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