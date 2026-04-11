import { dbPromise } from "./core";
import { ensureManagedMediaDirectory } from "./media";

// Return the column names currently defined for a table.
async function getTableColumnNames(db, tableName) {
  const columns = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
  return columns.map((column) => column.name);
}

// Add any missing columns to an existing table.
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

// Create the database tables and indexes if they do not already exist,
// then make sure older local databases still get any newer columns.
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
      snapshotUri TEXT,
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

  // Make sure the places table includes all fields used by the current app version.
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

  // Make sure trip sessions include the fields needed for syncing.
  await ensureColumns(db, "trip_sessions", [
    ["syncStatus", "TEXT NOT NULL DEFAULT 'pending'"],
    ["remoteId", "TEXT"],
    ["lastSyncedAt", "TEXT"],
  ]);

  // Make sure location logs include delivery tracking and sync fields.
  await ensureColumns(db, "location_logs", [
    ["sendStatus", "TEXT NOT NULL DEFAULT 'pending'"],
    ["sendAttempts", "INTEGER NOT NULL DEFAULT 0"],
    ["lastAttemptAt", "TEXT"],
    ["sentVia", "TEXT"],
    ["syncStatus", "TEXT NOT NULL DEFAULT 'pending'"],
    ["remoteId", "TEXT"],
    ["lastSyncedAt", "TEXT"],
  ]);

  // Make sure routes include all route, image, and sync-related fields.
  await ensureColumns(db, "routes", [
    ["title", "TEXT"],
    ["note", "TEXT"],
    ["image", "TEXT"],
    ["images", "TEXT"],
    ["snapshotUri", "TEXT"],
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

  // Make sure the sync queue includes all fields needed for pending operations.
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

  // Make sure the managed media folder exists before image files are stored.
  await ensureManagedMediaDirectory();
}