const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pos = fs.readFileSync(path.join(root, 'pos-system', 'pos-system.html'), 'utf8');
const platform = fs.readFileSync(path.join(root, 'assets', 'platform.js'), 'utf8');
const mailer = fs.readFileSync(path.join(root, 'netlify', 'functions', 'send-invoice.js'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const config = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');

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
  assert.match(pos, /connectUsbBarcodeScanner/);
  assert.match(pos, /navigator\.hid\.requestDevice/);
  assert.match(pos, /usagePage:1,usage:6/);
  assert.match(pos, /claimUsbBarcodeScanner/);
  assert.match(pos, /handleHidScannerReport/);
  assert.match(pos, /hidKeyMap/);
  assert.match(pos, /restoreUsbBarcodeScanner/);
  assert.match(pos, /Connect USB Scanner/);
  assert.match(pos, /startBarcodeScannerTest/);
  assert.match(pos, /finishBarcodeScannerTest/);
  assert.match(pos, /scanner-test-input/);
  assert.match(pos, /This tablet browser does not support USB HID selection/);
  assert.match(pos, /function scannerCodeVariants\(code\)/);
  assert.match(pos, /function scannedProduct\(code\)/);
  assert.match(pos, /product\.code,product\.barcode,product\.sku/);
  assert.match(pos, /replace\(\/\^\\\*\+\|\\\*\+\$\/g,''\)/);
  assert.match(pos, /function addScannedProductToCurrentOrder\(product,code\)/);
  assert.match(pos, /go\('checkout'\)/);
  assert.match(pos, /cartList\.scrollTop=cartList\.scrollHeight/);
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
  assert.match(pos, /cashier:\['checkout','customers','staff','settings'\]/);
  assert.match(pos, /accountant:\['dashboard','sales','staff','settings'\]/);
  assert.match(pos, /management\.hidden=!user\|\|!\['owner','manager'\]\.includes\(user\.role\)/);
  assert.match(pos, /function applyPrinterSettingsAccess\(\)/);
  assert.match(pos, /panel\.hidden=!fullSettings&&!isPrinting/);
  assert.match(pos, /saveButton\.hidden=!fullSettings/);
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

test('POS business login never persists a browser-side rate-limit countdown', () => {
  assert.match(pos, /POS_AUTH_COOLDOWN_KEY='ceylonry-pos-auth-cooldown-until'/);
  assert.match(pos, /function clearPosAuthCooldown\(\)/);
  assert.match(pos, /clearPosAuthCooldown\(\);businessAccountSubmit=async function/);
  assert.match(pos, /submit\.disabled=true;submit\.textContent='Signing in/);
  assert.match(pos, /Appwrite is temporarily rate limiting sign-ins/);
  assert.match(pos, /catch\(e\).*clearPosAuthCooldown\(\);error\.textContent=posAuthMessage\(e\)/);
  assert.doesNotMatch(pos, /setItem\(POS_AUTH_COOLDOWN_KEY/);
  assert.doesNotMatch(pos, /Please wait about '\+Math\.ceil/);
});

test('catalogue recovery never restores intentionally deleted products', () => {
  assert.match(pos, /intentionallyDeleted=new Set\(current\.deletedIds\.products\.map\(String\)\)/);
  assert.match(pos, /removedCategories=new Set\(current\.deletedIds\.categories\.map\(String\)\)/);
  assert.match(pos, /removedSubcategories=new Set\(current\.deletedIds\.subcategories\.map\(String\)\)/);
  assert.match(pos, /products=\(products\|\|\[\]\)\.filter\(function\(product\)\{return!intentionallyDeleted\.has/);
  assert.match(pos, /!removedCategories\.has\(String\(product\?\.category\|\|''\)\)/);
  assert.match(pos, /current\.categories=.*\.filter\(function\(category\)\{return!removedCategories\.has/s);
  assert.doesNotMatch(pos, /restoredIds=new Set\(products\.map/);
});

test('a stale device cannot clear cloud deletion tombstones during merge', () => {
  assert.match(pos, /merged\.deletedIds\[key\]=Array\.from\(new Set\(\[\]\.concat\(remote\.deletedIds/);
  assert.doesNotMatch(pos, /merged\.deletedIds\[key\]=merged\.deletedIds\[key\]\.filter/);
});

test('installed POS reloads when an updated service worker takes control', () => {
  assert.match(pos, /serviceWorker\.addEventListener\('controllerchange'/);
  assert.match(pos, /register\('\/sw\.js',\{updateViaCache:'none'\}\)/);
  assert.match(worker, /'\/pos-system\/pos-system'/);
  assert.match(worker, /url\.pathname==='\/pos-system\/pos-system'/);
  assert.match(worker, /new Request\(event\.request,\{cache:'no-store'\}\)/);
  assert.match(config, /for = "\/pos-system\/pos-system"[\s\S]*?Cache-Control = "no-store/);
});

const admin = fs.readFileSync(path.join(root, 'netlify', 'functions', 'pos-admin-data.js'), 'utf8');
const azureImages = fs.readFileSync(path.join(root, 'assets', 'azure-swim-products.js'), 'utf8');

test('staff must select an authorized location before PIN login', () => {
  assert.match(pos, /id=\"login-location\"/);
  assert.match(pos, /Select your POS location before signing in/);
  assert.match(pos, /You are not authorized for that location/);
  assert.match(pos, /allowed\.includes\(selected\)/);
  assert.match(pos, /staff-login-location/);
});

test('staff login user selection survives login list refreshes', () => {
  assert.match(pos, /function refreshLoginUsers\(\)\{let select=document\.getElementById\('login-user'\),previous=select\?\.value/);
  assert.match(pos, /if\(users\.some\(u=>u\.id===previous\)\)select\.value=previous/);
  assert.match(pos, /document\.getElementById\('login-user'\)\.addEventListener\('change',refreshLoginLocations\)/);
  assert.match(pos, /function loginUserAllowedAt\(user,locId\)/);
  assert.match(pos, /userField\.before\(field\)/);
  assert.match(pos, /Choose the branch first\. Only staff allowed at that location are shown\./);
  assert.match(pos, /document\.getElementById\('login-location'\)\.addEventListener\('change',refreshLoginUsers\)/);
  assert.match(pos, /db\.users\.filter\(function\(user\)\{return loginUserAllowedAt\(user,selectedLocation\)\}\)/);
});

test('owner and admin dashboard shows statistics for every location', () => {
  assert.match(pos, /installLocationDashboard/);
  assert.match(pos, /role==='owner'\|\|role==='admin'/);
  assert.match(pos, /Location Status/);
  assert.match(pos, /Sales today/);
  assert.match(pos, /Stock units/);
  assert.match(pos, /item\.locationQuantities\?\.\[loc\.id\]/);
});

test('branch checkout sales are stamped for owner reporting and sync', () => {
  assert.match(pos, /var locationCompleteSale=completeSale/);
  assert.match(pos, /Choose a real POS location before completing checkout/);
  assert.match(pos, /sale\.businessId=db\.accountUid\|\|storageKey/);
  assert.match(pos, /sale\.locationId=loc\.id/);
  assert.match(pos, /sale\.locationName=loc\.name/);
  assert.match(pos, /audit\('checkout-completed',sale\.receipt\+'\s*·\s*'\+money\(sale\.total\),loc\.id\)/);
});

test('owners and admins can review inventory split across all locations', () => {
  assert.match(pos, /locationId\(\)!=='all'\|\|!\['owner','admin'\]\.includes\(currentUser\(\)\?\.role\)/);
  assert.match(pos, /Low Stock by Branch/);
  assert.match(pos, /Out of Stock by Branch/);
  assert.match(pos, /All-Location Value/);
  assert.match(pos, /item\.locationQuantities\?\.\[loc\.id\]/);
  assert.match(pos, /openBranchStockCounts/);
  assert.match(pos, /Set Branch Stock/);
  assert.match(pos, /Bulk Branch Count/);
  assert.match(pos, /locationLabel\(m\.locationId\)/);
  assert.doesNotMatch(pos, /Adjust by Branch/);
});

test('owners can set stock counts per location one by one or in bulk', () => {
  assert.match(pos, /function initializeLocationInventory\(locId\)/);
  assert.match(pos, /initializeLocationInventory\(loc\.id\)/);
  assert.match(pos, /function setLocationStock\(item,locId,value,reason,note\)/);
  assert.match(pos, /function addLocationStockMovement\(item,locId,change,balance,reason,note\)/);
  assert.match(pos, /id='branch-stock-modal'/);
  assert.match(pos, /id='bulk-branch-stock-modal'/);
  assert.match(pos, /data-location-stock/);
  assert.match(pos, /data-bulk-stock-item/);
  assert.match(pos, /Owner central inventory update/);
  assert.match(pos, /Owner bulk inventory update/);
  assert.match(pos, /locationQuantities\[locId\]=0/);
});

test('location inventory is persisted before every save', () => {
  assert.match(pos, /save=function\(\)\{normalizeLocations\(\);syncInventoryOut\(\);stampRecords\(\)/);
  assert.match(pos, /item\.locationQuantities\[loc\.id\]=Number\(item\.qty\)/);
  assert.match(pos, /function touchLocationQuantity\(item,locId\)/);
  assert.match(pos, /locationQuantityUpdatedAt\[locId\]/);
  assert.match(pos, /syncInventoryIn\(\)/);
});

test('products can generate scannable and printable barcode labels', () => {
  assert.match(pos, /installProductBarcodes/);
  assert.match(pos, /function uniqueBarcode\(\)/);
  assert.match(pos, /AS-/);
  assert.match(pos, /function barcodeSvg\(value\)/);
  assert.match(pos, /Product Barcode Labels/);
  assert.match(pos, /Barcode label print job/);
  assert.match(pos, /Select the connected barcode printer/);
  assert.match(pos, /Product Barcode Labels/);
  assert.match(pos, /function barcodeLabelCopy\(product\)/);
  assert.match(pos, /height="96"/);
  assert.match(pos, /viewBox="0 0 '\+\(x\+8\)\+' 106"/);
  assert.match(pos, /openProductBarcodeFromForm/);
  assert.match(pos, /button\.id='print-product-barcode'/);
  assert.match(pos, /button\.textContent='Print Barcode'/);
  assert.match(pos, /Save this item first, then print its barcode label/);
  assert.match(pos, /label-name/);
  assert.match(pos, /label-description/);
  assert.match(pos, /label-barcode/);
  assert.match(pos, /label-price/);
  assert.match(pos, /30 × 25 mm Azure standard/);
  assert.match(pos, /Azure Swim labels are fixed to 30 × 25 mm with product name, barcode and price only/);
  assert.doesNotMatch(pos, /Azure sticker · 40 × 30 mm/);
  assert.doesNotMatch(pos, /25 × 25 mm micro/);
  assert.doesNotMatch(pos, /35 × 25 mm micro/);
  assert.doesNotMatch(pos, /35 × 35 mm compact square/);
  assert.doesNotMatch(pos, /40 × 25 mm micro/);
  assert.doesNotMatch(pos, /Azure Swim fit · 45 × 30 mm/);
  assert.match(pos, /function labelBitmapLayout\(width,height\)/);
  assert.doesNotMatch(pos, /width<=30&&height<=13/);
  assert.match(pos, /width<=25&&height<=25/);
  assert.match(pos, /margin:22,nameFont:14,descFont:7,underNameFont:0,priceFont:15/);
  assert.match(pos, /nameY:8,descY:25,barcodeY:40,barcodeH:98/);
  assert.match(pos, /width<=30&&height<=25/);
  assert.match(pos, /margin:24,nameFont:16,descFont:0,underNameFont:0,priceFont:16/);
  assert.match(pos, /nameY:6,descY:0,barcodeY:28,barcodeH:104/);
  assert.match(pos, /margin:42,nameFont:18,descFont:8,underNameFont:0,priceFont:18/);
  assert.match(pos, /nameY:14,descY:36,barcodeY:56,barcodeH:110/);
  assert.match(pos, /if\(layout\.nameFont\)/);
  assert.match(pos, /layout\.underNameFont/);
  assert.match(pos, /layout\.barcodeY\+layout\.barcodeH\+layout\.underNameGap/);
  assert.match(pos, /priceGap:8,bottomPad:22/);
  assert.match(pos, /darken:true,gapMm:3/);
  assert.match(pos, /function tsplBitmapBytes\(product,copies,size\)/);
  assert.match(pos, /var code128Patterns=\[/);
  assert.match(pos, /function code128Values\(value\)/);
  assert.match(pos, /function drawCode128\(context,value,x,y,width,height,darken\)/);
  assert.match(pos, /function drawCode39\(context,value,x,y,width,height,darken\)/);
  assert.match(pos, /drawCode128\(context,product\.code,margin,layout\.barcodeY,dotsW-margin\*2,layout\.barcodeH,layout\.darken\)/);
  assert.match(pos, /size=\['30','25'\]/);
  assert.match(pos, /30 × 25 mm barcode label/);
  assert.match(pos, /BITMAP 0,0/);
  assert.match(pos, /GAP '\+\(layout\.gapMm\|\|3\)\+' mm,0/);
  assert.match(pos, /calibrateUsbBarcodePrinter/);
  assert.match(pos, /GAPDETECT/);
  assert.match(pos, /Barcode label printer calibrated/);
  assert.match(pos, /DENSITY 15/);
  assert.match(pos, /SPEED 2/);
  assert.doesNotMatch(pos, /for\(var copy=0;copy<count;copy\+\+\)/);
  assert.match(pos, /SET TEAR OFF/);
  assert.match(pos, /SET PEEL OFF/);
  assert.match(pos, /SET CUTTER OFF/);
  assert.match(pos, /BACKFEED 0/);
  assert.match(pos, /PRINT 1,'\+count\+'/);
  assert.match(pos, /OFFSET 0 mm/);
  assert.match(pos, /REFERENCE 0,0/);
  assert.match(pos, /DIRECTION 0/);
  assert.match(pos, /pixels\[offset\+3\]<=40\|\|luma>=160/);
  assert.match(pos, /max-height:14mm/);
  assert.match(pos, /font-size:10pt/);
  assert.doesNotMatch(pos, /SKU: '\+code/);
  assert.doesNotMatch(pos, /SKU: '\+esc\(product\.code\)/);
  assert.match(pos, /connectUsbBarcodePrinter/);
  assert.match(pos, /printBarcodeLabelsUsbFromModal/);
  assert.match(pos, /USB barcode label printer/);
  assert.match(pos, /restoreBarcodePrinter\(\)\.then/);
  assert.match(pos, /Saved USB label printers reconnect automatically/);
  assert.match(pos, /BARCODE '\+barcodeX\+'\,'\+barcodeY\+',\\"128\\"/);
  assert.doesNotMatch(pos, /button\.textContent='Generate Barcode'/);
});

test('product category views hide stale preset-only categories', () => {
  assert.match(pos, /function visibleProductCategories\(\)/);
  assert.match(pos, /function stalePresetCategory\(name\)/);
  assert.match(pos, /pastries/);
  assert.match(pos, /sandwiches/);
  assert.match(pos, /visibleProductCategories\(\)\.filter/);
  assert.match(pos, /visibleCategories=visibleProductCategories\(\)/);
});

test('POS hardware settings expose persistent printers and scanner readiness', () => {
  assert.match(pos, /Saved USB label printers reconnect automatically/);
  assert.match(pos, /Android usually exposes USB scanners as keyboards/);
  assert.match(pos, /USB scanner not connected\. Keyboard-mode scanning is ready/);
  assert.match(pos, /window\.testBarcodeScanner=function/);
  assert.match(pos, /navigator\.usb\.addEventListener\('connect',function\(\)\{restoreBarcodePrinter\(\)\}\)/);
  assert.match(pos, /matched Azure item codes to Current Order/);
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
  assert.match(pos, /#sidebar-toggle\{[\s\S]*?min-width:92px/);
  assert.match(pos, /#sidebar-toggle\{[\s\S]*?flex:0 0 auto/);
  assert.doesNotMatch(pos, /#sidebar-toggle\{\s*min-width:0/);
});

test('mobile and tablet chrome keeps lock and business sign out reachable', () => {
  assert.match(pos, /class="top-actions"/);
  assert.match(pos, /class="btn out session-action" type="button" onclick="staffLogout\(\)">Lock POS/);
  assert.match(pos, /class="btn out session-action" type="button" onclick="businessLogout\(\)">Sign Out Business/);
  assert.match(pos, /@media\(max-width:900px\).*\.top-actions\{flex:1 1 100%;display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/s);
  assert.match(pos, /@media\(max-width:520px\).*\.top-actions #full-btn\{grid-column:1\/-1\}/s);
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
  assert.match(pos, /function defaultUserLocationIds\(\)/);
  assert.match(pos, /locationIds:defaultUserLocationIds\(\)/);
  assert.match(pos, /requestAnimationFrame\(function\(\)\{audit\('location-switch'/);
  assert.match(pos, /class="location-choice-copy"/);
  assert.match(pos, /Choose at least one location for this user/);
  assert.match(pos, /match=edit&&\(edit\.getAttribute\('onclick'\)\|\|''\)\.match/);
  assert.match(pos, /String\(item\.id\)===String\(match\[1\]\)/);
  assert.match(pos, /You do not have access to that location/);
  assert.match(pos, /All Locations is available for reporting roles only/);
  assert.match(pos, /Choose a real location before starting checkout/);
});

test('operational records and inventory are location aware', () => {
  assert.match(pos, /\['sales','openOrders','cashShifts','timeEntries','stockMovements','voidOrders','customerCommunications','kitchenTickets'\]/);
  assert.match(pos, /item\.locationQuantities\[loc\.id\]/);
  assert.match(pos, /inventory-location-button/);
  assert.match(pos, /button\.onclick=openLocationSwitcher/);
  assert.match(pos, /Location: '\+\(loc\?loc\.name:'Select Location'\)/);
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
  assert.match(pos, /Connect Label Printer/);
  assert.match(pos, /Calibrate Label Gap/);
  assert.match(pos, /settings-barcode-printer-status/);
  assert.match(pos, /settings-scanner-status/);
  assert.match(config, /hid=\(self\)/);
  assert.match(pos, /Printer connection settings are available to every staff user/);
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

test('receipts use chunked ESC POS without opening Android PDF printing', () => {
  assert.match(pos, /usbPrinter\.transferOut\(usbEndpointNumber,chunk\)/);
  assert.match(pos, /bytes\.set\(\[27,64\],0\)/);
  assert.match(pos, /bytes\.set\(\[29,86,66,0\]/);
  assert.match(pos, /function escPosLogoBytes\(\)/);
  assert.match(pos, /var target=240,width=target,height=target/);
  assert.match(pos, /width:30mm;height:30mm/);
  assert.match(pos, /offset\+=4096/);
  assert.match(pos, /The POS will not open Save as PDF/);
  assert.doesNotMatch(pos, /sendReceiptToPrinter\(sale\).*printDocument\(receiptHtml\(sale\)\)/s);
});

test('all locations share the same receipt logo and QR print sizing', () => {
  assert.match(pos, /var originalReceiptHtml=receiptHtml;receiptHtml=function\(sale\)/);
  assert.match(pos, /originalReceiptHtml\.apply\(this,arguments\)/);
  assert.match(pos, /sale\.locationId\|\|locationId\(\)/);
  assert.match(pos, /width:30mm;height:30mm/);
  assert.match(pos, /var target=240,width=target,height=target/);
  assert.match(pos, /\.social-qr\{display:block;width:42mm;height:42mm;object-fit:contain/);
  assert.match(pos, /socialQr=await escPosSocialQrBytes\(\)/);
});

test('Business Tools is removed and successful voids disappear permanently', () => {
  assert.match(pos, /button\.remove\(\)/);
  assert.match(pos, /if\(view\)view\.remove\(\)/);
  assert.match(pos, /deleteSalePermanently\(sale\.id,true\)/);
  assert.match(pos, /bypassHistoricalCash/);
});

test('connecting the USB receipt printer enables automatic sale printing', () => {
  assert.match(pos, /db\.settings\.printerType='usb-direct';db\.settings\.autoPrint=true/);
  assert.match(pos, /if\(db\.settings\.autoPrint\)setTimeout\(\(\)=>printReceipt\(sale\.id\),200\)/);
  assert.match(pos, /printReceipt=function\(id\).*sendReceiptToPrinter\(sale\)/s);
});

test('tablet landscape keeps page tools and refund dialogs aligned', () => {
  assert.match(pos, /min-width:701px\) and \(max-width:1100px/);
  assert.match(pos, /\.side,body\.full \.side\{position:relative!important/);
  assert.match(pos, /\.modal\{z-index:1000!important/);
  assert.match(pos, /#sale-action-modal \.modal-box.*grid-template-rows:auto minmax\(0,1fr\) auto/s);
  assert.match(pos, /#view-products \.panel-head\{align-items:flex-start!important;flex-wrap:wrap!important/);
});

test('checkout saves sales before optional receipt printing', () => {
  assert.match(pos, /installReliableSaleCompletion/);
  assert.match(pos, /id="print-sale-receipt"/);
  assert.match(pos, /Sale .* saved to Sales History/);
  assert.match(pos, /if\(shouldPrint\)await printReceipt\(sale\.id\)/);
  assert.match(pos, /window\.clsSyncPosNow\(\)\.catch/);
  assert.match(pos, /db\.settings\.autoPrint=false/);
});

test('all businesses can print social links and QR artwork on receipts', () => {
  assert.match(pos, /installReceiptSocials/);
  assert.match(pos, /function cleanReceiptQrImage\(source,callback\)/);
  assert.match(pos, /function whitenSolidQrBackground\(canvas\)/);
  assert.match(pos, /Socials on receipt/);
  assert.match(pos, /set-social-instagram/);
  assert.match(pos, /set-social-facebook/);
  assert.match(pos, /set-social-tiktok/);
  assert.match(pos, /set-social-website/);
  assert.match(pos, /receiptSocialQr/);
  assert.match(pos, /function escPosSocialQrBytes\(\)/);
  assert.match(pos, /sluma>185/);
  assert.match(pos, /var pad=0,cropX=found\?Math\.max\(0,minX-pad\):0/);
  assert.match(pos, /whitenSolidQrBackground\(canvas\)/);
  assert.match(pos, /receiptSocialQrCleanedVersion='qr-white-v2'/);
  assert.match(pos, /bytes\.set\(socialQr,logo\.length\+receiptBody\.length\)/);
  assert.doesNotMatch(pos, /addEventListener\('input',renderReceiptSocialPreview\)/);
  assert.match(pos, /addEventListener\('input',function\(\)\{window\.renderReceiptSocialPreview\(\)\}\)/);
});

test('retail products automatically participate in location stock counts', () => {
  assert.match(pos, /installRetailOperationsIntegrity/);
  assert.match(pos, /window\.clsEnsureProductInventory=ensureProductInventory/);
  assert.match(pos, /if\(ensureProductInventory\(\)\)save\(\)/);
  assert.match(pos, /if\(window\.clsEnsureProductInventory\)window\.clsEnsureProductInventory\(\)/);
  assert.match(pos, /autoProductStock:true/);
  assert.match(pos, /autoProductStock:true,locationQuantities:\{\}/);
  assert.match(pos, /item\.locationQuantities\[location\.id\]=Number\(product\.stock\)\|\|0/);
  assert.match(pos, /item\.locationQuantities\[loc\]=\(Number\(item\.locationQuantities\[loc\]\)\|\|0\)\+change/);
  assert.match(pos, /item\.locationQuantityUpdatedAt\[loc\]=new Date\(\)\.toISOString\(\)/);
  assert.match(pos, /direction<0\?'Product sold':'Sale reversed'/);
});

test('cloud sync merges inventory counts per location', () => {
  assert.match(pos, /function mergeInventoryList\(remote,local\)/);
  assert.match(pos, /key==='inventory'\?mergeInventoryList\(remote\[key\],local\[key\]\):mergeList/);
  assert.match(pos, /remoteTimes=old\.locationQuantityUpdatedAt\|\|\{\}/);
  assert.match(pos, /localTimes=item\.locationQuantityUpdatedAt\|\|\{\}/);
  assert.match(pos, /mergedQty\[loc\]=localTime>=remoteTime\?localQty\[loc\]:remoteQty\[loc\]/);
});

test('checkout prevents selling more retail stock than the branch has', () => {
  assert.match(pos, /function availableProductStock\(productId\)/);
  assert.match(pos, /function stockProblem\(lines\)/);
  assert.match(pos, /button\.classList\.toggle\('out-of-stock',available<=0\)/);
  assert.match(pos, /button\.disabled=available<=0/);
  assert.match(pos, /Reduce the quantity before completing the sale/);
});

test('receipt purchase dates use a stable day-month-year format', () => {
  assert.match(pos, /function receiptDate\(s\)/);
  assert.match(pos, /toLocaleString\('en-GB'/);
  assert.match(pos, /\$\{receiptDate\(s\)\}/);
  assert.match(pos, /\(sale\.receipt\|\|'RECEIPT'\)\+'  '\+receiptDate\(sale\)/);
  assert.doesNotMatch(pos, /sale\.createdAt\|\|Date\.now\(\)\)\.toLocaleString\(\)/);
});

test('confirmed cloud pulls clear stale pending sync status', () => {
  assert.match(pos, /payloadCovers\(remote,safePayload\(\)\).*localStorage\.removeItem\(pendingSyncKey\(\)\)/s);
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

test('large Appwrite documents are chunked below the data attribute limit', () => {
  const appwrite = fs.readFileSync(path.join(root, 'netlify', 'lib', 'appwrite.js'), 'utf8');
  assert.match(appwrite, /DOCUMENT_DATA_LIMIT = 900000/);
  assert.match(appwrite, /Buffer\.byteLength/);
  assert.match(appwrite, /splitUtf8\(serialized,DOCUMENT_CHUNK_SIZE\)/);
  assert.match(appwrite, /payload\.data=storedData\(payload\.data\)/);
  assert.match(appwrite, /__chunkedDocument:true/);
  assert.match(appwrite, /hydratedRowToDoc/);
  assert.match(pos, /imageSource==='azure-swim-catalogue'.*bundled\[code\]===product\.image/s);
});

test('product edits persist modifier rules and stock usage before cloud sync', () => {
  assert.match(pos, /row\.dataset\.modifierId/);
  assert.match(pos, /product\.modifierRules=modifierRules;product\.recipe=recipe;product\.updatedAt=/);
  assert.match(pos, /window\.clsSyncPosNow\(\);renderInventory\(\);renderProducts\(\);renderCheckout\(\)/);
});

test('failed cloud sync exposes an immediate retry action', () => {
  assert.match(pos, /Cloud sync failed\. Tap to retry now\./);
  assert.match(pos, /Retrying cloud sync/);
  assert.match(pos, /Cloud sync failed · changes saved locally · tap to retry/);
});

test('cross-device sync resolves records and individual settings by update time', () => {
  assert.match(pos, /function prepareSyncMetadata\(previous\)/);
  assert.match(pos, /db\.syncMeta\.settings\[key\]=now/);
  assert.match(pos, /item\.updatedAt=now/);
  assert.match(pos, /localTime>remoteTime\?localSettings\[key\]:remoteTime>localTime\?remoteSettings\[key\]/);
  assert.match(pos, /setInterval\(pull,1500\)/);
});

test('Azure Swim social QR artwork is preloaded and included in receipt printing', () => {
  assert.match(pos, /var azureSwimReceiptQr='data:image\/png;base64,/);
  assert.match(pos, /receiptSocialQr=azureSwimReceiptQr/);
  assert.match(pos, /@AZURE_SWIM_SRI_LANKA/);
  assert.match(pos, /escPosSocialQrBytes/);
});

test('linked staff accounts and devices use the owner business workspace', () => {
  const appwrite = fs.readFileSync(path.join(root, 'netlify', 'lib', 'appwrite.js'), 'utf8');
  assert.match(pos, /workspaceUid=String\(profile\.ownerUid\|\|user\.uid\)/);
  assert.match(pos, /collection\('users'\)\.doc\(workspaceUid\)\.collection\('pos'\)\.doc\('main'\)/);
  assert.match(pos, /storageKey=KEY\+'-'\+workspaceUid/);
  assert.match(pos, /saveCloudSnapshotLocally\(\);lastCloudJson=/);
  assert.match(appwrite, /async function linkedOwnerUid\(user\)/);
  assert.match(appwrite, /ownerUid===pathOwner/);
});

test('POS cloud writes merge on the server and verify persistence before reporting synced', () => {
  const api = fs.readFileSync(path.join(root, 'netlify', 'functions', 'appwrite-docs.js'), 'utf8');
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(api, /function mergePosPayload\(remote,local\)/);
  assert.match(api, /data\.payload=mergePosPayload\(current\.data\.payload,data\.payload\)/);
  assert.match(pos, /function payloadCovers\(remote,local\)/);
  assert.match(pos, /for\(var attempt=0;attempt<3;attempt\+\+\)/);
  assert.match(pos, /if\(payloadCovers\(verified,payload\)\)break/);
  assert.match(pos, /Cloud did not confirm the latest device changes/);
  assert.match(pos, /localStorage\.getItem\(pendingSyncKey\(\)\)==='1'\)setCloudStatus\('Syncing POS with cloud/);
  assert.match(worker, /ceylonry-pos-app-shell-v14/);
  assert.match(worker, /new Request\(event\.request,\{cache:'no-store'\}\)/);
});
test('an upload finishing preserves additions and deletions made while it was running', async () => {
  const vm = require('node:vm');
  const context = { console, setTimeout: () => {}, navigator: { onLine: true },
    db: { products: [{ id: 'old' }], settings: {} }, cloudUser: { uid: 'owner' }, cloudProfile: {},
    syncInFlight: false, syncAgain: false, lastCloudJson: '',
    localStorage: { getItem: () => '1', setItem() {}, removeItem() {} },
    pendingSyncKey: () => 'pending', updateConnectionStatus: () => true,
    normalizeAccountDb: x => x, saveCloudSnapshotLocally() {}, setCloudStatus() {}, refreshSyncedView() {},
    withSyncTimeout: x => x, firebase: { firestore: { FieldValue: { serverTimestamp: () => 'now' } } }
  };
  vm.createContext(context);
  for (const name of ['itemTime', 'mergeList', 'mergeInventoryList', 'mergePayload', 'payloadCovers', 'syncCloud']) {
    const line = pos.split('\n').find(line => line.trim().startsWith((name === 'syncCloud' ? 'async ' : '') + 'function ' + name + '('));
    vm.runInContext(line, context);
  }
  context.safePayload = () => JSON.parse(JSON.stringify(context.db));
  let persisted;
  context.cloudRef = {
    get: async () => ({ exists: !!persisted, data: () => ({ payload: persisted }) }),
    set: async value => {
      persisted = JSON.parse(JSON.stringify(value.payload));
      context.db = { products: [{ id: 'new', updatedAt: '2026-09-20T12:00:00Z' }], settings: {}, deletedIds: { products: ['old'] } };
    }
  };
  await context.syncCloud();
  assert.deepEqual(Array.from(context.db.products, x => x.id), ['new']);
  assert.deepEqual(Array.from(context.db.deletedIds.products), ['old']);
  assert.equal(context.syncAgain, false);
  assert.equal(context.payloadCovers({ products: [], deletedIds: { products: ['old'] }, settings: {} }, { products: [{ id: 'old' }], settings: {} }), true);
});
