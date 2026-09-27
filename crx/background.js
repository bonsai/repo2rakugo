chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "submit-job") return;

  (async () => {
    try {
      const { apiBaseUrl } = await chrome.storage.sync.get(["apiBaseUrl"]);
      if (!apiBaseUrl) throw new Error("Configure the API base URL in extension options");

      const response = await fetch(apiBaseUrl.replace(/\/$/, "") + "/v1/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(message.spec)
      });

      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {}

      if (!response.ok) {
        throw new Error(data.error || "Job submission failed: " + response.status);
      }

      sendResponse({ ok: true, ...data });
    } catch (error) {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Job submission failed"
      });
    }
  })();

  return true;
});
