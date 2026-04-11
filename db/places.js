import { dbPromise } from "./core";
import {
  buildImageFields,
  getPlaceFileUris,
  serialisePlaceRow,
} from "./helpers";
import { deleteUnusedManagedUris } from "./media";
import { createPendingSyncEntry } from "./sync";

// Return all saved places from newest to oldest.
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

// Save a new place or update an existing one, then queue the change for sync.
export async function savePlaceToDb(place, editingId = null) {
  const db = await dbPromise;
  const { image, imagesJson, imageUris } = buildImageFields(place);

  // Update the existing place when an editing id is provided.
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

    const oldUris = getPlaceFileUris(existingPlace);

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

    // Queue the update so it can be synced later.
    await createPendingSyncEntry({
      entityType: "place",
      entityId: editingId,
      action: "update",
      payload,
    });

    const removedUris = oldUris.filter((uri) => !imageUris.includes(uri));

    // Remove old managed files if nothing else still references them.
    await deleteUnusedManagedUris(removedUris, [
      { table: "places", id: editingId },
    ]);

    return editingId;
  }

  // Insert a new place when no editing id was provided.
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

  // Queue the create action so the new place can be synced later.
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

// Delete a place, unlink any related routes, and clean up unused managed files.
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

  const imageUris = getPlaceFileUris(existingPlace);

  await db.runAsync("DELETE FROM places WHERE id = ?", id);

  // Clear the place link from any routes that pointed to this place.
  await db.runAsync(
    `UPDATE routes
     SET linkedPlaceId = NULL,
         syncStatus = 'pending'
     WHERE linkedPlaceId = ?`,
    id
  );

  // Queue the delete action so the removal can be synced later.
  await createPendingSyncEntry({
    entityType: "place",
    entityId: id,
    action: "delete",
    payload: serialisePlaceRow(existingPlace),
  });

  // Remove files that are no longer referenced after deletion.
  await deleteUnusedManagedUris(imageUris);
}