/**
 * Online orders (pure): orders that arrive from an online store (see ONLINE_CHANNELS) are open orders with that channel.
 * "New" ones have not been sent to the kitchen yet.
 */
import { ONLINE_CHANNELS } from "../config/constants";
import { stateOf } from "./onlineFlow";

export const isOnlineOrder = (order) => ONLINE_CHANNELS.includes(order?.orderChannel);

/** The open online orders, newest first. */
export const openOnlineOrders = (openOrders = []) =>
	openOrders.filter((o) => o.status === "open" && isOnlineOrder(o)).sort((a, b) => new Date(b.updatedAt || b.openedAt) - new Date(a.updatedAt || a.openedAt));

/** Every online order, whatever step it is at (declined and fulfilled ones stay in the list), newest first. */
export const allOnlineOrders = (openOrders = []) => openOrders.filter(isOnlineOrder).sort((a, b) => new Date(b.updatedAt || b.openedAt) - new Date(a.updatedAt || a.openedAt));

/** How many are new: waiting for staff to accept or decline them. */
export const newOnlineCount = (openOrders = []) => openOnlineOrders(openOrders).filter((o) => stateOf(o) === "new").length;
