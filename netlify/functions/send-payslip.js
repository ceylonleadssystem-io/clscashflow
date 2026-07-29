const nodemailer = require('nodemailer');

function clean(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max || 500);
}

function esc(value) {
  return clean(value, 2000).replace(/[&<>"]/g, function (char) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char];
  });
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  let data;
  try { data = JSON.parse(event.body || '{}'); }
  catch (error) { return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid request body' }) }; }

  const to = clean(data.to, 320);
  const employeeName = clean(data.employeeName, 160);
  const businessName = clean(data.businessName, 160) || 'Your Employer';
  const month = clean(data.month, 20);
  const pdfBase64 = clean(data.pdfBase64, 2500000);
  if (!to || !employeeName || !month || !pdfBase64) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Email, employee, month, and payslip PDF are required.' }) };
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(pdfBase64) || Buffer.byteLength(pdfBase64, 'base64') > 1500000) {
    return { statusCode: 413, body: JSON.stringify({ ok: false, error: 'The payslip attachment is invalid or too large.' }) };
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Email is not configured. Set SMTP_USER and SMTP_PASS in Netlify.' }) };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user, pass }
  });
  const fromAddress = process.env.SMTP_FROM || user;
  const netSalary = clean(data.netSalary, 80);
  const html = '<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;border:1px solid #e2ddd4">'
    + '<div style="background:#1c1814;color:#fff;padding:24px 28px"><div style="font-size:20px;font-weight:bold">' + esc(businessName) + '</div><div style="color:#d4a840;margin-top:5px">PAYSLIP · ' + esc(month) + '</div></div>'
    + '<div style="padding:28px"><p>Hello ' + esc(employeeName) + ',</p><p>Your payslip for <strong>' + esc(month) + '</strong> is attached as a PDF.</p>'
    + (netSalary ? '<p style="background:#f7f5f0;padding:14px;border-left:3px solid #b8922a">Net salary: <strong>' + esc(netSalary) + '</strong></p>' : '')
    + '<p>If any information needs correction, please contact your payroll administrator.</p></div></div>';

  try {
    await transporter.sendMail({
      from: '"' + businessName.replace(/"/g, '') + '" <' + fromAddress + '>',
      to,
      replyTo: clean(data.replyTo, 320) || fromAddress,
      subject: 'Payslip ' + month + ' - ' + businessName,
      text: 'Hello ' + employeeName + ',\n\nYour payslip for ' + month + ' is attached as a PDF.\n\n' + businessName,
      html,
      attachments: [{
        filename: 'Payslip-' + month.replace(/[^0-9A-Za-z_-]/g, '-') + '-' + employeeName.replace(/[^0-9A-Za-z_-]/g, '-') + '.pdf',
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf'
      }]
    });
    return { statusCode: 200, body: JSON.stringify({ ok: true, sent: true }) };
  } catch (error) {
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Email server rejected the payslip: ' + clean(error && error.message, 300) }) };
  }
};
