const CURRENT_SCHEMA_VERSION = 1;
console.log("[CLAUDE SITE TOOLS] 🚀 Background script loaded.");

// Listen to the HTTP completion stream
chrome.webRequest.onCompleted.addListener(
    async (details) => {
        if (details.statusCode === 200 && details.tabId >= 0) {
            try {
                await chrome.tabs.sendMessage(details.tabId, {
                    action: "CLAUDE_RESPONSE_FINISHED",
                });
            } catch (error) {
                console.warn(
                    "[CLAUDE SITE TOOLS] Error sending message to content script:",
                    error,
                );
            }
        }
    },
    {
        urls: [
            "https://claude.ai/api/organizations/*/chat_conversations/*/completion*",
        ],
    },
);

// Handle settings schema migration
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install" || details.reason === "update") {
        await migrateSettings();
    }
});

async function migrateSettings() {
    const { settings, schemaVersion } = await chrome.storage.local.get([
        "settings",
        "schemaVersion",
    ]);
    if (schemaVersion == CURRENT_SCHEMA_VERSION) return;
    // In case of future schema changes, migrations can be handled sequentially here
}
