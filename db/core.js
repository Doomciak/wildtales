import * as SQLite from "expo-sqlite";
import { Directory, Paths } from "expo-file-system";

// Name of the SQLite database used by the application.
const DATABASE_NAME = "wildtales.db";

// Name of the folder used to store media files managed by the application.
export const MANAGED_MEDIA_FOLDER_NAME = "wildtales-media";

// Open the local SQLite database so it can be accessed throughout the app. 
export const dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);

// Defines the location of the application's managed media folder
// within the device document storage.
export const managedMediaDirectory = new Directory(
  Paths.document,
  MANAGED_MEDIA_FOLDER_NAME
);

// Returns the current date and time as an ISO string.
export function nowIso() {
  return new Date().toISOString();
}