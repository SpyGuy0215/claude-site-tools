const usageViewerEnabledToggle = document.getElementById("enable-usage-viewer");

(async () => {
    const { settings } = await chrome.storage.local.get("settings");
    usageViewerEnabledToggle.checked = settings?.usageViewerEnabled ?? true;
})(); 

usageViewerEnabledToggle.addEventListener("change", async (event) => {
    const { settings } = await chrome.storage.local.get("settings");
    console.log(event.target.checked); 
    const updated = {...settings, usageViewerEnabled: event.target.checked };
    console.log("[CLAUDE SITE TOOLS] Updating settings:", JSON.stringify(updated));
    await chrome.storage.local.set({ settings: updated });

    const tabs = await chrome.tabs.query({
        url: ["https://claude.ai/*"],
    });
    for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, {
            action: "UPDATE_SETTINGS",
            settings: updated,
        });
        if (chrome.runtime.lastError) {
            console.warn("[CLAUDE SITE TOOLS] Error sending message to tab:", chrome.runtime.lastError);
            return; 
        }
    }
}); 

chrome.storage.onChanged.addListener((changes, area) => {
    if(area == 'local' && changes.settings) {
        const newSettings = changes.settings.newValue;
        usageViewerEnabledToggle.checked = newSettings?.usageViewerEnabled ?? true;
    }
})