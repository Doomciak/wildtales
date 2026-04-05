import * as SQLite from "expo-sqlite";
import { File } from "expo-file-system";

const DATABASE_NAME = "wildtales.db";

export const dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);

function nowIso() {
  return new Date().toISOString();
}

function safeJsonArray(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string" && item.trim())
      : [];
  } catch {
    return [];
  }
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()))];
}

function normaliseIncomingImages(images, image) {
  const arrayImages = Array.isArray(images) ? images : safeJsonArray(images);
  return uniqueStrings([image, ...arrayImages]);
}

function buildImageFields(data = {}) {
  const imageUris = normaliseIncomingImages(data.images, data.image);
  return {
    image: imageUris[0] || null,
    imagesJson: JSON.stringify(imageUris),
    imageUris,
  };
}

function getRowImageUris(row) {
  if (!row) {
    return [];
  }

  return uniqueStrings([row.image, ...safeJsonArray(row.images)]);
}

function serialisePlaceRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    placeName: row.placeName,
    note: row.note,
    image: row.image,
    images: safeJsonArray(row.images),
    latitude: row.latitude,
    longitude: row.longitude,
    city: row.city,
    country: row.country,
    syncStatus: row.syncStatus,
    remoteId: row.remoteId,
    lastSyncedAt: row.lastSyncedAt,
  };
}

function serialiseRouteRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    note: row.note,
    image: row.image,
    images: safeJsonArray(row.images),
    startPlaceName: row.startPlaceName,
    endPlaceName: row.endPlaceName,
    startLatitude: row.startLatitude,
    startLongitude: row.startLongitude,
    endLatitude: row.endLatitude,
    endLongitude: row.endLongitude,
    distanceKm: row.distanceKm,
    durationMinutes: row.durationMinutes,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    routePoints: safeJsonArray(row.routePoints),
    linkedPlaceId: row.linkedPlaceId,
    syncStatus: row.syncStatus,
    remoteId: row.remoteId,
    lastSyncedAt: row.lastSyncedAt,
  };
}

async function getTableColumnNames(db, tableName) {
  const columns = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
  return columns.map((column) => column.name);
}

async function ensureColumns(db, tableName, columns) {
  const existingColumns = await getTableColumnNames(db, tableName);

  for (const [columnName, definition] of columns) {
    if (!existingColumns.includes(columnName)) {
      await db.execAsync(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`
      );
      existingColumns.push(columnName);
    }
  }
}

async function deleteLocalFile(uri) {
  if (!uri || !uri.startsWith("file://")) {
    return;
  }

  try {
    const file = new File(uri);

    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.log("Could not delete local file:", uri, error);
  }
}

async function isImageStillReferenced(db, uri, ignoredRecords = []) {
  if (!uri) {
    return false;
  }

  const ignoredSet = new Set(
    ignoredRecords.map((item) => `${item.table}:${item.id}`)
  );

  const placeRows = await db.getAllAsync(
    "SELECT id, image, images FROM places"
  );

  for (const row of placeRows) {
    if (ignoredSet.has(`places:${row.id}`)) {
      continue;
    }

    if (getRowImageUris(row).includes(uri)) {
      return true;
    }
  }

  const routeRows = await db.getAllAsync(
    "SELECT id, image, images FROM routes"
  );

  for (const row of routeRows) {
    if (ignoredSet.has(`routes:${row.id}`)) {
      continue;
    }

    if (getRowImageUris(row).includes(uri)) {
      return true;
    }
  }

  return false;
}

async function deleteUnusedImageUris(uris, ignoredRecords = []) {
  const db = await dbPromise;

  for (const uri of uniqueStrings(uris)) {
    const stillReferenced = await isImageStillReferenced(db, uri, ignoredRecords);

    if (!stillReferenced) {
      await deleteLocalFile(uri);
    }
  }
}

async function createPendingSyncEntry({
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

export async function setupDatabase() {
  const db = await dbPromise;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      placeName TEXT,
      note TEXT NOT NULL,
      image TEXT,
      images TEXT,
      latitude REAL,
      longitude REAL,
      city TEXT,
      country TEXT,
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      remoteId TEXT,
      lastSyncedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS safety_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trip_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      startedAt TEXT NOT NULL,
      endedAt TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      remoteId TEXT,
      lastSyncedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS location_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tripId INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      placeName TEXT,
      recordedAt TEXT NOT NULL,
      sendStatus TEXT NOT NULL DEFAULT 'pending',
      sendAttempts INTEGER NOT NULL DEFAULT 0,
      lastAttemptAt TEXT,
      sentVia TEXT,
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      remoteId TEXT,
      lastSyncedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      note TEXT,
      image TEXT,
      images TEXT,
      startPlaceName TEXT,
      endPlaceName TEXT,
      startLatitude REAL,
      startLongitude REAL,
      endLatitude REAL,
      endLongitude REAL,
      distanceKm REAL,
      durationMinutes INTEGER,
      startedAt TEXT NOT NULL,
      endedAt TEXT,
      routePoints TEXT NOT NULL,
      linkedPlaceId INTEGER,
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      remoteId TEXT,
      lastSyncedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entityType TEXT NOT NULL,
      entityId INTEGER,
      action TEXT NOT NULL,
      payload TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      retryCount INTEGER NOT NULL DEFAULT 0,
      lastError TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_trip_sessions_active
    ON trip_sessions(isActive);

    CREATE INDEX IF NOT EXISTS idx_location_logs_trip_id
    ON location_logs(tripId);

    CREATE INDEX IF NOT EXISTS idx_location_logs_recorded_at
    ON location_logs(recordedAt);

    CREATE INDEX IF NOT EXISTS idx_location_logs_send_status
    ON location_logs(sendStatus);

    CREATE INDEX IF NOT EXISTS idx_routes_started_at
    ON routes(startedAt);

    CREATE INDEX IF NOT EXISTS idx_routes_ended_at
    ON routes(endedAt);

    CREATE INDEX IF NOT EXISTS idx_pending_sync_status
    ON pending_sync(status);

    CREATE INDEX IF NOT EXISTS idx_pending_sync_entity
    ON pending_sync(entityType, entityId);
  `);

  await ensureColumns(db, "places", [
    ["placeName", "TEXT"],
    ["image", "TEXT"],
    ["images", "TEXT"],
    ["latitude", "REAL"],
    ["longitude", "REAL"],
    ["city", "TEXT"],
    ["country", "TEXT"],
    ["syncStatus", "TEXT NOT NULL DEFAULT 'pending'"],
    ["remoteId", "TEXT"],
    ["lastSyncedAt", "TEXT"],
  ]);

  await ensureColumns(db, "trip_sessions", [
    ["syncStatus", "TEXT NOT NULL DEFAULT 'pending'"],
    ["remoteId", "TEXT"],
    ["lastSyncedAt", "TEXT"],
  ]);

  await ensureColumns(db, "location_logs", [
    ["sendStatus", "TEXT NOT NULL DEFAULT 'pending'"],
    ["sendAttempts", "INTEGER NOT NULL DEFAULT 0"],
    ["lastAttemptAt", "TEXT"],
    ["sentVia", "TEXT"],
    ["syncStatus", "TEXT NOT NULL DEFAULT 'pending'"],
    ["remoteId", "TEXT"],
    ["lastSyncedAt", "TEXT"],
  ]);

  await ensureColumns(db, "routes", [
    ["title", "TEXT"],
    ["note", "TEXT"],
    ["image", "TEXT"],
    ["images", "TEXT"],
    ["startPlaceName", "TEXT"],
    ["endPlaceName", "TEXT"],
    ["startLatitude", "REAL"],
    ["startLongitude", "REAL"],
    ["endLatitude", "REAL"],
    ["endLongitude", "REAL"],
    ["distanceKm", "REAL"],
    ["durationMinutes", "INTEGER"],
    ["startedAt", "TEXT"],
    ["endedAt", "TEXT"],
    ["routePoints", "TEXT"],
    ["linkedPlaceId", "INTEGER"],
    ["syncStatus", "TEXT NOT NULL DEFAULT 'pending'"],
    ["remoteId", "TEXT"],
    ["lastSyncedAt", "TEXT"],
  ]);

  await ensureColumns(db, "pending_sync", [
    ["entityType", "TEXT"],
    ["entityId", "INTEGER"],
    ["action", "TEXT"],
    ["payload", "TEXT"],
    ["status", "TEXT NOT NULL DEFAULT 'pending'"],
    ["retryCount", "INTEGER NOT NULL DEFAULT 0"],
    ["lastError", "TEXT"],
    ["createdAt", "TEXT"],
    ["updatedAt", "TEXT"],
  ]);
}

export async function getAllPlaces() {
  const db = await dbPromise;

  return db.getAllAsync(
    `SELECT
      id,
      title,
      placeName,
      note,
      image,
      images,
      latitude,
      longitude,
      city,
      country,
      syncStatus,
      remoteId,
      lastSyncedAt
     FROM places
     ORDER BY id DESC`
  );
}

export async function savePlaceToDb(place, editingId = null) {
  const db = await dbPromise;
  const { image, imagesJson, imageUris } = buildImageFields(place);

  if (editingId) {
    const existingPlace = await db.getFirstAsync(
      `SELECT
        id,
        title,
        placeName,
        note,
        image,
        images,
        latitude,
        longitude,
        city,
        country,
        syncStatus,
        remoteId,
        lastSyncedAt
       FROM places
       WHERE id = ?`,
      editingId
    );

    if (!existingPlace) {
      throw new Error("Place not found.");
    }

    const oldUris = getRowImageUris(existingPlace);

    await db.runAsync(
      `UPDATE places
       SET title = ?,
           placeName = ?,
           note = ?,
           image = ?,
           images = ?,
           latitude = ?,
           longitude = ?,
           city = ?,
           country = ?,
           syncStatus = 'pending'
       WHERE id = ?`,
      place.title,
      place.placeName || null,
      place.note,
      image,
      imagesJson,
      place.latitude ?? null,
      place.longitude ?? null,
      place.city || null,
      place.country || null,
      editingId
    );

    const payload = {
      id: editingId,
      title: place.title,
      placeName: place.placeName || null,
      note: place.note,
      image,
      images: imageUris,
      latitude: place.latitude ?? null,
      longitude: place.longitude ?? null,
      city: place.city || null,
      country: place.country || null,
    };

    await createPendingSyncEntry({
      entityType: "place",
      entityId: editingId,
      action: "update",
      payload,
    });

    const removedUris = oldUris.filter((uri) => !imageUris.includes(uri));

    await deleteUnusedImageUris(removedUris, [{ table: "places", id: editingId }]);

    return editingId;
  }

  const result = await db.runAsync(
    `INSERT INTO places (
      title,
      placeName,
      note,
      image,
      images,
      latitude,
      longitude,
      city,
      country,
      syncStatus,
      remoteId,
      lastSyncedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL)`,
    place.title,
    place.placeName || null,
    place.note,
    image,
    imagesJson,
    place.latitude ?? null,
    place.longitude ?? null,
    place.city || null,
    place.country || null
  );

  const placeId = result.lastInsertRowId;

  await createPendingSyncEntry({
    entityType: "place",
    entityId: placeId,
    action: "create",
    payload: {
      id: placeId,
      title: place.title,
      placeName: place.placeName || null,
      note: place.note,
      image,
      images: imageUris,
      latitude: place.latitude ?? null,
      longitude: place.longitude ?? null,
      city: place.city || null,
      country: place.country || null,
    },
  });

  return placeId;
}

export async function deletePlaceFromDb(id) {
  const db = await dbPromise;

  const existingPlace = await db.getFirstAsync(
    `SELECT
      id,
      title,
      placeName,
      note,
      image,
      images,
      latitude,
      longitude,
      city,
      country,
      syncStatus,
      remoteId,
      lastSyncedAt
     FROM places
     WHERE id = ?`,
    id
  );

  if (!existingPlace) {
    return;
  }

  const imageUris = getRowImageUris(existingPlace);

  await db.runAsync("DELETE FROM places WHERE id = ?", id);
  await db.runAsync("UPDATE routes SET linkedPlaceId = NULL WHERE linkedPlaceId = ?", id);

  await createPendingSyncEntry({
    entityType: "place",
    entityId: id,
    action: "delete",
    payload: serialisePlaceRow(existingPlace),
  });

  await deleteUnusedImageUris(imageUris);
}

export async function getAllRoutes() {
  const db = await dbPromise;

  return db.getAllAsync(
    `SELECT
      id,
      title,
      note,
      image,
      images,
      startPlaceName,
      endPlaceName,
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
      distanceKm,
      durationMinutes,
      startedAt,
      endedAt,
      routePoints,
      linkedPlaceId,
      syncStatus,
      remoteId,
      lastSyncedAt
     FROM routes
     ORDER BY COALESCE(endedAt, startedAt) DESC, id DESC`
  );
}

export async function saveRouteToDb(route, editingId = null) {
  const db = await dbPromise;
  const { image, imagesJson, imageUris } = buildImageFields(route);
  const routePointsJson = JSON.stringify(route.routePoints || []);

  if (editingId) {
    const existingRoute = await db.getFirstAsync(
      `SELECT
        id,
        title,
        note,
        image,
        images,
        startPlaceName,
        endPlaceName,
        startLatitude,
        startLongitude,
        endLatitude,
        endLongitude,
        distanceKm,
        durationMinutes,
        startedAt,
        endedAt,
        routePoints,
        linkedPlaceId,
        syncStatus,
        remoteId,
        lastSyncedAt
       FROM routes
       WHERE id = ?`,
      editingId
    );

    if (!existingRoute) {
      throw new Error("Route not found.");
    }

    const oldUris = getRowImageUris(existingRoute);

    await db.runAsync(
      `UPDATE routes
       SET title = ?,
           note = ?,
           image = ?,
           images = ?,
           startPlaceName = ?,
           endPlaceName = ?,
           startLatitude = ?,
           startLongitude = ?,
           endLatitude = ?,
           endLongitude = ?,
           distanceKm = ?,
           durationMinutes = ?,
           startedAt = ?,
           endedAt = ?,
           routePoints = ?,
           linkedPlaceId = ?,
           syncStatus = 'pending'
       WHERE id = ?`,
      route.title,
      route.note || null,
      image,
      imagesJson,
      route.startPlaceName || null,
      route.endPlaceName || null,
      route.startLatitude ?? null,
      route.startLongitude ?? null,
      route.endLatitude ?? null,
      route.endLongitude ?? null,
      route.distanceKm ?? 0,
      route.durationMinutes ?? 0,
      route.startedAt,
      route.endedAt || null,
      routePointsJson,
      route.linkedPlaceId ?? null,
      editingId
    );

    await createPendingSyncEntry({
      entityType: "route",
      entityId: editingId,
      action: "update",
      payload: {
        id: editingId,
        title: route.title,
        note: route.note || null,
        image,
        images: imageUris,
        startPlaceName: route.startPlaceName || null,
        endPlaceName: route.endPlaceName || null,
        startLatitude: route.startLatitude ?? null,
        startLongitude: route.startLongitude ?? null,
        endLatitude: route.endLatitude ?? null,
        endLongitude: route.endLongitude ?? null,
        distanceKm: route.distanceKm ?? 0,
        durationMinutes: route.durationMinutes ?? 0,
        startedAt: route.startedAt,
        endedAt: route.endedAt || null,
        routePoints: route.routePoints || [],
        linkedPlaceId: route.linkedPlaceId ?? null,
      },
    });

    const removedUris = oldUris.filter((uri) => !imageUris.includes(uri));

    await deleteUnusedImageUris(removedUris, [{ table: "routes", id: editingId }]);

    return editingId;
  }

  const result = await db.runAsync(
    `INSERT INTO routes (
      title,
      note,
      image,
      images,
      startPlaceName,
      endPlaceName,
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
      distanceKm,
      durationMinutes,
      startedAt,
      endedAt,
      routePoints,
      linkedPlaceId,
      syncStatus,
      remoteId,
      lastSyncedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL)`,
    route.title,
    route.note || null,
    image,
    imagesJson,
    route.startPlaceName || null,
    route.endPlaceName || null,
    route.startLatitude ?? null,
    route.startLongitude ?? null,
    route.endLatitude ?? null,
    route.endLongitude ?? null,
    route.distanceKm ?? 0,
    route.durationMinutes ?? 0,
    route.startedAt,
    route.endedAt || null,
    routePointsJson,
    route.linkedPlaceId ?? null
  );

  const routeId = result.lastInsertRowId;

  await createPendingSyncEntry({
    entityType: "route",
    entityId: routeId,
    action: "create",
    payload: {
      id: routeId,
      title: route.title,
      note: route.note || null,
      image,
      images: imageUris,
      startPlaceName: route.startPlaceName || null,
      endPlaceName: route.endPlaceName || null,
      startLatitude: route.startLatitude ?? null,
      startLongitude: route.startLongitude ?? null,
      endLatitude: route.endLatitude ?? null,
      endLongitude: route.endLongitude ?? null,
      distanceKm: route.distanceKm ?? 0,
      durationMinutes: route.durationMinutes ?? 0,
      startedAt: route.startedAt,
      endedAt: route.endedAt || null,
      routePoints: route.routePoints || [],
      linkedPlaceId: route.linkedPlaceId ?? null,
    },
  });

  return routeId;
}

export async function updateRouteLinkedPlace(routeId, placeId) {
  const db = await dbPromise;

  await db.runAsync(
    "UPDATE routes SET linkedPlaceId = ?, syncStatus = 'pending' WHERE id = ?",
    placeId,
    routeId
  );

  const updatedRoute = await db.getFirstAsync(
    `SELECT
      id,
      title,
      note,
      image,
      images,
      startPlaceName,
      endPlaceName,
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
      distanceKm,
      durationMinutes,
      startedAt,
      endedAt,
      routePoints,
      linkedPlaceId,
      syncStatus,
      remoteId,
      lastSyncedAt
     FROM routes
     WHERE id = ?`,
    routeId
  );

  if (updatedRoute) {
    await createPendingSyncEntry({
      entityType: "route",
      entityId: routeId,
      action: "update",
      payload: serialiseRouteRow(updatedRoute),
    });
  }
}

export async function deleteRouteFromDb(id) {
  const db = await dbPromise;

  const existingRoute = await db.getFirstAsync(
    `SELECT
      id,
      title,
      note,
      image,
      images,
      startPlaceName,
      endPlaceName,
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
      distanceKm,
      durationMinutes,
      startedAt,
      endedAt,
      routePoints,
      linkedPlaceId,
      syncStatus,
      remoteId,
      lastSyncedAt
     FROM routes
     WHERE id = ?`,
    id
  );

  if (!existingRoute) {
    return;
  }

  const imageUris = getRowImageUris(existingRoute);

  await db.runAsync("DELETE FROM routes WHERE id = ?", id);

  await createPendingSyncEntry({
    entityType: "route",
    entityId: id,
    action: "delete",
    payload: serialiseRouteRow(existingRoute),
  });

  await deleteUnusedImageUris(imageUris);
}

export async function getSafetyContact() {
  const db = await dbPromise;
  const rows = await db.getAllAsync(
    "SELECT id, name, phone FROM safety_contacts ORDER BY id DESC LIMIT 1"
  );
  return rows[0] || null;
}

export async function saveSafetyContact(contact) {
  const db = await dbPromise;

  await db.runAsync("DELETE FROM safety_contacts");
  await db.runAsync(
    "INSERT INTO safety_contacts (name, phone) VALUES (?, ?)",
    contact.name,
    contact.phone
  );
}

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

export async function deleteCompletedSyncItems() {
  const db = await dbPromise;
  await db.runAsync("DELETE FROM pending_sync WHERE status = 'done'");
}

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