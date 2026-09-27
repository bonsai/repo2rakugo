(() => {
  const BUTTON_ID = "repo2rakugo-button";

  function isRepoPage() {
    const parts = location.pathname.split("/").filter(Boolean);
    return parts.length >= 2 && !parts[2];
  }

  function getRepoUrl() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return "https://github.com/" + parts[0] + "/" + parts[1];
  }

  function createButton() {
    if (!isRepoPage() || document.getElementById(BUTTON_ID)) return;

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "repo2rakugo";
    button.className = "Button--secondary Button";
    button.style.marginLeft = "8px";

    button.addEventListener("click", async () => {
      const repoUrl = getRepoUrl();
      if (!repoUrl) return;

      const email = window.prompt("Email address");
      if (!email) return;

      button.disabled = true;

      try {
        const response = await chrome.storage.sync.get(["apiBaseUrl"]);
        const apiBaseUrl = response.apiBaseUrl;
        if (!apiBaseUrl) throw new Error("API base URL is not configured");

        const result = await fetch(apiBaseUrl.replace(/\/$/, "") + "/v1/jobs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            source: {
              type: "github",
              url: repoUrl
            },
            generation: {
              style: "edo-cyber",
              length: "short"
            },
            outputs: ["json", "mp3"],
            delivery: {
              type: "email",
              email
            }
          })
        });

        if (!result.ok) throw new Error("Job submission failed");

        const job = await result.json();
        window.alert("Job queued: " + job.job_id);
      } catch (error) {
        window.alert(error.message);
      } finally {
        button.disabled = false;
      }
    });

    const target = document.querySelector("main");
    if (target) {
      target.prepend(button);
    }
  }

  createButton();

  const observer = new MutationObserver(createButton);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
