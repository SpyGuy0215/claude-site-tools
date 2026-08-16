// Entry point, bootstraps every enabled feature
// Also handles settings

initUsageViewer(); 

chrome.runtime.onMessage.addListener((message) => {
    if (message.action == "UPDATE_SETTINGS") {
        console.log("[CLAUDE SITE TOOLS] Received settings update:", message.settings);
        updateWidgetVisibility('all', message.settings.usageViewerEnabled);
    }
});