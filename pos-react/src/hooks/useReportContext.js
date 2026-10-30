/**
 * Everything a report builder reads, for the active location and the chosen filters: sales, registers, time entries,
 * kitchen tickets, users, locations. Employee / order type / payment filters narrow sales (and the employee filter also time entries).
 */
import { useMemo } from "react";
import { userRate } from "../domain/access";
import { resolveOptions } from "../domain/systemOptions";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";
import { useScopedData } from "./useScopedData";

export function applyReportFilters(sales, timeEntries, filters) {
	if (!filters.length) return { sales, timeEntries };
	const by = (type) => filters.filter((f) => f.type === type).map((f) => f.value);
	const staff = by("employee");
	const types = by("orderType");
	const pays = by("payment");
	return {
		sales: sales.filter((s) => (!staff.length || staff.includes(s.staffId)) && (!types.length || types.includes(s.orderChannel || "Retail")) && (!pays.length || pays.includes(s.payment))),
		timeEntries: staff.length ? timeEntries.filter((e) => staff.includes(e.userId)) : timeEntries,
	};
}

export function useReportContext(range, filters = [], extra = "") {
	const data = useData();
	const { locationId } = usePos();
	const scoped = useScopedData();
	return useMemo(() => {
		const f = applyReportFilters(scoped.sales, scoped.timeEntries, filters);
		return {
			range,
			extra,
			payroll: resolveOptions(data.settings, "payroll", "all"),
			rates: Object.fromEntries(data.users.map((u) => [u.id, userRate(data.settings, u.id)])),
			locationId,
			sales: f.sales,
			allSales: data.sales,
			cashShifts: scoped.cashShifts,
			timeEntries: f.timeEntries,
			users: data.users,
			locations: data.locations.filter((l) => l.active !== false),
			kitchenTickets: data.kitchenTickets || [],
			openOrders: data.openOrders || [],
			voidOrders: data.voidOrders || [],
			supportAudit: data.supportAudit || [],
			stockTransfers: data.stockTransfers || [],
			inventory: data.inventory || [],
		};
	}, [scoped, data, locationId, range, filters, extra]);
}
