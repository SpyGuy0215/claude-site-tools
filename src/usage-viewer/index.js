// Usage-viewer feature entry point

function initUsageViewer() {
    injectCustomUI();
    updateWidgetVisibility("sidebar");
    initSidebarObserver();

    let resizeTimeout = null;
    window.addEventListener("resize", () => {
        console.log("Window resized.");
        updateWidgetVisibility("sidebar");
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        resizeTimeout = setTimeout(() => {
            initSidebarObserver();
        }, 150);
    });

    const observer = new MutationObserver((mutationsList, observer) => {
        ensureUIInjected();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "CLAUDE_RESPONSE_FINISHED") {
            console.log(
                "[CLAUDE SITE TOOLS] Claude response finished, updating usage data.",
            );
            setTimeout(() => {
                updateUsageUI();
                console.log(
                    "[CLAUDE SITE TOOLS] Usage data updated after Claude response.",
                );
            }, 2500); // Wait for backend to update
        } else if (message.action === "TEST_PING") {
            console.log(
                "[CLAUDE SITE TOOLS] Received test ping from background script.",
            );
        }
    });

    const usageUpdateTimer = setInterval(() => {
        updateUsageUI();
        console.log(
            "[CLAUDE SITE TOOLS] Periodic usage data update triggered.",
        );
    }, 60000);
}
