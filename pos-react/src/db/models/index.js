import { TABLE_LIST } from "../tables";

/**
 * WatermelonDB model classes. They are generated from the declarative table
 * specs in ../tables (typed accessors for each column + JSON handling).
 */
export const modelClasses = TABLE_LIST.map((t) => t.model);

export { T as tables } from "../tables";
export const Product = TABLE_LIST.find((t) => t.name === "products").model;
export const Sale = TABLE_LIST.find((t) => t.name === "sales").model;
export const SaleLine = TABLE_LIST.find((t) => t.name === "sale_lines").model;
export const Customer = TABLE_LIST.find((t) => t.name === "customers").model;
export const ModifierGroup = TABLE_LIST.find((t) => t.name === "modifier_groups").model;
export const User = TABLE_LIST.find((t) => t.name === "users").model;
export const CashShift = TABLE_LIST.find((t) => t.name === "cash_shifts").model;
export const InventoryItem = TABLE_LIST.find((t) => t.name === "inventory_items").model;
export const Location = TABLE_LIST.find((t) => t.name === "locations").model;
