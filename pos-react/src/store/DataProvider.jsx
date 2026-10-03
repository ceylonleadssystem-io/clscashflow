/**
 * Provides the live, plain-object snapshot of the WatermelonDB data (products, sales, customers, settings...),
 * plus the store and repositories. dataRef always holds the newest snapshot for service code.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { EMPTY_SNAPSHOT } from "../db/PosStore";
import { createRepositories } from "../db/repositories";

/**
 * Live, plain-object view of the WatermelonDB data (same shape as the legacy
 * `db` object: products, sales(with lines), customers, settings, ...).
 * `dataRef` always holds the newest snapshot, including right after an awaited
 * write, so service code can call `ctx.data()` safely.
 */
const DataContext = createContext(null);

export function DataProvider({ store, children }) {
	const [data, setData] = useState(() => ({ ...EMPTY_SNAPSHOT(), ready: false }));
	const dataRef = useRef(data);
	useEffect(() => {
		if (!store) return undefined;
		dataRef.current = { ...EMPTY_SNAPSHOT(), ready: false };
		setData(dataRef.current);
		return store.observe((snapshot, ready) => {
			dataRef.current = { ...snapshot, ready };
			setData(dataRef.current);
		});
	}, [store]);
	const repos = useMemo(() => (store ? createRepositories(store) : null), [store]);
	const value = useMemo(() => ({ data, dataRef, store, repos }), [data, store, repos]);
	return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/** The current snapshot (re-renders on every change). */
export const useData = () => useContext(DataContext).data;
export const useDataRef = () => useContext(DataContext).dataRef;
export const useStore = () => useContext(DataContext).store;
/** Repository layer (queries + single-entity saves) over WatermelonDB. */
export const useRepositories = () => useContext(DataContext).repos;
