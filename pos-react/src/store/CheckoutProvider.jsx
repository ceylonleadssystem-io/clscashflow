/**
 * State and actions of the order being rung up: cart, discount, split bill, customer, payment, receipt options,
 * category/search, and the checkout actions (add items, complete sale, void, hold as open order, recall, rewards).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ORDER_CHANNELS, STORAGE } from "../config/constants";
import { addConfiguredLine, cartTotals, changeQty, EMPTY_DISCOUNT, productModifiers } from "../domain/cart";
import { availableProductStock, cartQtyForProduct } from "../domain/inventory";
import { phoneKey } from "../domain/format";
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
	const { svc, locationId, go, kitchen } = usePos();
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
	const [orderChannel, setOrderChannel] = useState("Dine-in");
	const [platformOrderId, setPlatformOrderId] = useState("");
	const [openOrderId, setOpenOrderId] = useState("");
	const [category, setCategory] = useState("All");
	const [search, setSearch] = useState("");
	const [picker, setPicker] = useState(null); // { productId, lineKey }
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
		() => cartTotals(cart, enabled["checkout.discounts"] ? discount : EMPTY_DISCOUNT, settings, enabled["checkout.serviceCharge"] && serviceChargeSupported(settings)),
		[cart, discount, settings, enabled],
	);

	// order channels configured in settings (kitchen presets only)
	const channels = useMemo(() => {
		const saved = settings.orderChannels;
		const list = Array.isArray(saved) && saved.length ? saved.filter((c) => ORDER_CHANNELS.includes(c)) : ORDER_CHANNELS;
		return list.length ? list : ORDER_CHANNELS;
	}, [settings.orderChannels]);
	useEffect(() => {
		if (!channels.includes(orderChannel)) setOrderChannel(channels[0]);
	}, [channels, orderChannel]);

	// a split that no longer matches the total is discarded (legacy behaviour)
	useEffect(() => {
		if (splitPayments.length && Math.abs(splitPayments.reduce((a, p) => a + p.amount, 0) - totals.total) > 0.01) setSplitPayments([]);
	}, [totals.total, splitPayments]);

	// ------------------------------------------------------------ cart ------
	const addConfigured = useCallback(
		(product, selections, lineKey = "") => {
			const requested = lineKey ? cart.find((l) => l.key === lineKey)?.qty || 1 : 1;
			if (enabled["checkout.stockGuard"] && enabled["inventory.productStock"]) {
				const available = availableProductStock(product, data.inventory, locationId);
				if (Number.isFinite(available) && cartQtyForProduct(cart, product.id, lineKey) + requested > available) {
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

	const changeLineQty = useCallback(
		(key, delta) => {
			const line = cart.find((l) => l.key === key);
			if (line && delta > 0 && enabled["checkout.stockGuard"] && enabled["inventory.productStock"]) {
				const product = data.products.find((p) => p.id === line.productId);
				const available = availableProductStock(product, data.inventory, locationId);
				if (Number.isFinite(available) && cartQtyForProduct(cart, line.productId, key) + line.qty + delta > available) {
					ui.notice(`${line.name} has only ${available} in stock.`);
					return;
				}
			}
			setCart((c) => changeQty(c, key, delta));
		},
		[cart, enabled, data, locationId, ui],
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
		setOrderChannel(channels[0] || "Dine-in");
		setCashTendered("");
		setWantsEmail(false);
		setWantsWhatsApp(false);
		setReceiptEmail("");
	}, [channels]);

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
		picker, setPicker, splitOpen, setSplitOpen, customerModal, setCustomerModal, totals, channels, busy: busyUi,
		addProduct, addConfigured, changeLineQty, removeProductFromCart, resetOrder, applyDiscount, toggleDiscount, clearDiscount, prefillDiscount,
		completeSale, voidOrder, saveOrder, loadOpenOrder, newOpenOrder, applyReward, onCustomerSaved,
	};
	return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export const useCheckout = () => useContext(CheckoutContext);
