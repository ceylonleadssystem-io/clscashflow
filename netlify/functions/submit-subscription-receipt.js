const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { appwriteAdmin, getUserFromEvent, getDocument } = require('../lib/appwrite');
const log = require('../lib/log').createLogger('submit-subscription-receipt');

const MAX_FILE_BYTES = 3000000;
const PLANS = {
  solo: { name: 'Solo', monthly: 3500, annual: 36000 },
  studio: { name: 'Studio', monthly: 5500, annual: 60000 },
  business: { name: 'Business', monthly: 8500, annual: 94800 },
  pos: { name: 'POS', monthly: 3500, annual: 42000 }
};
const PLAN_ALIASES = { starter: 'studio', growth: 'business', premium: 'business' };

function clean(value, max) { return String(value == null ? '' : value).trim().slice(0, max || 500); }
function esc(value) { return clean(value, 2000).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function json(statusCode, body) { return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) }; }
function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 320; }
function validPeriod(value) { return /^\d{4}-(?:0[1-9]|1[0-2]|annual)$/.test(value); }

function decodedFile(value, mimeType) {
  const base64 = clean(value, 4100000).replace(/\s/g, '');
  if (!base64 || base64.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) return null;
  const file = Buffer.from(base64, 'base64');
  if (!file.length || file.length > MAX_FILE_BYTES || file.toString('base64') !== base64) return null;
  const magic = {
    'application/pdf': file.subarray(0, 5).toString() === '%PDF-',
    'image/png': file.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
    'image/jpeg': file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff,
    'image/webp': file.subarray(0, 4).toString() === 'RIFF' && file.subarray(8, 12).toString() === 'WEBP'
  };
  return magic[mimeType] ? { base64, file } : null;
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  let user;
  try { user = await getUserFromEvent(event); } catch (e) { log.warn('receipt denied', { status: 401, reason: 'auth-check-failed' }); return json(401, { ok: false, error: 'Please sign in again.' }); }
  if (!user) log.warn('receipt denied', { status: 401, reason: 'not-signed-in' });
  if (!user) return json(401, { ok: false, error: 'Please sign in again.' });

  let data;
  try { data = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { ok: false, error: 'Invalid request body' }); }
  const mimeType = clean(data.mimeType, 100).toLowerCase();
  const upload = decodedFile(data.fileBase64, mimeType);
  const fileName = clean(data.fileName, 180);
  // Magic-byte and size checks run before anything is emailed so the attachment cannot be spoofed by mimeType alone.
  if (!upload || !fileName) log.warn('receipt rejected', { status: 400, reason: 'invalid-file', uid: user.id });
  if (!upload || !fileName) return json(400, { ok: false, error: 'A valid PDF or image payment slip smaller than 3 MB is required.' });

  const cycle = clean(data.billingCycle, 20) === 'annual' ? 'annual' : 'monthly';
  const rawPlan = clean(data.planKey, 30).toLowerCase();
  const planKey = PLAN_ALIASES[rawPlan] || rawPlan;
  const plan = PLANS[planKey];
  const period = clean(data.period, 20);
  if (!plan || !validPeriod(period)) log.warn('receipt rejected', { status: 400, reason: 'invalid-plan-or-period', uid: user.id });
  if (!plan || !validPeriod(period)) return json(400, { ok: false, error: 'Invalid subscription plan or billing period.' });

  let profile = null;
  try { profile = await getDocument('users', user.id); } catch (e) { log.error('billing profile lookup failed', e, { uid: user.id }); return json(503, { ok: false, error: 'Could not verify the billing account.' }); }
  const profileData = profile && profile.data || {};
  const ownerUid = clean(profileData.ownerUid || user.id, 160);
  const email = clean(user.email || profileData.email, 320).toLowerCase();
  if (!ownerUid || !validEmail(email)) log.warn('receipt rejected', { status: 400, reason: 'missing-billing-email', uid: user.id });
  if (!ownerUid || !validEmail(email)) return json(400, { ok: false, error: 'Your account needs a valid billing email.' });

  const amountLkr = cycle === 'annual' ? plan.annual : plan.monthly;
  const name = clean(profileData.name || (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)), 160) || 'Customer';
  const businessName = clean(profileData.bizName || profileData.invoiceBiz || profileData.businessName, 180);
  const safeFileName = fileName.replace(/[^A-Za-z0-9._-]/g, '-');
  const contentHash = crypto.createHash('sha256').update(upload.file).digest('hex');
  const receiptId = ownerUid + '-' + period;
  const admin = appwriteAdmin();
  const receiptRef = admin.firestore().collection('subscriptionPayments').doc(receiptId);
  try {
    const prior = await receiptRef.get();
    const priorData = prior && prior.exists ? prior.data() || {} : {};
    // Same slip re-submitted for the same period: answer success without emailing accounts again.
    if (priorData.emailSent && priorData.contentHash === contentHash) log.info('duplicate receipt ignored', { receiptId });
    if (priorData.emailSent && priorData.contentHash === contentHash) return json(200, { ok: true, sent: true, adminStored: true, duplicate: true });
  } catch (e) { log.error('prior receipt lookup failed', e, { receiptId }); return json(503, { ok: false, error: 'Could not safely register the payment slip. Please retry.' }); }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) log.error('SMTP is not configured', null, { receiptId });
  if (!smtpUser || !smtpPass) return json(500, { ok: false, error: 'Email is not configured. Set SMTP_USER and SMTP_PASS in Netlify.' });
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.hostinger.com', port: Number(process.env.SMTP_PORT || 465), secure: true, auth: { user: smtpUser, pass: smtpPass } });
  const amount = 'LKR ' + amountLkr.toLocaleString('en-US');
  try {
    await transporter.sendMail({
      from: '"Cashflow Billing" <' + (process.env.SMTP_FROM || smtpUser) + '>', to: 'accounts@ceylonrylabs.io', replyTo: email,
      subject: 'Subscription bank slip · ' + plan.name + ' · ' + (businessName || name),
      text: [cycle.charAt(0).toUpperCase()+cycle.slice(1)+' subscription payment slip received','Name: '+name,'Email: '+email,'Business: '+businessName,'Plan: '+plan.name,'Billing cycle: '+cycle,'Amount: '+amount,'Period: '+period].join('\n'),
      html: '<div style="font-family:Arial,sans-serif"><h2>'+esc(cycle.charAt(0).toUpperCase()+cycle.slice(1))+' subscription payment slip</h2><p><b>Name:</b> '+esc(name)+'</p><p><b>Email:</b> '+esc(email)+'</p><p><b>Business:</b> '+esc(businessName)+'</p><p><b>Plan:</b> '+esc(plan.name)+'</p><p><b>Billing cycle:</b> '+esc(cycle)+'</p><p><b>Amount:</b> '+esc(amount)+'</p><p><b>Period:</b> '+esc(period)+'</p></div>',
      attachments: [{ filename: safeFileName, content: upload.base64, encoding: 'base64', contentType: mimeType }]
    });
    const stamp = admin.firestore.FieldValue.serverTimestamp();
    await receiptRef.set({ uid: ownerUid, submittedByUid: user.id, email, name, businessName, plan: planKey, billingCycle: cycle, amountLkr, currency: 'LKR', period, status: 'receipt-submitted', source: 'bank-receipt-email', receiptName: safeFileName, receiptType: mimeType, receiptSize: upload.file.length, contentHash, emailRecipient: 'accounts@ceylonrylabs.io', emailSent: true, receivedAt: stamp, receivedAtUtc: new Date().toISOString() }, { merge: true });
    log.info('receipt emailed and stored', { receiptId, plan: planKey, cycle, bytes: upload.file.length });
    return json(200, { ok: true, sent: true, adminStored: true });
  } catch (error) {
    log.error('receipt email/store failed', error, { receiptId });
    return json(502, { ok: false, error: 'Could not process the payment slip. Please retry.' });
  }
};

exports._test = { decodedFile, validPeriod };
