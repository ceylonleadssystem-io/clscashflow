import { createContext, useCallback, useContext, useMemo, useState } from "react";

/** Open-state of modals that can be launched from several screens. */
const ModalsContext = createContext(null);

export function ModalsProvider({ children }) {
	const [product, setProduct] = useState(null); // null | "" (new) | id
	const [barcodeProductId, setBarcodeProductId] = useState(null);
	const [cashMode, setCashMode] = useState(null); // null | "clock-in" | "open" | "close"
	const openProduct = useCallback((id = "") => setProduct(id), []);
	const closeProduct = useCallback(() => setProduct(null), []);
	const value = useMemo(
		() => ({
			product,
			openProduct,
			closeProduct,
			barcodeProductId,
			openBarcode: setBarcodeProductId,
			closeBarcode: () => setBarcodeProductId(null),
			cashMode,
			openCash: setCashMode,
			closeCash: () => setCashMode(null),
		}),
		[product, openProduct, closeProduct, barcodeProductId, cashMode],
	);
	return <ModalsContext.Provider value={value}>{children}</ModalsContext.Provider>;
}

export const useModals = () => useContext(ModalsContext);
