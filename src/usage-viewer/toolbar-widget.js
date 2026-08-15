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
