'use strict';

// "Closed shop" alert: when a new Shopify order arrives and no POS has looked for orders for a few minutes, the business owner is e-mailed.
// Needs SMTP_USER and SMTP_PASS (the same settings the other e-mails use); without them nothing is sent. Never throws: an e-mail problem
// must not make Shopify think the order was not received.
const nodemailer = require('nodemailer');

const QUIET_MS = 3 * 60 * 1000;

/** No POS has asked for orders for a few minutes (or ever). */
const posAway = (lastPollAt, now) => !lastPollAt || (now || Date.now()) - Date.parse(lastPollAt) > QUIET_MS;

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function sendNewOrderEmail(to, shop, order) {
  const user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  if (!to || !user || !pass) return false;
  try {
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.hostinger.com', port: Number(process.env.SMTP_PORT || 465), secure: true, auth: { user, pass } });
    const lines = (order.lines || []).map((l) => esc(l.qty + ' x ' + l.title)).join('<br>');
    await transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to: to,
      subject: 'New online order ' + (order.name || '') + ' from ' + shop,
      html: '<p>A new order arrived from <b>' + esc(shop) + '</b> while no POS was open.</p><p><b>' + esc(order.name) + '</b> · ' + esc(order.currency) + ' ' + esc(order.total) + '</p><p>' + lines + '</p>' +
        '<p>' + esc(order.customer && order.customer.name) + ' ' + esc(order.customer && order.customer.phone) + '<br>' + esc(order.delivery && order.delivery.address) + '</p>' +
        '<p>Open the POS to see it under Online Orders.</p>'
    });
    return true;
  } catch (error) {
    console.error('shopify order e-mail failed', error && error.message);
    return false;
  }
}

module.exports = { QUIET_MS, posAway, sendNewOrderEmail };
