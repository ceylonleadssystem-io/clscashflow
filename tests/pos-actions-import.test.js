const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'pos-system', 'pos-system.html'), 'utf8');

test('core POS actions have reliable delegated handlers', () => {
  for (const action of ['openProduct', 'deleteProduct', 'openModifier', 'posDeleteModifierGroup', 'saveModifier', 'openCustomer', 'saveCustomer', 'loadOpenOrder', 'voidOpenOrder', 'openSaleAction', 'confirmSaleAction']) {
    assert.match(html, new RegExp(action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(html, /addEventListener\('click'.*stopImmediatePropagation/s);
});

test('legacy saved orders are normalized into the open order queue', () => {
  assert.match(html, /db\.openOrders\.forEach\(function\(order\).*if\(!order\.status\)order\.status='open'/s);
  assert.match(html, /function renderOrders\(\).*db\.openOrders\.filter\(o=>o\.status==='open'\)/s);
});

test('catalogue importer supports Excel mapping, preview, merge and template download', () => {
  assert.match(html, /xlsx\.full\.min\.js/);
  assert.match(html, /Download Ceylonry Excel Template/);
  assert.match(html, /function parseCatalogueRows\(matrix\)/);
  assert.match(html, /Square catalogue format is detected automatically/);
  assert.match(html, /Add new items and update matching SKU \/ Code/);
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'pos-system', 'assets', 'Ceylonry-POS-Catalogue-Template.xlsx')));
});

test('imported products remain editable and retain image controls', () => {
  assert.match(html, /Images can be added from Edit Item afterwards/);
  assert.match(html, /imageFit:'cover',imagePositionX:50,imagePositionY:50/);
  assert.match(html, /id="p-image-fit"/);
});

test('catalogue list and thumbnail views are mutually exclusive', () => {
  assert.match(html, /#view-products \.table-wrap\[hidden\],#product-management-grid\[hidden\]\{display:none!important\}/);
  assert.match(html, /productManagementView=mode/);
});

test('product images can be positioned by dragging the preview', () => {
  assert.match(html, /draggable-image-preview/);
  assert.match(html, /addEventListener\('pointerdown'/);
  assert.match(html, /addEventListener\('pointermove'/);
  assert.match(html, /data-image-move="0,-10"/);
  assert.match(html, /style\.setProperty\('object-position'.*'important'\)/s);
  assert.match(html, /imagePositionX:Number\.isFinite\(imageX\)\?imageX:50/);
});

test('cloud merge preserves catalogue, category and inventory deletions', () => {
  assert.match(html, /deletedIds:\{products:\[\],modifiers:\[\],inventory:\[\],categories:\[\],subcategories:\[\]\}/);
  assert.match(html, /function markDeleted\(group,id\)/);
  assert.match(html, /merged\.deletedIds\.categories/);
  assert.match(html, /deletePosCategory=function\(name\).*db\.deletedIds\.categories/s);
  assert.match(html, /window\.deletePosSubcategory=function\(id\).*db\.deletedIds\.subcategories/s);
  assert.match(html, /saveCloudSnapshotLocally/);
});

test('an empty sync cannot silently erase an existing catalogue', () => {
  assert.match(html, /function cacheCatalogue\(payload,user\)/);
  assert.match(html, /function productsFromHistory\(payload\)/);
  assert.match(html, /function recoverMissingCatalogue\(current,candidates,profile,user\)/);
  assert.match(html, /Your saved POS items were restored/);
  assert.match(html, /if\(preferLocal\).*merged\.deletedIds\[key\]=merged\.deletedIds\[key\]\.filter/s);
  assert.match(html, /Recover the account-bound device catalogue before the first write/);
  assert.match(html, /if\(localPayload&&typeof localPayload==='object'&&!localPayload\.accountUid\)localPayload\.accountUid=user\.uid/);
  assert.match(html, /preSyncRecovered=recoverMissingCatalogue.*await syncCloud\(\)/s);
});

test('sync saves offline first and cannot remain stuck indefinitely', () => {
  assert.match(html, /Offline · saved on this device/);
  assert.match(html, /withSyncTimeout/);
  assert.match(html, /cloudUnsubscribe=setInterval\(pull,5000\)/);
  assert.match(html, /POS is online · cloud synced/);
  assert.doesNotMatch(html, /id="pos-connection-label">POS is online</);
});

test('split bill takes and records every payment separately', () => {
  assert.match(html, /function installSplitPaymentCheckout/);
  assert.match(html, /takeSplitPayment/);
  assert.match(html, /payment\.paid=true/);
  assert.match(html, /Take each split payment before completing the sale/);
});

test('full-screen checkout keeps totals and completion controls reachable', () => {
  assert.match(html, /Checkout visibility repair/);
  assert.match(html, /body\.full #view-checkout \.cart\{position:relative!important;top:0!important;height:100%!important;max-height:100%!important\}/);
  assert.match(html, /body\.full #view-checkout \.cart-foot\{display:grid!important;grid-template-rows:minmax\(0,1fr\) repeat\(6,auto\)!important/s);
  assert.match(html, /body\.full #view-checkout #complete-btn\{position:relative!important;bottom:auto!important/s);
  assert.match(html, /cartList\.scrollTop=cartList\.scrollHeight/);
  assert.match(html, /Browser zoom reduces the CSS viewport width/);
  assert.match(html, /@media\(min-width:650px\) and \(max-width:1100px\).*#view-checkout\.active\{height:auto!important.*overflow:visible!important/s);
  assert.match(html, /body\.full #view-checkout\.active\{height:100%!important;overflow-x:hidden!important;overflow-y:auto!important/s);
});

test('tablet-width POS checkout retains both catalogue and order columns', () => {
  assert.match(html, /@media\(min-width:700px\) and \(max-width:1100px\)/);
  assert.match(html, /body:not\(\.mobile-checkout\) #view-checkout \.layout\{display:grid!important;grid-template-columns:minmax\(0,1\.18fr\) minmax\(330px,\.92fr\)!important/);
  assert.match(html, /body:not\(\.mobile-checkout\) #view-checkout \.cart\{display:grid!important;grid-template-rows:auto minmax\(90px,\.75fr\) minmax\(0,1\.65fr\)!important/);
  assert.match(html, /body:not\(\.mobile-checkout\) #view-checkout \.products\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
});

test('checkout order list scrolls continuously without item pagination', () => {
  assert.match(html, /cartList\.innerHTML=cart\.map\(lineHtml\)\.join/);
  assert.match(html, /cartList\.scrollTop=cartList\.scrollHeight/);
  assert.match(html, /#view-checkout #cart-pagination\{display:none!important\}/);
  assert.doesNotMatch(html, /onclick="changeCartPage\(/);
  assert.match(html, /#view-checkout #order-actions\{display:grid!important;grid-template-columns:repeat\(3,minmax\(112px,1fr\)\)!important/);
  assert.match(html, /payment-method-picker\{grid-template-columns:repeat\(auto-fit,minmax\(104px,1fr\)\)!important/);
});

test('checkout offers remembered mobile and terminal interfaces', () => {
  assert.match(html, /Choose Your Checkout/);
  assert.match(html, /data-checkout-mode="mobile"/);
  assert.match(html, /data-checkout-mode="pos"/);
  assert.match(html, /Remember my choice on this device/);
  assert.match(html, /ceylonry-pos-checkout-mode/);
  assert.match(html, /Switch Checkout/);
  assert.match(html, /body\.mobile-checkout #view-checkout \.products/);
  assert.match(html, /body\.mobile-checkout\.mobile-cart-open #view-checkout \.cart/);
});

test('checkout presents preserved payment methods as touch-friendly cards', () => {
  assert.match(html, /function installPaymentMethodCards/);
  assert.match(html, /aria-label','Payment method'/);
  for (const method of ['Cash', 'Card', 'Bank Transfer', 'Online Payment']) assert.match(html, new RegExp(`'${method}'`));
  assert.match(html, /select\.dispatchEvent\(new Event\('change'/);
  assert.match(html, /cart-line-image/);
});

test('modern UI is additive and offers three cached themes', () => {
  assert.match(html, /assets\/pos-modern\.css/);
  assert.match(html, /id:'ceylonry'/);
  assert.match(html, /id:'graphite'/);
  assert.match(html, /id:'sand'/);
  const css = fs.readFileSync(path.join(__dirname, '..', 'assets', 'pos-modern.css'), 'utf8');
  assert.match(css, /data-pos-theme="ceylonry"/);
  assert.match(css, /data-pos-theme="graphite"/);
  assert.match(css, /data-pos-theme="sand"/);
  assert.match(html, /id='pos-theme-settings'/);
  assert.match(html, /settings-theme-picker/);
  assert.match(html, /db\.settings\.uiTheme=id;save\(\)/);
  const worker = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  assert.match(worker, /\/assets\/pos-modern\.css/);
  assert.match(css, /Unified Ceylonry POS interface/);
  assert.match(css, /Operational sections: orders, products, CRM, inventory, sales and staff/);
  assert.match(css, /Checkout mirrors the compact sales\/payment reference/);
  assert.match(worker, /ceylonry-pos-app-shell-v12/);
  assert.equal((css.match(/:root,\[data-pos-theme="ceylonry"\]/g) || []).length, 1);
  assert.match(html, /meta\.content=theme\.color/);
});

test('reported checkout and settings regressions stay fixed', () => {
  assert.match(html, /function tenderAmount\(\).*replace\(\/,\/g,''\)/);
  assert.match(html, /tender\.removeAttribute\('max'\)/);
  assert.match(html, /saved=id;document\.documentElement\.dataset\.posTheme=id/);
  assert.match(html, /function installConfiguredOrderChannels/);
  for (const channel of ['Dine-in', 'Takeaway', 'PickMe', 'Uber Eats']) {
    assert.match(html, new RegExp(`'${channel}'`));
  }
  assert.match(html, /db\.settings\.orderChannels=foodService\?enabled:\[\];channelSave\(\)/);
  assert.match(html, /if\(window\.clsSyncPosNow\)await window\.clsSyncPosNow\(\)/);
});

test('customer admin can maintain the live catalogue', () => {
  const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'pos-system', 'pos-admin.html'), 'utf8');
  const adminApi = fs.readFileSync(path.join(__dirname, '..', 'netlify', 'functions', 'pos-admin-data.js'), 'utf8');
  assert.match(adminHtml, /id=["']manual-image["']/);
  assert.match(adminHtml, /data-edit-product/);
  assert.match(adminHtml, /data-delete-product/);
  assert.match(adminHtml, /data-rename-category/);
  assert.match(adminHtml, /data-delete-category/);
  for (const action of ['deleteProduct', 'renameCategory', 'deleteCategory']) {
    assert.match(adminApi, new RegExp(`action === '${action}'`));
  }
});

test('POS landing page offers a hardware cart and emailed order form', () => {
  const landing = fs.readFileSync(path.join(__dirname, '..', 'pos.html'), 'utf8');
  const orderApi = fs.readFileSync(path.join(__dirname, '..', 'netlify', 'functions', 'hardware-order.js'), 'utf8');
  for (const model of ['Ceylonry POS Lite', 'Ceylonry POS Lite · Black', 'Ceylonry POS Pro · White', 'Ceylonry POS Pro · Black']) {
    assert.match(landing, new RegExp(model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(landing, /Receipt Printer/);
  assert.equal((landing.match(/data-hardware-id=/g) || []).length, 5);
  assert.match(landing, /id="hardware-order-form"/);
  for (const field of ['name', 'email', 'mobile', 'address']) assert.match(landing, new RegExp(`name="${field}"`));
  assert.match(landing, /Have something else you want to add\?/);
  assert.match(landing, /id="hardware-add-more"/);
  assert.match(landing, /scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/);
  assert.match(landing, /\.netlify\/functions\/hardware-order/);
  assert.match(orderApi, /to: 'hello@ceylonrylabs\.io'/);
  assert.match(orderApi, /Delivery address:/);
  assert.match(orderApi, /items\.reduce/);
  for (const image of ['ceylonry-pos-lite.jpg', 'ceylonry-pos-lite-black.jpg', 'ceylonry-pos-pro-white.jpg', 'ceylonry-pos-pro-black.jpg', 'ceylonry-receipt-printer.jpg', 'ceylonry-pos-lite-industries.jpg']) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', image)));
    assert.match(landing, new RegExp(`assets/${image}`));
  }
});
