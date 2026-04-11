import { dbPromise } from "./core";

// Return the most recently saved safety contact.
export async function getSafetyContact() {
  const db = await dbPromise;
  const rows = await db.getAllAsync(
    "SELECT id, name, phone FROM safety_contacts ORDER BY id DESC LIMIT 1"
  );

  return rows[0] || null;
}

// Replace the current safety contact with the newly selected one.
export async function saveSafetyContact(contact) {
  const db = await dbPromise;

  await db.runAsync("DELETE FROM safety_contacts");
  await db.runAsync(
    "INSERT INTO safety_contacts (name, phone) VALUES (?, ?)",
    contact.name,
    contact.phone
  );
}