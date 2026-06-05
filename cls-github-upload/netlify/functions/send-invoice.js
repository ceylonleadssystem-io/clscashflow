const nodemailer = require('nodemailer');

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}
function money(n) {
  return Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  let d;
  try { d = JSON.parse(event.body || '{}'); }
  catch (e) { return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid request body' }) }; }

  const to = (d.to || '').trim();
  if (!to) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'No client email on this invoice.' }) };

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Email not configured. Set SMTP_USER and SMTP_PASS in Netlify.' }) };
  }
  // Send "from" the noreply alias; authenticate with the real mailbox (SMTP_USER).
  const fromAddr = process.env.SMTP_FROM || 'noreply@ceylonrylabs.io';

  const accent   = /^#[0-9a-fA-F]{6}$/.test(d.accent || '') ? d.accent : '#B8922A';
  const biz      = esc(d.bizName || 'Your Business');
  const cur      = esc(d.cur || 'LKR');
  const invNum   = esc(d.invNum || '');
  const lines    = Array.isArray(d.lines) ? d.lines : [];
  const vatRate  = d.vatRate || 0;

  const rows = lines.map(function (l) {
    return '<tr>'
      + '<td style="padding:10px 12px;border-bottom:1px solid #f0eee9;font-size:14px;color:#15110d;font-weight:600">' + esc(l.desc || '') + '</td>'
      + '<td style="padding:10px 12px;border-bottom:1px solid #f0eee9;font-size:14px;color:#3d3a34;text-align:right">' + esc(l.qty || 1) + '</td>'
      + '<td style="padding:10px 12px;border-bottom:1px solid #f0eee9;font-size:14px;color:#3d3a34;text-align:right">' + cur + ' ' + money(l.price) + '</td>'
      + '<td style="padding:10px 12px;border-bottom:1px solid #f0eee9;font-size:14px;color:#15110d;font-weight:600;text-align:right">' + cur + ' ' + money(l.total != null ? l.total : 0) + '</td>'
      + '</tr>';
  }).join('');

  const sub = d.sub != null ? d.sub : 0;
  const disc = d.disc || 0;
  const discAmt = disc > 0 ? (sub - sub * (1 - disc / 100)) : 0;

  function totalRow(label, value) {
    return '<tr><td style="padding:6px 0;font-size:14px;color:#6f685e">' + label + '</td>'
      + '<td style="padding:6px 0;font-size:14px;color:#15110d;text-align:right">' + value + '</td></tr>';
  }
  let totalsInner = totalRow('Subtotal', cur + ' ' + money(sub));
  if (disc > 0) totalsInner += totalRow('Discount (' + disc + '%)', '- ' + cur + ' ' + money(discAmt));
  if (d.vat > 0) totalsInner += totalRow('VAT (' + vatRate + '%)', cur + ' ' + money(d.vat));

  const html =
  '<div style="font-family:Arial,Helvetica,sans-serif;background:#f5f3ee;padding:24px 0">'
  + '<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #ececec">'
  // header band
  + '<div style="background:' + accent + ';padding:28px 32px;color:#ffffff">'
  +   '<table width="100%" cellpadding="0" cellspacing="0"><tr>'
  +     '<td style="vertical-align:top"><div style="font-size:22px;font-weight:700">' + biz + '</div>'
  +       (d.bizAddr ? '<div style="font-size:12px;opacity:.8;margin-top:4px">' + esc(d.bizAddr) + '</div>' : '')
  +       (d.bizEmail ? '<div style="font-size:12px;opacity:.8">' + esc(d.bizEmail) + '</div>' : '')
  +     '</td>'
  +     '<td style="vertical-align:top;text-align:right"><div style="font-size:26px;font-weight:700;letter-spacing:3px">INVOICE</div>'
  +       '<div style="font-size:13px;opacity:.9;margin-top:4px">' + invNum + '</div></td>'
  +   '</tr></table>'
  + '</div>'
  // intro / reminder
  + '<div style="padding:28px 32px 8px">'
  +   '<p style="font-size:15px;color:#15110d;margin:0 0 14px">Dear ' + esc(d.clientName || 'Customer') + ',</p>'
  +   '<p style="font-size:14px;color:#4a463f;line-height:1.7;margin:0 0 6px">Please find your invoice from <strong>' + biz + '</strong> below. '
  +   'Kindly arrange payment by the due date shown. If you have already paid, please disregard this reminder.</p>'
  + '</div>'
  // meta
  + '<div style="padding:8px 32px 0"><table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#6f685e">'
  +   '<tr><td style="padding:3px 0">Invoice Date: <strong style="color:#15110d">' + esc(d.date || '') + '</strong></td>'
  +       '<td style="padding:3px 0;text-align:right">Due Date: <strong style="color:#15110d">' + esc(d.due || '') + '</strong></td></tr>'
  +   '<tr><td style="padding:3px 0">Terms: <strong style="color:#15110d">' + esc(d.terms || 'Net 30') + '</strong></td><td></td></tr>'
  + '</table></div>'
  // line items
  + '<div style="padding:18px 32px 0"><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">'
  +   '<thead><tr style="background:' + accent + ';color:#ffffff">'
  +     '<th style="padding:10px 12px;text-align:left;font-size:11px;letter-spacing:1px">DESCRIPTION</th>'
  +     '<th style="padding:10px 12px;text-align:right;font-size:11px;letter-spacing:1px">QTY</th>'
  +     '<th style="padding:10px 12px;text-align:right;font-size:11px;letter-spacing:1px">UNIT PRICE</th>'
  +     '<th style="padding:10px 12px;text-align:right;font-size:11px;letter-spacing:1px">AMOUNT</th>'
  +   '</tr></thead><tbody>' + rows + '</tbody></table></div>'
  // totals
  + '<div style="padding:14px 32px 0"><table width="100%" cellpadding="0" cellspacing="0"><tr><td></td>'
  +   '<td style="width:280px"><table width="100%" cellpadding="0" cellspacing="0">' + totalsInner + '</table>'
  +     '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;background:' + accent + '"><tr>'
  +       '<td style="padding:14px 16px;color:#ffffff;font-size:12px;letter-spacing:1px">TOTAL DUE</td>'
  +       '<td style="padding:14px 16px;color:#ffffff;font-size:18px;font-weight:700;text-align:right">' + cur + ' ' + money(d.amount) + '</td>'
  +     '</tr></table>'
  +   '</td></tr></table></div>'
  // notes + footer
  + '<div style="padding:22px 32px 8px"><div style="font-size:11px;letter-spacing:1px;color:' + accent + ';font-weight:700;margin-bottom:6px">NOTES</div>'
  +   '<div style="font-size:13px;color:#6f685e;line-height:1.6">' + esc(d.notes || 'Thank you for your business.') + '</div></div>'
  + '<div style="padding:18px 32px 26px;border-top:1px solid #f3f1ec;margin-top:14px;text-align:center;font-size:12px;color:#b3ada3">'
  +   'Invoice generated by Cashflow System - <strong style="color:' + accent + '">CeylonryLabs.io</strong></div>'
  + '</div></div>';

  const textBody =
    'Dear ' + (d.clientName || 'Customer') + ',\n\n'
    + 'Please find your invoice from ' + (d.bizName || 'Your Business') + '.\n\n'
    + 'Invoice: ' + (d.invNum || '') + '\n'
    + 'Date: ' + (d.date || '') + '\n'
    + 'Due: ' + (d.due || '') + '\n'
    + 'Amount Due: ' + (d.cur || 'LKR') + ' ' + money(d.amount) + '\n\n'
    + (d.notes || 'Thank you for your business.') + '\n\n'
    + 'Invoice generated by Cashflow System - CeylonryLabs.io';

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user: user, pass: pass }
  });

  try {
    await transporter.sendMail({
      from: '"' + (d.bizName || 'CeylonryLabs.io') + '" <' + fromAddr + '>',
      to: to,
      replyTo: d.bizEmail || fromAddr,
      subject: 'Invoice ' + (d.invNum || '') + ' from ' + (d.bizName || 'Your Business') + ' — ' + (d.cur || 'LKR') + ' ' + money(d.amount),
      text: textBody,
      html: html
    });
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Email server rejected the message: ' + (err && err.message ? err.message : 'unknown error') }) };
  }
};
