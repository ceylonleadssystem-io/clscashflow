/**
 * Business Tools modules, in page order. Each runs for the business types that have its capability (config/capabilities.js), so a
 * new vertical picks the modules it needs and a new module is added here once.
 */
import { Appointments } from "./Appointments";
import { Commissions } from "./Commissions";
import { MedicineBatches } from "./MedicineBatches";
import { Memberships } from "./Memberships";
import { Prescriptions } from "./Prescriptions";

export const INDUSTRY_MODULES = [
	{ key: "appointments", capability: "appointments", Component: Appointments },
	{ key: "memberships", capability: "memberships", Component: Memberships },
	{ key: "prescriptions", capability: "prescriptions", Component: Prescriptions },
	{ key: "medicineBatches", capability: "medicineBatches", Component: MedicineBatches },
	{ key: "commissions", capability: "commissions", Component: Commissions },
];
