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
