const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pos = fs.readFileSync(path.join(root, 'pos-system', 'pos-system.html'), 'utf8');
const config = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');

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
