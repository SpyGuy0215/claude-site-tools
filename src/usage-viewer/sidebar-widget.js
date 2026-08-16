function injectSidebarUsageBar() {
    if (document.getElementById("claude-site-tools-sidebar-container")) return;

    // find the claude.ai sidebar container
    let siteSidebar, sidebarFlexComponents, chatsSidebar;
    try {
        siteSidebar = document.querySelectorAll(
            ".\\[scrollbar-gutter\\:stable\\]",
        )[1];
        sidebarFlexComponents = siteSidebar.querySelectorAll(".flex .flex-col");
        chatsSidebar = sidebarFlexComponents[0];
    } catch (e) {
        console.error(
            "[CLAUDE SITE TOOLS] Error finding claude.ai sidebar container:",
            e,
        );
    }
    if (!siteSidebar) return;

    // create sidebar UI
    const customSidebarUIContainer = document.createElement("div");
    customSidebarUIContainer.style.cssText = `
        padding-left: 1rem; 
        padding-right: 1rem; 
        margin-top: 1rem;
        color: #c3c2b7; 
    `;
    const customSidebarUIHTML = `
        <div>
            <h3>Usage</h3>
            <div id='five-hour-usage' style='flex: 1; display: flex; flex-direction: row; align-items: center; gap: 0.5rem;'>
                <div id="claude-site-tools-usage-bar-container" style="width: 85%; height: 3px; background-color: #444; border-radius: 0.5rem; overflow: hidden;">
                    <div id="claude-site-tools-usage-bar" style="width: 0%; height: 100%; background-color: #2a78d6;"></div>
                </div>
                <span style="margin-left: 0.3rem;">0%</span>
            </div>
            <span id='5-hour-reset-time' style='font-size: 0.8rem; color: #888;'>Resets at: --:--</span>
        </div>
            `;
    customSidebarUIContainer.innerHTML = customSidebarUIHTML;
    customSidebarUIContainer.id = "claude-site-tools-sidebar-container";

    // add custom UI to the sidebar
    chatsSidebar.after(customSidebarUIContainer);
    console.log(
        "[CLAUDE SITE TOOLS] Custom UI injected into claude.ai sidebar.",
    );

    updateSidebarWidgetVisibilityAuto();
    updateUsageUI();
}

function updateSidebarWidgetVisibilityAuto() {
    const sidebarContainer = document.getElementById(
        "claude-site-tools-sidebar-container",
    );
    const sidebarNav = document.querySelector("[aria-label='Sidebar' i]");
    console.log(
        "[CLAUDE SITE TOOLS] Sidebar navigation element found:",
        sidebarNav,
    );
    if (!sidebarNav) {
        console.error(
            "[CLAUDE SITE TOOLS] Sidebar navigation element not found.",
        );
        return;
    }
    const isClosed = sidebarNav && sidebarNav.hasAttribute("data-find-omitted");
    console.log(
        "[CLAUDE SITE TOOLS] Sidebar visibility changed. Is closed:",
        isClosed,
    );
    if (sidebarContainer) {
        sidebarContainer.style.display = isClosed ? "none" : "block";
    }
}

let sidebarMutationObserver = null;
function initSidebarObserver() {
    const sidebarNav = document.querySelector("[aria-label='Sidebar' i]");
    if (!sidebarNav) {
        console.error(
            "[CLAUDE SITE TOOLS] Sidebar navigation element not found for observer initialization.",
        );
    }

    if (sidebarMutationObserver) {
        console.log("Disconnecting existing sidebar mutationObserver.");
        sidebarMutationObserver.disconnect();
        sidebarMutationObserver = null;
    }

    sidebarMutationObserver = new MutationObserver(
        (mutationsList, observer) => {
            console.log("Sidebar mutationObserver firing.");
            for (const mutation of mutationsList) {
                if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === "data-find-omitted"
                ) {
                    updateSidebarWidgetVisibilityAuto();
                }
            }
        },
    );
    if (!sidebarNav) return;
    sidebarMutationObserver.observe(sidebarNav, {
        attributes: true,
        attributeFilter: ["data-find-omitted"],
    });
}
