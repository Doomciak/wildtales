// Maximum age of the latest location log that can be used in the automatic SMS.
// Kept short so the fallback is easier to demonstrate during testing.
export const AUTO_SMS_MAX_AGE_MS = 60 * 1000;

// How often the fallback logic checks pending logs and retry conditions.
export const AUTO_CHECK_INTERVAL_MS = 15000;

// Minimum gap between automatic retry attempts for the same log.
export const AUTO_RETRY_INTERVAL_MS = 15000;

// How often the live trip UI refreshes while tracking is active.
export const LIVE_REFRESH_INTERVAL_MS = 5000;

// How often live tracking collects location updates.
export const LIVE_TRACK_TIME_INTERVAL_MS = 3000;

// Minimum distance change needed before saving another live tracking point.
export const LIVE_TRACK_DISTANCE_INTERVAL_METERS = 5;

// How often background tracking collects location updates.
export const BACKGROUND_TRACK_TIME_INTERVAL_MS = 5000;

// Minimum distance change needed before saving another background tracking point.
export const BACKGROUND_TRACK_DISTANCE_INTERVAL_METERS = 10;

// Extra delay used when testing the fallback behaviour.
export const TEST_FALLBACK_DELAY_MS = 20000;