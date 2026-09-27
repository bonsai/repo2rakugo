const input = document.getElementById("apiBaseUrl");
const save = document.getElementById("save");

chrome.storage.sync.get(["apiBaseUrl"]).then(({ apiBaseUrl }) => {
  input.value = apiBaseUrl || "";
});

save.addEventListener("click", async () => {
  const apiBaseUrl = input.value.trim().replace(/\/$/, "");
  await chrome.storage.sync.set({ apiBaseUrl });
  save.textContent = "Saved";
  setTimeout(() => {
    save.textContent = "Save";
  }, 1200);
});
