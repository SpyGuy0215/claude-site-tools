// Legacy functions
// Kept in case the original internal API functionality returns

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
    console.log("[CLAUDE SITE TOOLS] Fetched organization ID:", orgID);
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
        console.error("[CLAUDE SITE TOOLS] Error fetching usage data (response OK):", data);
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

// ============================================================================
// New completion-based usage functions
// Usage data now arrives attached to /completion SSE responses (message_limit
// event). The interceptor in the MAIN world parses it and dispatches a
// "cst-usage-update" CustomEvent; we cache it here for the UI to consume.
// ============================================================================

let latestCompletionUsage = null;

// Persistent cache (survives page reloads via chrome.storage.local).
// Invalidated once the five-hour window's reset time has passed.
const USAGE_CACHE_KEY = "cst_usage_cache";

function isUsageCacheValid(cached) {
    if (!cached || !cached.five_hour || !cached.five_hour.resets_at) {
        return false;
    }
    const resetTime = new Date(cached.five_hour.resets_at);
    if (isNaN(resetTime)) return false;
    // Cache is valid only until the five-hour window resets
    return Date.now() < resetTime.getTime();
}

async function loadUsageCache() {
    try {
        const result = await chrome.storage.local.get(USAGE_CACHE_KEY);
        const cached = result[USAGE_CACHE_KEY];
        if (isUsageCacheValid(cached)) {
            return cached;
        }
        // Expired or invalid — clear it
        await chrome.storage.local.remove(USAGE_CACHE_KEY);
        return null;
    } catch (error) {
        console.warn(
            "[CLAUDE SITE TOOLS] Error reading usage cache:",
            error,
        );
        return null;
    }
}

async function saveUsageCache(usage) {
    try {
        await chrome.storage.local.set({ [USAGE_CACHE_KEY]: usage });
    } catch (error) {
        console.warn(
            "[CLAUDE SITE TOOLS] Error saving usage cache:",
            error,
        );
    }
}

function initCompletionUsageListener() {
    window.addEventListener("cst-usage-update", async (event) => {
        if (!event.detail) return;
        latestCompletionUsage = event.detail;
        await saveUsageCache(event.detail);
        console.log(
            "[CLAUDE SITE TOOLS] Cached usage from completion stream:",
            latestCompletionUsage,
        );
    });
}

// Returns usage in the exact legacy shape:
// { five_hour: { utilization, resets_at }, seven_day: { utilization, resets_at } }
async function fetchUsageFromCompletion() {
    // Prefer fresh in-memory data from this page session
    if (
        latestCompletionUsage &&
        isUsageCacheValid(latestCompletionUsage)
    ) {
        return latestCompletionUsage;
    }
    latestCompletionUsage = null;

    // Fall back to persistent cache across page loads
    const cached = await loadUsageCache();
    if (cached) {
        latestCompletionUsage = cached;
        console.log(
            "[CLAUDE SITE TOOLS] Loaded usage from persistent cache:",
            cached,
        );
        return cached;
    }

    console.warn(
        "[CLAUDE SITE TOOLS] No valid completion-derived usage available. Send a message on claude.ai first.",
    );
    return null;
}