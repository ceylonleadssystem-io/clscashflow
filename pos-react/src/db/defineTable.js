import { Model } from "@nozbe/watermelondb";

/**
 * One declarative definition per table drives:
 *   - the WatermelonDB `tableSchema`   (see schema.js)
 *   - the Model class with typed accessors (defineModel below)
 *   - the legacy <-> relational mapper    (legacy/mapper.js)
 *
 * Field types: "string" | "number" | "boolean" | "json".
 * `json` columns are stored as serialised strings (Watermelon has no native
 * JSON column) and exposed as parsed values on the model.
 * Every table also has an `extra` JSON column that keeps legacy properties we
 * do not model explicitly, so a round-trip through the cloud payload is lossless.
 */
export const camelToSnake = (s) =>
	s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());

/** `created_at` / `updated_at` are reserved by WatermelonDB (numeric), so the
 * legacy ISO strings use `_iso` columns. */
const RESERVED = { createdAt: "created_iso", updatedAt: "updated_iso" };
const columnName = (key) => RESERVED[key] || camelToSnake(key);

export function defineTable(name, fields, options = {}) {
	const indexed = new Set(options.indexed || []);
	fields = { ...fields, seq: "number" };
	const spec = {
		name,
		/** "newest": legacy arrays use unshift (latest first); "oldest": push. */
		order: options.order || "oldest",
		/** key in the legacy payload (defaults to table name camel-cased). */
		legacyKey: "legacyKey" in options ? options.legacyKey : name,
		fields,
		indexed,
		columns: Object.entries(fields).map(([key, type]) => ({
			key,
			type,
			column: columnName(key),
			isIndexed: indexed.has(key),
		})),
		/** timestamp fields used for merges (legacy itemTime()). */
		timeKeys: options.timeKeys || ["updatedAt", "createdAt", "at", "date"],
	};
	spec.model = defineModel(spec);
	return spec;
}

function defineModel(spec) {
	class TableModel extends Model {
		static table = spec.name;
	}
	Object.defineProperty(TableModel, "name", { value: pascal(spec.name) });
	for (const { key, type, column } of spec.columns) {
		// `createdAt` / `updatedAt` on a model make WatermelonDB write its own
		// numeric created_at/updated_at columns, so expose them as *Iso.
		const prop = key === "createdAt" ? "createdIso" : key === "updatedAt" ? "updatedIso" : key;
		Object.defineProperty(TableModel.prototype, prop, {
			configurable: true,
			enumerable: true,
			get() {
				const raw = this._getRaw(column);
				if (raw == null) return undefined;
				if (type === "json") {
					try {
						return JSON.parse(raw);
					} catch {
						return undefined;
					}
				}
				return raw;
			},
			set(value) {
				this._setRaw(column, encode(type, value));
			},
		});
	}
	Object.defineProperty(TableModel.prototype, "extra", {
		configurable: true,
		get() {
			const raw = this._getRaw("extra");
			if (!raw) return {};
			try {
				return JSON.parse(raw) || {};
			} catch {
				return {};
			}
		},
		set(value) {
			this._setRaw("extra", value && Object.keys(value).length ? JSON.stringify(value) : null);
		},
	});
	return TableModel;
}

const pascal = (s) =>
	s
		.split("_")
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join("");

/** Value -> raw column value. */
export function encode(type, value) {
	if (value === undefined || value === null) return null;
	switch (type) {
		case "number": {
			const n = Number(value);
			return Number.isFinite(n) ? n : null;
		}
		case "boolean":
			return !!value;
		case "json":
			return JSON.stringify(value);
		default:
			return String(value);
	}
}

/** Raw column value -> value (mirror of the model getters, used on _raw maps). */
export function decode(type, raw) {
	if (raw === undefined || raw === null) return undefined;
	if (type === "json") {
		try {
			return JSON.parse(raw);
		} catch {
			return undefined;
		}
	}
	return raw;
}
