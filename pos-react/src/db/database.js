import { Database } from "@nozbe/watermelondb";
import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
import { schema } from "./schema";
import { migrations } from "./migrations";
import { modelClasses } from "./models";
import { SCHEMA_VERSION } from "./schema";
import { createLogger } from "../utils/logger";

const log = createLogger("db");

/**
 * Creates (or re-opens) a WatermelonDB database.
 *
 * Web: LokiJS adapter persisted to IndexedDB (incremental). Each business
 * workspace gets its own database name (`ceylonry-pos-<workspaceUid>`), which
 * replaces the per-account `localStorage` keys used by the legacy POS.
 */
export function createDatabase(name, { onSetUpError } = {}) {
	log.info("opening local database", { name, schemaVersion: SCHEMA_VERSION });
	const adapter = new LokiJSAdapter({
		dbName: name,
		schema,
		migrations,
		useWebWorker: false,
		// IndexedDB persistence; WatermelonDB transparently falls back to an
		// in-memory Loki adapter when IndexedDB is unavailable (private mode, tests).
		useIncrementalIndexedDB: true,
		onSetUpError: (error) => {
			console.error("POS local database failed to start", error);
			log.error("local database failed to start", error, { name });
			if (onSetUpError) onSetUpError(error);
		},
	});
	return new Database({ adapter, modelClasses });
}

export function databaseNameFor(workspaceUid) {
	return workspaceUid ? `ceylonry-pos-${workspaceUid}` : "ceylonry-pos-v1";
}
