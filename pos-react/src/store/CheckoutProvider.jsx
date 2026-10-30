/**
 * State and actions of the order being rung up: cart, discount, split bill, customer, payment, receipt options,
 * category/search, and the checkout actions (add items, complete sale, void, hold as open order, recall, rewards).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ORDER_CHANNELS, STORAGE } from "../config/constants";
import { addConfiguredLine, cartTotals, changeQty, EMPTY_DISCOUNT, productModifiers } from "../domain/cart";
import { productSizeGroup } from "../domain/catalog";
import { removalNeedsApproval } from "../domain/deleteApproval";
import { availableProductStock, cartQtyForProduct, hasSizedStock, stockSizeFor } from "../domain/inventory";
import { phoneKey } from "../domain/format";
import { resolveOptions } from "../domain/systemOptions";
import { serviceChargeSupported } from "../services/pos/common";
import { useData } from "./DataProvider";
import { useFeatures } from "./FeatureProvider";
import { usePos } from "./PosProvider";
import { useUi } from "./UiProvider";
import { createLogger } from "../utils/logger";

const log = createLogger("checkout");

/**
 * State of the order currently being rung up (cart, discount, split bill,
 * customer, payment, receipt options) plus the checkout actions.
 */
const CheckoutContext = createContext(null);

export function CheckoutProvider({ children }) {
	const data = useData();
	const { enabled } = useFeatures();
	const { svc, locationId, go, kitchen, can } = usePos();
	const ui = useUi();

	const [cart, setCart] = useState([]);
	const [discount, setDiscount] = useState(EMPTY_DISCOUNT);
	const [discountOn, setDiscountOn] = useState(false);
	const [payment, setPayment] = useState("Cash");
	const [splitPayments, setSplitPayments] = useState([]);
	const [customerId, setCustomerId] = useState("");
	const [phoneSearch, setPhoneSearch] = useState("");
	const [findNote, setFindNote] = useState({ text: "Search by mobile, add a new customer, or continue as a walk-in.", error: false, addPhone: "" });
	const [wantsEmail, setWantsEmail] = useState(false);
	const [receiptEmail, setReceiptEmail] = useState("");
	const [wantsWhatsApp, setWantsWhatsApp] = useState(false);
	const [printAfter, setPrintAfterState] = useState(() => localStorage.getItem(STORAGE.printSale) !== "false");
	const [cashTendered, setCashTendered] = useState("");
	const [orderReference, setOrderReference] = useState("");
	const [orderChannel, setOrderChannel] = useState(() => resolveOptions(data.settings, "orderEntry", locationId).defaultOrderType);
	const [platformOrderId, setPlatformOrderId] = useState("");
	const [openOrderId, setOpenOrderId] = useState("");
	const [category, setCategory] = useState("All");
	const [search, setSearch] = useState("");
	const [picker, setPicker] = useState(null); // { productId, lineKey }
	const [approval, setApproval] = useState(null); // { key, delta, line, removed }: a removal waiting for a manager
	const [splitOpen, setSplitOpen] = useState(false);
	const [customerModal, setCustomerModal] = useState(null); // { id, phone, source }
	const busy = useRef(false);
	const [busyUi, setBusyUi] = useState(false);

	const setPrintAfter = (v) => {
		localStorage.setItem(STORAGE.printSale, String(v));
		setPrintAfterState(v);
	};

	const settings = data.settings;
	const totals = useMemo(
		() => cartTotals(cart, enabled["checkout.discounts"] ? discount : EMPTY_DISCOUNT, settings, enabled["checkout.serviceCharge"] && serviceChargeSupported(settings), orderChannel),
		[cart, discount, settings, enabled, orderChannel],
	);

	// order channels configured in settings (kitchen presets only)
	const channels = useMemo(() => {
		const saved = settings.orderChannels;
		const list = Array.isArray(saved) && saved.length ? saved.filter((c) => ORDER_CHANNELS.includes(c)) : ORDER_CHANNELS;
		return list.length ? list : ORDER_CHANNELS;
	}, [settings.orderChannels]);
	// the order type new orders start with (Settings > System Options > Order Entry); the first channel when that one is switched off
	const defaultChannel = useMemo(() => {
		const wanted = resolveOptions(settings, "orderEntry", locationId).defaultOrderType;
		return channels.includes(wanted) ? wanted : channels[0];
	}, [settings, locationId, channels]);
	// an empty order that has not been started follows a changed default straight away
	useEffect(() => {
		if (!cart.length && !openOrderId) setOrderChannel(defaultChannel);
	}, [defaultChannel]); // eslint-disable-line react-hooks/exhaustive-deps
	useEffect(() => {
		if (!channels.includes(orderChannel)) setOrderChannel(defaultChannel);
	}, [channels, orderChannel, defaultChannel]);

	// a split that no longer matches the total is discarded (legacy behaviour)
	useEffect(() => {
		if (splitPayments.length && Math.abs(splitPayments.reduce((a, p) => a + p.amount, 0) - totals.total) > 0.01) setSplitPayments([]);
	}, [totals.total, splitPayments]);

	// ------------------------------------------------------------ cart ------
	const addConfigured = useCallback(
		(product, selections, lineKey = "") => {
			const requested = lineKey ? cart.find((l) => l.key === lineKey)?.qty || 1 : 1;
			if (enabled["checkout.stockGuard"] && enabled["inventory.productStock"]) {
				const size = stockSizeFor(data.inventory, product.id, selections);
				const available = availableProductStock(product, data.inventory, locationId, size || "");
				if (Number.isFinite(available) && cartQtyForProduct(cart, product.id, lineKey, size) + requested > available) {
					ui.notice(`${product.name} has only ${available} in stock.`);
					return false;
				}
			}
			setCart((c) => addConfiguredLine(c, product, selections, lineKey));
			return true;
		},
		[cart, enabled, data.inventory, locationId, ui],
	);

	const addProduct = useCallback(
		(id) => {
			const product = data.products.find((p) => p.id === id);
			if (!product) return;
			if (productModifiers(product, data.modifiers).length) return setPicker({ productId: id, lineKey: "" });
			addConfigured(product, []);
		},
		[data.products, data.modifiers, addConfigured],
	);

	/**
	 * Barcode scan: adds the item without asking for modifiers. A size barcode ("<code>-M") adds it with that Size option,
	 * so the size shows on the receipt and in reports. A plain code of an item counted per size has to ask the size.
	 * Returns false when the item could not be added (stock guard).
	 */
	const addScanned = useCallback(
		(id, size = "") => {
			const product = data.products.find((p) => p.id === id);
			if (!product) return undefined;
			const group = size ? productSizeGroup(product, data.modifiers) : null;
			const option = group?.options.find((o) => o.name === size);
			if (group && option)
				return addConfigured(product, [{ groupId: group.id, groupName: group.name, optionName: option.name, price: +option.price || 0 }]);
			if (hasSizedStock(data.inventory, product.id)) return void setPicker({ productId: id, lineKey: "" });
			return addConfigured(product, []);
		},
		[data.products, data.modifiers, data.inventory, addConfigured],
	);

	const changeLineQty = useCallback(
		(key, delta) => {
			const line = cart.find((l) => l.key === key);
			if (line && delta > 0 && enabled["checkout.stockGuard"] && enabled["inventory.productStock"]) {
				const product = data.products.find((p) => p.id === line.productId);
				const size = stockSizeFor(data.inventory, line.productId, line.modifiers);
				const available = availableProductStock(product, data.inventory, locationId, size || "");
				if (Number.isFinite(available) && cartQtyForProduct(cart, line.productId, key, size) + line.qty + delta > available) {
					ui.notice(`${line.name} has only ${available} in stock.`);
					return;
				}
			}
			// taking sent items off an order can need a manager (Menu Admin, Categories); people who hold the permission never do
			if (line && delta < 0 && !can("pos.void.item")) {
				const check = removalNeedsApproval(line, line.qty + delta, data.settings);
				if (check.needed) return void setApproval({ key, delta, line, removed: check.removed });
			}
			setCart((c) => changeQty(c, key, delta));
		},
		[cart, enabled, data, locationId, ui, can],
	);
	/** The manager's PIN for the pending removal: on success the quantity change goes through. */
	const approveRemoval = useCallback(
		async (pin) => {
			if (!approval) return false;
			const approver = await svc.sales.approveItemRemoval({ pin, line: approval.line, removed: approval.removed });
			if (!approver) return false;
			setCart((c) => changeQty(c, approval.key, approval.delta));
			setApproval(null);
			return true;
		},
		[approval, svc],
	);

	const removeProductFromCart = useCallback((productId) => setCart((c) => c.filter((l) => l.productId !== productId)), []);

	const resetOrder = useCallback(() => {
		setCart([]);
		setDiscount(EMPTY_DISCOUNT);
		setDiscountOn(false);
		setSplitPayments([]);
		setOpenOrderId("");
		setOrderReference("");
		setPlatformOrderId("");
		setOrderChannel(defaultChannel || "Dine-in");
		setCashTendered("");
		setWantsEmail(false);
		setWantsWhatsApp(false);
		setReceiptEmail("");
	}, [defaultChannel]);

	// ------------------------------------------------------- customers ------
	const selectCustomer = useCallback(
		(id) => {
			setCustomerId(id);
			if (wantsEmail) setReceiptEmail(data.customers.find((c) => c.id === id)?.email || "");
		},
		[data.customers, wantsEmail],
	);

	const findCustomerByPhone = useCallback(() => {
		const key = phoneKey(phoneSearch.trim());
		if (key.length < 7) return setFindNote({ text: "Enter a valid phone number.", error: true, addPhone: "" });
		const customer = data.customers.find((c) => phoneKey(c.phone) === key);
		if (customer) {
			selectCustomer(customer.id);
			setFindNote({ text: "Customer found. This sale is now on their tab.", error: false, addPhone: "" });
		} else {
			setCustomerId("");
			setFindNote({ text: "No customer found.", error: true, addPhone: phoneSearch.trim() });
		}
	}, [phoneSearch, data.customers, selectCustomer]);

	const clearCustomer = useCallback(() => {
		setCustomerId("");
		setPhoneSearch("");
		setFindNote({ text: "Find a customer by phone, or leave as walk-in.", error: false, addPhone: "" });
		if (wantsEmail) setReceiptEmail("");
	}, [wantsEmail]);

	const onCustomerSaved = useCallback(
		(customer, source) => {
			if (source !== "checkout") return;
			setCustomerId(customer.id);
			setPhoneSearch(customer.phone);
			setFindNote({ text: "Customer added. This sale is now on their tab.", error: false, addPhone: "" });
		},
		[],
	);

	const toggleEmail = (on) => {
		setWantsEmail(on);
		setReceiptEmail(on ? data.customers.find((c) => c.id === customerId)?.email || "" : "");
	};

	// ------------------------------------------------------- discount -------
	const applyDiscount = useCallback(
		async (type, rawValue) => {
			if (!discountOn) return;
			const value = Number(String(rawValue).replace(/,/g, ""));
			if (value < 0 || !Number.isFinite(value) || (type === "percent" && value > 100))
				return void (await ui.alert("Enter a valid discount value. Percentage discounts cannot exceed 100%."));
			setDiscount({ type, value });
		},
		[discountOn, ui],
	);
	const toggleDiscount = (on) => {
		setDiscountOn(on);
		if (!on) setDiscount(EMPTY_DISCOUNT);
	};
	const clearDiscount = () => {
		setDiscount(EMPTY_DISCOUNT);
		setDiscountOn(false);
	};
	/** CRM "10% reward" / birthday reward / membership: prefill the discount. */
	const prefillDiscount = useCallback((type, value) => {
		setDiscount({ type, value });
		setDiscountOn(true);
	}, []);

	// --------------------------------------------------------- actions ------
	const completeSale = useCallback(async () => {
		if (busy.current || !cart.length) return;
		busy.current = true;
		setBusyUi(true);
		try {
			const result = await svc.sales.completeSale({
				cart,
				discount,
				payment,
				splitPayments,
				customerId,
				wantsEmail,
				receiptEmail,
				wantsWhatsApp,
				printAfter: enabled["checkout.printReceipt"] ? printAfter : false,
				cashTendered,
				orderReference,
				orderChannel,
				platformOrderId,
				openOrderId,
			});
			if (result?.needsSplit) return setSplitOpen(true);
			if (result?.sale) {
				log.info("order placed", { orderId: result.sale.id, lines: cart.length, payment });
				resetOrder();
				if (result.printRequested) await svc.sales.printCompletedSale(result.sale);
				return true; // lets the Pay popups close only after the sale really went through
			}
			return false;
		} catch (e) {
			log.error("sale could not be completed", e);
			throw e;
		} finally {
			busy.current = false;
			setBusyUi(false);
		}
	}, [cart, discount, payment, splitPayments, customerId, wantsEmail, receiptEmail, wantsWhatsApp, printAfter, cashTendered, orderReference, orderChannel, platformOrderId, openOrderId, svc, enabled, resetOrder]);

	const voidOrder = useCallback(async () => {
		if (await svc.sales.voidCurrentOrder(cart)) {
			log.info("current order cleared/voided", { lines: cart.length });
			resetOrder();
		}
	}, [svc, cart, resetOrder]);

	const saveOrder = useCallback(
		async (sendKitchen) => {
			const order = await svc.sales.saveOpenOrder({
				cart,
				discount,
				customerId,
				reference: orderReference.trim(),
				orderChannel: kitchen ? orderChannel : "Retail",
				platformOrderId: kitchen ? platformOrderId.trim() : "",
				openOrderId,
				sendKitchen,
			});
			if (order) {
				log.info(sendKitchen ? "order held and sent to kitchen" : "order held", { orderId: order.id });
				resetOrder();
				go("orders", true);
			}
		},
		[svc, cart, discount, customerId, orderReference, orderChannel, platformOrderId, openOrderId, kitchen, resetOrder, go],
	);

	const loadOpenOrder = useCallback(
		async (id) => {
			const order = data.openOrders.find((o) => o.id === id && o.status === "open");
			if (!order) return void (await ui.alert("This order is no longer open."));
			setOpenOrderId(id);
			setCart(JSON.parse(JSON.stringify(order.lines || [])));
			const dv = { type: order.discount?.type || "percent", value: order.discount?.value || 0 };
			setDiscount(dv);
			setDiscountOn(dv.value > 0);
			setCustomerId(order.customerId || "");
			setOrderReference(order.orderReference || "");
			setOrderChannel(kitchen ? order.orderChannel || "Dine-in" : "Dine-in");
			setPlatformOrderId(kitchen ? order.platformOrderId || "" : "");
			go("checkout");
			ui.notice("Open order " + order.orderNumber + " recalled. Complete payment when the guest is ready.");
		},
		[data.openOrders, ui, go, kitchen],
	);

	/** Recalls an open order and opens the split dialog for it. */
	const splitOpenOrder = useCallback(
		async (id) => {
			if (!data.openOrders.some((o) => o.id === id && o.status === "open")) return;
			await loadOpenOrder(id);
			setSplitOpen(true);
		},
		[data.openOrders, loadOpenOrder],
	);

	const newOpenOrder = useCallback(() => {
		resetOrder();
		go("checkout");
	}, [resetOrder, go]);

	const applyReward = useCallback(
		(customer) => {
			go("checkout");
			setCustomerId(customer.id);
			setPhoneSearch(customer.phone || "");
			prefillDiscount("percent", 10);
			ui.notice("10% customer reward prepared for " + customer.name + ".");
		},
		[go, prefillDiscount, ui],
	);

	const value = {
		cart, setCart, discount, discountOn, payment, setPayment, splitPayments, setSplitPayments, customerId, selectCustomer,
		phoneSearch, setPhoneSearch, findNote, findCustomerByPhone, clearCustomer, wantsEmail, toggleEmail, receiptEmail, setReceiptEmail,
		wantsWhatsApp, setWantsWhatsApp, printAfter, setPrintAfter, cashTendered, setCashTendered, orderReference, setOrderReference,
		orderChannel, setOrderChannel, platformOrderId, setPlatformOrderId, openOrderId, category, setCategory, search, setSearch,
		picker, setPicker, approval, setApproval, approveRemoval, splitOpen, setSplitOpen, customerModal, setCustomerModal, totals, channels, busy: busyUi,
		addProduct, addScanned, addConfigured, changeLineQty, removeProductFromCart, resetOrder, applyDiscount, toggleDiscount, clearDiscount, prefillDiscount,
		completeSale, voidOrder, saveOrder, loadOpenOrder, splitOpenOrder, newOpenOrder, applyReward, onCustomerSaved,
	};
	return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export const useCheckout = () => useContext(CheckoutContext);
