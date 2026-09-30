import { appSchema, tableSchema } from "@nozbe/watermelondb";
import { TABLE_LIST } from "./tables";

/** Bump when a column/table is added and add the step to migrations.js */
export const SCHEMA_VERSION = 1;

const TYPE = { string: "string", number: "number", boolean: "boolean", json: "string" };

export const schema = appSchema({
	version: SCHEMA_VERSION,
	tables: TABLE_LIST.map((t) =>
		tableSchema({
			name: t.name,
			columns: [
				...t.columns.map((c) => ({
					name: c.column,
					type: TYPE[c.type] || "string",
					isOptional: true,
					isIndexed: c.isIndexed || undefined,
				})),
				{ name: "extra", type: "string", isOptional: true },
			],
		}),
	),
});
