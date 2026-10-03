/**
 * Tiny lookups that turn ids into display names (customer, user).
 */
/** Display helpers for lookups by id. */
export const customerName = (customers, id) => customers.find((c) => c.id === id)?.name || "Walk-in Customer";
export const userName = (users, id, fallback = "Unknown") => users.find((u) => u.id === id)?.name || fallback;
