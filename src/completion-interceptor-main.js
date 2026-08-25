// Injected into the MAIN world so it can intercept the page's own fetch calls.
// Wraps window.fetch, taps /completion SSE responses, extracts the
// message_limit event near the end of the stream, normalizes it into the same
// usage shape the UI has always consumed, and re-dispatches it to the
// content script via a CustomEvent.

(function () {
    if (window.__cstCompletionInterceptorInstalled) return;
    window.__cstCompletionInterceptorInstalled = true;

    const ORIGINAL_FETCH = window.fetch;

    function parseSseMessageLimit(text) {
        // SSE format: lines of "event: <name>" followed by "data: {json}"
        const events = text.split(/\r?\n\r?\n/);
        for (const chunk of events) {
            const lines = chunk.split(/\r?\n/);
            let eventName = null;
            let dataLines = [];
            for (const line of lines) {
                if (line.startsWith("event:")) {
                    eventName = line.slice(6).trim();
                } else if (line.startsWith("data:")) {
                    dataLines.push(line.slice(5).trim());
                }
            }
            if (eventName === "message_limit" && dataLines.length > 0) {
                try {
                    const parsed = JSON.parse(dataLines.join("\n"));
                    if (parsed && parsed.message_limit) {
                        return parsed.message_limit;
                    }
                } catch (e) {
                    console.warn(
                        "[CLAUDE SITE TOOLS] Failed to parse message_limit data:",
                        e,
                    );
                }
            }
        }
        return null;
    }

    function normalizeUsage(messageLimit) {
        const windows = messageLimit.windows || {};
        const resolved = messageLimit.resolved || {};

        function mapWindow(win) {
            if (!win) return null;
            return {
                // Legacy UI expects 0-100 integers
                utilization:
                    typeof win.utilization === "number"
                        ? Math.min(Math.round(win.utilization * 100), 100)
                        : null,
                // Legacy resets_at was an ISO string / ms timestamp; convert epoch seconds -> ms
                resets_at:
                    typeof win.resets_at === "number"
                        ? win.resets_at * 1000
                        : win.resets_at,
            };
        }

        let fiveHour = mapWindow(windows["5h"]);
        let sevenDay = mapWindow(windows["7d"]);

        // Fallbacks from the resolved block when per-window data is missing
        if (!fiveHour && resolved.limit && resolved.limit.kind === "session") {
            fiveHour = {
                utilization: Math.min(
                    typeof resolved.limit.percent === "number"
                        ? resolved.limit.percent
                        : 0,
                    100,
                ),
                resets_at: resolved.limit.resets_at || null,
            };
        }

        if (!fiveHour && !sevenDay) return null;

        return { five_hour: fiveHour, seven_day: sevenDay };
    }

    async function tapCompletionResponse(response) {
        try {
            const cloned = response.clone();
            if (!cloned.body || !cloned.body.getReader) {
                // No streaming body available; fall back to full text
                const text = await cloned.text();
                handlePayloadText(text);
                return;
            }
            const reader = cloned.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                // message_limit arrives near the end; check opportunistically
                const idx = buffer.indexOf("event: message_limit");
                if (idx !== -1) {
                    handlePayloadText(buffer.slice(idx));
                }
            }
            handlePayloadText(buffer);
        } catch (error) {
            console.warn(
                "[CLAUDE SITE TOOLS] Error tapping completion response:",
                error,
            );
        }
    }

    function handlePayloadText(text) {
        if (!text || text.indexOf("message_limit") === -1) return;
        const messageLimit = parseSseMessageLimit(text);
        if (!messageLimit) return;
        const usage = normalizeUsage(messageLimit);
        if (!usage) return;

        console.log(
            "[CLAUDE SITE TOOLS] Extracted usage from completion stream:",
            usage,
        );
        window.dispatchEvent(
            new CustomEvent("cst-usage-update", { detail: usage }),
        );
    }

    window.fetch = async function (...args) {
        const response = await ORIGINAL_FETCH.apply(this, args);
        try {
            const url =
                typeof args[0] === "string"
                    ? args[0]
                    : args[0] && args[0].url
                      ? args[0].url
                      : "";
            if (
                response.ok &&
                url.includes("/completion") &&
                (response.headers.get("content-type") || "").includes(
                    "text/event-stream",
                )
            ) {
                tapCompletionResponse(response);
            }
        } catch (error) {
            console.warn(
                "[CLAUDE SITE TOOLS] Error inspecting fetch response:",
                error,
            );
        }
        return response;
    };
})();
