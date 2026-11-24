/**
 * Prints the End of Day report once a day at the time set in System Options > EOD Reports. It runs only while the POS is open and
 * someone is signed in on this device; a time missed by more than two hours (POS closed) is skipped, not printed late.
 */
import { useEffect, useRef } from "react";
import { printEodReceipt } from "../services/printing/eodPrint";
import { resolveOptions } from "../domain/systemOptions";
import { today } from "../domain/format";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";
import { createLogger } from "../utils/logger";

const log = createLogger("eod-auto-print");
const LATE_MIN = 120;
const key = (locationId, day) => `eod-auto-print:${locationId || "all"}:${day}`;
const seen = (k) => {
	try {
		return !!localStorage.getItem(k);
	} catch {
		return false;
	}
};

export function useEodAutoPrint() {
	const data = useData();
	const { currentUser, support, locationId } = usePos();
	const ref = useRef();
	ref.current = { data, locationId };
	useEffect(() => {
		if (!currentUser || support) return undefined;
		const tick = () => {
			const { data: d, locationId: loc } = ref.current;
			const o = resolveOptions(d.settings, "eod", loc);
			if (!o.autoOn) return;
			const now = new Date();
			const [h, m] = o.autoTime.split(":").map(Number);
			const late = (now - new Date(now).setHours(h, m, 0, 0)) / 60000;
			const day = today();
			if (late < 0 || late > LATE_MIN || seen(key(loc, day))) return;
			try {
				localStorage.setItem(key(loc, day), "1");
			} catch {
				/* private mode: it may print again after a reload within the window */
			}
			const keep = (x) => !x.locationId || x.locationId === loc || !loc || loc === "all";
			log.info("automatic end of day print", { day, location: loc });
			try {
				printEodReceipt(
					{
						day,
						business: d.settings.business || "",
						locationName: loc && loc !== "all" ? d.locations.find((l) => l.id === loc)?.name || "" : "All locations",
						locationId: loc,
						sales: d.sales.filter(keep),
						cashShifts: d.cashShifts.filter(keep),
						timeEntries: d.timeEntries.filter(keep),
						users: d.users,
						inventory: d.inventory,
						stockMovements: d.stockMovements,
						openOrders: d.openOrders,
						voidOrders: d.voidOrders,
						supportAudit: d.supportAudit,
					},
					d.settings,
				);
			} catch (e) {
				log.error("automatic end of day print failed", e);
			}
		};
		tick();
		const id = setInterval(tick, 30000);
		return () => clearInterval(id);
	}, [currentUser?.id, support]); // eslint-disable-line react-hooks/exhaustive-deps
}
