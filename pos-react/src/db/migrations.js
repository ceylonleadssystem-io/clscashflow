import { schemaMigrations } from "@nozbe/watermelondb/Schema/migrations";

/**
 * Schema migrations. Version 1 is the initial relational schema, therefore no
 * steps yet. Example for a future release:
 *
 *   { toVersion: 2, steps: [ addColumns({ table: "products", columns: [...] }) ] }
 */
// Keep this list in lockstep with SCHEMA_VERSION in schema.js: LokiJS refuses to open a database
// whose stored version is older than the schema unless a migration path exists.
export const migrations = schemaMigrations({ migrations: [] });
