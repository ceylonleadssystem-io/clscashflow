'use strict';

// Writing back to a Shopify store through its Admin API (GraphQL): accept (tag), decline (cancel), fulfil with tracking, tracking update.
// The store's access token comes from the install in lib/shopify-oauth.js and is kept encrypted on the store's row (`adminBox`).
// Needs the scopes read_orders, write_orders, read_merchant_managed_fulfillment_orders and write_merchant_managed_fulfillment_orders.
const VERSION = () => process.env.SHOPIFY_API_VERSION || '2026-01';
const SCOPES = ['read_orders', 'write_orders', 'read_merchant_managed_fulfillment_orders', 'write_merchant_managed_fulfillment_orders'];
const ACCEPT_TAG = 'pos-accepted';

function fail(message, code) {
  const e = new Error(message);
  if (code) e.code = code;
  return e;
}

const gid = (orderId) => 'gid://shopify/Order/' + String(orderId).replace(/[^0-9]/g, '');

/** One GraphQL call; throws with Shopify's own message when it refuses. `fetchImpl` is for tests. */
async function graphql(shop, token, query, variables, fetchImpl) {
  const res = await (fetchImpl || fetch)('https://' + shop + '/admin/api/' + VERSION() + '/graphql.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query: query, variables: variables || {} })
  });
  if (res.status === 401 || res.status === 403) throw fail('Shopify refused the POS access (' + res.status + '). Connect Shopify access again in Settings > Online Store.', 'no_access');
  if (!res.ok) throw fail('Shopify answered ' + res.status + '.');
  const json = await res.json();
  if (json.errors && json.errors.length) {
    const message = Array.from(new Set(json.errors.map(function(e) { return e.message; }))).join('; ');
    throw fail(/access denied|scope|permission/i.test(message) ? 'Shopify access is missing a permission: ' + message : message, /access denied|scope|permission/i.test(message) ? 'no_access' : undefined);
  }
  return json.data || {};
}

/** Throws the first user error of a mutation result. */
function checkErrors(result) {
  const errors = ((result && (result.userErrors || [])) || []).concat((result && result.orderCancelUserErrors) || []);
  if (errors.length) throw fail(errors.map(function(e) { return e.message; }).join('; '));
}

const text = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

/** Tags the order so staff in Shopify can see the POS accepted it. */
async function acceptOrder(shop, token, orderId, fetchImpl) {
  const data = await graphql(shop, token, 'mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { field message } } }', { id: gid(orderId), tags: [ACCEPT_TAG] }, fetchImpl);
  checkErrors(data.tagsAdd);
  return { tagged: ACCEPT_TAG };
}

/** Cancels the order: { reason (Shopify's OrderCancelReason), note, refund, restock, notify }. Shopify runs the cancellation as a job. */
async function cancelOrder(shop, token, orderId, o, fetchImpl) {
  const reason = ['CUSTOMER', 'DECLINED', 'FRAUD', 'INVENTORY', 'OTHER', 'STAFF'].includes(o.reason) ? o.reason : 'OTHER';
  const data = await graphql(shop, token,
    'mutation($orderId: ID!, $reason: OrderCancelReason!, $refund: Boolean!, $restock: Boolean!, $notifyCustomer: Boolean, $staffNote: String) { orderCancel(orderId: $orderId, reason: $reason, refund: $refund, restock: $restock, notifyCustomer: $notifyCustomer, staffNote: $staffNote) { job { id done } orderCancelUserErrors { field message code } userErrors { field message } } }',
    { orderId: gid(orderId), reason: reason, refund: o.refund !== false, restock: o.restock !== false, notifyCustomer: o.notify !== false, staffNote: text(o.note, 255) || null }, fetchImpl);
  checkErrors(data.orderCancel);
  return { job: data.orderCancel && data.orderCancel.job && data.orderCancel.job.id };
}

const trackingOf = (t) => {
  t = t || {};
  const info = { company: text(t.company, 60), number: text(t.number, 80), url: text(t.url, 400) };
  return info.number || info.url ? Object.fromEntries(Object.entries(info).filter(function(e) { return e[1]; })) : null;
};

const ORDER_FULFILLMENT = 'query($id: ID!) { order(id: $id) { fulfillmentOrders(first: 25) { nodes { id status } } fulfillments(first: 25) { id status } } }';

/** Fulfils every open fulfilment order of the order, with the tracking, and e-mails the customer when asked. Already fulfilled is fine. */
async function fulfillOrder(shop, token, orderId, o, fetchImpl) {
  const data = await graphql(shop, token, ORDER_FULFILLMENT, { id: gid(orderId) }, fetchImpl);
  const order = data.order;
  if (!order) throw fail('Shopify has no order ' + orderId + '.');
  const open = ((order.fulfillmentOrders && order.fulfillmentOrders.nodes) || []).filter(function(f) { return ['OPEN', 'IN_PROGRESS'].includes(f.status); });
  if (!open.length) {
    if ((order.fulfillments || []).length) return { already: true, fulfillmentId: order.fulfillments[0].id };
    throw fail('Shopify has nothing left to fulfil on this order (it may be cancelled or on hold).');
  }
  const tracking = trackingOf(o.tracking);
  const fulfillment = { notifyCustomer: o.notify !== false, lineItemsByFulfillmentOrder: open.map(function(f) { return { fulfillmentOrderId: f.id }; }) };
  if (tracking) fulfillment.trackingInfo = tracking;
  const made = await graphql(shop, token, 'mutation($fulfillment: FulfillmentInput!) { fulfillmentCreate(fulfillment: $fulfillment) { fulfillment { id status } userErrors { field message } } }', { fulfillment: fulfillment }, fetchImpl);
  checkErrors(made.fulfillmentCreate);
  return { fulfillmentId: made.fulfillmentCreate.fulfillment && made.fulfillmentCreate.fulfillment.id };
}

/** Changes the tracking of an order that is already fulfilled in Shopify. */
async function updateTracking(shop, token, orderId, o, fetchImpl) {
  const tracking = trackingOf(o.tracking);
  if (!tracking) throw fail('Add a tracking number or link first.');
  const data = await graphql(shop, token, ORDER_FULFILLMENT, { id: gid(orderId) }, fetchImpl);
  const fulfillments = (data.order && data.order.fulfillments) || [];
  if (!fulfillments.length) throw fail('Shopify shows this order as not fulfilled yet, so there is no shipment to add tracking to.');
  const made = await graphql(shop, token, 'mutation($fulfillmentId: ID!, $trackingInfoInput: FulfillmentTrackingInput!, $notifyCustomer: Boolean) { fulfillmentTrackingInfoUpdate(fulfillmentId: $fulfillmentId, trackingInfoInput: $trackingInfoInput, notifyCustomer: $notifyCustomer) { fulfillment { id } userErrors { field message } } }', { fulfillmentId: fulfillments[0].id, trackingInfoInput: tracking, notifyCustomer: o.notify === true }, fetchImpl);
  checkErrors(made.fulfillmentTrackingInfoUpdate);
  return { fulfillmentId: fulfillments[0].id };
}

/**
 * Subscribes the store to order creation and cancellation, pointed at the POS's webhook address. Webhooks the app subscribes to itself are signed
 * with the app's secret, so the merchant needs no signing secret. A subscription that already exists is fine.
 */
async function subscribeOrderWebhooks(shop, token, callbackUrl, fetchImpl) {
  const done = [];
  for (const topic of ['ORDERS_CREATE', 'ORDERS_CANCELLED']) {
    const data = await graphql(shop, token, 'mutation($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) { webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) { webhookSubscription { id } userErrors { field message } } }', { topic: topic, webhookSubscription: { callbackUrl: callbackUrl, format: 'JSON' } }, fetchImpl);
    const errors = (data.webhookSubscriptionCreate && data.webhookSubscriptionCreate.userErrors) || [];
    const taken = errors.every(function(e) { return /already been taken|already exists/i.test(e.message); });
    if (errors.length && !taken) throw fail(errors.map(function(e) { return e.message; }).join('; '));
    done.push(topic);
  }
  return { subscribed: done };
}

const ORDERS_QUERY = 'query($first: Int!, $after: String, $query: String) { orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT) { pageInfo { hasNextPage endCursor } nodes { legacyResourceId name createdAt cancelledAt displayFulfillmentStatus displayFinancialStatus currencyCode note email phone shippingAddress { name address1 address2 city zip phone } billingAddress { name phone } shippingLines(first: 1) { nodes { title } } totalDiscountsSet { shopMoney { amount } } totalShippingPriceSet { shopMoney { amount } } totalTaxSet { shopMoney { amount } } totalPriceSet { shopMoney { amount } } lineItems(first: 30) { nodes { title variantTitle sku quantity originalUnitPriceSet { shopMoney { amount } } } } fulfillments(first: 3) { trackingInfo(first: 1) { company number url } } } } }';
const amount = (set) => (set && set.shopMoney && set.shopMoney.amount) || '0';

/** One order of the Admin API, reshaped like the webhook's order (so lib/shopify.js sanitizeOrder reads both), with how far it got: open, fulfilled or cancelled. */
function orderFromAdmin(n) {
  n = n || {};
  const tracking = ((n.fulfillments || []).map(function(f) { return (f.trackingInfo || [])[0]; }).filter(Boolean)[0]) || {};
  const history = n.cancelledAt ? 'cancelled' : n.displayFulfillmentStatus === 'FULFILLED' ? 'fulfilled' : 'open';
  return {
    history: history,
    tracking: { company: text(tracking.company, 60), number: text(tracking.number, 80), url: text(tracking.url, 400) },
    order: {
      id: n.legacyResourceId, name: n.name, created_at: n.createdAt, currency: n.currencyCode, financial_status: String(n.displayFinancialStatus || '').toLowerCase(), note: n.note,
      // the name, phone and e-mail come from the order itself (its addresses): the separate customer record needs the read_customers permission
      email: n.email, phone: n.phone, customer: { first_name: (n.shippingAddress && n.shippingAddress.name) || (n.billingAddress && n.billingAddress.name) || '', phone: n.phone || (n.shippingAddress && n.shippingAddress.phone) || (n.billingAddress && n.billingAddress.phone) || '', email: n.email || '' },
      shipping_address: n.shippingAddress ? { name: n.shippingAddress.name, address1: n.shippingAddress.address1, address2: n.shippingAddress.address2, city: n.shippingAddress.city, zip: n.shippingAddress.zip, phone: n.shippingAddress.phone } : null,
      shipping_lines: ((n.shippingLines && n.shippingLines.nodes) || []).map(function(s) { return { title: s.title }; }),
      total_discounts: amount(n.totalDiscountsSet), total_tax: amount(n.totalTaxSet), total_price: amount(n.totalPriceSet),
      total_shipping_price_set: { shop_money: { amount: amount(n.totalShippingPriceSet) } },
      line_items: ((n.lineItems && n.lineItems.nodes) || []).map(function(l) { return { title: l.title, variant_title: l.variantTitle, sku: l.sku, quantity: l.quantity, price: amount(l.originalUnitPriceSet) }; })
    }
  };
}

/** One page of past orders created on or after `since` (YYYY-MM-DD), oldest first: { orders, hasMore, cursor }. Shopify shows the last 60 days unless the app has been given the "read all orders" access. */
async function listOrders(shop, token, o, fetchImpl) {
  const since = /^\d{4}-\d{2}-\d{2}$/.test(String(o.since || '')) ? o.since : '';
  const data = await graphql(shop, token, ORDERS_QUERY, { first: Math.min(Math.max(Number(o.pageSize) || 10, 1), 25), after: o.cursor || null, query: since ? 'created_at:>=' + since : null }, fetchImpl);
  const page = data.orders || { nodes: [], pageInfo: {} };
  return { orders: (page.nodes || []).map(orderFromAdmin), hasMore: !!(page.pageInfo && page.pageInfo.hasNextPage), cursor: (page.pageInfo && page.pageInfo.endCursor) || '' };
}

module.exports = { VERSION, SCOPES, ACCEPT_TAG, gid, graphql, acceptOrder, cancelOrder, fulfillOrder, updateTracking, subscribeOrderWebhooks, orderFromAdmin, listOrders };
