async function fetchOrganizationID() {
    const response = await fetch("https://claude.ai/api/organizations", {
        credentials: "include",
    });
    if (!response.ok) {
        console.error(
            "[CLAUDE SITE TOOLS] Error fetching organization ID:",
            response.status,
            response.statusText,
        );
        return null;
    }
    const data = await response.json();
    if (!data || !data[0] || !data[0].id) {
        console.error(
            "[CLAUDE SITE TOOLS] Error fetching organization ID:",
            data,
        );
        return null;
    }
    const orgID = data[0].uuid;
    return orgID;
}

async function fetchExactUsage(orgID) {
    const response = await fetch(
        `https://claude.ai/api/organizations/${orgID}/usage`,
        {
            cache: "no-store",
            credentials: "include",
        },
    );
    if (!response.ok) {
        console.error(
            "[CLAUDE SITE TOOLS] Error fetching usage data:",
            response.status,
            response.statusText,
        );
        return null;
    }
    const data = await response.json();
    console.log(data);

    if (!data.five_hour || !data.seven_day) {
        console.error("[CLAUDE SITE TOOLS] Error fetching usage data:", data);
        return null;
    }

    const usage = {
        five_hour: {
            utilization: Math.min(data.five_hour.utilization, 100),
            resets_at: data.five_hour.resets_at,
        },
        seven_day: {
            utilization: Math.min(data.seven_day.utilization, 100),
            resets_at: data.seven_day.resets_at,
        },
    };
    return usage;
}

function findBottomToolbar() {
    const mainInput = document.querySelector("fieldset");
    if (!mainInput) return null;
    let bottomToolbar = null;
    let winningScore = 0;
    for (const element of mainInput.querySelectorAll("div")) {
        let score = 0;

        // 1. Specific sub-elements
        if (element.querySelector("[aria-label*='Add files' i]")) score += 10;
        if (element.querySelector("[aria-label*='Model' i]")) score += 10;

        // 2. Structural traits
        if (element.children.length >= 2) score += 5;
        if (element.children.length === 0) {
            score = 0;
            continue;
        }

        // 3. Classes
        if (element.classList.contains("flex")) score += 8;
        if (element.classList.contains("relative")) score += 6;
        if (element.classList.contains("w-full")) score += 4;
        if (element.classList.contains("gap-2")) score += 3;

        if (score > winningScore) {
            winningScore = score;
            bottomToolbar = element;
        }
    }

    return bottomToolbar;
}

function injectBottomToolbarUsageCircle() {
    // Add bottom toolbar usage circle
    if (document.getElementById("toolbar-circular-usage-container")) return;
    console.log("[CLAUDE SITE TOOLS] Injecting bottom toolbar usage circle.");
    const bottomToolbar = findBottomToolbar();
    if (!bottomToolbar) return;

    const customToolbarUsageContainer = document.createElement("div");
    const customToolbarUsageHTML = `
    <div id='toolbar-circular-usage-container' class='toolbar circular-progress-container'>
    <span id='toolbar-usage-progress-text' class='toolbar circular-progress-text'>0%</span>    
    <svg id='toolbar-usage-progress-ring' class='toolbar progress-ring' width='24' height='24' viewBox='0 0 120 120'>
            <circle 
                id='toolbar-usage-progress-ring-track'
                class='toolbar progress-ring__circle progress-ring__track'
                stroke='#444'
                stroke-width='10'
                fill='transparent'
                r='45'
                cx='60'
                cy='60'
            />
            <circle
                id='toolbar-usage-progress-ring-circle'
                class='toolbar progress-ring__circle progress-ring__indicator'
                stroke='#3b82f6'
                stroke-width='10'
                stroke-linecap='round'
                fill='transparent'
                r='45'
                cx='60'
                cy='60'
                />
        </svg>
    </div>
    `;
    customToolbarUsageContainer.innerHTML = customToolbarUsageHTML;
    customToolbarUsageContainer.style.cssText = `
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: fit-content;
        `;

    const bottomToolbarModelPicker = bottomToolbar
        .querySelector("[aria-label*='Model' i]")
        .closest("div");
    if (bottomToolbarModelPicker) {
        bottomToolbarModelPicker.after(customToolbarUsageContainer);
    } else {
        bottomToolbar.appendChild(customToolbarUsageContainer);
    }

    // Populate UI with current usage data
    updateUsageUI();
}

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
                <span>0%</span>
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

    updateWidgetVisibility("sidebar");
    updateUsageUI();
}

function injectCustomUI() {
    injectSidebarUsageBar();
    injectBottomToolbarUsageCircle();
}

function ensureUIInjected() {
    if (!document.getElementById("claude-site-tools-sidebar-container")) {
        injectSidebarUsageBar();
    }

    if (!document.getElementById("toolbar-circular-usage-container")) {
        injectBottomToolbarUsageCircle();
    }
}

function updateUsageUI() {
    ensureUIInjected();
    fetchOrganizationID().then((orgID) => {
        if (!orgID) return;
        fetchExactUsage(orgID).then((usage) => {
            if (!usage) return;
            const fiveHourUsage = usage.five_hour.utilization;
            const fiveHourResetTime = new Date(usage.five_hour.resets_at);
            const usageBar = document.getElementById(
                "claude-site-tools-usage-bar",
            );
            const usageText = document.querySelector("#five-hour-usage span");
            const resetTime = document.getElementById("5-hour-reset-time");
            const bottomToolbarUsageCircle = document.getElementsByClassName(
                "progress-ring__indicator",
            )[0];
            const bottomToolbarUsageText = document.getElementById(
                "toolbar-usage-progress-text",
            );
            usageBar.style.width = `${fiveHourUsage}%`;
            usageText.textContent = `${fiveHourUsage}%`;
            resetTime.textContent = `Resets at: ${fiveHourResetTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

            // Calculate stroke-dashoffset for the circular progress ring
            // Formula: 283 * (1 - (fiveHourUsage / 100))
            const strokeDashoffset = 283 * (1 - fiveHourUsage / 100);
            bottomToolbarUsageCircle.style.strokeDashoffset = strokeDashoffset;
            bottomToolbarUsageText.textContent = `${fiveHourUsage}%`;
        });
    });
}

function updateWidgetVisibility(widgetType) {
    if (widgetType === "sidebar") {
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
        const isClosed =
            sidebarNav && sidebarNav.hasAttribute("data-find-omitted");
        console.log(
            "[CLAUDE SITE TOOLS] Sidebar visibility changed. Is closed:",
            isClosed,
        );
        if (sidebarContainer) {
            sidebarContainer.style.display = isClosed ? "none" : "block";
        }
    }
}

let sidebarMutationObserver = null; 
function initSidebarObserver() {
    const sidebarNav = document.querySelector("[aria-label='Sidebar' i]");
    if(!sidebarNav){
        console.error("[CLAUDE SITE TOOLS] Sidebar navigation element not found for observer initialization.");
    }

    if (sidebarMutationObserver) {
        console.log("Disconneting existing sidebar mutationObserver.");
        sidebarMutationObserver.disconnect();
        sidebarMutationObserver = null;
    }

    sidebarMutationObserver = new MutationObserver(
        (mutationsList, observer) => {
            console.log("Sidebar mutationObserver firing. ")
            for (const mutation of mutationsList) {
                if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === "data-find-omitted"
                ) {
                    updateWidgetVisibility("sidebar");
                }
            }
        },
    );
    sidebarMutationObserver.observe(sidebarNav, {
        attributes: true,
        attributeFilter: ["data-find-omitted"],
    });
}

injectCustomUI();
updateWidgetVisibility("sidebar");
initSidebarObserver();

let resizeTimeout = null; 
window.addEventListener("resize", () => {
    console.log("Window resized.")
    updateWidgetVisibility("sidebar");
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
        initSidebarObserver();
    }, 150);
})

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
    console.log("[CLAUDE SITE TOOLS] Periodic usage data update triggered.");
}, 60000);
