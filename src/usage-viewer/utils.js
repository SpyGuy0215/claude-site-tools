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

function updateWidgetVisibility(widgetType='all', visible=true) {
    if(widgetType === 'sidebar' || widgetType === 'all'){
        const sidebarWidgetContainer = document.getElementById("claude-site-tools-sidebar-container");
        sidebarWidgetContainer.style.display = visible ? "block" : "none";
    }
    if(widgetType === 'bottom-toolbar' || widgetType === 'all'){
        const bottomToolbarWidgetContainer = document.getElementById("toolbar-circular-usage-container");
        bottomToolbarWidgetContainer.style.display = visible ? "flex" : "none";
    }
}

function showNoDataState() {
    const usageBar = document.getElementById("claude-site-tools-usage-bar");
    const usageText = document.querySelector("#five-hour-usage span");
    const resetTime = document.getElementById("5-hour-reset-time");
    const bottomToolbarUsageCircle = document.getElementsByClassName(
        "progress-ring__indicator",
    )[0];
    const bottomToolbarUsageText = document.getElementById(
        "toolbar-usage-progress-text",
    );

    if (usageBar) usageBar.style.width = `0%`;
    if (usageText) usageText.textContent = `--`;
    if (resetTime) {
        resetTime.textContent = `Send a message first to load usage`;
    }
    if (bottomToolbarUsageCircle) {
        bottomToolbarUsageCircle.style.strokeDashoffset = 283;
    }
    if (bottomToolbarUsageText) {
        bottomToolbarUsageText.textContent = `--`;
    }
}

function updateUsageUI() {
    ensureUIInjected();
    fetchUsageFromCompletion().then((usage) => {
        if (!usage || usage.five_hour.utilization == null) {
            showNoDataState();
            return;
        }
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
        if (!usageBar || !usageText || !resetTime) return;
        usageBar.style.width = `${fiveHourUsage}%`;
        usageText.textContent = `${fiveHourUsage}%`;
        if (!isNaN(fiveHourResetTime)) {
            resetTime.textContent = `Resets at: ${fiveHourResetTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        }

        // Calculate stroke-dashoffset for the circular progress ring
        // Formula: 283 * (1 - (fiveHourUsage / 100))
        if (bottomToolbarUsageCircle && bottomToolbarUsageText) {
            const strokeDashoffset = 283 * (1 - fiveHourUsage / 100);
            bottomToolbarUsageCircle.style.strokeDashoffset = strokeDashoffset;
            bottomToolbarUsageText.textContent = `${fiveHourUsage}%`;
        }
    });
}