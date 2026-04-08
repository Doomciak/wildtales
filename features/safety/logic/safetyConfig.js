// Maximum age of the latest location log that can be used in the automatic SMS.
export const AUTO_SMS_MAX_AGE_MS = 5 * 60 * 1000;

// How often the fallback logic checks whether a new SMS should be sent.
export const AUTO_CHECK_INTERVAL_MS = 15000;

// How often the live trip UI refreshes while tracking is active.
export const LIVE_REFRESH_INTERVAL_MS = 5000;

// Time interval for collecting live tracking updates.
export const LIVE_TRACK_TIME_INTERVAL_MS = 5000;

// Minimum distance change needed before saving another live tracking point.
export const LIVE_TRACK_DISTANCE_INTERVAL_METERS = 10;

// Time interval for collecting background tracking updates.
export const BACKGROUND_TRACK_TIME_INTERVAL_MS = 10000;

// Minimum distance change needed before saving another background tracking point.
export const BACKGROUND_TRACK_DISTANCE_INTERVAL_METERS = 15;

// Delay used for testing the fallback behaviour.
export const TEST_FALLBACK_DELAY_MS = 20000;