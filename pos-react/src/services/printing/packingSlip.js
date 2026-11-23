/**
 * Packing label for an online order: who it goes to, where, the items to put in the parcel and the tracking, on one page (a 4x6 inch
 * shipping label size, also fine on A4 and an 80 mm roll). Printed from the Online Orders page.
 */
import { esc } from "../../domain/format";
import { packingLines, stateOf } from "../../domain/onlineFlow";

const CSS = `@page{size:100mm 150mm;margin:5mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#000;margin:0;font-size:12px}
.slip{page-break-after:always;border:2px solid #000;padding:8px}.slip:last-child{page-break-after:auto}h1{font-size:18px;margin:0 0 4px}h2{font-size:12px;margin:10px 0 3px;text-transform:uppercase;letter-spacing:.05em}
.big{font-size:20px;font-weight:700}.row{display:flex;justify-content:space-between;gap:8px}.muted{color:#444}table{width:100%;border-collapse:collapse;margin-top:4px}
td,th{border-top:1px solid #999;padding:4px 2px;text-align:left;vertical-align:top}th{font-size:10px;text-transform:uppercase}td.q{width:34px;font-weight:700}.flag{font-weight:700}`;

/** HTML of the packing label (one page) for `order`; `business` and `products` are only for the sender line and the SKUs. */
export function packingSlipHtml(order, { business = "", products = [] } = {}) {
	const o = order.online || {};
	const lines = packingLines(order, products);
	const t = o.tracking || {};
	const items = lines.map((l) => `<tr><td class="q">${esc(l.qty)} x</td><td>${esc(l.name)}${l.sku ? `<div class="muted">SKU ${esc(l.sku)}</div>` : ""}${l.unmatched ? `<div class="flag">Check this item</div>` : ""}</td></tr>`).join("");
	return `<!doctype html><html><head><title>Packing ${esc(order.platformOrderId || order.orderNumber || "")}</title><style>${CSS}</style></head><body><div class="slip">
<div class="row"><h1>${esc(business || "Packing label")}</h1><div class="big">${esc(order.platformOrderId || order.orderNumber || "")}</div></div>
<div class="muted">${esc(order.orderNumber || "")}${o.shop ? " · " + esc(o.shop) : ""}${stateOf(order) === "declined" ? " · DECLINED" : ""}</div>
<h2>Deliver to</h2><div class="big">${esc(o.customer?.name || "Customer")}</div>
<div>${esc(o.delivery?.address || "No delivery address (collection)")}</div><div>${esc(o.customer?.phone || "")}</div>
${o.delivery?.method ? `<div class="muted">Delivery: ${esc(o.delivery.method)}</div>` : ""}
<h2>Items (${lines.reduce((a, l) => a + l.qty, 0)})</h2><table><thead><tr><th>Qty</th><th>Item</th></tr></thead><tbody>${items || `<tr><td colspan="2">No items</td></tr>`}</tbody></table>
${o.note ? `<h2>Customer note</h2><div>${esc(o.note)}</div>` : ""}
${t.number || t.company ? `<h2>Tracking</h2><div>${esc(t.company || "")} ${esc(t.number || "")}</div>${t.url ? `<div class="muted">${esc(t.url)}</div>` : ""}` : ""}
</div><script>onload=()=>print()</script></body></html>`;
}
