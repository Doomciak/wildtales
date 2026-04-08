import { dbPromise } from "./core";
import {
  buildImageFields,
  getRouteFileUris,
  serialiseRouteRow,
  uniqueStrings,
} from "./helpers";
import { deleteUnusedManagedUris } from "./media";
import { createPendingSyncEntry } from "./sync";

// Retrieves all saved routes from the database,
// ordered by the most recent route activity.
export async function getAllRoutes() {
  const db = await dbPromise;

  return db.getAllAsync(
    `SELECT
      id,
      title,
      note,
      image,
      images,
      snapshotUri,
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

// Saves a new route or updates an existing one,
// and records the change for later syncing.
export async function saveRouteToDb(route, editingId = null) {
  const db = await dbPromise;
  const { image, imagesJson, imageUris } = buildImageFields(route);
  const snapshotUri = route.snapshotUri || null;
  const routePointsJson = JSON.stringify(route.routePoints || []);
  const nextFileUris = uniqueStrings([snapshotUri, ...imageUris]);

  // Update the existing route if an editing id is provided.
  if (editingId) {
    const existingRoute = await db.getFirstAsync(
      `SELECT
        id,
        title,
        note,
        image,
        images,
        snapshotUri,
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

    const oldUris = getRouteFileUris(existingRoute);

    await db.runAsync(
      `UPDATE routes
       SET title = ?,
           note = ?,
           image = ?,
           images = ?,
           snapshotUri = ?,
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
      snapshotUri,
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

    // Adds an update entry so the edited route can be synced later.
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
        snapshotUri,
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

    const removedUris = oldUris.filter((uri) => !nextFileUris.includes(uri));

    // Removes old managed files if they are no longer used.
    await deleteUnusedManagedUris(removedUris, [
      { table: "routes", id: editingId },
    ]);

    return editingId;
  }

  // Insert a new route if no editing id was provided.
  const result = await db.runAsync(
    `INSERT INTO routes (
      title,
      note,
      image,
      images,
      snapshotUri,
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL)`,
    route.title,
    route.note || null,
    image,
    imagesJson,
    snapshotUri,
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

  // Adds a create entry so the new route can be synced later.
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
      snapshotUri,
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

// Updates the place linked to a route
// and records the change for syncing.
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
      snapshotUri,
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

// Deletes a route, records the deletion for syncing,
// and removes files that are no longer used.
export async function deleteRouteFromDb(id) {
  const db = await dbPromise;

  const existingRoute = await db.getFirstAsync(
    `SELECT
      id,
      title,
      note,
      image,
      images,
      snapshotUri,
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

  const fileUris = getRouteFileUris(existingRoute);

  await db.runAsync("DELETE FROM routes WHERE id = ?", id);

  await createPendingSyncEntry({
    entityType: "route",
    entityId: id,
    action: "delete",
    payload: serialiseRouteRow(existingRoute),
  });

  await deleteUnusedManagedUris(fileUris);
}