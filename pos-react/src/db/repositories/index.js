import { T } from "../tables";
import { BaseRepository } from "./BaseRepository";
import { categoryId } from "../PosStore";

/** Catalogue ---------------------------------------------------------------- */
export class ProductRepository extends BaseRepository {
	constructor(store) {
		super(store, T.products);
	}
	findByCode(code) {
		return this.first("code", code);
	}
	byCategory(category) {
		return this.where("category", category);
	}
}

export class CategoryRepository extends BaseRepository {
	constructor(store) {
		super(store, T.categories);
	}
	async names() {
		return (await this.all()).map((c) => c.name);
	}
	add(name) {
		return this.store.write((tx) => tx.addCategory(name));
	}
	removeByName(name) {
		return this.store.write((tx) => tx.removeCategory(name));
	}
	idFor(name) {
		return categoryId(name);
	}
}

/** Customers --------------------------------------------------------------- */
export class CustomerRepository extends BaseRepository {
	constructor(store) {
		super(store, T.customers);
	}
	/** Matches by digits only, like the checkout phone lookup. */
	async findByPhone(phone) {
		const key = String(phone || "").replace(/\D/g, "");
		if (key.length < 7) return null;
		return (await this.all()).find((c) => String(c.phone || "").replace(/\D/g, "") === key) || null;
	}
}

/** Sales & orders ------------------------------------------------------------ */
export class SaleRepository extends BaseRepository {
	constructor(store) {
		super(store, T.sales);
	}
	/** Sales with their order lines. */
	all() {
		return this.store.readSnapshot().then((s) => s.sales);
	}
	byId(id) {
		return this.store.getSale(id);
	}
	save(sale, options) {
		return this.store.write((tx) => tx.putSale(sale), options);
	}
	remove(id) {
		return this.store.write((tx) => tx.removeSale(id));
	}
	async inRange(from, to) {
		return (await this.all()).filter((s) => s.date >= from && s.date <= to);
	}
	async forCustomer(customerId) {
		return (await this.all()).filter((s) => s.customerId === customerId);
	}
	async lines(saleId) {
		return (await this.store.getSale(saleId))?.lines || [];
	}
}

export class OpenOrderRepository extends BaseRepository {
	constructor(store) {
		super(store, T.openOrders);
	}
	open() {
		return this.where("status", "open");
	}
}

/** Staff ------------------------------------------------------------------- */
export class UserRepository extends BaseRepository {
	constructor(store) {
		super(store, T.users);
	}
	async activeByPin(pin) {
		return (await this.all()).find((u) => u.active !== false && u.pin === pin) || null;
	}
}

export class CashShiftRepository extends BaseRepository {
	constructor(store) {
		super(store, T.cashShifts);
	}
	async openFor(userId) {
		return (await this.where("userId", userId)).find((s) => s.status === "open") || null;
	}
}

export class TimeEntryRepository extends BaseRepository {
	constructor(store) {
		super(store, T.timeEntries);
	}
	async activeFor(userId) {
		return (await this.where("userId", userId)).find((e) => !e.clockOut) || null;
	}
}

/** Inventory & locations ---------------------------------------------------------- */
export class InventoryRepository extends BaseRepository {
	constructor(store) {
		super(store, T.inventoryItems);
	}
	forProduct(productId) {
		return this.first("productId", productId);
	}
	async lowStock() {
		return (await this.all()).filter((i) => Number(i.qty) <= Number(i.reorder));
	}
}

export class StockMovementRepository extends BaseRepository {
	constructor(store) {
		super(store, T.stockMovements);
	}
	forItem(itemId) {
		return this.where("itemId", itemId);
	}
}

/** Key/value settings (one row per key, each with its own `updatedAt`). */
export class SettingsRepository extends BaseRepository {
	constructor(store) {
		super(store, T.settings);
	}
	async getAll() {
		return (await this.store.readSnapshot()).settings;
	}
	async get(key, fallback) {
		const row = await this.byId(key);
		return row && row.value !== undefined ? row.value : fallback;
	}
	set(key, value) {
		return this.store.write((tx) => tx.setSetting(key, value));
	}
}

export class MetaRepository extends BaseRepository {
	constructor(store) {
		super(store, T.appMeta);
	}
	async get(key, fallback) {
		const row = await this.byId(key);
		return row && row.value !== undefined ? row.value : fallback;
	}
	set(key, value) {
		return this.store.write((tx) => tx.setMeta(key, value));
	}
}

/** Everything else needs no custom queries. */
const generic = (spec) => (store) => new BaseRepository(store, spec);

export function createRepositories(store) {
	return {
		products: new ProductRepository(store),
		categories: new CategoryRepository(store),
		subcategories: generic(T.subcategories)(store),
		modifierGroups: generic(T.modifierGroups)(store),
		customers: new CustomerRepository(store),
		customerCommunications: generic(T.customerCommunications)(store),
		sales: new SaleRepository(store),
		openOrders: new OpenOrderRepository(store),
		voidOrders: generic(T.voidOrders)(store),
		kitchenTickets: generic(T.kitchenTickets)(store),
		users: new UserRepository(store),
		timeEntries: new TimeEntryRepository(store),
		cashShifts: new CashShiftRepository(store),
		inventory: new InventoryRepository(store),
		stockMovements: new StockMovementRepository(store),
		stockTransfers: generic(T.stockTransfers)(store),
		locations: generic(T.locations)(store),
		locationAudit: generic(T.locationAudit)(store),
		supportAudit: generic(T.supportAudit)(store),
		appointments: generic(T.appointments)(store),
		memberships: generic(T.memberships)(store),
		prescriptions: generic(T.prescriptions)(store),
		medicineBatches: generic(T.medicineBatches)(store),
		commissionPayments: generic(T.commissionPayments)(store),
		settings: new SettingsRepository(store),
		meta: new MetaRepository(store),
	};
}

export { BaseRepository };
