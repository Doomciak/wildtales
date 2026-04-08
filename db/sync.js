import { dbPromise, nowIso } from "./core";

// Creates a new entry in the pending sync queue.
export async function createPendingSyncEntry({
  entityType,
  entityId = null,
  action,
  payload = null,
}) {
  const db = await dbPromise;
  const timestamp = nowIso();

  const result = await db.runAsync(
    `INSERT INTO pending_sync (
      entityType,
      entityId,
      action,
      payload,
      status,
      retryCount,
      lastError,
      createdAt,
      updatedAt
    ) VALUES (?, ?, ?, ?, 'pending', 0, NULL, ?, ?)`,
    entityType,
    entityId,
    action,
    payload ? JSON.stringify(payload) : null,
    timestamp,
    timestamp
  );

  return result.lastInsertRowId;
}

// Retrieves pending or failed sync items for processing.
export async function getPendingSyncItems(limit = 50) {
  const db = await dbPromise;

  return db.getAllAsync(
    `SELECT
      id,
      entityType,
      entityId,
      action,
      payload,
      status,
      retryCount,
      lastError,
      createdAt,
      updatedAt
     FROM pending_sync
     WHERE status IN ('pending', 'failed')
     ORDER BY createdAt ASC
     LIMIT ?`,
    limit
  );
}

// Marks a sync queue item as currently being processed.
export async function markPendingSyncProcessing(id) {
  const db = await dbPromise;

  await db.runAsync(
    `UPDATE pending_sync
     SET status = 'processing',
         updatedAt = ?
     WHERE id = ?`,
    nowIso(),
    id
  );
}

// Marks a sync queue item as completed.
export async function markPendingSyncDone(id) {
  const db = await dbPromise;

  await db.runAsync(
    `UPDATE pending_sync
     SET status = 'done',
         updatedAt = ?
     WHERE id = ?`,
    nowIso(),
    id
  );
}

// Marks a sync queue item as failed and stores the error message.
export async function markPendingSyncFailed(id, errorMessage = "Unknown error") {
  const db = await dbPromise;

  await db.runAsync(
    `UPDATE pending_sync
     SET status = 'failed',
         retryCount = retryCount + 1,
         lastError = ?,
         updatedAt = ?
     WHERE id = ?`,
    String(errorMessage),
    nowIso(),
    id
  );
}

// Removes sync queue items that have already been completed.
export async function deleteCompletedSyncItems() {
  const db = await dbPromise;
  await db.runAsync("DELETE FROM pending_sync WHERE status = 'done'");
}

// Marks a place record as successfully synced.
export async function markPlaceSynced(localId, remoteId = null) {
  const db = await dbPromise;

  await db.runAsync(
    `UPDATE places
     SET syncStatus = 'synced',
         remoteId = COALESCE(?, remoteId),
         lastSyncedAt = ?
     WHERE id = ?`,
    remoteId,
    nowIso(),
    localId
  );
}

// Marks a route record as successfully synced.
export async function markRouteSynced(localId, remoteId = null) {
  const db = await dbPromise;

  await db.runAsync(
    `UPDATE routes
     SET syncStatus = 'synced',
         remoteId = COALESCE(?, remoteId),
         lastSyncedAt = ?
     WHERE id = ?`,
    remoteId,
    nowIso(),
    localId
  );
}

// Marks a trip session record as successfully synced.
export async function markTripSessionSynced(localId, remoteId = null) {
  const db = await dbPromise;

  await db.runAsync(
    `UPDATE trip_sessions
     SET syncStatus = 'synced',
         remoteId = COALESCE(?, remoteId),
         lastSyncedAt = ?
     WHERE id = ?`,
    remoteId,
    nowIso(),
    localId
  );
}