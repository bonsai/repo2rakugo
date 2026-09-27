(() => {
  const BUTTON_ID = "repo2rakugo-button";

  function getRepoParts() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length !== 2) return null;
    return parts;
  }

  function getRepoUrl() {
    const parts = getRepoParts();
    return parts ? "https://github.com/" + parts[0] + "/" + parts[1] : null;
  }

  function createButton() {
    const repoUrl = getRepoUrl();
    if (!repoUrl || document.getElementById(BUTTON_ID)) return;

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "repo2rakugo";
    button.className = "Button--secondary Button";
    button.style.marginLeft = "8px";

    button.addEventListener("click", async () => {
      try {
        await chrome.runtime.sendMessage({
          type: "open-popup",
          repoUrl
        });
      } catch {}
    });

    const target = document.querySelector("main");
    if (target) target.prepend(button);
  }

  createButton();
  new MutationObserver(createButton).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
