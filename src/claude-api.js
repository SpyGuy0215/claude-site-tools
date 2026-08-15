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