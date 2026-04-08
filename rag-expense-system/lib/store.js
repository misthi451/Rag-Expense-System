/**
 * Global In-Memory Store
 * Vercel pe file system read-only hota hai,
 * isliye data memory mein store karte hain
 */

global._expenseStore = global._expenseStore || [];

export function saveExpenses(data) {
  global._expenseStore = [...global._expenseStore, ...data];
  return global._expenseStore.length;
}

export function getExpenses() {
  return global._expenseStore || [];
}

export function clearExpenses() {
  global._expenseStore = [];
}
