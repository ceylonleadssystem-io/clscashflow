const nodemailer = require('nodemailer');

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const PRODUCTS = {
  lite: { name: 'Ceylonry POS Lite', price: 120000 },
  'lite-black': { name: 'Ceylonry POS Lite · Black', price: 155000 },
  'pro-white': { name: 'Ceylonry POS Pro · White', price: 162000 },
  'pro-black': { name: 'Ceylonry POS Pro · Black', price: 165000 },
  printer: { name: 'Ceylonry Receipt Printer', price: 18000 }
};

function response(statusCode, body) {
  return { statusCode, headers: HEADERS, body: JSON.stringify(body) };
}

function clean(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function(character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
  });
}

function money(value) {
  return 'LKR ' + Number(value || 0).toLocaleString('en-LK');
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return response(204, {});
  if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'Method not allowed.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (error) { return response(400, { ok: false, error: 'Invalid order request.' }); }
  if (clean(body.website, 200)) return response(200, { ok: true, sent: true });

  const customer = {
    name: clean(body.name, 120),
    email: clean(body.email, 160).toLowerCase(),
    mobile: clean(body.mobile, 35),
    address: clean(body.address, 800),
    notes: clean(body.notes, 1200)
  };
  if (!customer.name || !customer.email || !customer.mobile || !customer.address) {
    return response(400, { ok: false, error: 'Please complete your name, email, mobile number and delivery address.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return response(400, { ok: false, error: 'Please enter a valid email address.' });
  }
  if (customer.mobile.replace(/\D/g, '').length < 9) {
    return response(400, { ok: false, error: 'Please enter a valid mobile number.' });
  }

  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 20).map(function(item) {
    const product = PRODUCTS[clean(item && item.id, 40)];
    const quantity = Math.max(1, Math.min(20, Math.floor(Number(item && item.quantity) || 1)));
    return product ? { name: product.name, price: product.price, quantity, total: product.price * quantity } : null;
  }).filter(Boolean);
  if (!items.length) return response(400, { ok: false, error: 'Please add at least one hardware item.' });

  const total = items.reduce(function(sum, item) { return sum + item.total; }, 0);
  const orderId = 'HW-' + Date.now().toString(36).toUpperCase();
  const itemText = items.map(function(item) { return item.quantity + ' × ' + item.name + ' — ' + money(item.total); }).join('\n');
  const text = [
    'New Ceylonry POS hardware order request', '',
    'Reference: ' + orderId,
    'Customer: ' + customer.name,
    'Email: ' + customer.email,
    'Mobile: ' + customer.mobile,
    'Delivery address: ' + customer.address,
    '', 'Items:', itemText, '',
    'Estimated total: ' + money(total),
    'Notes: ' + (customer.notes || 'None provided'),
    '', 'Please contact the customer to confirm availability, delivery and payment.'
  ].join('\n');
  const rows = items.map(function(item) {
    return '<tr><td style="padding:10px;border-bottom:1px solid #eee">' + escapeHtml(item.name) + '</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:center">' + item.quantity + '</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:right">' + money(item.total) + '</td></tr>';
  }).join('');
  const html = '<div style="font-family:Arial,sans-serif;background:#f4f4f4;padding:28px"><div style="max-width:700px;margin:auto;background:white;border-radius:14px;overflow:hidden"><div style="padding:24px 28px;background:#171512;color:white"><div style="color:#ff5a00;font-weight:800;letter-spacing:2px">CEYLONRY POS</div><h1 style="margin:8px 0 0">New hardware order</h1><p style="margin:7px 0 0;color:#ccc">Reference ' + orderId + '</p></div><div style="padding:26px 28px;color:#222"><p><strong>Customer:</strong> ' + escapeHtml(customer.name) + '<br><strong>Email:</strong> ' + escapeHtml(customer.email) + '<br><strong>Mobile:</strong> ' + escapeHtml(customer.mobile) + '<br><strong>Delivery address:</strong> ' + escapeHtml(customer.address) + '</p><table style="width:100%;border-collapse:collapse;margin:22px 0"><thead><tr><th style="padding:10px;text-align:left;background:#faf5f1">Item</th><th style="padding:10px;background:#faf5f1">Qty</th><th style="padding:10px;text-align:right;background:#faf5f1">Total</th></tr></thead><tbody>' + rows + '</tbody></table><p style="font-size:20px;text-align:right"><strong>Estimated total: ' + money(total) + '</strong></p><p><strong>Notes:</strong><br>' + escapeHtml(customer.notes || 'None provided') + '</p></div></div></div>';

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return response(500, { ok: false, error: 'Online ordering is temporarily unavailable. Please email hello@ceylonrylabs.io.' });
  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE !== 'false' : port === 465,
    auth: { user, pass }
  });
  try {
    await transporter.sendMail({
      from: '"Ceylonry POS Hardware" <' + (process.env.SMTP_FROM || user) + '>',
      to: 'hello@ceylonrylabs.io',
      replyTo: customer.email,
      subject: 'Hardware order ' + orderId + ' — ' + customer.name,
      text,
      html
    });
    return response(200, { ok: true, sent: true, orderId });
  } catch (error) {
    console.error('Hardware order email failed:', error);
    return response(502, { ok: false, error: 'We could not send the order. Please try again or email hello@ceylonrylabs.io.' });
  }
};
