/**
 * WatermelonDB schema migrations (schema version 2). Keep in step with SCHEMA_VERSION in schema.js.
 */
import { schemaMigrations, createTable } from "@nozbe/watermelondb/Schema/migrations";
import { T } from "./tables";

const TYPE = { string: "string", number: "number", boolean: "boolean", json: "string" };
const tableColumns = (t) => [
	...t.columns.map((c) => ({ name: c.column, type: TYPE[c.type] || "string", isOptional: true, isIndexed: c.isIndexed || undefined })),
	{ name: "extra", type: "string", isOptional: true },
];

/**
 * Schema migrations. Version 1 is the initial relational schema.
 * Version 2 adds the Automobile (detailing) tables: vehicles, detail_packages and detail_jobs.
 * Example for a future release:
 *
 *   { toVersion: 3, steps: [ addColumns({ table: "products", columns: [...] }) ] }
 */
// Keep this list in lockstep with SCHEMA_VERSION in schema.js: LokiJS refuses to open a database
// whose stored version is older than the schema unless a migration path exists.
export const migrations = schemaMigrations({
	migrations: [
		{
			toVersion: 2,
			steps: [T.vehicles, T.detailPackages, T.detailJobs].map((t) => createTable({ name: t.name, columns: tableColumns(t) })),
		},
	],
});
