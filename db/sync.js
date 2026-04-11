import { dbPromise, nowIso } from "./core";

// Create a new entry in the pending sync queue.
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

// Return pending or failed sync items ready for processing.
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

// Mark a sync queue item as currently being processed.
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

// Mark a sync queue item as completed.
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

// Mark a sync queue item as failed and store the latest error message.
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

// Remove sync queue items that have already been completed.
export async function deleteCompletedSyncItems() {
  const db = await dbPromise;
  await db.runAsync("DELETE FROM pending_sync WHERE status = 'done'");
}

// Mark a place record as successfully synced.
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

// Mark a route record as successfully synced.
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

// Mark a trip session record as successfully synced.
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