import {
  getPendingLocationLogs,
  incrementLocationLogAttempt,
  markLocationLogSent,
} from "./db";

export const API_BASE_URL = "https://api.moodified.space/api";

const REQUEST_TIMEOUT_MS = 10000;

function buildApiUrl(path) {
  // Build a clean final URL no matter how the base or path is written.
  const cleanBase = API_BASE_URL.replace(/\/+$/, "");
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
}

async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  // Try JSON first when the API says the response is JSON.
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (error) {
      console.log("Response JSON parse error:", error);
      return null;
    }
  }

  // Otherwise fall back to plain text.
  try {
    return await response.text();
  } catch (error) {
    console.log("Response text parse error:", error);
    return null;
  }
}

async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildApiUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    const body = await readResponseBody(response);

    // Turn non-2xx responses into normal JS errors
    // so the calling code can handle them in one place.
    if (!response.ok) {
      const message =
        typeof body === "string"
          ? body
          : body?.message || `Request failed with status ${response.status}`;

      throw new Error(message);
    }

    return body;
  } catch (error) {
    // Give timeout errors a clearer message.
    if (error?.name === "AbortError") {
      throw new Error("Request timed out");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function normaliseLocationLogPayload(log) {
  // Keep the payload sent to the server small and consistent.
  return {
    tripId: log.tripId,
    latitude: log.latitude,
    longitude: log.longitude,
    placeName: log.placeName || null,
    recordedAt: log.recordedAt,
  };
}

export async function sendLocationLogToApi(log) {
  if (!log) {
    throw new Error("Missing location log payload");
  }

  return apiRequest("/location-logs", {
    method: "POST",
    body: JSON.stringify(normaliseLocationLogPayload(log)),
  });
}

export async function syncPendingLocationLogs() {
  const pendingLogs = await getPendingLocationLogs();

  if (!pendingLogs.length) {
    return {
      total: 0,
      sent: 0,
      failed: 0,
    };
  }

  let sent = 0;
  let failed = 0;

  // Try to resend each pending log one by one.
  for (const log of pendingLogs) {
    try {
      await sendLocationLogToApi(log);
      await markLocationLogSent(log.id, "api");
      sent += 1;
    } catch (error) {
      console.log(`Sync location log failed for ${log.id}:`, error);
      await incrementLocationLogAttempt(log.id);
      failed += 1;
    }
  }

  return {
    total: pendingLogs.length,
    sent,
    failed,
  };
}

export async function checkApiReachable() {
  try {
    // Simple health check to confirm the API responds at all.
    await apiRequest("/ping", {
      method: "GET",
    });

    return true;
  } catch (error) {
    return false;
  }
}