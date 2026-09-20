const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pos = fs.readFileSync(path.join(root, 'pos-system', 'pos-system.html'), 'utf8');
const platform = fs.readFileSync(path.join(root, 'assets', 'platform.js'), 'utf8');
const mailer = fs.readFileSync(path.join(root, 'netlify', 'functions', 'send-invoice.js'), 'utf8');

test('product prices survive business type changes and cloud merges', () => {
  assert.match(pos, /createdAt:new Date\(\)\.toISOString\(\)/);
  assert.match(pos, /modifierIds:.*updatedAt:new Date\(\)\.toISOString\(\)/s);
  assert.match(pos, /Object\.assign\(product,\{name:name.*cost:cost,price:price/s);
});

test('formatted product cost and selling prices save as finite numbers', () => {
  assert.match(pos, /parseMoney=typeof window\.posNumber==='function'\?window\.posNumber/);
  assert.match(pos, /cost=parseMoney\(document\.getElementById\('p-cost'\)\.value\)/);
  assert.match(pos, /price=parseMoney\(document\.getElementById\('p-price'\)\.value\)/);
  assert.match(pos, /!Number\.isFinite\(cost\).*cost<0.*!Number\.isFinite\(price\).*price<=0/);
  assert.match(pos, /saved with cost .*selling price/);
});

test('cloud account refresh applies the saved appearance immediately', () => {
  assert.match(pos, /window\.clsApplyPosTheme=applyTheme/);
  assert.match(pos, /refreshSyncedView\(\).*clsApplyPosTheme\(db\.settings\?\.uiTheme\|\|'ceylonry',false\)/s);
});

test('POS receipts use server email first with EmailJS fallback', () => {
  assert.match(platform, /if \(isDocument \|\| isReceipt\)/);
  assert.match(platform, /sendDocumentViaSmtp\(opts, isReceipt \? 'Receipt' : documentLabel\)/);
  assert.match(mailer, /\^receipt\$\/i\.test\(rawLabel\) \? 'Receipt'/);
  assert.match(mailer, /TOTAL PAID/);
});

test('full-screen menu toggle can reveal the sidebar', () => {
  assert.match(pos, /body\.full:not\(\.sidebar-collapsed\) \.side\{display:flex!important\}/);
  assert.match(pos, /body\.full\.sidebar-collapsed:has\(#view-checkout\.active\) \.side\{display:none!important\}/);
});

test('USB barcode scanner adds an exact product code through the existing cart flow', () => {
  assert.match(pos, /installRegisterHardwareSupport/);
  assert.match(pos, /String\(product\.code\|\|''\).*===normalized/);
  assert.match(pos, /addCart\(product\.id\)/);
});

test('receipt printing uses an in-page frame instead of an Android-blocked popup', () => {
  assert.match(pos, /function printDocument\(html\)/);
  assert.match(pos, /frame\.contentWindow\.print\(\)/);
  assert.match(pos, /printReceipt=function\(id\)/);
});

test('product deletion records a cloud tombstone before syncing', () => {
  assert.match(pos, /installAccessAndDeletionEnforcement\(\).*db\.deletedIds\.products.*clsSyncPosNow/s);
});

test('POS only restores the explicitly approved business account', () => {
  assert.match(pos, /POS_LOGIN_UID_KEY='ceylonry-pos-login-uid'/);
  assert.match(pos, /approvedUid===user\.uid/);
  assert.match(pos, /sessionStorage\.removeItem\(POS_LOGIN_UID_KEY\)/);
  assert.match(pos, /if\(firebase\.auth\(\)\.currentUser\)await firebase\.auth\(\)\.signOut\(\);var cred=await firebase\.auth\(\)\.signInWithEmailAndPassword/);
});

test('role navigation remains hidden despite forced button styling', () => {
  assert.match(pos, /#nav button\[hidden\]\{display:none!important\}/);
  assert.match(pos, /button\.hidden=!canView\(button\.dataset\.view\)/);
  assert.match(pos, /cashier:\['checkout','customers','staff'\]/);
  assert.match(pos, /management\.hidden=!user\|\|!\['owner','manager'\]\.includes\(user\.role\)/);
});

test('business-specific settings hide restaurant controls from hardware shops', () => {
  assert.match(pos, /supportsFoodOrders\(\).*\['restaurant','cafe'\]/s);
  assert.match(pos, /orderSettings\.hidden=!supportsFoodOrders\(\)/);
  assert.match(pos, /serviceSettings\.hidden=!supportsServiceCharge\(\)/);
  assert.match(pos, /foodService\?enabled:\[\]/);
});

test('retail checkout hides restaurant order channels and records retail sales', () => {
  assert.match(pos, /\.order-channel-fields\[hidden\]\{display:none!important\}/);
  assert.match(pos, /channel\.hidden=!restaurant/);
  assert.match(pos, /reference\.placeholder=restaurant\?'Table \/ order reference \(optional\)':'Sale reference \(optional\)'/);
  assert.match(pos, /orderChannel:restaurant\?\(channelSelect\.value\|\|'Dine-in'\):'Retail'/);
  assert.match(pos, /platformOrderId:restaurant\?platformId\.value\.trim\(\):''/);
});

test('POS business login provides password recovery', () => {
  assert.match(pos, /id='pos-forgot-password'/);
  assert.match(pos, /firebase\.auth\(\)\.sendPasswordResetEmail\(email\)/);
  assert.match(pos, /Password reset link sent/);
});

test('catalogue recovery never restores intentionally deleted products', () => {
  assert.match(pos, /intentionallyDeleted=new Set\(current\.deletedIds\.products\.map\(String\)\)/);
  assert.match(pos, /products=\(products\|\|\[\]\)\.filter\(function\(product\)\{return!intentionallyDeleted\.has/);
  assert.doesNotMatch(pos, /restoredIds=new Set\(products\.map/);
});

test('a stale device cannot clear cloud deletion tombstones during merge', () => {
  assert.match(pos, /merged\.deletedIds\[key\]=Array\.from\(new Set\(\[\]\.concat\(remote\.deletedIds/);
  assert.doesNotMatch(pos, /merged\.deletedIds\[key\]=merged\.deletedIds\[key\]\.filter/);
});

test('installed POS reloads when an updated service worker takes control', () => {
  assert.match(pos, /serviceWorker\.addEventListener\('controllerchange'/);
  assert.match(pos, /register\('\/sw\.js',\{updateViaCache:'none'\}\)/);
});

const admin = fs.readFileSync(path.join(root, 'netlify', 'functions', 'pos-admin-data.js'), 'utf8');
const config = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
const azureImages = fs.readFileSync(path.join(root, 'assets', 'azure-swim-products.js'), 'utf8');

test('staff must select an authorized location before PIN login', () => {
  assert.match(pos, /id=\"login-location\"/);
  assert.match(pos, /Select your POS location before signing in/);
  assert.match(pos, /You are not authorized for that location/);
  assert.match(pos, /allowed\.includes\(selected\)/);
  assert.match(pos, /staff-login-location/);
});

test('owner and admin dashboard shows statistics for every location', () => {
  assert.match(pos, /installLocationDashboard/);
  assert.match(pos, /role==='owner'\|\|role==='admin'/);
  assert.match(pos, /Location Status/);
  assert.match(pos, /Sales today/);
  assert.match(pos, /Stock units/);
  assert.match(pos, /item\.locationQuantities\?\.\[loc\.id\]/);
});

test('location inventory is persisted before every save', () => {
  assert.match(pos, /save=function\(\)\{normalizeLocations\(\);syncInventoryOut\(\);stampRecords\(\)/);
  assert.match(pos, /item\.locationQuantities\[loc\.id\]=Number\(item\.qty\)/);
  assert.match(pos, /syncInventoryIn\(\)/);
});

test('products can generate scannable and printable barcode labels', () => {
  assert.match(pos, /installProductBarcodes/);
  assert.match(pos, /function uniqueBarcode\(\)/);
  assert.match(pos, /AS-/);
  assert.match(pos, /function barcodeSvg\(value\)/);
  assert.match(pos, /Print Barcode Labels/);
  assert.match(pos, /Barcode label print job/);
  assert.match(pos, /Select the connected barcode printer/);
});

test('Azure Swim catalogue photos fill matching empty product codes', () => {
  assert.match(pos, /installAzureSwimCatalogueImages/);
  assert.match(pos, /azure\\s\*swim/i);
  assert.match(pos, /var images=window\.CLS_AZURE_SWIM_IMAGES\|\|\{\}/);
  assert.match(pos, /if\(image&&!product\.image\)/);
  for (const code of ['CO1AT', 'LA2LP', 'LU10JO', 'SU9HS', 'VE4CP']) {
    assert.match(azureImages, new RegExp('\"' + code + '\":\"data:image\\/png;base64,'));
  }
});

test('full-screen tablet checkout keeps the sidebar menu control visible', () => {
  assert.match(pos, /body\.full:not\(\.mobile-checkout\):has\(#view-checkout\.active\) #sidebar-toggle\s*\{\s*display:inline-flex!important/);
  assert.match(pos, /@media\(max-width:900px\)/);
  assert.match(pos, /not\(\.sidebar-collapsed\).*#view-checkout\.active.*\.side/);
});

test('locations are a universal POS capability rather than a business preset', () => {
  assert.match(pos, /installBusinessLocations/);
  assert.match(pos, /Branches are available for every business and POS type/);
  assert.doesNotMatch(pos, /businessType[^\n]{0,120}locations/);
});

test('location management stays inside the Business Profile settings tab', () => {
  assert.match(pos, /section=document\.getElementById\('settings-section-business'\)/);
  assert.match(pos, /var host=section\|\|root/);
  assert.match(pos, /if\(panel\.parentElement!==host\)/);
});

test('new and legacy accounts receive a main location', () => {
  assert.match(pos, /id:'loc-main',name:'Main Location',code:'MAIN'/);
  assert.match(pos, /if\(!clean\.locations\.length\)clean\.locations\.push/);
  assert.match(admin, /locations: \[\{ id: 'loc-main', name: 'Main Location'/);
});

test('staff access and sessions enforce selected locations', () => {
  assert.match(pos, /locationAccess:'all'/);
  assert.match(pos, /Choose at least one location for this user/);
  assert.match(pos, /You do not have access to that location/);
  assert.match(pos, /All Locations is available for reporting roles only/);
  assert.match(pos, /Choose a real location before starting checkout/);
});

test('operational records and inventory are location aware', () => {
  assert.match(pos, /\['sales','openOrders','cashShifts','timeEntries','stockMovements','voidOrders','customerCommunications','kitchenTickets'\]/);
  assert.match(pos, /item\.locationQuantities\[loc\.id\]/);
  assert.match(pos, /businessId=businessId;item\.locationId=loc/);
  assert.match(pos, /locationAudit/);
  assert.match(pos, /stockTransfers/);
});

test('only owner or admin can permanently delete reversed sales', () => {
  assert.match(pos, /role==='owner'\|\|role==='admin'/);
  assert.match(pos, /Only the owner or an admin can permanently delete sales/);
  assert.match(pos, /\['refunded','voided'\]\.includes\(status\)/);
  assert.match(pos, /Refund or void this sale before permanently deleting it/);
});

test('deleted sales receive persistent cloud tombstones', () => {
  assert.match(pos, /deletedIds:\{products:\[\],modifiers:\[\],inventory:\[\],sales:\[\]/);
  assert.match(pos, /\['products','modifiers','inventory','sales','subcategories'\]/);
  assert.match(pos, /\['products','modifiers','inventory','sales','categories','subcategories'\]/);
  assert.match(pos, /db\.deletedIds\.sales\.push/);
  assert.match(pos, /clsSyncPosNow/);
});

test('permanent deletion is audited and removed from sales history', () => {
  assert.match(pos, /action:'sale-permanently-deleted'/);
  assert.match(pos, /button\.dataset\.deleteSale=sale\.id/);
  assert.match(pos, /deleteSalePermanently\(sale\.id\)/);
  assert.match(pos, /reconcileDeletedSales\(\)/);
});

test('Azure Swim USB printer can be discovered and authorised from settings', () => {
  assert.match(pos, /AZURE_PRINTER_VENDOR=1046,AZURE_PRINTER_PRODUCT=20497/);
  assert.match(pos, /navigator\.usb\.requestDevice/);
  assert.match(pos, /Connect USB Printer/);
  assert.match(pos, /header-printer-button/);
  assert.match(pos, /openHeaderPrinterControl/);
  assert.match(pos, /Direct USB ESC\/POS printer \(80 mm\)/);
  assert.match(config, /usb=\(self\)/);
});

test('direct printer claims a bulk output endpoint and restores permission', () => {
  assert.match(pos, /endpoint\.direction==='out'&&endpoint\.type==='bulk'/);
  assert.match(pos, /device\.claimInterface/);
  assert.match(pos, /navigator\.usb\.getDevices\(\)/);
  assert.match(pos, /navigator\.usb\.addEventListener\('disconnect'/);
});

test('receipts use ESC POS with Android system print fallback', () => {
  assert.match(pos, /usbPrinter\.transferOut\(usbEndpointNumber,escPosBytes\(sale\)\)/);
  assert.match(pos, /bytes\.set\(\[27,64\],0\)/);
  assert.match(pos, /bytes\.set\(\[29,86,66,0\]/);
  assert.match(pos, /Direct print failed\. Opening Android System Print instead/);
  assert.match(pos, /printDocument\(receiptHtml\(sale\)\)/);
});

test('retail products automatically participate in location stock counts', () => {
  assert.match(pos, /installRetailOperationsIntegrity/);
  assert.match(pos, /autoProductStock:true/);
  assert.match(pos, /autoProductStock:true,locationQuantities:\{\}/);
  assert.match(pos, /item\.locationQuantities\[location\.id\]=Number\(product\.stock\)\|\|0/);
  assert.match(pos, /item\.locationQuantities\[loc\]=\(Number\(item\.locationQuantities\[loc\]\)\|\|0\)\+change/);
  assert.match(pos, /direction<0\?'Product sold':'Sale reversed'/);
});

test('sales history supports purchase date filtering and receipt tombstones', () => {
  assert.match(pos, /Purchased from/);
  assert.match(pos, /Purchased to/);
  assert.match(pos, /saleReceipts/);
  assert.match(pos, /receipts\.has\(String\(sale\.receipt/);
});

test('admin billing handles reminders, payment confirmation and account access', () => {
  assert.match(admin, /action === 'recordPayment'/);
  assert.match(admin, /action === 'billingReminder'/);
  assert.match(admin, /action === 'deleteAccount'/);
  assert.match(pos, /deletePosUser/);
  assert.doesNotMatch(platform, /id="cls-paywall"[^;]+type="file"/);
  assert.match(platform, /No payment-slip upload is required/);
});
