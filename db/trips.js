import { dbPromise, nowIso } from "./core";
import { createPendingSyncEntry } from "./sync";

// Return the currently active trip session, if one exists.
export async function getActiveTripSession() {
  const db = await dbPromise;
  const rows = await db.getAllAsync(
    `SELECT
      id,
      startedAt,
      endedAt,
      isActive,
      syncStatus,
      remoteId,
      lastSyncedAt
     FROM trip_sessions
     WHERE isActive = 1
     ORDER BY id DESC
     LIMIT 1`
  );

  return rows[0] || null;
}

// Start a new trip session and queue it for syncing.
export async function startTripSession() {
  const db = await dbPromise;

  await db.runAsync("UPDATE trip_sessions SET isActive = 0 WHERE isActive = 1");

  const startedAt = nowIso();

  const result = await db.runAsync(
    `INSERT INTO trip_sessions (
      startedAt,
      isActive,
      syncStatus,
      remoteId,
      lastSyncedAt
    ) VALUES (?, 1, 'pending', NULL, NULL)`,
    startedAt
  );

  const tripId = result.lastInsertRowId;

  await createPendingSyncEntry({
    entityType: "trip_session",
    entityId: tripId,
    action: "create",
    payload: {
      id: tripId,
      startedAt,
      endedAt: null,
      isActive: 1,
    },
  });

  return tripId;
}

// Stop an active trip session and queue the update for syncing.
export async function stopTripSession(tripId) {
  const db = await dbPromise;
  const endedAt = nowIso();

  await db.runAsync(
    `UPDATE trip_sessions
     SET endedAt = ?,
         isActive = 0,
         syncStatus = 'pending'
     WHERE id = ?`,
    endedAt,
    tripId
  );

  const tripSession = await db.getFirstAsync(
    `SELECT
      id,
      startedAt,
      endedAt,
      isActive,
      syncStatus,
      remoteId,
      lastSyncedAt
     FROM trip_sessions
     WHERE id = ?`,
    tripId
  );

  if (tripSession) {
    await createPendingSyncEntry({
      entityType: "trip_session",
      entityId: tripId,
      action: "update",
      payload: tripSession,
    });
  }
}

// Save a new location log for the current trip.
export async function saveLocationLog(log) {
  const db = await dbPromise;

  const result = await db.runAsync(
    `INSERT INTO location_logs (
      tripId,
      latitude,
      longitude,
      placeName,
      recordedAt,
      sendStatus,
      sendAttempts,
      lastAttemptAt,
      sentVia,
      syncStatus,
      remoteId,
      lastSyncedAt
    ) VALUES (?, ?, ?, ?, ?, 'pending', 0, NULL, NULL, 'pending', NULL, NULL)`,
    log.tripId,
    log.latitude,
    log.longitude,
    log.placeName || null,
    log.recordedAt
  );

  return result.lastInsertRowId;
}

// Delete all saved location logs for one trip.
export async function deleteLocationLogsForTrip(tripId) {
  if (!tripId) {
    return;
  }

  const db = await dbPromise;

  await db.runAsync(
    `DELETE FROM location_logs
     WHERE tripId = ?`,
    tripId
  );
}

// Mark a location log as successfully sent.
export async function markLocationLogSent(id, via = "api") {
  const db = await dbPromise;
  const timestamp = nowIso();

  await db.runAsync(
    `UPDATE location_logs
     SET sendStatus = 'sent',
         sentVia = ?,
         lastAttemptAt = ?,
         syncStatus = 'synced',
         lastSyncedAt = ?
     WHERE id = ?`,
    via,
    timestamp,
    timestamp,
    id
  );
}

// Mark a location log as prepared for SMS sending.
export async function markLocationLogSmsPrepared(id) {
  const db = await dbPromise;

  await db.runAsync(
    `UPDATE location_logs
     SET sentVia = 'sms',
         lastAttemptAt = ?
     WHERE id = ?`,
    nowIso(),
    id
  );
}

// Increase the send attempt count after a failed delivery attempt.
export async function incrementLocationLogAttempt(id) {
  const db = await dbPromise;

  await db.runAsync(
    `UPDATE location_logs
     SET sendAttempts = sendAttempts + 1,
         lastAttemptAt = ?,
         sendStatus = 'failed'
     WHERE id = ?`,
    nowIso(),
    id
  );
}

// Return all location logs that have not been sent successfully.
export async function getPendingLocationLogs() {
  const db = await dbPromise;

  return db.getAllAsync(
    `SELECT
      id,
      tripId,
      latitude,
      longitude,
      placeName,
      recordedAt,
      sendStatus,
      sendAttempts,
      lastAttemptAt,
      sentVia,
      syncStatus,
      remoteId,
      lastSyncedAt
     FROM location_logs
     WHERE sendStatus != 'sent'
     ORDER BY id ASC`
  );
}

// Return unsent location logs for a specific trip.
export async function getPendingLocationLogsForTrip(tripId) {
  const db = await dbPromise;

  return db.getAllAsync(
    `SELECT
      id,
      tripId,
      latitude,
      longitude,
      placeName,
      recordedAt,
      sendStatus,
      sendAttempts,
      lastAttemptAt,
      sentVia,
      syncStatus,
      remoteId,
      lastSyncedAt
     FROM location_logs
     WHERE tripId = ?
       AND sendStatus != 'sent'
     ORDER BY id ASC`,
    tripId
  );
}

// Return the most recent location log.
export async function getLatestLocationLog() {
  const db = await dbPromise;
  const rows = await db.getAllAsync(
    `SELECT
      id,
      tripId,
      latitude,
      longitude,
      placeName,
      recordedAt,
      sendStatus,
      sendAttempts,
      lastAttemptAt,
      sentVia,
      syncStatus,
      remoteId,
      lastSyncedAt
     FROM location_logs
     ORDER BY id DESC
     LIMIT 1`
  );

  return rows[0] || null;
}

// Return the most recent location log that has not been sent successfully.
export async function getLatestPendingLocationLog() {
  const db = await dbPromise;
  const rows = await db.getAllAsync(
    `SELECT
      id,
      tripId,
      latitude,
      longitude,
      placeName,
      recordedAt,
      sendStatus,
      sendAttempts,
      lastAttemptAt,
      sentVia,
      syncStatus,
      remoteId,
      lastSyncedAt
     FROM location_logs
     WHERE sendStatus != 'sent'
     ORDER BY id DESC
     LIMIT 1`
  );

  return rows[0] || null;
}

// Return the most recent unsent location log for a specific trip.
export async function getLatestPendingLocationLogForTrip(tripId) {
  const db = await dbPromise;
  const rows = await db.getAllAsync(
    `SELECT
      id,
      tripId,
      latitude,
      longitude,
      placeName,
      recordedAt,
      sendStatus,
      sendAttempts,
      lastAttemptAt,
      sentVia,
      syncStatus,
      remoteId,
      lastSyncedAt
     FROM location_logs
     WHERE tripId = ?
       AND sendStatus != 'sent'
     ORDER BY id DESC
     LIMIT 1`,
    tripId
  );

  return rows[0] || null;
}

// Return the ten most recent location logs.
export async function getRecentLocationLogs() {
  const db = await dbPromise;

  return db.getAllAsync(
    `SELECT
      id,
      tripId,
      latitude,
      longitude,
      placeName,
      recordedAt,
      sendStatus,
      sendAttempts,
      lastAttemptAt,
      sentVia,
      syncStatus,
      remoteId,
      lastSyncedAt
     FROM location_logs
     ORDER BY id DESC
     LIMIT 10`
  );
}

// Return all location logs recorded for a specific trip.
export async function getLocationLogsForTrip(tripId) {
  const db = await dbPromise;

  return db.getAllAsync(
    `SELECT
      id,
      tripId,
      latitude,
      longitude,
      placeName,
      recordedAt,
      sendStatus,
      sendAttempts,
      lastAttemptAt,
      sentVia,
      syncStatus,
      remoteId,
      lastSyncedAt
     FROM location_logs
     WHERE tripId = ?
     ORDER BY id ASC`,
    tripId
  );
}