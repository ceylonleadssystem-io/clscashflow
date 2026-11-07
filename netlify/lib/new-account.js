'use strict';

// A new POS account created by an administrator (admin portal, Account management, "New POS account"): validation of the form and the
// documents the account starts with. The profile matches what the self-service sign-up (pos-onboarding.html) writes; the workspace is the
// empty POS with an owner user, with the business type already chosen and locked (the business can no longer change it).

const TRIAL_DAYS = 15; // the same length pos-onboarding.html gives a self-service trial
const BUSINESS_TYPES = ['restaurant', 'cafe', 'retail', 'hardware', 'grocery', 'salon', 'pharmacy', 'services', 'automobile', 'ogf', 'other'];
const EMAIL = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;
const DAY = 86400000;

const text = (value, max) => String(value == null ? '' : value).trim().slice(0, max);

// 12 characters from an alphabet without look-alikes (no 0/O, 1/l/I); `random` is injectable for tests
function generatePassword(random) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const pick = random || function(n) { return require('crypto').randomInt(n); };
  let out = '';
  for (let i = 0; i < 12; i++) out += alphabet[pick(alphabet.length)];
  return out;
}

/**
 * Checks the form. Returns { error } or the cleaned values. A blank password is replaced by a generated one (`generated: true`) that the
 * administrator is shown once.
 */
function cleanNewAccount(body, random) {
  body = body || {};
  const name = text(body.name, 50);
  const business = text(body.business, 80);
  const email = text(body.email, 254).toLowerCase();
  const mobile = text(body.mobile, 20);
  const businessType = text(body.businessType, 20);
  let password = String(body.password == null ? '' : body.password);
  if (name.length < 2) return { error: 'Enter the owner\'s name (at least 2 characters).' };
  if (business.length < 2) return { error: 'Enter the business name (at least 2 characters).' };
  if (!EMAIL.test(email) || /\.\./.test(email)) return { error: 'Enter a valid e-mail address, for example name@example.com.' };
  if (mobile && !/^[0-9+\-() ]{7,20}$/.test(mobile)) return { error: 'The mobile number can only contain digits, spaces, + - and brackets.' };
  if (BUSINESS_TYPES.indexOf(businessType) < 0) return { error: 'Choose a business type.' };
  let generated = false;
  if (!password) { password = generatePassword(random); generated = true; }
  else if (password.length < 8 || password.length > 256) return { error: 'The password must have at least 8 characters.' };
  return { name, business, email, mobile, businessType, password, generated };
}

/** The profile (users collection) and the empty POS workspace of a new account. */
function buildNewAccount(values, uid, adminEmail, now) {
  now = now || new Date();
  const iso = now.toISOString();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * DAY).toISOString();
  const profile = {
    name: values.name, email: values.email, bizName: values.business, posBusinessName: values.business, posMobile: values.mobile,
    role: 'owner', customerType: 'customer',
    posEnabled: true, posPlan: 'pos', posPlanName: 'Ceylonry POS', posMonthlyPrice: 3500, posAnnualPrice: 42000, posIncludedUsers: 5, posAdditionalUserPrice: 500,
    posTrialStart: iso, posTrialEnd: trialEnd, posPaid: false, posSubscriptionStatus: 'trial', posPaymentReminderStatus: 'scheduled',
    posOnboardingComplete: true,
    product: 'pos', plan: 'pos', currentPlan: 'pos', trialStart: iso, trialEnd, paid: false, subscriptionStatus: 'trial',
    posCreatedBy: adminEmail || '', posCreatedByAdminAt: iso, createdAt: iso, updatedAt: iso
  };
  const workspace = {
    accountUid: uid,
    products: [], modifiers: [], customers: [], sales: [],
    users: [{ id: 'u-owner', name: values.name, role: 'owner', pin: '1234', active: true, createdAt: iso }],
    timeEntries: [], cashShifts: [], supportAudit: [], categories: [], inventory: [], stockMovements: [], voidOrders: [], openOrders: [], customerCommunications: [],
    // the owner finishes the rest of the setup on the first sign-in; the business type is already set and cannot be changed by the business
    settings: { business: values.business, email: values.email, address: '', feedbackLink: '', feedbackDelay: 2, businessType: values.businessType, businessTypeLocked: true, onboardingComplete: false }
  };
  return { profile, workspace };
}

module.exports = { TRIAL_DAYS, BUSINESS_TYPES, cleanNewAccount, buildNewAccount, generatePassword };
