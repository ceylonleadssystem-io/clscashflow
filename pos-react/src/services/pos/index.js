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
			toggleBreak: staff.toggleBreak,
			openRegister: staff.openRegister,
			closeRegister: staff.closeRegister,
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
			requestFeedback: customers.requestFeedback,
			sendCustomerWhatsApp: customers.sendCustomerWhatsApp,
		}),
		inventory: bind(ctx, {
			saveInventoryItem: inventory.saveInventoryItem,
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
			sendToKitchen: printing.sendToKitchen,
		}),
		settings: bind(ctx, {
			saveSettings: settings.saveSettings,
			patchSettings: settings.patchSettings,
			regenerateSupportCode: settings.regenerateSupportCode,
			uploadBusinessLogo: settings.uploadBusinessLogo,
			removeBusinessLogo: settings.removeBusinessLogo,
			uploadSocialQr: settings.uploadSocialQr,
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
	};
}
