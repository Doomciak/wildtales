import * as SQLite from "expo-sqlite";

export const dbPromise = SQLite.openDatabaseAsync("wildtales.db");

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
      latitude REAL,
      longitude REAL
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
      isActive INTEGER NOT NULL DEFAULT 1
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
      sentVia TEXT
    );
  `);

  const placeColumns = await db.getAllAsync("PRAGMA table_info(places)");
  const placeColumnNames = placeColumns.map((column) => column.name);

  if (!placeColumnNames.includes("placeName")) {
    await db.execAsync("ALTER TABLE places ADD COLUMN placeName TEXT;");
  }

  if (!placeColumnNames.includes("latitude")) {
    await db.execAsync("ALTER TABLE places ADD COLUMN latitude REAL;");
  }

  if (!placeColumnNames.includes("longitude")) {
    await db.execAsync("ALTER TABLE places ADD COLUMN longitude REAL;");
  }

  const logColumns = await db.getAllAsync("PRAGMA table_info(location_logs)");
  const logColumnNames = logColumns.map((column) => column.name);

  if (!logColumnNames.includes("sendStatus")) {
    await db.execAsync(
      "ALTER TABLE location_logs ADD COLUMN sendStatus TEXT DEFAULT 'pending';"
    );
  }

  if (!logColumnNames.includes("sendAttempts")) {
    await db.execAsync(
      "ALTER TABLE location_logs ADD COLUMN sendAttempts INTEGER DEFAULT 0;"
    );
  }

  if (!logColumnNames.includes("lastAttemptAt")) {
    await db.execAsync(
      "ALTER TABLE location_logs ADD COLUMN lastAttemptAt TEXT;"
    );
  }

  if (!logColumnNames.includes("sentVia")) {
    await db.execAsync("ALTER TABLE location_logs ADD COLUMN sentVia TEXT;");
  }
}

export async function getAllPlaces() {
  const db = await dbPromise;
  return db.getAllAsync(
    "SELECT id, title, placeName, note, image, latitude, longitude FROM places ORDER BY id DESC"
  );
}

export async function savePlaceToDb(place, editingId = null) {
  const db = await dbPromise;

  if (editingId) {
    await db.runAsync(
      "UPDATE places SET title = ?, placeName = ?, note = ?, image = ?, latitude = ?, longitude = ? WHERE id = ?",
      place.title,
      place.placeName,
      place.note,
      place.image,
      place.latitude,
      place.longitude,
      editingId
    );
    return;
  }

  await db.runAsync(
    "INSERT INTO places (title, placeName, note, image, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)",
    place.title,
    place.placeName,
    place.note,
    place.image,
    place.latitude,
    place.longitude
  );
}

export async function deletePlaceFromDb(id) {
  const db = await dbPromise;
  await db.runAsync("DELETE FROM places WHERE id = ?", id);
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
    "SELECT id, startedAt, endedAt, isActive FROM trip_sessions WHERE isActive = 1 ORDER BY id DESC LIMIT 1"
  );
  return rows[0] || null;
}

export async function startTripSession() {
  const db = await dbPromise;
  await db.runAsync("UPDATE trip_sessions SET isActive = 0 WHERE isActive = 1");

  const startedAt = new Date().toISOString();
  const result = await db.runAsync(
    "INSERT INTO trip_sessions (startedAt, isActive) VALUES (?, 1)",
    startedAt
  );

  return result.lastInsertRowId;
}

export async function stopTripSession(tripId) {
  const db = await dbPromise;
  await db.runAsync(
    "UPDATE trip_sessions SET endedAt = ?, isActive = 0 WHERE id = ?",
    new Date().toISOString(),
    tripId
  );
}

export async function saveLocationLog(log) {
  const db = await dbPromise;
  const result = await db.runAsync(
    "INSERT INTO location_logs (tripId, latitude, longitude, placeName, recordedAt, sendStatus, sendAttempts, lastAttemptAt, sentVia) VALUES (?, ?, ?, ?, ?, 'pending', 0, NULL, NULL)",
    log.tripId,
    log.latitude,
    log.longitude,
    log.placeName,
    log.recordedAt
  );

  return result.lastInsertRowId;
}

export async function markLocationLogSent(id, via = "api") {
  const db = await dbPromise;
  await db.runAsync(
    "UPDATE location_logs SET sendStatus = 'sent', sentVia = ?, lastAttemptAt = ? WHERE id = ?",
    via,
    new Date().toISOString(),
    id
  );
}

export async function markLocationLogSmsPrepared(id) {
  const db = await dbPromise;
  await db.runAsync(
    "UPDATE location_logs SET sentVia = 'sms', lastAttemptAt = ? WHERE id = ?",
    new Date().toISOString(),
    id
  );
}

export async function incrementLocationLogAttempt(id) {
  const db = await dbPromise;
  await db.runAsync(
    "UPDATE location_logs SET sendAttempts = sendAttempts + 1, lastAttemptAt = ?, sendStatus = 'failed' WHERE id = ?",
    new Date().toISOString(),
    id
  );
}

export async function getPendingLocationLogs() {
  const db = await dbPromise;
  return db.getAllAsync(
    "SELECT id, tripId, latitude, longitude, placeName, recordedAt, sendStatus, sendAttempts, lastAttemptAt, sentVia FROM location_logs WHERE sendStatus != 'sent' ORDER BY id ASC"
  );
}

export async function getLatestLocationLog() {
  const db = await dbPromise;
  const rows = await db.getAllAsync(
    "SELECT id, tripId, latitude, longitude, placeName, recordedAt, sendStatus, sendAttempts, lastAttemptAt, sentVia FROM location_logs ORDER BY id DESC LIMIT 1"
  );
  return rows[0] || null;
}

export async function getLatestPendingLocationLog() {
  const db = await dbPromise;
  const rows = await db.getAllAsync(
    "SELECT id, tripId, latitude, longitude, placeName, recordedAt, sendStatus, sendAttempts, lastAttemptAt, sentVia FROM location_logs WHERE sendStatus != 'sent' ORDER BY id DESC LIMIT 1"
  );
  return rows[0] || null;
}

export async function getRecentLocationLogs() {
  const db = await dbPromise;
  return db.getAllAsync(
    "SELECT id, tripId, latitude, longitude, placeName, recordedAt, sendStatus, sendAttempts, lastAttemptAt, sentVia FROM location_logs ORDER BY id DESC LIMIT 12"
  );
}
export async function getLocationLogsForTrip(tripId) {
  const db = await dbPromise;

  return db.getAllAsync(
    "SELECT id, tripId, latitude, longitude, placeName, recordedAt, sendStatus, sendAttempts, lastAttemptAt, sentVia FROM location_logs WHERE tripId = ? ORDER BY id ASC",
    tripId
  );
}