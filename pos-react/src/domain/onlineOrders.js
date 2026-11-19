/**
 * Online orders (pure): orders that arrive from an online store (see ONLINE_CHANNELS) are open orders with that channel.
 * "New" ones have not been sent to the kitchen yet.
 */
import { ONLINE_CHANNELS } from "../config/constants";

export const isOnlineOrder = (order) => ONLINE_CHANNELS.includes(order?.orderChannel);

/** The open online orders, newest first. */
export const openOnlineOrders = (openOrders = []) =>
	openOrders.filter((o) => o.status === "open" && isOnlineOrder(o)).sort((a, b) => new Date(b.updatedAt || b.openedAt) - new Date(a.updatedAt || a.openedAt));

/** How many are new: not yet sent to the kitchen. */
export const newOnlineCount = (openOrders = []) => openOnlineOrders(openOrders).filter((o) => !o.kitchenSentAt).length;
