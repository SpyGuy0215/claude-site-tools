console.log("[CLAUDE SITE TOOLS] 🚀 Background script loaded.");
// Test ping
chrome.tabs.sendMessage(1, { action: "TEST_PING" }, (response) => {
    if (chrome.runtime.lastError) {
        console.error("[CLAUDE SITE TOOLS] Error sending test ping:", chrome.runtime.lastError);
    } else {
        console.log("[CLAUDE SITE TOOLS] Test ping sent to content script.");
    }
}); 

// Listen to the HTTP completion stream
chrome.webRequest.onCompleted.addListener(
    (details) => {
        if(details.statusCode === 200 && details.tabId >= 0) {
            console.log("[CLAUDE SITE TOOLS] Detected Claude response completion, sending message to content script.");
            chrome.tabs.sendMessage(details.tabId, {
                action: "CLAUDE_RESPONSE_FINISHED"
            }).catch((error) => {
                console.error("[CLAUDE SITE TOOLS] Error sending message to content script:", error);
            }
            )
        }
    },
    {urls: ["https://claude.ai/api/organizations/*/chat_conversations/*/completion*"]}
); 