import { schemaMigrations } from "@nozbe/watermelondb/Schema/migrations";

/**
 * Schema migrations. Version 1 is the initial relational schema, therefore no
 * steps yet. Example for a future release:
 *
 *   { toVersion: 2, steps: [ addColumns({ table: "products", columns: [...] }) ] }
 */
export const migrations = schemaMigrations({ migrations: [] });
