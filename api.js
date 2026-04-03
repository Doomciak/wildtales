export const API_BASE_URL = "http://192.168.4.33:3000/api";

export async function sendLocationLogToApi(log) {
  const response = await fetch(`${API_BASE_URL}/location-logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tripId: log.tripId,
      latitude: log.latitude,
      longitude: log.longitude,
      placeName: log.placeName,
      recordedAt: log.recordedAt,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to upload location log");
  }

  return response.json();
}