import { Directory, File } from "expo-file-system";

import { dbPromise, managedMediaDirectory } from "./core";
import {
  getPlaceFileUris,
  getRouteFileUris,
  isLocalFileUri,
  isManagedMediaUri,
  uniqueStrings,
} from "./helpers";

// Ensures that the managed media folder exists before files are saved into it.
export async function ensureManagedMediaDirectory() {
  if (!managedMediaDirectory.exists) {
    managedMediaDirectory.create({
      idempotent: true,
      intermediates: true,
    });
  }

  return managedMediaDirectory;
}

// Deletes a local file if the provided URI points to a valid local file.
export async function deleteLocalFile(uri) {
  if (!isLocalFileUri(uri)) {
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

// Checks whether a file is still referenced by any place or route record.
// Records passed in ignoredRecords are excluded from the check.
export async function isFileStillReferenced(db, uri, ignoredRecords = []) {
  if (!uri) {
    return false;
  }

  const ignoredSet = new Set(
    ignoredRecords.map((item) => `${item.table}:${item.id}`)
  );

  const placeRows = await db.getAllAsync("SELECT id, image, images FROM places");

  for (const row of placeRows) {
    if (ignoredSet.has(`places:${row.id}`)) {
      continue;
    }

    if (getPlaceFileUris(row).includes(uri)) {
      return true;
    }
  }

  const routeRows = await db.getAllAsync(
    "SELECT id, image, images, snapshotUri FROM routes"
  );

  for (const row of routeRows) {
    if (ignoredSet.has(`routes:${row.id}`)) {
      continue;
    }

    if (getRouteFileUris(row).includes(uri)) {
      return true;
    }
  }

  return false;
}

// Deletes managed media files only if they are no longer referenced in the database.
export async function deleteUnusedManagedUris(uris, ignoredRecords = []) {
  const db = await dbPromise;

  for (const uri of uniqueStrings(uris)) {
    if (!isManagedMediaUri(uri)) {
      continue;
    }

    const stillReferenced = await isFileStillReferenced(db, uri, ignoredRecords);

    if (!stillReferenced) {
      await deleteLocalFile(uri);
    }
  }
}

// Recursively collects all file URIs stored inside the managed media folder.
async function listManagedMediaFilesRecursive(directory = managedMediaDirectory) {
  if (!directory.exists) {
    return [];
  }

  const items = directory.list();
  const uris = [];

  for (const item of items) {
    if (item instanceof Directory) {
      const nestedUris = await listManagedMediaFilesRecursive(item);
      uris.push(...nestedUris);
      continue;
    }

    if (item instanceof File) {
      uris.push(item.uri);
    }
  }

  return uniqueStrings(uris);
}

// Returns the URI of the managed media folder.
export function getManagedMediaDirectoryUri() {
  return managedMediaDirectory.uri;
}

// Produces a summary of image storage usage by comparing
// database references with files stored locally.
export async function getImageStorageAudit() {
  await ensureManagedMediaDirectory();
  const db = await dbPromise;

  const placeRows = await db.getAllAsync("SELECT id, image, images FROM places");
  const routeRows = await db.getAllAsync(
    "SELECT id, image, images, snapshotUri FROM routes"
  );

  const placeReferences = placeRows.flatMap((row) =>
    getPlaceFileUris(row)
      .filter(isLocalFileUri)
      .map((uri) => ({
        table: "places",
        id: row.id,
        uri,
        managed: isManagedMediaUri(uri),
        exists: new File(uri).exists,
      }))
  );

  const routeReferences = routeRows.flatMap((row) =>
    getRouteFileUris(row)
      .filter(isLocalFileUri)
      .map((uri) => ({
        table: "routes",
        id: row.id,
        uri,
        managed: isManagedMediaUri(uri),
        exists: new File(uri).exists,
      }))
  );

  const referencedLocalUris = uniqueStrings([
    ...placeReferences.map((item) => item.uri),
    ...routeReferences.map((item) => item.uri),
  ]);

  const missingReferencedUris = referencedLocalUris.filter((uri) => {
    try {
      return !new File(uri).exists;
    } catch {
      return true;
    }
  });

  const managedFileUris = await listManagedMediaFilesRecursive();
  const referencedManagedSet = new Set(
    referencedLocalUris.filter(isManagedMediaUri)
  );

  const managedOrphanUris = managedFileUris.filter(
    (uri) => !referencedManagedSet.has(uri)
  );

  return {
    managedDirectoryUri: managedMediaDirectory.uri,
    placeReferenceCount: placeReferences.length,
    routeReferenceCount: routeReferences.length,
    referencedLocalUriCount: referencedLocalUris.length,
    managedFileCount: managedFileUris.length,
    missingReferencedUriCount: missingReferencedUris.length,
    managedOrphanCount: managedOrphanUris.length,
    placeReferences,
    routeReferences,
    referencedLocalUris,
    missingReferencedUris,
    managedFileUris,
    managedOrphanUris,
  };
}

// Removes orphaned managed files and returns the audit data
// together with the number of deleted files.
export async function cleanupManagedOrphanFiles() {
  const audit = await getImageStorageAudit();

  for (const uri of audit.managedOrphanUris) {
    await deleteLocalFile(uri);
  }

  return {
    ...audit,
    deletedOrphanCount: audit.managedOrphanUris.length,
  };
}