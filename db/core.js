import * as SQLite from "expo-sqlite";
import { Directory, Paths } from "expo-file-system";

// Name of the SQLite database used by the app.
const DATABASE_NAME = "wildtales.db";

// Folder name used for app-managed media files.
export const MANAGED_MEDIA_FOLDER_NAME = "wildtales-media";

// Open the local SQLite database so it can be reused across the app.
export const dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);

// Points to the app's managed media folder inside document storage.
export const managedMediaDirectory = new Directory(
  Paths.document,
  MANAGED_MEDIA_FOLDER_NAME
);

// Return the current date and time as an ISO string.
export function nowIso() {
  return new Date().toISOString();
}