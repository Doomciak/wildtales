import { dbPromise } from "./core";

// Retrieves the most recently saved safety contact from the database.
export async function getSafetyContact() {
  const db = await dbPromise;
  const rows = await db.getAllAsync(
    "SELECT id, name, phone FROM safety_contacts ORDER BY id DESC LIMIT 1"
  );

  return rows[0] || null;
}

// Replaces the current safety contact with the newly provided one.
export async function saveSafetyContact(contact) {
  const db = await dbPromise;

  await db.runAsync("DELETE FROM safety_contacts");
  await db.runAsync(
    "INSERT INTO safety_contacts (name, phone) VALUES (?, ?)",
    contact.name,
    contact.phone
  );
}