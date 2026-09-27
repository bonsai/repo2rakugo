const form = document.getElementById("job-form");
const email = document.getElementById("email");
const status = document.getElementById("status");

async function getRepoUrl() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.url) throw new Error("Open a GitHub repository page");
  const url = new URL(tab.url);
  const parts = url.pathname.split("/").filter(Boolean);
  if (url.hostname !== "github.com" || parts.length !== 2) {
    throw new Error("Open a GitHub repository page");
  }
  return "https://github.com/" + parts[0] + "/" + parts[1];
}

async function submitJob(repoUrl, address) {
  const { apiBaseUrl } = await chrome.storage.sync.get(["apiBaseUrl"]);
  if (!apiBaseUrl) throw new Error("API base URL is not configured");

  const response = await chrome.runtime.sendMessage({
    type: "submit-job",
    spec: {
      source: { type: "github", url: repoUrl },
      generation: { style: "edo-cyber", length: "short" },
      outputs: ["json", "mp3"],
      delivery: { type: "email", email: address }
    }
  });

  if (!response?.ok) throw new Error(response?.error || "Job submission failed");
  return response;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "Sending...";
  try {
    const repoUrl = await getRepoUrl();
    const result = await submitJob(repoUrl, email.value.trim());
    status.textContent = "Queued: " + result.job_id;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Job submission failed";
  }
});
