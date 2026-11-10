/**
 * Binds every action service (staff, catalog, customers, inventory, sales, printing, settings, locations,
 * industry) to a context, so components call e.g. svc.sales.completeSale().
 */
import * as staff from "./staff";
import * as catalog from "./catalog";
import * as customers from "./customers";
import * as inventory from "./inventory";
import * as sales from "./sales";
import * as printing from "./printing";
import * as settings from "./settings";
import * as locations from "./locations";
import * as industry from "./industry";
import * as detailing from "./detailing";

/**
 * Binds every action service to a context (store, data, session, features, ui)
 * so components call e.g. `svc.sales.completeSale(input)`.
 */
const bind = (ctx, fns) =>
	Object.fromEntries(Object.entries(fns).map(([name, fn]) => [name, (...args) => fn(ctx, ...args)]));

export function bindServices(ctx) {
	return {
		staff: bind(ctx, {
			clockInAndOpenRegister: staff.clockInAndOpenRegister,
			clockOut: staff.clockOut,
			clockIn: staff.clockIn,
			saveTimeEntry: staff.saveTimeEntry,
			deleteTimeEntry: staff.deleteTimeEntry,
			autoClockOutAll: staff.autoClockOutAll,
			toggleBreak: staff.toggleBreak,
			saveUser: staff.saveUser,
			deleteUser: staff.deleteUser,
		}),
		catalog: bind(ctx, {
			saveProduct: catalog.saveProduct,
			deleteProduct: catalog.deleteProduct,
			addCategory: catalog.addCategory,
			renameCategory: catalog.renameCategory,
			deleteCategory: catalog.deleteCategory,
			addSubcategory: catalog.addSubcategory,
			renameSubcategory: catalog.renameSubcategory,
			deleteSubcategory: catalog.deleteSubcategory,
			saveModifier: catalog.saveModifier,
			deleteModifier: catalog.deleteModifier,
			addCommonModifiers: catalog.addCommonModifiers,
			importCatalogue: catalog.importCatalogue,
			applyBundledCatalogueImages: catalog.applyBundledCatalogueImages,
		}),
		customers: bind(ctx, {
			saveCustomer: customers.saveCustomer,
			ensureCustomer: customers.ensureCustomer,
			requestFeedback: customers.requestFeedback,
			sendCustomerWhatsApp: customers.sendCustomerWhatsApp,
		}),
		inventory: bind(ctx, {
			saveInventoryItem: inventory.saveInventoryItem,
			addStockBatch: inventory.addStockBatch,
			adjustStock: inventory.adjustStock,
			deleteInventoryItem: inventory.deleteInventoryItem,
			saveBranchStockCounts: inventory.saveBranchStockCounts,
			saveBulkBranchStockCounts: inventory.saveBulkBranchStockCounts,
			importStockCountFile: inventory.importStockCountFile,
		}),
		sales: bind(ctx, {
			completeSale: sales.completeSale,
			printCompletedSale: sales.printCompletedSale,
			reverseSale: sales.reverseSale,
			deleteSalePermanently: sales.deleteSalePermanently,
			voidCurrentOrder: sales.voidCurrentOrder,
			saveOpenOrder: sales.saveOpenOrder,
			resendOpenOrder: sales.resendOpenOrder,
			approveItemRemoval: sales.approveItemRemoval,
			voidOpenOrder: sales.voidOpenOrder,
			transferOpenOrder: sales.transferOpenOrder,
			mergeOpenOrders: sales.mergeOpenOrders,
		}),
		printing: bind(ctx, {
			printReceipt: printing.printReceipt,
			printTestReceipt: printing.printTestReceipt,
			downloadReceipt: printing.downloadReceipt,
			shareReceiptWhatsApp: printing.shareReceiptWhatsApp,
			printKotForSale: printing.printKotForSale,
			printTestKot: printing.printTestKot,
			testStation: printing.testStation,
			sendToKitchen: printing.sendToKitchen,
			markTicketServed: printing.markTicketServed,
		}),
		settings: bind(ctx, {
			saveSettings: settings.saveSettings,
			patchSettings: settings.patchSettings,
			saveKitchenStations: settings.saveKitchenStations,
			saveSystemOptions: settings.saveSystemOptions,
			saveThirdPartyPayment: settings.saveThirdPartyPayment,
			reorderThirdPartyPayments: settings.reorderThirdPartyPayments,
			deleteThirdPartyPayment: settings.deleteThirdPartyPayment,
			saveJob: settings.saveJob,
			reorderJobs: settings.reorderJobs,
			deleteJob: settings.deleteJob,
			saveUserAccess: settings.saveUserAccess,
			saveZone: settings.saveZone,
			reorderZones: settings.reorderZones,
			deleteZone: settings.deleteZone,
			registerDevice: settings.registerDevice,
			seedRoleJobs: settings.seedRoleJobs,
			saveDevice: settings.saveDevice,
			deleteDevice: settings.deleteDevice,
			saveDevicePrinter: settings.saveDevicePrinter,
			deleteDevicePrinter: settings.deleteDevicePrinter,
			copyDevicePrinters: settings.copyDevicePrinters,
			saveMenuEntity: settings.saveMenuEntity,
			assignGroupToItems: settings.assignGroupToItems,
			deleteMenuEntity: settings.deleteMenuEntity,
			reorderMenuEntities: settings.reorderMenuEntities,
			addStandardSalesCategories: settings.addStandardSalesCategories,
			publishMenu: settings.publishMenu,
			revertMenuEdit: settings.revertMenuEdit,
			discardMenuDraft: settings.discardMenuDraft,
			regenerateSupportCode: settings.regenerateSupportCode,
			uploadBusinessLogo: settings.uploadBusinessLogo,
			removeBusinessLogo: settings.removeBusinessLogo,
			uploadSocialQr: settings.uploadSocialQr,
			moveImagesToCloud: settings.moveImagesToCloud,
			setTheme: settings.setTheme,
			applyPosSetup: settings.applyPosSetup,
			dismissPosSetup: settings.dismissPosSetup,
		}),
		locations: bind(ctx, {
			saveLocation: locations.saveLocation,
			auditLocationSwitch: locations.auditLocationSwitch,
			auditLogin: locations.auditLogin,
		}),
		industry: bind(ctx, {
			saveAppointment: industry.saveAppointment,
			saveMembership: industry.saveMembership,
			savePrescription: industry.savePrescription,
			saveMedicineBatch: industry.saveMedicineBatch,
			removeRecord: industry.removeRecord,
			setCommissionRate: industry.setCommissionRate,
			recordCommissionPayment: industry.recordCommissionPayment,
		}),
		detailing: bind(ctx, {
			saveVehicle: detailing.saveVehicle,
			savePackage: detailing.savePackage,
			saveJob: detailing.saveJob,
			advanceJob: detailing.advanceJob,
			togglePause: detailing.togglePause,
			saveInspection: detailing.saveInspection,
			createInvoice: detailing.createInvoice,
			recordPayment: detailing.recordPayment,
			removeRecord: detailing.removeRecord,
		}),
	};
}
