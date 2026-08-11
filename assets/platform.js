(function() {
  var VALID_PLANS = { solo: true, studio: true, business: true };
  var PLAN_FILES = { solo: 'solo.html', studio: 'starter.html', business: 'growth.html' };
  var PLAN_ALIASES = { starter: 'studio', growth: 'business', premium: 'business' };
  var PLAN_DETAILS = {
    solo: {
      name: 'Solo',
      userLimit: 1,
      userLabel: '1 user only',
      monthlyPrice: 3500,
      price: 36000,
      file: 'solo.html',
      monthlyPayLink: '', annualPayLink: ''
    },
    studio: {
      name: 'Studio',
      userLimit: 5,
      userLabel: 'Up to 5 users',
      monthlyPrice: 5500,
      price: 60000,
      file: 'starter.html',
      monthlyPayLink: '', annualPayLink: ''
    },
    business: {
      name: 'Business',
      userLimit: Infinity,
      userLabel: 'Unlimited users',
      monthlyPrice: 8500,
      price: 94800,
      file: 'growth.html',
      monthlyPayLink: '', annualPayLink: ''
    }
  };
  var PLAN_RANK = { solo: 1, studio: 2, business: 3 };
  var BILLING_ID = 'cls-billing-widget';
  var CLS_BANK = {accountName:'Ceylonry Life Care',bank:'Commercial Bank',accountNumber:'1001069904',branch:'City Office',email:'accounts@ceylonrylabs.io'};
  var SUPPORT_ID = 'cls-support-widget';
  var DANGER_ID = 'cls-danger-zone-widget';
  var DEFAULT_INVOICE_FOOTER = 'Invoice by Cashflow System - Ceylonry Labs.io';
  var scriptLoads = {};

  function nowIso() {
    return new Date().toISOString();
  }

  function afterFirstPaint(fn, delay) {
    var run = function() {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(fn, { timeout: delay || 3000 });
      } else {
        setTimeout(fn, delay || 3000);
      }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
    else setTimeout(run, 0);
  }

  function loadScriptOnce(src, id) {
    id = id || src;
    if (scriptLoads[id]) return scriptLoads[id];
    if (document.getElementById(id)) {
      scriptLoads[id] = Promise.resolve();
      return scriptLoads[id];
    }
    scriptLoads[id] = new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.onload = function() { resolve(); };
      script.onerror = function() { reject(new Error('Could not load ' + src)); };
      document.head.appendChild(script);
    });
    return scriptLoads[id];
  }

  window.clsLoadScriptOnce = window.clsLoadScriptOnce || loadScriptOnce;
  window.clsLoadChart = window.clsLoadChart || function() {
    if (window.Chart) return Promise.resolve(window.Chart);
    return loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js', 'cls-chartjs').then(function() {
      return window.Chart;
    });
  };
  window.clsRunWhenIdle = window.clsRunWhenIdle || afterFirstPaint;

  function safeGet(key) {
    try { return localStorage.getItem(key) || ''; } catch (e) { return ''; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  function normalizePlan(plan) {
    plan = String(plan || '').toLowerCase();
    plan = PLAN_ALIASES[plan] || plan;
    return VALID_PLANS[plan] ? plan : '';
  }

  function planRank(plan) {
    return PLAN_RANK[normalizePlan(plan)] || 0;
  }

  function rememberedPlan() {
    return normalizePlan(safeGet('cls-current-plan')) || normalizePlan(safeGet('cls-last-plan'));
  }

  function planFromPath() {
    var path = (location.pathname || '').toLowerCase();
    if (path.indexOf('solo') !== -1) return 'solo';
    if (path.indexOf('growth') !== -1) return 'business';
    if (path.indexOf('premium') !== -1) return 'business';
    if (path.indexOf('starter') !== -1) return 'studio';
    return '';
  }

  function isPortalPath() {
    return !!planFromPath();
  }

  function isLandingPath(path) {
    path = String(path || location.pathname || '').toLowerCase();
    return path === '/' || path === '' || path.endsWith('/index.html');
  }

  function pageKind() {
    var plan = planFromPath();
    if (plan) return plan + '-portal';
    if (/signin/i.test(location.pathname || '')) return 'signin';
    if (/onboarding/i.test(location.pathname || '')) return 'onboarding';
    if (/ceylonry-admin/i.test(location.pathname || '')) return 'admin';
    if (isLandingPath(location.pathname)) return 'landing';
    return 'website';
  }

  window.clsEnsureUserProfile = window.clsEnsureUserProfile || async function(user, db, opts) {
    opts = opts || {};
    if (!user || !user.uid || !db || typeof db.collection !== 'function') return null;
    var ref = db.collection('users').doc(user.uid);
    var snap = await ref.get();
    if (snap && snap.exists) return snap;

    var plan = normalizePlan(opts.plan || rememberedPlan() || 'solo') || 'solo';
    var trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 15);
    var email = plainText(user.email || '', 240);
    var fallbackName = email ? email.split('@')[0] : 'User';
    var name = plainText(user.displayName || fallbackName, 180);
    var stamp = window.firebase && firebase.firestore && firebase.firestore.FieldValue
      ? firebase.firestore.FieldValue.serverTimestamp()
      : new Date().toISOString();
    await ref.set({
      name: name,
      email: email,
      role: 'owner',
      plan: plan,
      currentPlan: plan,
      lastPlan: plan,
      planPrice: (PLAN_DETAILS[plan] && PLAN_DETAILS[plan].price) || 36000,
      planMonthlyPrice: (PLAN_DETAILS[plan] && PLAN_DETAILS[plan].monthlyPrice) || 3500,
      billingCycle: 'monthly',
      trialStart: new Date().toISOString(),
      trialEnd: trialEnd.toISOString(),
      paid: false,
      onboardingComplete: false,
      recoveredProfile: true,
      createdAt: stamp,
      updatedAt: stamp
    }, { merge: true });
    return ref.get();
  };

  function newId(prefix) {
    var randomPart = '';
    try {
      if (window.crypto && crypto.randomUUID) randomPart = crypto.randomUUID();
    } catch (e) {}
    if (!randomPart) {
      randomPart = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
    }
    return (prefix || 'id') + '-' + randomPart;
  }

  function persistentId(key, prefix) {
    var id = safeGet(key);
    if (!id) {
      id = newId(prefix);
      safeSet(key, id);
    }
    return id;
  }

  function getFirestore(db) {
    if (db) return db;
    try {
      if (window.firebase && firebase.apps && firebase.apps.length && firebase.firestore) {
        return firebase.firestore();
      }
    } catch (e) {}
    return null;
  }

  function getAuthUser() {
    try {
      if (window.firebase && firebase.apps && firebase.apps.length && firebase.auth) {
        return firebase.auth().currentUser;
      }
    } catch (e) {}
    return null;
  }

  var pendingSigninRedirect = null;

  window.clsRedirectToSignInAfterAuthCheck = function clsRedirectToSignInAfterAuthCheck(delayMs) {
    if (pendingSigninRedirect) return pendingSigninRedirect;
    pendingSigninRedirect = new Promise(function(resolve) {
      setTimeout(async function() {
        var user = getAuthUser();
        if (!user) {
          try {
            var auth = window.firebase && firebase.auth ? firebase.auth() : null;
            if (auth && typeof auth.waitForCurrentUser === 'function') {
              user = await auth.waitForCurrentUser(1200);
            }
          } catch (e) {}
        }
        pendingSigninRedirect = null;
        if (!user) window.location.href = 'signin.html';
        resolve(user || null);
      }, delayMs || 250);
    });
    return pendingSigninRedirect;
  };

  window.clsPlanFiles = PLAN_FILES;
  window.clsPlanDetails = PLAN_DETAILS;

  function isProfilePaidRecord(profile) {
    profile = profile || {};
    var status = String(profile.subscriptionStatus || '').toLowerCase();
    var due = dateMs(profile.nextPaymentDue || profile.subscriptionCurrentPeriodEnd);
    if (due && Date.now() > due + 86400000) return false;
    return profile.paid === true || status === 'active' || status === 'manual-paid';
  }

  function paidLockedPlan(profile) {
    if (!isProfilePaidRecord(profile)) return '';
    return normalizePlan(profile.lockedPlan)
      || normalizePlan(profile.currentPlan)
      || normalizePlan(profile.plan)
      || normalizePlan(profile.lastPlan)
      || '';
  }

  window.clsRememberPlan = async function clsRememberPlan(plan, uid, db) {
    plan = normalizePlan(plan);
    if (!plan) return plan;
    var user = getAuthUser();
    uid = uid || (user && user.uid);
    safeSet('cls-last-plan', plan);
    safeSet('cls-current-plan', plan);
    safeSet('cls-last-plan-at', nowIso());
    if (uid) safeSet('cls-plan-uid', uid);

    db = getFirestore(db);
    if (!uid || !db) return plan;

    try {
      var existingSnap = await db.collection('users').doc(uid).get();
      var existingProfile = existingSnap && existingSnap.exists ? (existingSnap.data() || {}) : {};
      var lockedPlan = paidLockedPlan(existingProfile);
      if (lockedPlan && lockedPlan !== plan) {
        safeSet('cls-last-plan', lockedPlan);
        safeSet('cls-current-plan', lockedPlan);
        return lockedPlan;
      }
    } catch (e) {
      console.warn('Paid plan lock check skipped:', e);
    }

    var update = {
      currentPlan: plan,
      lastPlan: plan,
      lastSeenPath: location.pathname,
      lastSeenUrl: location.href,
      lastSeenUtc: nowIso()
    };
    try {
      if (window.firebase && firebase.firestore && firebase.firestore.FieldValue) {
        update.lastSeenAt = firebase.firestore.FieldValue.serverTimestamp();
      }
      await db.collection('users').doc(uid).set(update, { merge: true });
    } catch (e) {
      console.warn('Plan memory update skipped:', e);
    }
    return plan;
  };

  function profilePlan(profile) {
    profile = profile || {};
    return normalizePlan(profile.currentPlan)
      || normalizePlan(profile.plan)
      || normalizePlan(profile.requestedPlan)
      || normalizePlan(profile.lastPlan);
  }

  window.clsPlanForProfile = function clsPlanForProfile(profile) {
    return profilePlan(profile)
      || rememberedPlan()
      || 'solo';
  };

  window.clsPlanFileFor = function clsPlanFileFor(plan) {
    plan = normalizePlan(plan) || 'solo';
    return PLAN_FILES[plan] || PLAN_FILES.solo;
  };

  window.clsRouteForProfile = function clsRouteForProfile(profile) {
    return window.clsPlanFileFor(window.clsPlanForProfile(profile));
  };

  window.clsGuardPlanAccess = async function clsGuardPlanAccess(expectedPlan, profile, opts) {
    opts = opts || {};
    expectedPlan = normalizePlan(expectedPlan) || 'solo';
    var accountPlan = profilePlan(profile);
    var lockedPlan = paidLockedPlan(profile);
    var routePlan = lockedPlan || accountPlan;
    if (routePlan && routePlan !== expectedPlan) {
      safeSet('cls-last-plan', routePlan);
      safeSet('cls-current-plan', routePlan);
      var dest = window.clsPlanFileFor(routePlan);
      var current = (location.pathname || '').split('/').pop() || 'index.html';
      if (current !== dest) window.location.replace(dest);
      return false;
    }

    safeSet('cls-last-plan', expectedPlan);
    safeSet('cls-current-plan', expectedPlan);

    var user = getAuthUser();
    var uid = opts.uid || (user && user.uid);
    var db = getFirestore(opts.db);
    if (uid) safeSet('cls-plan-uid', uid);
    if (!uid || !db) return true;

    var update = {
      lastSeenPath: location.pathname,
      lastSeenUrl: location.href,
      lastSeenUtc: nowIso()
    };
    if (!accountPlan) {
      update.plan = expectedPlan;
      update.currentPlan = expectedPlan;
      update.lastPlan = expectedPlan;
    }
    try {
      if (window.firebase && firebase.firestore && firebase.firestore.FieldValue) {
        update.lastSeenAt = firebase.firestore.FieldValue.serverTimestamp();
      }
      db.collection('users').doc(uid).set(update, { merge: true }).catch(function(e) {
        console.warn('Plan access check update skipped:', e);
      });
    } catch (e) {}
    return true;
  };

  function money(n) {
    return 'LKR ' + Number(n || 0).toLocaleString();
  }

  function planAnnualLine(details) {
    details = details || PLAN_DETAILS.solo;
    return money(details.price) + ' billed yearly';
  }

  function planMonthlyLine(details) {
    details = details || PLAN_DETAILS.solo;
    return 'Monthly package: ' + money(details.monthlyPrice || 0) + '/mo';
  }

  function plainText(value, max) {
    value = String(value == null ? '' : value).trim();
    return max && value.length > max ? value.slice(0, max) : value;
  }

  var INVOICE_TEMPLATES = [
    { name: 'Bold Editorial', accent: '#d8784a', dark: '#171615', paper: '#f8efd8', layout: 'bold-editorial', source: 'files12' },
    { name: 'Cafe Illustrated', accent: '#2546b8', dark: '#1f2b78', paper: '#fffbe8', layout: 'cafe-illustrated', source: 'files12' },
    { name: 'Elegant Wreath', accent: '#b89a68', dark: '#2a2622', paper: '#fbfaf6', layout: 'elegant-wreath', source: 'files12' },
    { name: 'Signature Script', accent: '#b9b0a3', dark: '#27231f', paper: '#fbf8f1', layout: 'signature-script', source: 'files12' },
    { name: 'Monochrome Wave', accent: '#111111', dark: '#111111', paper: '#ffffff', layout: 'monochrome-wave', source: 'files12' },
    { name: 'Corporate Diagonal', accent: '#84b63d', dark: '#24344a', paper: '#ffffff', layout: 'corporate-diagonal', source: 'files12' },
    { name: 'Modern Serif', accent: '#c88c7c', dark: '#2a2420', paper: '#fff2ee', layout: 'modern-serif', source: 'files12' },
    { name: 'Flame Dark Header', accent: '#d7a82d', dark: '#242321', paper: '#ffffff', layout: 'flame-dark-header', source: 'files12' },
    { name: 'Dotted Mono', accent: '#111111', dark: '#111111', paper: '#ffffff', layout: 'dotted-mono', source: 'files12' },
    { name: 'Corporate Charcoal', accent: '#b6aa8d', dark: '#353535', paper: '#ffffff', layout: 'corporate-charcoal', source: 'files12' },
    { name: 'Geometric Blue', accent: '#4777c8', dark: '#28324f', paper: '#ffffff', layout: 'geometric-blue', source: 'files12' },
    { name: 'Furniture Pink', accent: '#f29ad8', dark: '#315de7', paper: '#fff0dc', layout: 'furniture-pink', source: 'files12' },
    { name: 'Minimal Grey', accent: '#bfc0c2', dark: '#44464a', paper: '#ffffff', layout: 'minimal-grey', source: 'files12' }
  ];
  var INVOICE_FONTS = [
    { id: 'classic', name: 'Classic Serif', body: 'Georgia, "Times New Roman", serif', title: 'Georgia, "Times New Roman", serif' },
    { id: 'modern', name: 'Modern Sans', body: 'Arial, Helvetica, sans-serif', title: 'Arial, Helvetica, sans-serif' },
    { id: 'editorial', name: 'Editorial Serif', body: '"Times New Roman", Times, serif', title: 'Georgia, "Times New Roman", serif' },
    { id: 'clean', name: 'Clean Humanist', body: '"Trebuchet MS", Arial, sans-serif', title: '"Trebuchet MS", Arial, sans-serif' },
    { id: 'mono', name: 'Mono Ledger', body: '"Courier New", Courier, monospace', title: '"Courier New", Courier, monospace' }
  ];
  var INVOICE_VIEWS = [
    { id: 'modern', name: 'Modern' },
    { id: 'classic', name: 'Classic' },
    { id: 'olden', name: 'Olden' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'bold', name: 'Bold' }
  ];

  function invoiceTemplate(idx) {
    idx = parseInt(idx, 10);
    if (!Number.isFinite(idx) || idx < 0 || idx >= INVOICE_TEMPLATES.length) idx = 0;
    return INVOICE_TEMPLATES[idx];
  }

  function invoiceFont(id) {
    id = String(id || 'classic').toLowerCase();
    return INVOICE_FONTS.find(function(font) { return font.id === id; }) || INVOICE_FONTS[0];
  }

  function invoiceView(id) {
    id = String(id || 'modern').toLowerCase();
    return INVOICE_VIEWS.find(function(view) { return view.id === id; }) || INVOICE_VIEWS[0];
  }

  function optionsHtml(options, active) {
    active = String(active || '');
    return options.map(function(option) {
      return '<option value="' + invoiceEscape(option.id) + '"' + (option.id === active ? ' selected' : '') + '>' + invoiceEscape(option.name) + '</option>';
    }).join('');
  }

  function sanitizeInvoicePrefix(value) {
    value = String(value || 'INV').trim().toUpperCase();
    value = value.replace(/[^A-Z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return value.slice(0, 14) || 'INV';
  }

  function clampNumber(value, min, max, fallback) {
    value = Number(value);
    if (!Number.isFinite(value)) value = fallback;
    return Math.max(min, Math.min(max, value));
  }

  function invoiceEscape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function invoiceBreaks(value) {
    return invoiceEscape(value).replace(/\n/g, '<br>');
  }

  function invoiceCustomerDetails(inv) {
    inv = inv || {};
    return [inv.caddr ? invoiceBreaks(inv.caddr) : '', inv.cemail ? invoiceEscape(inv.cemail) : '', inv.cphone ? invoiceEscape(inv.cphone) : ''].filter(Boolean).join('<br>');
  }

  function invoiceMoney(cur, value) {
    return String(cur || 'LKR') + ' ' + Number(value || 0).toLocaleString('en', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function humanDate(value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d.getTime())) return invoiceEscape(value);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function invoiceEmailTheme(opts) {
    opts = opts || {};
    var settings = opts.settings || {};
    var idx = opts.templateIndex != null ? opts.templateIndex : (opts.tpl != null ? opts.tpl : settings.defaultTpl);
    return invoiceTemplate(window.clsNormalizeInvoiceTemplate(idx));
  }

  function invoiceEmailBrand(opts, businessName, theme) {
    var settings = normalizeInvoiceSettings((opts && opts.settings) || opts || {});
    if (settings.logo) {
      return '<img src="' + invoiceEscape(settings.logo) + '" alt="' + invoiceEscape(businessName) + '" style="display:block;max-width:170px;max-height:64px;object-fit:contain;margin:0 0 10px;">' +
        '<div style="font-size:16px;font-weight:800;color:#fff;">' + invoiceEscape(businessName) + '</div>';
    }
    return '<div style="font-family:Georgia,serif;font-size:28px;line-height:1.2;color:#fff;">' + invoiceEscape(businessName) + '</div>' +
      '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:' + invoiceEscape(theme.accent) + ';margin-top:6px;">' + invoiceEscape(theme.name) + '</div>';
  }

  function paymentEmailLineRows(lines, cur, invoiceTotal) {
    lines = lines || [];
    if (!lines.length) lines = [{ desc: 'Invoice total', qty: 1, price: invoiceTotal, total: invoiceTotal }];
    return lines.map(function(line) {
      line = line || {};
      var qty = Number(line.qty || 1) || 1;
      var price = Number(line.price || line.unitPrice || 0) || 0;
      var total = line.total != null ? Number(line.total || 0) : qty * price;
      return '<tr><td colspan="4" style="padding:0 0 10px;">' +
        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;border:1px solid #eadfce;background:#fff;table-layout:fixed;">' +
          '<tr><td colspan="3" style="padding:13px 12px 10px;color:#2d2117;font-size:14px;line-height:1.45;font-weight:700;word-break:break-word;">' + invoiceBreaks(line.desc || line.description || 'Invoice item') + '</td></tr>' +
          '<tr style="background:#fbf7f0;">' +
            '<td width="18%" valign="top" style="width:18%;padding:9px 8px;color:#6f6258;font-size:12px;line-height:1.35;"><span style="display:block;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#9a8c80;">Qty</span><strong style="color:#2d2117;">' + invoiceEscape(qty) + '</strong></td>' +
            '<td width="38%" valign="top" align="right" style="width:38%;padding:9px 7px;color:#6f6258;font-size:12px;line-height:1.35;word-break:break-word;"><span style="display:block;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#9a8c80;">Price</span>' + invoiceEscape(invoiceMoney(cur, price)) + '</td>' +
            '<td width="44%" valign="top" align="right" style="width:44%;padding:9px 8px;color:#2d2117;font-size:12px;line-height:1.35;font-weight:800;word-break:break-word;"><span style="display:block;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#9a8c80;">Amount</span>' + invoiceEscape(invoiceMoney(cur, total)) + '</td>' +
          '</tr>' +
        '</table>' +
      '</td></tr>';
    }).join('');
  }

  function paymentEmailHtml(opts, kind) {
    opts = opts || {};
    kind = kind === 'receipt' ? 'receipt' : 'reminder';
    var cur = opts.currency || 'LKR';
    var invoiceNo = opts.invoiceNumber || opts.invoiceNo || opts.num || opts.id || '';
    var businessName = opts.businessName || opts.bizName || 'Your Business';
    var businessEmail = opts.businessEmail || opts.replyTo || '';
    var businessAddress = opts.businessAddress || opts.addr || '';
    var customerName = opts.customerName || opts.clientName || opts.client || 'Customer';
    var invoiceDate = opts.invoiceDate || humanDate(opts.date);
    var dueDate = opts.dueDate || humanDate(opts.due);
    var amountDue = opts.amountDue != null ? Number(opts.amountDue || 0) : Number(opts.invoiceTotal || opts.total || opts.amount || 0);
    var invoiceTotal = opts.invoiceTotal != null ? Number(opts.invoiceTotal || 0) : amountDue;
    var paymentAmount = opts.paymentAmount != null ? Number(opts.paymentAmount || 0) : Number(opts.amountPaid || 0);
    var paidTotal = opts.paidTotal != null ? Number(opts.paidTotal || 0) : Number(opts.totalPaid || opts.paid || paymentAmount || 0);
    var remainingBalance = opts.remainingBalance != null ? Number(opts.remainingBalance || 0) : amountDue;
    var status = opts.status || (amountDue <= 0 ? 'paid' : 'unpaid');
    var notes = opts.notes || 'Thank you for your business.';
    var bankHtml = invoiceBankEmailHtml(opts.settings || opts);
    var lines = opts.lines || opts.items || [];
    var rows = paymentEmailLineRows(lines, cur, invoiceTotal);
    var payLink = opts.payLink || opts.paymentLink || opts.checkoutUrl || '';
    var isReceipt = kind === 'receipt';
    var theme = invoiceEmailTheme(opts);
    var title = isReceipt ? 'Payment received' : 'Invoice payment reminder';
    var eyebrow = isReceipt ? 'Thank you for your payment' : 'Payment overdue';
    var lead = isReceipt
      ? 'Thank you. We have received your payment for invoice <strong>' + invoiceEscape(invoiceNo) + '</strong>.'
      : 'This is a payment reminder for invoice <strong>' + invoiceEscape(invoiceNo) + '</strong>. The current amount outstanding is <strong>' + invoiceEscape(invoiceMoney(cur, amountDue)) + '</strong>.';
    var amountLabel = isReceipt ? 'Amount paid' : 'Amount outstanding';
    var amountValue = isReceipt ? (paymentAmount || paidTotal || invoiceTotal) : amountDue;
    var detailRows = isReceipt
      ? '<tr><td style="padding:12px 14px;color:#6f6258;">Payment date</td><td align="right" style="padding:12px 14px;font-weight:700;">' + invoiceEscape(opts.paymentDate || humanDate(opts.date) || '-') + '</td></tr>' +
        '<tr><td style="padding:12px 14px;color:#6f6258;border-top:1px solid #eadfce;">Payment method</td><td align="right" style="padding:12px 14px;font-weight:700;border-top:1px solid #eadfce;">' + invoiceEscape(opts.paymentMethod || '-') + '</td></tr>' +
        '<tr><td style="padding:12px 14px;color:#6f6258;border-top:1px solid #eadfce;">Remaining balance</td><td align="right" style="padding:12px 14px;font-weight:700;border-top:1px solid #eadfce;">' + invoiceEscape(invoiceMoney(cur, remainingBalance)) + '</td></tr>'
      : '<tr><td style="padding:12px 14px;color:#6f6258;">Invoice date</td><td align="right" style="padding:12px 14px;font-weight:700;">' + invoiceEscape(invoiceDate || '-') + '</td></tr>' +
        '<tr><td style="padding:12px 14px;color:#6f6258;border-top:1px solid #eadfce;">Due date</td><td align="right" style="padding:12px 14px;font-weight:700;border-top:1px solid #eadfce;">' + invoiceEscape(dueDate || '-') + '</td></tr>' +
        '<tr><td style="padding:12px 14px;color:#6f6258;border-top:1px solid #eadfce;">Status</td><td align="right" style="padding:12px 14px;font-weight:700;text-transform:capitalize;border-top:1px solid #eadfce;">' + invoiceEscape(status) + '</td></tr>';
    var ctaHtml = (!isReceipt && payLink) ? '<div style="text-align:center;margin:24px 0 6px;"><a href="' + invoiceEscape(payLink) + '" style="display:inline-block;background:' + invoiceEscape(theme.dark) + ';color:#fff;text-decoration:none;padding:14px 28px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-radius:4px;">Pay now</a></div>' : '';
    var closingNote = isReceipt
      ? (remainingBalance <= 0.01 ? 'This invoice is now fully settled.' : 'A remaining balance is still open on this invoice.')
      : 'If you have already made this payment, please reply with the payment reference so we can update the invoice.';
    return '<div style="width:100%;margin:0;background:' + invoiceEscape(theme.paper) + ';padding:12px;font-family:Arial,Helvetica,sans-serif;color:#2d2117;box-sizing:border-box;">' +
      '<div style="width:100%;max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5d9c8;border-radius:8px;overflow:hidden;box-sizing:border-box;">' +
        '<div style="padding:20px 18px;border-bottom:5px solid ' + invoiceEscape(theme.accent) + ';background:' + invoiceEscape(theme.dark) + ';">' +
          invoiceEmailBrand(opts, businessName, theme) +
        '</div>' +
        '<div style="background:' + invoiceEscape(theme.dark) + ';color:#fff;padding:26px 18px;text-align:center;">' +
          '<div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:' + invoiceEscape(theme.accent) + ';">' + invoiceEscape(eyebrow) + '</div>' +
          '<h1 style="margin:12px 0 8px;font-size:27px;line-height:1.2;word-break:break-word;">' + invoiceEscape(title) + '</h1>' +
          '<div style="font-size:15px;color:#eadfce;">Invoice ' + invoiceEscape(invoiceNo) + '</div>' +
        '</div>' +
        '<div style="padding:22px 16px;">' +
          '<p style="font-size:16px;line-height:1.6;margin:0 0 18px;">Hi ' + invoiceEscape(customerName) + ',</p>' +
          '<p style="font-size:16px;line-height:1.6;margin:0 0 22px;">' + lead + '</p>' +
          '<div style="background:' + invoiceEscape(theme.paper) + ';border:1px solid #eadfce;border-radius:8px;text-align:center;padding:24px 18px;margin:0 0 24px;">' +
            '<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8b7c6f;margin-bottom:8px;">' + invoiceEscape(amountLabel) + '</div>' +
            '<div style="font-size:28px;line-height:1.15;font-weight:800;color:#2d2117;word-break:break-word;">' + invoiceEscape(invoiceMoney(cur, amountValue)) + '</div>' +
          '</div>' +
          ctaHtml +
          '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;background:#f7f2ea;border:1px solid #eadfce;">' + detailRows + '</table>' +
          '<div style="margin:0 0 10px;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#8b7c6f;font-weight:800;">Invoice items</div>' +
          '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;table-layout:fixed;border-collapse:collapse;margin:0 0 18px;">' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
          '<div style="text-align:center;margin-bottom:24px;">' +
            '<div style="display:block;width:100%;box-sizing:border-box;background:' + invoiceEscape(theme.dark) + ';color:#fff;padding:16px 14px;font-size:17px;line-height:1.35;font-weight:700;word-break:break-word;border-bottom:5px solid ' + invoiceEscape(theme.accent) + ';">Invoice total: ' + invoiceEscape(invoiceMoney(cur, invoiceTotal)) + '</div>' +
          '</div>' +
          '<div style="border-left:4px solid ' + invoiceEscape(theme.accent) + ';padding:10px 0 10px 16px;color:#6f6258;line-height:1.6;">' + invoiceBreaks(closingNote + '\n\n' + notes) + '</div>' +
          bankHtml +
          '<p style="font-size:14px;line-height:1.6;margin:24px 0 0;color:#6f6258;">' + invoiceEscape(businessName) + '<br>' + invoiceEscape(businessAddress) + (businessEmail ? '<br>' + invoiceEscape(businessEmail) : '') + '</p>' +
        '</div>' +
        '<div style="padding:16px 18px;border-top:1px solid #eadfce;text-align:center;font-size:12px;color:#8b7c6f;">Invoice by Cashflow System - Ceylonry Labs.io</div>' +
      '</div>' +
    '</div>';
  }

  function paymentReminderEmailHtml(opts) {
    return paymentEmailHtml(opts, 'reminder');
  }

  function paymentReceiptEmailHtml(opts) {
    opts = opts || {};
    var cur = opts.currency || 'LKR';
    var invoiceNo = opts.invoiceNumber || opts.invoiceNo || opts.num || opts.id || '';
    var businessName = opts.businessName || opts.bizName || 'Your Business';
    var businessEmail = opts.businessEmail || opts.replyTo || '';
    var businessAddress = opts.businessAddress || opts.addr || '';
    var customerName = opts.customerName || opts.clientName || opts.client || 'Customer';
    var invoiceTotal = opts.invoiceTotal != null ? Number(opts.invoiceTotal || 0) : Number(opts.total || opts.amount || 0);
    var paymentAmount = opts.paymentAmount != null ? Number(opts.paymentAmount || 0) : Number(opts.amountPaid || opts.paidTotal || invoiceTotal || 0);
    var paidTotal = opts.paidTotal != null ? Number(opts.paidTotal || 0) : Number(opts.totalPaid || opts.paid || paymentAmount || 0);
    var remainingBalance = opts.remainingBalance != null ? Number(opts.remainingBalance || 0) : Math.max(0, invoiceTotal - paidTotal);
    var paymentDate = opts.paymentDate || humanDate(opts.paymentRawDate || opts.date) || humanDate(new Date());
    var paymentMethod = opts.paymentMethod || 'Payment recorded';
    var paymentReference = opts.paymentReference || opts.paymentRef || '';
    var theme = invoiceEmailTheme(opts);
    var bankHtml = invoiceBankEmailHtml(opts.settings || opts);
    var statusLine = remainingBalance <= 0.01
      ? 'This invoice is now fully settled. Thank you for your payment.'
      : 'Thank you for your initial payment. The remaining amount to pay is ' + invoiceMoney(cur, remainingBalance) + '.';
    return '<div style="margin:0;background:' + invoiceEscape(theme.paper) + ';padding:28px;font-family:Arial,Helvetica,sans-serif;color:#2d2117;">' +
      '<div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e5d9c8;border-radius:8px;overflow:hidden;">' +
        '<div style="background:' + invoiceEscape(theme.dark) + ';color:#fff;padding:24px 30px;border-bottom:5px solid ' + invoiceEscape(theme.accent) + ';">' +
          invoiceEmailBrand(opts, businessName, theme) +
        '</div>' +
        '<div style="padding:30px;">' +
          '<div style="background:#f7f2ea;border-left:5px solid #20a366;border-radius:6px;padding:22px;text-align:center;margin-bottom:24px;">' +
            '<div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#20a366;font-weight:800;margin-bottom:8px;">Payment Received</div>' +
            '<div style="font-family:Georgia,serif;font-size:32px;line-height:1.2;color:#2d2117;">Thank you</div>' +
            '<div style="color:#6f6258;margin-top:8px;">Invoice ' + invoiceEscape(invoiceNo) + '</div>' +
          '</div>' +
          '<p style="font-size:16px;line-height:1.6;margin:0 0 18px;">Dear ' + invoiceEscape(customerName) + ',</p>' +
          '<p style="font-size:16px;line-height:1.6;margin:0 0 22px;color:#6f6258;">' + invoiceEscape(statusLine) + '</p>' +
          '<div style="border:1px solid #eadfce;border-radius:8px;padding:24px;text-align:center;margin-bottom:22px;">' +
            '<div style="font-size:13px;color:#8b7c6f;margin-bottom:8px;">Payment amount</div>' +
            '<div style="font-family:Georgia,serif;font-size:34px;font-weight:800;color:#2d2117;">' + invoiceEscape(invoiceMoney(cur, paymentAmount || paidTotal || invoiceTotal)) + '</div>' +
          '</div>' +
          '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:22px;">' +
            '<tr><td style="border-top:1px solid #eadfce;padding:12px 0;color:#8b7c6f;">Invoice</td><td align="right" style="border-top:1px solid #eadfce;padding:12px 0;font-weight:800;">' + invoiceEscape(invoiceNo) + '</td></tr>' +
            '<tr><td style="border-top:1px solid #eadfce;padding:12px 0;color:#8b7c6f;">Payment date</td><td align="right" style="border-top:1px solid #eadfce;padding:12px 0;font-weight:800;">' + invoiceEscape(paymentDate || '-') + '</td></tr>' +
            '<tr><td style="border-top:1px solid #eadfce;padding:12px 0;color:#8b7c6f;">Payment method</td><td align="right" style="border-top:1px solid #eadfce;padding:12px 0;font-weight:800;">' + invoiceEscape(paymentMethod || '-') + '</td></tr>' +
            (paymentReference ? '<tr><td style="border-top:1px solid #eadfce;padding:12px 0;color:#8b7c6f;">Reference</td><td align="right" style="border-top:1px solid #eadfce;padding:12px 0;font-weight:800;">' + invoiceEscape(paymentReference) + '</td></tr>' : '') +
            '<tr><td style="border-top:1px solid #eadfce;padding:12px 0;color:#8b7c6f;">Paid total</td><td align="right" style="border-top:1px solid #eadfce;padding:12px 0;font-weight:800;">' + invoiceEscape(invoiceMoney(cur, paidTotal || paymentAmount || invoiceTotal)) + '</td></tr>' +
            '<tr><td style="border-top:1px solid #eadfce;border-bottom:1px solid #eadfce;padding:12px 0;color:#8b7c6f;">Remaining balance</td><td align="right" style="border-top:1px solid #eadfce;border-bottom:1px solid #eadfce;padding:12px 0;font-weight:800;">' + invoiceEscape(invoiceMoney(cur, remainingBalance)) + '</td></tr>' +
          '</table>' +
          bankHtml +
          '<p style="font-size:14px;line-height:1.6;margin:0;color:#6f6258;">Regards,<br><strong style="color:#2d2117;">' + invoiceEscape(businessName) + '</strong>' + (businessAddress ? '<br>' + invoiceEscape(businessAddress) : '') + (businessEmail ? '<br>' + invoiceEscape(businessEmail) : '') + '</p>' +
        '</div>' +
        '<div style="padding:16px 30px;background:#f7f2ea;text-align:center;font-size:13px;color:#8b7c6f;">Invoice by Cashflow System - Ceylonry Labs.io</div>' +
      '</div>' +
    '</div>';
  }

  window.clsBuildPaymentReminderEmailHtml = function(opts) {
    return paymentReminderEmailHtml(opts || {});
  };

  window.clsBuildPaymentReceiptEmailHtml = function(opts) {
    return paymentReceiptEmailHtml(opts || {});
  };

  function documentEmailHtml(opts) {
    opts = opts || {};
    var requestedLabel = String(opts.documentLabel || opts.kind || 'Quote');
    var label = /^invoice$/i.test(requestedLabel) ? 'Invoice' : (/^estimate$/i.test(requestedLabel) ? 'Estimate' : 'Quote');
    var cur = opts.currency || 'LKR';
    var number = opts.documentNumber || opts.invoiceNumber || opts.num || opts.id || '';
    var businessName = opts.businessName || opts.bizName || 'Your Business';
    var businessEmail = opts.businessEmail || opts.replyTo || '';
    var businessAddress = opts.businessAddress || opts.addr || '';
    var customerName = opts.customerName || opts.clientName || opts.client || 'Customer';
    var validUntil = opts.validUntil || opts.dueDate || humanDate(opts.due);
    var total = Number(opts.documentTotal != null ? opts.documentTotal : (opts.invoiceTotal || opts.total || opts.amount || 0));
    var rows = paymentEmailLineRows(opts.lines || opts.items || [], cur, total);
    var notes = opts.notes || 'Please contact us if you have any questions.';
    var theme = invoiceEmailTheme(opts);
    return '<div style="margin:0;background:' + invoiceEscape(theme.paper) + ';padding:28px;font-family:Arial,Helvetica,sans-serif;color:#2d2117;">' +
      '<div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #e5d9c8;border-radius:8px;overflow:hidden;">' +
        '<div style="background:' + invoiceEscape(theme.dark) + ';color:#fff;padding:30px 32px;border-bottom:6px solid ' + invoiceEscape(theme.accent) + ';">' +
          invoiceEmailBrand(opts, businessName, theme) +
          '<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:' + invoiceEscape(theme.accent) + ';margin-top:18px;">' + invoiceEscape(label + ' ready for review') + '</div>' +
          '<h1 style="margin:10px 0 4px;font-size:30px;line-height:1.2;">' + invoiceEscape(label + ' ' + number) + '</h1>' +
          '<div style="color:#eadfce;font-size:14px;">From ' + invoiceEscape(businessName) + '</div>' +
        '</div>' +
        '<div style="padding:30px 32px;">' +
          '<p style="font-size:16px;line-height:1.6;margin:0 0 18px;">Hi ' + invoiceEscape(customerName) + ',</p>' +
          '<p style="font-size:16px;line-height:1.6;margin:0 0 22px;color:#6f6258;">Please review the details for ' + invoiceEscape(label.toLowerCase()) + ' <strong style="color:#2d2117;">' + invoiceEscape(number) + '</strong>.' + (label === 'Invoice' ? ' Payment is due by ' : ' It is valid until ') + '<strong style="color:#2d2117;">' + invoiceEscape(validUntil || '-') + '</strong>.</p>' +
          '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 22px;">' +
            '<thead><tr style="background:' + invoiceEscape(theme.dark) + ';color:#fff;text-transform:uppercase;letter-spacing:1.5px;font-size:12px;"><th align="left" style="padding:12px 10px;">Description</th><th align="center" style="padding:12px 10px;">Qty</th><th align="right" style="padding:12px 10px;">Price</th><th align="right" style="padding:12px 10px;">Amount</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
          '<div style="text-align:right;margin-bottom:24px;"><div style="display:inline-block;min-width:260px;background:' + invoiceEscape(theme.dark) + ';color:#fff;padding:16px 20px;font-size:18px;font-weight:700;border-bottom:5px solid ' + invoiceEscape(theme.accent) + ';">' + invoiceEscape(label + ' total: ' + invoiceMoney(cur, total)) + '</div></div>' +
          '<div style="border-left:4px solid ' + invoiceEscape(theme.accent) + ';padding:10px 0 10px 16px;color:#6f6258;line-height:1.6;">' + invoiceBreaks(notes) + '</div>' +
          '<p style="font-size:14px;line-height:1.6;margin:24px 0 0;color:#6f6258;">Regards,<br><strong style="color:#2d2117;">' + invoiceEscape(businessName) + '</strong>' + (businessAddress ? '<br>' + invoiceEscape(businessAddress) : '') + (businessEmail ? '<br>' + invoiceEscape(businessEmail) : '') + '</p>' +
        '</div>' +
        '<div style="padding:16px 32px;background:#f7f2ea;text-align:center;font-size:12px;color:#8b7c6f;">Sent with Cashflow System - Ceylonry Labs.io</div>' +
      '</div>' +
    '</div>';
  }

  window.clsBuildDocumentEmailHtml = function(opts) {
    return documentEmailHtml(opts || {});
  };

  function emailJsErrorMessage(err) {
    if (!err) return '';
    if (typeof err === 'string') return err;
    var parts = [];
    if (err.status) parts.push('EmailJS ' + err.status);
    if (err.text) parts.push(err.text);
    if (err.message && parts.indexOf(err.message) === -1) parts.push(err.message);
    if (err.error) parts.push(typeof err.error === 'string' ? err.error : JSON.stringify(err.error));
    return parts.filter(Boolean).join(': ');
  }

  async function sendEmailJsViaFunction(params, config) {
    if (!window.fetch) throw new Error('EmailJS browser send failed and fetch is unavailable.');
    var res = await fetch('/.netlify/functions/emailjs-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: params, config: config })
    });
    var text = await res.text();
    var data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { error: text }; }
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || data.message || text || ('EmailJS function failed with HTTP ' + res.status));
    }
    return true;
  }

  window.clsSendPaymentReminderEmail = async function(opts) {
    opts = opts || {};
    var settings = opts.settings || {};
    var to = String(opts.to || opts.toEmail || '').trim();
    if (!to) throw new Error('No customer email saved for this invoice.');
    var emailKind = String(opts.kind || opts.emailType || opts.type || 'reminder').toLowerCase();
    var isReceipt = emailKind === 'receipt' || emailKind === 'paid' || emailKind === 'payment-received';
    var isDocument = emailKind === 'invoice' || emailKind === 'quote' || emailKind === 'estimate' || emailKind === 'document';
    var requestedDocumentLabel = String(opts.documentLabel || emailKind);
    var documentLabel = /^invoice$/i.test(requestedDocumentLabel) ? 'Invoice' : (/^estimate$/i.test(requestedDocumentLabel) ? 'Estimate' : 'Quote');
    var publicKey = settings.ejsKey || window.CLS_EMAILJS_PUBLIC_KEY || 'gCD6W70FKqiN2ATlp';
    var serviceId = settings.ejsService || window.CLS_EMAILJS_SERVICE_ID || 'service_uneb8lv';
    var reminderTemplateId = settings.ejsTemplate || window.CLS_EMAILJS_TEMPLATE_ID || 'template_5xb3yer';
    var receiptTemplateId = settings.ejsReceiptTemplate || settings.ejsPaidTemplate || window.CLS_EMAILJS_RECEIPT_TEMPLATE_ID || 'template_avm444n';
    var templateId = isReceipt ? receiptTemplateId : reminderTemplateId;
    if (!serviceId) {
      throw new Error('EmailJS Service ID is missing. Open EmailJS > Email Services and copy the Service ID that starts with service_.');
    }
    if (!/^service_/i.test(String(serviceId))) {
      throw new Error('EmailJS Service ID looks wrong. It should start with service_. Do not paste the secret/private key into this field.');
    }
    if (!publicKey || !templateId) {
      throw new Error('EmailJS Public Key or ' + (isReceipt ? 'Paid Receipt Template ID' : 'Payment Reminder Template ID') + ' is missing.');
    }
    var cur = opts.currency || 'LKR';
    var invoiceNo = opts.invoiceNumber || opts.invoiceNo || opts.num || opts.id || '';
    var businessName = opts.businessName || opts.bizName || 'Your Business';
    var customerName = opts.customerName || opts.clientName || opts.client || 'Customer';
    var amountDue = opts.amountDue != null ? Number(opts.amountDue || 0) : Number(opts.invoiceTotal || opts.total || opts.amount || 0);
    var paymentAmount = opts.paymentAmount != null ? Number(opts.paymentAmount || 0) : Number(opts.amountPaid || 0);
    var paidTotal = opts.paidTotal != null ? Number(opts.paidTotal || 0) : Number(opts.totalPaid || opts.paid || paymentAmount || 0);
    var remainingBalance = opts.remainingBalance != null ? Number(opts.remainingBalance || 0) : amountDue;
    var lines = opts.lines || opts.items || [];
    var itemRows = paymentEmailLineRows(lines, cur, amountDue);
    var params = {
      to_email: to,
      user_email: to,
      email: to,
      customer_email: to,
      recipient_email: to,
      receiver_email: to,
      to: to,
      toEmail: to,
      to_name: customerName,
      user_name: customerName,
      customer_name: customerName,
      name: customerName,
      from_name: businessName,
      reply_to: opts.businessEmail || settings.email || '',
      subject: opts.subject || (isDocument ? (documentLabel + ' ' + invoiceNo + ' from ' + businessName) : (isReceipt ? ((remainingBalance > 0.01 ? 'Partial payment received: Invoice ' : 'Payment received: Invoice ') + invoiceNo + ' from ' + businessName) : ('Payment reminder: Invoice ' + invoiceNo + ' from ' + businessName + ' - ' + invoiceMoney(cur, amountDue)))),
      message_html: isDocument ? documentEmailHtml(Object.assign({}, opts, { documentLabel: documentLabel })) : (isReceipt ? paymentReceiptEmailHtml(opts) : paymentReminderEmailHtml(opts)),
      business_name: businessName,
      business_address: opts.businessAddress || settings.addr || settings.address || '',
      client_name: customerName,
      invoice_no: invoiceNo,
      invoice_date: opts.invoiceDate || humanDate(opts.date),
      due_date: opts.dueDate || humanDate(opts.due),
      terms: opts.terms || 'Net 30',
      total_due: invoiceMoney(cur, amountDue),
      outstanding_amount: invoiceMoney(cur, amountDue),
      payment_amount: invoiceMoney(cur, paymentAmount),
      paid_total: invoiceMoney(cur, paidTotal),
      remaining_balance: invoiceMoney(cur, remainingBalance),
      payment_date: opts.paymentDate || humanDate(opts.paymentRawDate || opts.date),
      payment_method: opts.paymentMethod || '',
      payment_reference: opts.paymentReference || opts.paymentRef || '',
      pay_link: opts.payLink || opts.paymentLink || opts.checkoutUrl || '',
      payment_status: opts.status || (amountDue <= 0 ? 'paid' : 'unpaid'),
      notes: opts.notes || '',
      items_html: itemRows,
      bank_name: settings.bankName || settings.bank || '',
      bank_account_name: settings.bankAccountName || settings.accountName || '',
      bank_account_number: settings.bankAccountNumber || settings.accountNumber || '',
      bank_branch: settings.bankBranch || settings.branch || '',
      bank_details_html: emailJsBankDetailsHtml(settings)
    };
    var config = { publicKey: publicKey, serviceId: serviceId, templateId: templateId };
    var browserError = null;
    try {
      if ((!window.emailjs || typeof window.emailjs.send !== 'function') && window.clsLoadScriptOnce) {
        await window.clsLoadScriptOnce('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js', 'cls-emailjs');
      }
      if (!window.emailjs || typeof window.emailjs.send !== 'function') {
        throw new Error('EmailJS browser SDK did not load.');
      }
      if (typeof window.emailjs.init === 'function') {
        window.emailjs.init({ publicKey: publicKey });
      }
      await window.emailjs.send(serviceId, templateId, params, { publicKey: publicKey });
      return true;
    } catch (err) {
      browserError = err;
      console.error('EmailJS browser send failed:', err);
    }
    try {
      return await sendEmailJsViaFunction(params, config);
    } catch (fnErr) {
      var msg = emailJsErrorMessage(browserError) || emailJsErrorMessage(fnErr) || 'Could not send invoice email.';
      if (/recipient|recipients|address is empty/i.test(msg)) {
        msg += ' In EmailJS, set the template To Email field to {{to_email}} or {{user_email}}.';
      }
      var fnMsg = emailJsErrorMessage(fnErr);
      if (fnMsg && fnMsg !== msg) msg += ' Function fallback: ' + fnMsg;
      throw new Error(msg);
    }
  };

  window.clsSendPaymentReceiptEmail = function(opts) {
    var payload = {};
    opts = opts || {};
    Object.keys(opts).forEach(function(k) { payload[k] = opts[k]; });
    payload.kind = 'receipt';
    return window.clsSendPaymentReminderEmail(payload);
  };

  window.clsSendDocumentEmail = function(opts) {
    var payload = {};
    opts = opts || {};
    Object.keys(opts).forEach(function(k) { payload[k] = opts[k]; });
    payload.kind = /^invoice$/i.test(payload.documentLabel) ? 'invoice' : (/^estimate$/i.test(payload.documentLabel) ? 'estimate' : 'quote');
    return window.clsSendPaymentReminderEmail(payload);
  };

  window.clsSendInvoiceStatusEmail = function(opts) {
    opts = opts || {};
    var remaining = Number(opts.remainingBalance != null ? opts.remainingBalance : opts.amountDue) || 0;
    var paid = Number(opts.paidTotal != null ? opts.paidTotal : opts.paymentAmount) || 0;
    var status = String(opts.status || '').toLowerCase();
    if (status === 'paid' || status === 'partial' || paid > 0.01) {
      var receipt = {};
      Object.keys(opts).forEach(function(k) { receipt[k] = opts[k]; });
      receipt.status = remaining <= 0.01 ? 'paid' : 'partial';
      receipt.kind = 'receipt';
      return window.clsSendPaymentReminderEmail(receipt);
    }
    return window.clsSendPaymentReminderEmail(opts);
  };

  function normalizeInvoiceSettings(settings) {
    settings = settings || {};
    var biz = settings.bizName || settings.biz || settings.businessName || 'Your Business';
    var email = settings.email || settings.invoiceEmail || '';
    var footer = Object.prototype.hasOwnProperty.call(settings, 'footer') ? String(settings.footer || '').trim() : '';
    if (footer === DEFAULT_INVOICE_FOOTER || /^thank you for your business\.?$/i.test(footer)) footer = '';
    var align = settings.logoAlign || 'left';
    var defaultX = align === 'right' ? 88 : (align === 'center' ? 50 : 8);
    return {
      biz: biz,
      user: settings.username || settings.user || '',
      addr: settings.addr || settings.address || '',
      email: email,
      vat: settings.vat || '',
      bankName: settings.bankName || settings.bank || '',
      bankAccountName: settings.bankAccountName || settings.accountName || '',
      bankAccountNumber: settings.bankAccountNumber || settings.accountNumber || '',
      bankBranch: settings.bankBranch || settings.branch || '',
      footer: footer,
      logo: settings.logo || '',
      logoAlign: align,
      logoSize: settings.logoSize || 'M',
      logoX: clampNumber(settings.logoX, 0, 100, defaultX),
      logoY: clampNumber(settings.logoY, 0, 100, 5),
      invoiceFont: invoiceFont(settings.invoiceFont || settings.font).id,
      invoiceView: invoiceView(settings.invoiceView || settings.templateView || settings.view).id,
      invoicePrefix: sanitizeInvoicePrefix(settings.invoicePrefix || settings.prefix || 'INV')
    };
  }

  function invoiceBankRows(settings) {
    settings = normalizeInvoiceSettings(settings || {});
    return [
      ['Bank', settings.bankName],
      ['Account name', settings.bankAccountName],
      ['Account number', settings.bankAccountNumber],
      ['Branch', settings.bankBranch]
    ].filter(function(row) { return String(row[1] || '').trim(); });
  }

  function invoiceBankEmailHtml(settings) {
    var rows = invoiceBankRows(settings);
    if (!rows.length) return '';
    return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;table-layout:fixed;border-collapse:collapse;margin:24px 0 0;border:1px solid #e2dbd2;background:#faf8f4;">' +
      '<tr><td colspan="2" style="padding:16px 14px 8px;font-size:11px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#8a6818;">Bank details</td></tr>' +
      rows.map(function(row) {
        return '<tr><td width="38%" valign="top" style="width:38%;padding:6px 8px 6px 14px;font-size:12px;line-height:1.45;color:#6e635a;">' + invoiceEscape(row[0]) + '</td>' +
          '<td width="62%" valign="top" align="right" style="width:62%;padding:6px 14px 6px 8px;font-size:12px;line-height:1.45;color:#18130f;font-weight:700;word-break:break-word;">' + invoiceEscape(row[1]) + '</td></tr>';
      }).join('') + '<tr><td colspan="2" style="height:10px;line-height:10px;font-size:1px;">&nbsp;</td></tr></table>';
  }

  function emailJsBankDetailsHtml(settings) {
    var rows = invoiceBankRows(settings);
    if (!rows.length) return '';
    return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:28px 0 0;background:#fbfaf7;border:1px solid #eadfce;">' +
      '<tr><td style="padding:16px 18px;">' +
        '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#b8922a;font-weight:800;margin-bottom:7px;">Bank details for payment</div>' +
        '<div style="font-size:13px;line-height:1.55;color:#6f6258;margin-bottom:8px;">Please use the invoice number as the payment reference.</div>' +
        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">' +
          rows.map(function(row) {
            return '<tr>' +
              '<td width="38%" valign="top" style="width:38%;padding:8px 0;color:#8b7c6f;font-size:13px;line-height:1.45;border-bottom:1px solid #eadfce;">' + invoiceEscape(row[0]) + '</td>' +
              '<td width="62%" valign="top" align="right" style="width:62%;padding:8px 0;color:#2d2117;font-size:13px;line-height:1.45;font-weight:700;border-bottom:1px solid #eadfce;word-break:break-word;">' + invoiceEscape(row[1]) + '</td>' +
            '</tr>';
          }).join('') +
        '</table>' +
      '</td></tr>' +
    '</table>';
  }

  function invoiceLineItems(inv) {
    var lines = inv && (inv.lines || inv.items) || [];
    if (!lines.length && inv) lines = [{ desc: 'Invoice total', qty: 1, price: inv.amount || inv.total || 0, total: inv.amount || inv.total || 0 }];
    return lines.map(function(line) {
      var qty = Number(line.qty || 1) || 1;
      var price = Number(line.price || 0) || 0;
      var total = line.total != null ? Number(line.total || 0) : qty * price;
      return { desc: line.desc || line.description || 'Service or product', qty: qty, price: price, total: total };
    });
  }

  function invoiceLogoOverlay(settings) {
    if (!settings.logo) return '';
    var width = settings.logoSize === 'L' ? 132 : (settings.logoSize === 'S' ? 58 : 92);
    var transform = settings.logoX > 75 ? 'translateX(-100%)' : (settings.logoX > 35 && settings.logoX < 65 ? 'translateX(-50%)' : 'none');
    return '<img class="invoice-free-logo" src="' + invoiceEscape(settings.logo) + '" alt="Logo" style="left:' + settings.logoX + '%;top:' + settings.logoY + '%;width:' + width + 'px;transform:' + transform + '">';
  }

  function invoiceTemplateClass(layout) {
    return String(layout || 'pop').replace(/[^a-z0-9_-]/gi, '').toLowerCase();
  }

  function invoiceCustomTemplateCss(layout) {
    var cls = '.tpl-' + invoiceTemplateClass(layout);
    var rules = {
      'bold-editorial':
        cls + '{background:var(--paper)!important;--line:rgba(23,22,21,.2)!important}' +
        cls + ' .brand-rule{height:9mm!important;background:var(--dark)!important;margin:-14mm -15mm 0!important}' +
        cls + ' .invoice-head{background:var(--accent)!important;margin:0 -15mm 9mm!important;padding:10mm 15mm 9mm!important;border-bottom:0!important}' +
        cls + ' .invoice-title h1,' + cls + ' .invoice-title .num,' + cls + ' .invoice-title .meta,' + cls + ' .biz-name,' + cls + ' .muted{color:#171615!important}' +
        cls + ' .grand{background:#e6bc42!important;color:#171615!important}' + cls + ' .grand b{color:#171615!important}',
      'cafe-illustrated':
        cls + '{background:var(--paper)!important;--line:rgba(37,70,184,.28)!important}' +
        cls + ' .brand-rule{background:var(--accent)!important;height:2px!important}' +
        cls + ' .invoice-head{border-bottom:2px solid var(--accent)!important}' + cls + ' .invoice-title h1,' + cls + ' .label,' + cls + ' .line-no{color:var(--accent)!important}' +
        cls + ' .parties{border:1.5px solid var(--accent)!important;padding:7mm!important}' +
        cls + ' .items th{border-bottom-color:var(--accent)!important;color:var(--accent)!important}' + cls + ' .grand{background:var(--accent)!important}',
      'elegant-wreath':
        cls + '{background:var(--paper)!important}' + cls + ' .brand-rule{height:8px!important;background:transparent!important;border-top:3px double var(--accent)!important;border-bottom:1px solid var(--accent)!important}' +
        cls + ' .biz-name,' + cls + ' .invoice-title h1{font-family:Georgia,"Times New Roman",serif!important;font-weight:500!important}' +
        cls + ' .invoice-head{border-bottom:1px solid var(--accent)!important}' + cls + ' .label,' + cls + ' .line-no{color:#8a7048!important}' + cls + ' .grand{background:#2a2622!important}',
      'signature-script':
        cls + '{background:var(--paper)!important}' + cls + ' .brand-rule{height:1px!important;background:var(--dark)!important}' +
        cls + ' .invoice-title h1{font-family:Georgia,"Times New Roman",serif!important;font-style:italic!important;text-transform:none!important;letter-spacing:0!important;font-weight:500!important}' +
        cls + ' .parties{border:1px solid var(--dark)!important;padding:7mm!important}' + cls + ' .grand{background:#4a3b2a!important}',
      'monochrome-wave':
        cls + '{background:#fff!important;--accent:#111!important;--dark:#111!important}' + cls + ' .brand-rule{height:10mm!important;background:#111!important;margin:-14mm -15mm 9mm!important}' +
        cls + ' .invoice-title h1{font-size:48px!important;letter-spacing:1px!important}' + cls + ' .powered{background:#111!important;color:#fff!important;margin:8mm -15mm -11mm!important;padding:7mm 15mm!important;border:0!important}' + cls + ' .powered b{color:#fff!important}',
      'corporate-diagonal':
        cls + ' .brand-rule{height:5mm!important;background:linear-gradient(105deg,var(--dark) 0 72%,var(--accent) 72% 88%,#6f9d2a 88%)!important}' +
        cls + ' .invoice-head{background:var(--dark)!important;color:#fff!important;padding:8mm!important;border:0!important}' +
        cls + ' .invoice-title h1,' + cls + ' .invoice-title .num,' + cls + ' .invoice-title .meta,' + cls + ' .biz-name,' + cls + ' .invoice-head .muted{color:#fff!important}' +
        cls + ' .items th{background:var(--accent)!important;color:#111!important;border-bottom-color:var(--accent)!important}' + cls + ' .grand{background:var(--accent)!important;color:#111!important}' + cls + ' .grand b{color:#111!important}',
      'modern-serif':
        cls + '{background:var(--paper)!important}' + cls + ' .brand-rule{height:2px!important;background:var(--accent)!important}' +
        cls + ' .biz-name,' + cls + ' .invoice-title h1{font-family:Georgia,"Times New Roman",serif!important;font-weight:500!important;text-transform:none!important;letter-spacing:0!important}' +
        cls + ' .invoice-head{border-bottom:1px solid var(--dark)!important}' + cls + ' .items th{border-bottom:1px solid var(--dark)!important}' + cls + ' .grand{background:var(--dark)!important}',
      'flame-dark-header':
        cls + ' .brand-rule{height:5px!important;background:var(--accent)!important;margin-bottom:0!important}' + cls + ' .invoice-head{background:var(--dark)!important;color:#fff!important;margin:0 -15mm 9mm!important;padding:9mm 15mm!important;border:0!important}' +
        cls + ' .invoice-title h1,' + cls + ' .invoice-title .num,' + cls + ' .invoice-title .meta,' + cls + ' .biz-name,' + cls + ' .invoice-head .muted{color:#fff!important}' +
        cls + ' .label,' + cls + ' .line-no{color:#9d7412!important}' + cls + ' .grand{background:var(--dark)!important;border-top:5px solid var(--accent)!important}',
      'dotted-mono':
        cls + '{font-family:"Courier New",Courier,monospace!important}' + cls + ' .brand-rule{height:0!important;border-top:3px dotted #111!important;background:transparent!important}' +
        cls + ' .biz-name,' + cls + ' .invoice-title h1,' + cls + ' .items,' + cls + ' .money-row{font-family:"Courier New",Courier,monospace!important}' +
        cls + ' .invoice-head,' + cls + ' .parties,' + cls + ' .items td,' + cls + ' .totals{border-color:#111!important}' + cls + ' .grand{background:#111!important}',
      'corporate-charcoal':
        cls + ' .brand-rule{height:7mm!important;background:var(--dark)!important;margin:-14mm -15mm 8mm!important}' + cls + ' .invoice-head{border-bottom:4px solid var(--dark)!important}' +
        cls + ' .logo-box{background:var(--dark)!important;color:#fff!important;border:0!important}' + cls + ' .grand{background:var(--dark)!important}' +
        cls + ' .powered{background:var(--dark)!important;color:#fff!important;margin:8mm -15mm -11mm!important;padding:5mm 15mm!important;border:0!important}' + cls + ' .powered b{color:#fff!important}',
      'geometric-blue':
        cls + ' .brand-rule{height:4mm!important;background:var(--accent)!important}' + cls + ' .invoice-head{background:var(--dark)!important;color:#fff!important;padding:8mm!important;border-bottom:7px solid var(--accent)!important}' +
        cls + ' .invoice-title h1,' + cls + ' .invoice-title .num,' + cls + ' .invoice-title .meta,' + cls + ' .biz-name,' + cls + ' .invoice-head .muted{color:#fff!important}' +
        cls + ' .items th{background:var(--dark)!important;color:#fff!important;border-bottom-color:var(--dark)!important}' + cls + ' .grand{background:var(--accent)!important}',
      'furniture-pink':
        cls + '{background:var(--paper)!important;border-radius:0!important}' + cls + ' .brand-rule{height:8mm!important;background:linear-gradient(90deg,var(--dark),var(--accent))!important}' +
        cls + ' .biz-name{color:var(--dark)!important;font-size:30px!important}' + cls + ' .invoice-title h1{color:var(--dark)!important}' +
        cls + ' .items th{background:var(--accent)!important;color:#29243b!important;border-bottom-color:var(--accent)!important}' + cls + ' .grand{background:var(--dark)!important}',
      'minimal-grey':
        cls + '{background:#fff!important;--line:#d8d8d8!important}' + cls + ' .brand-rule{height:1px!important;background:#777!important}' + cls + ' .invoice-head{border-bottom:1px solid #aaa!important}' +
        cls + ' .invoice-title h1{font-size:32px!important;letter-spacing:2px!important;font-weight:500!important}' + cls + ' .items th{font-weight:500!important;color:#555!important;border-bottom:1px solid #aaa!important}' +
        cls + ' .line-no{color:#777!important}' + cls + ' .grand{background:#555!important}'
    };
    return rules[invoiceTemplateClass(layout)] || '';
  }

  window.clsInvoiceTemplates = INVOICE_TEMPLATES;
  window.clsInvoiceFontOptions = INVOICE_FONTS;
  window.clsInvoiceViewOptions = INVOICE_VIEWS;
  window.clsInvoiceFontOptionsHtml = function(active) { return optionsHtml(INVOICE_FONTS, invoiceFont(active).id); };
  window.clsInvoiceViewOptionsHtml = function(active) { return optionsHtml(INVOICE_VIEWS, invoiceView(active).id); };
  window.clsInvoiceFontCss = function(active) { return invoiceFont(active).body; };
  window.clsInvoiceViewName = function(active) { return invoiceView(active).name; };
  window.clsSanitizeInvoicePrefix = sanitizeInvoicePrefix;
  window.clsFormatInvoiceNumber = function(prefix, number) {
    return sanitizeInvoicePrefix(prefix) + '-' + String(Number(number || 1) || 1).padStart(4, '0');
  };
  window.clsNormalizeInvoiceTemplate = function(idx) {
    idx = parseInt(idx, 10);
    return Number.isFinite(idx) && idx >= 0 && idx < INVOICE_TEMPLATES.length ? idx : 0;
  };
  window.clsInvoiceTemplateName = function(idx) {
    return invoiceTemplate(idx).name;
  };
  window.clsInvoiceMiniPreview = function(theme) {
    theme = theme || INVOICE_TEMPLATES[0];
    var dark = ['orange', 'green', 'yellow', 'corporate-diagonal', 'flame-dark-header', 'corporate-charcoal', 'geometric-blue'].indexOf(theme.layout) !== -1;
    var side = ['pinbox', 'kazuma', 'architect'].indexOf(theme.layout) !== -1;
    return '<div class="tpl-mini' + (dark ? ' dark' : '') + (side ? ' side' : '') + '" style="--tpl-accent:' + theme.accent + ';background:' + (dark ? theme.dark : theme.paper || '#fff') + '">' +
      '<div class="tm-logo"></div>' +
      '<div class="tm-lines"><span style="width:75%"></span><span style="width:54%"></span><span style="width:90%"></span></div>' +
      '<div class="tm-total"></div>' +
    '</div>';
  };
  window.clsInvoiceTemplateCards = function(active, opts) {
    opts = opts || {};
    active = window.clsNormalizeInvoiceTemplate(active);
    var cardClass = opts.cardClass || 'tpl-pick-card';
    var nameClass = opts.nameClass || 'tpl-pick-name';
    var locked = opts.locked === true;
    var fn = opts.fn || 'selectDefaultInvoiceTemplate';
    return INVOICE_TEMPLATES.map(function(theme, i) {
      var attrs = ' data-tpl-card="' + invoiceEscape(opts.group || (locked ? 'invoice' : 'settings')) + '" data-tpl="' + i + '"';
      if (!locked) attrs += ' data-cls-fn="' + invoiceEscape(fn) + '" data-cls-arg="' + i + '" data-cls-this="1"';
      return '<div class="' + cardClass + (i === active ? ' selected sel' : '') + '"' + attrs + '>' +
        window.clsInvoiceMiniPreview(theme) +
        '<div class="' + nameClass + '">' + invoiceEscape(theme.name) + '</div>' +
      '</div>';
    }).join('');
  };

  function clsLegacyInvoiceRendererRemoved(opts) {
    opts = opts || {};
    var inv = opts.inv || {};
    var s = normalizeInvoiceSettings(opts.settings || {});
    var idx = window.clsNormalizeInvoiceTemplate(opts.templateIndex != null ? opts.templateIndex : inv.tpl);
    var theme = invoiceTemplate(idx);
    var cur = inv.cur || inv.currency || 'LKR';
    var lines = invoiceLineItems(inv);
    var sub = lines.reduce(function(sum, line) { return sum + (line.total || 0); }, 0) || Number(inv.sub || inv.amount || inv.total || 0) || 0;
    var disc = Number(inv.disc || inv.discount || 0) || 0;
    var explicitDiscount = inv.discountAmount != null ? Number(inv.discountAmount) : NaN;
    var discAmount = Number.isFinite(explicitDiscount) ? Math.max(0, explicitDiscount) : (disc > 0 && disc <= 100 ? sub * disc / 100 : disc);
    var vat = Number(inv.vat || inv.tax || 0) || 0;
    var total = Number(inv.amount || inv.total || (sub - discAmount + vat)) || 0;
    var note = String(Object.prototype.hasOwnProperty.call(inv, 'notes') ? (inv.notes || '') : (s.footer || '')).trim();
    if (note === DEFAULT_INVOICE_FOOTER || /^thank you for your business\.?$/i.test(note)) note = '';
    var title = inv.num || inv.id || 'PREVIEW';
    var documentLabel = String(opts.documentLabel || inv.documentLabel || inv.documentType || 'Invoice');
    documentLabel = /^quote$/i.test(documentLabel) ? 'Quote' : (/^estimate$/i.test(documentLabel) ? 'Estimate' : 'Invoice');
    var legacyBankRows = documentLabel === 'Invoice' ? invoiceBankRows(s) : [];
    var legacyBankHtml = legacyBankRows.length ? '<div class="bank-details"><div class="label">Bank details</div>' + legacyBankRows.map(function(row) {
      return '<div class="bank-row"><span>' + invoiceEscape(row[0]) + '</span><b>' + invoiceEscape(row[1]) + '</b></div>';
    }).join('') + '</div>' : '';
    var font = invoiceFont(s.invoiceFont);
    var logo = s.logo
      ? '<img class="logo-img" src="' + s.logo + '" alt="Logo">'
      : '<div class="logo-box">LOGO</div>';
    var rows = lines.map(function(line, i) {
      return '<tr><td><b>' + String(i + 1).padStart(2, '0') + '</b> ' + invoiceBreaks(line.desc) + '</td><td>' + invoiceEscape(line.qty) + '</td><td>' + invoiceMoney(cur, line.price) + '</td><td>' + invoiceMoney(cur, line.total) + '</td></tr>';
    }).join('') || '<tr><td>Service or product</td><td>1</td><td>' + invoiceMoney(cur, total) + '</td><td>' + invoiceMoney(cur, total) + '</td></tr>';
    var cssLayout = invoiceTemplateClass(theme.layout);
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + invoiceEscape(title) + '</title><style>' +
      '@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{background:#f2f2f2;color:#17130f;font-family:' + font.body + '}.invoice-page{width:210mm;min-height:297mm;margin:0 auto;background:' + (theme.paper || '#fff') + ';padding:18mm 18mm 14mm;--accent:' + theme.accent + ';--dark:' + theme.dark + ';--line:rgba(23,19,15,.16);font-family:' + font.body + '}.top-rule{height:5px;background:var(--accent);margin-bottom:17mm}.invoice-head{display:grid;grid-template-columns:minmax(0,1fr) 62mm;gap:12mm;align-items:start;margin-bottom:14mm}.brand{display:grid;grid-template-columns:24mm minmax(0,1fr);gap:7mm;align-items:start}.logo-img{max-width:23mm;max-height:18mm;object-fit:contain;display:block}.logo-box{width:23mm;height:16mm;border:1px dashed var(--line);display:flex;align-items:center;justify-content:center;font-size:9px;letter-spacing:3px;color:#978b7f}.biz-name{font-family:' + font.title + ';font-size:22px;font-weight:800;line-height:1.12}.small{font-size:10.5px;line-height:1.55;color:#6b6259;white-space:pre-line}.title{text-align:right}.title h1{font-family:' + font.title + ';font-size:42px;line-height:1;letter-spacing:1px;color:#111}.title .num{margin-top:5mm;font-size:12px;font-weight:800}.meta{margin-top:4mm;font-size:10.5px;line-height:1.65;color:#6b6259}.parties{display:grid;grid-template-columns:minmax(0,1fr) 32mm;gap:11mm;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:9mm 0;margin-bottom:11mm}.label{font-size:9px;letter-spacing:3px;text-transform:uppercase;font-weight:800;color:var(--dark);margin-bottom:4mm}.party-name{font-size:14px;font-weight:800;margin-bottom:2mm;line-height:1.3}.status-pill{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:5px 9px;font-size:10px;font-weight:800;text-transform:capitalize;margin-bottom:3mm}.items{width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:10mm}.items th{background:var(--dark);color:#fff;font-size:9px;letter-spacing:2px;text-transform:uppercase;text-align:left;padding:9px 10px}.items th:nth-child(1){width:52%}.items th:nth-child(2){width:11%}.items th:nth-child(3),.items th:nth-child(4){width:18.5%}.items th:nth-child(n+2),.items td:nth-child(n+2){text-align:right}.items td{border-bottom:1px solid var(--line);padding:10px;font-size:10.5px;line-height:1.4;vertical-align:top}.bottom{display:grid;grid-template-columns:minmax(0,1fr) 76mm;gap:14mm;align-items:start}.note{border-left:4px solid var(--accent);padding-left:6mm;min-height:23mm}.note-text{font-size:10.5px;line-height:1.6;color:#6b6259;white-space:pre-line}.totals{border-top:1px solid var(--line);padding-top:3mm}.row{display:flex;justify-content:space-between;gap:8mm;border-bottom:1px solid var(--line);padding:6px 0;font-size:10.5px;color:#5f554c}.grand{margin-top:5mm;background:var(--dark);color:#fff;border:0;padding:12px 14px;align-items:center}.grand span{font-size:9px;letter-spacing:3px;text-transform:uppercase;font-weight:800}.grand b{font-size:18px;color:#fff}.powered{margin-top:11mm;border-top:1px solid var(--line);padding-top:4mm;text-align:center;font-size:9px;letter-spacing:.08em;color:#90877d}.powered b{color:var(--accent)}.tpl-pop .items th,.tpl-pop .grand{background:var(--accent);color:var(--dark)}.tpl-orange .top-rule{height:9mm;background:var(--dark)}.tpl-cafe .title h1{color:var(--accent)}.tpl-green .items th,.tpl-yellow .items th{background:var(--accent);color:#111}.tpl-architect .top-rule{background:var(--accent)}@media print{body{background:#fff}.invoice-page{margin:0;width:210mm;min-height:297mm;box-shadow:none}}' +
      '</style></head><body><div class="invoice-page tpl-' + cssLayout + '"><div class="top-rule"></div>' +
      '<section class="invoice-head"><div class="brand">' + logo + '<div><div class="biz-name">' + invoiceEscape(s.biz) + '</div><div class="small">' + invoiceBreaks(s.addr) + (s.email ? '<br>' + invoiceEscape(s.email) : '') + (s.vat ? '<br>VAT: ' + invoiceEscape(s.vat) : '') + '</div></div></div><div class="title"><h1>Invoice</h1><div class="num">' + invoiceEscape(title) + '</div><div class="meta"><div>Date: ' + humanDate(inv.date) + '</div><div>Due: ' + humanDate(inv.due) + '</div><div>Terms: ' + invoiceEscape(inv.terms || 'Net 30') + '</div></div></div></section>' +
      '<section class="parties"><div><div class="label">Bill To</div><div class="party-name">' + invoiceEscape(inv.client || 'Customer') + '</div><div class="small">' + invoiceCustomerDetails(inv) + '</div></div><div><div class="label">Status</div><div class="status-pill">' + invoiceEscape(status) + '</div><div class="small">Balance due<br><b>' + invoiceMoney(cur, balance) + '</b></div></div></section>' +
      '<table class="items"><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<section class="bottom"><div class="note"><div class="label">Notes</div><div class="note-text">' + invoiceBreaks(note) + '</div></div><div class="totals"><div class="row"><span>Subtotal</span><b>' + invoiceMoney(cur, sub) + '</b></div>' + (discAmount ? '<div class="row"><span>Discount</span><b>- ' + invoiceMoney(cur, discAmount) + '</b></div>' : '') + (vat ? '<div class="row"><span>Tax / VAT</span><b>' + invoiceMoney(cur, vat) + '</b></div>' : '') + '<div class="row grand"><span>Total due</span><b>' + invoiceMoney(cur, total) + '</b></div></div></section>' +
      '<div class="powered"><b>' + DEFAULT_INVOICE_FOOTER + '</b></div></div></body></html>';
  };

  window.clsBuildInvoicePrintHtml = function(opts) {
    opts = opts || {};
    var inv = opts.inv || {};
    var s = normalizeInvoiceSettings(opts.settings || {});
    var idx = window.clsNormalizeInvoiceTemplate(opts.templateIndex != null ? opts.templateIndex : inv.tpl);
    var theme = invoiceTemplate(idx);
    var view = invoiceView(s.invoiceView).id;
    var font = invoiceFont(s.invoiceFont);
    var cur = inv.cur || inv.currency || 'LKR';
    var lines = invoiceLineItems(inv);
    var sub = lines.reduce(function(sum, line) { return sum + (Number(line.total) || 0); }, 0) || Number(inv.sub || inv.amount || inv.total || 0) || 0;
    var disc = Number(inv.disc || inv.discount || 0) || 0;
    var explicitDiscount = inv.discountAmount != null ? Number(inv.discountAmount) : NaN;
    var discAmount = Number.isFinite(explicitDiscount) ? Math.max(0, explicitDiscount) : (disc > 0 && disc <= 100 ? sub * disc / 100 : disc);
    var vat = Number(inv.vat || inv.tax || 0) || 0;
    var total = Number(inv.amount || inv.total || (sub - discAmount + vat)) || 0;
    var rawStatus = String(inv.status || '').toLowerCase();
    var paidSource = inv.paidAmount != null ? inv.paidAmount : inv.paid;
    if (paidSource == null && inv.outstanding != null) paidSource = total - Number(inv.outstanding || 0);
    var paid = Math.max(0, Math.min(total, Number(paidSource) || 0));
    if (rawStatus === 'paid' && total > 0) paid = total;
    var balance = Math.max(0, total - paid);
    var status = total > 0 && balance <= 0.01 ? 'paid' : (paid > 0.01 ? 'partial' : (rawStatus === 'overdue' ? 'overdue' : 'unpaid'));
    var statusLabel = status === 'paid' ? 'Paid / Settled' : (status === 'partial' ? 'Partially Paid' : (status === 'overdue' ? 'Payment Overdue' : 'Payment Pending'));
    var note = String(Object.prototype.hasOwnProperty.call(inv, 'notes') ? (inv.notes || '') : (s.footer || '')).trim();
    if (note === DEFAULT_INVOICE_FOOTER || /^thank you for your business\.?$/i.test(note)) note = '';
    var title = inv.num || inv.id || 'PREVIEW';
    var documentLabel = String(opts.documentLabel || inv.documentLabel || inv.documentType || 'Invoice');
    documentLabel = /^quote$/i.test(documentLabel) ? 'Quote' : (/^estimate$/i.test(documentLabel) ? 'Estimate' : 'Invoice');
    var bankRows = documentLabel === 'Invoice' ? invoiceBankRows(s) : [];
    var bankHtml = bankRows.length ? '<div class="bank-details"><div class="label">Bank details</div>' + bankRows.map(function(row) {
      return '<div class="bank-row"><span>' + invoiceEscape(row[0]) + '</span><b>' + invoiceEscape(row[1]) + '</b></div>';
    }).join('') + '</div>' : '';
    var logoWidth = s.logoSize === 'L' ? 42 : (s.logoSize === 'S' ? 24 : 34);
    var logoStyle = 'max-width:' + logoWidth + 'mm;max-height:24mm';
    var logo = s.logo
      ? '<img class="logo-img" src="' + invoiceEscape(s.logo) + '" alt="Logo" style="' + logoStyle + '">'
      : '<div class="logo-box">LOGO</div>';
    var rows = lines.map(function(line, i) {
      return '<tr>' +
        '<td><div class="line-item-description"><span class="line-no">' + String(i + 1).padStart(2, '0') + '</span><span class="line-desc">' + invoiceBreaks(line.desc) + '</span></div></td>' +
        '<td>' + invoiceEscape(line.qty) + '</td>' +
        '<td>' + invoiceMoney(cur, line.price) + '</td>' +
        '<td>' + invoiceMoney(cur, line.total) + '</td>' +
      '</tr>';
    }).join('') || '<tr><td><div class="line-item-description"><span class="line-no">01</span><span class="line-desc">Service or product</span></div></td><td>1</td><td>' + invoiceMoney(cur, total) + '</td><td>' + invoiceMoney(cur, total) + '</td></tr>';
    var cssLayout = invoiceTemplateClass(theme.layout);
    var densityClass = lines.length > 12 ? ' density-tight' : (lines.length > 7 ? ' density-compact' : '');
    var bodyFont = font.body;
    var titleFont = font.title;
    var css = '@page{size:A4;margin:0}' +
      '*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}' +
      'html,body{width:210mm;min-height:0;background:#fff;color:#18130f;font-family:' + bodyFont + '}' +
      'body{margin:0}.invoice-page{width:210mm;min-height:0;overflow:visible;margin:0 auto;background:#fff;color:#18130f;padding:11mm 12mm 8mm;display:block;--accent:' + theme.accent + ';--dark:' + theme.dark + ';--paper:#fff;--line:rgba(24,19,15,.16);font-family:' + bodyFont + '}' +
      '.brand-rule{height:4px;background:var(--accent);margin-bottom:14mm}.invoice-head{display:grid;grid-template-columns:minmax(0,1fr) 64mm;gap:12mm;align-items:start;margin-bottom:13mm;border-bottom:2px solid var(--dark);padding-bottom:9mm}.brand{text-align:' + (s.logoAlign === 'right' ? 'right' : (s.logoAlign === 'center' ? 'center' : 'left')) + '}.logo-img{display:inline-block;object-fit:contain;margin-bottom:5mm}.logo-box{display:inline-flex;width:28mm;height:16mm;border:1px dashed var(--line);align-items:center;justify-content:center;font-size:9px;letter-spacing:3px;color:#9b9188;margin-bottom:5mm}.biz-name{font-family:' + titleFont + ';font-size:24px;line-height:1.15;font-weight:800;color:#111}.muted{font-size:10.5px;line-height:1.55;color:#6e635a;white-space:pre-line;word-break:break-word}.invoice-title{text-align:right}.invoice-title h1{font-family:' + titleFont + ';font-size:36px;line-height:1;text-transform:uppercase;letter-spacing:5px;color:#111}.invoice-title .num{margin-top:4mm;font-size:12px;font-weight:800;letter-spacing:.04em}.invoice-title .meta{margin-top:5mm;font-size:10.5px;line-height:1.7;color:#6e635a}.payment-state{display:inline-flex;margin-top:4mm;border:1px solid var(--dark);padding:6px 9px;font-size:8.5px;letter-spacing:1.6px;text-transform:uppercase;font-weight:900;color:var(--dark)}.payment-state.paid{background:#167a4b;border-color:#167a4b;color:#fff}.payment-state.partial{background:#fff7df;border-color:#b8922a;color:#7b5a00}.payment-state.overdue{border-color:#bd3d32;color:#bd3d32}.parties{display:grid;grid-template-columns:minmax(0,1fr);gap:0;padding:0 0 8mm;margin-bottom:8mm}.label{font-size:8.5px;letter-spacing:2.5px;text-transform:uppercase;font-weight:800;color:var(--dark);margin-bottom:3mm}.party-name{font-size:14px;font-weight:800;line-height:1.25;margin-bottom:2mm}.items{width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:8mm}.items th{background:transparent;color:#18130f;border-bottom:2px solid var(--dark);font-size:8.5px;letter-spacing:2px;text-transform:uppercase;text-align:left;padding:0 10px 7px}.items th:nth-child(1){width:49%}.items th:nth-child(2){width:10%}.items th:nth-child(3){width:20%}.items th:nth-child(4){width:21%}.items th:nth-child(n+2),.items td:nth-child(n+2){text-align:right}.items td{border-bottom:1px solid var(--line);padding:9px 10px;font-size:10.5px;line-height:1.35;vertical-align:top;word-break:break-word}.line-item-description{display:grid;grid-template-columns:18px minmax(0,1fr);column-gap:7px;align-items:start}.line-no{display:block;min-width:0;margin:0;font-weight:800;color:var(--accent)}.line-desc{display:block;min-width:0;font-weight:650}.money-row{display:flex;justify-content:space-between;gap:10mm;border-bottom:1px solid var(--line);padding:6px 0;font-size:10.5px;color:#594f47}.money-row b{color:#111;font-variant-numeric:tabular-nums}.invoice-bottom{display:grid;grid-template-columns:minmax(0,1fr) 74mm;gap:14mm;align-items:start;margin-top:auto;padding-top:0}.notes{padding-left:0;min-height:22mm}.note-text{font-size:10.5px;line-height:1.55;color:#6e635a;white-space:pre-line}.bank-details{margin-top:6mm;padding-top:4mm;border-top:1px solid var(--line);max-width:88mm}.bank-row{display:flex;justify-content:space-between;gap:6mm;padding:2px 0;font-size:9.5px;line-height:1.35;color:#6e635a}.bank-row b{color:#18130f;text-align:right;word-break:break-word}.totals{border-top:1px solid var(--line);padding-top:2mm}.grand{margin-top:4mm;background:var(--dark);color:#fff!important;border:0;padding:11px 13px;align-items:center}.grand span{font-size:8.5px;letter-spacing:2.8px;text-transform:uppercase;font-weight:800}.grand b{font-size:17px;color:#fff}.grand.settled{background:#167a4b}.powered{margin-top:8mm;padding-top:7mm;text-align:center;font-size:9px;letter-spacing:.04em;color:#7d736a}.powered b{color:#18130f}.view-classic .invoice-title h1,.view-olden .invoice-title h1{text-transform:none;letter-spacing:0}.view-olden .brand-rule{height:6px;background:transparent;border-top:3px double var(--accent);border-bottom:1px solid var(--accent)}.view-minimal .brand-rule,.view-minimal .grand{background:#111}.view-bold .brand-rule{background:var(--dark)}.tpl-pop .grand{background:var(--accent);color:#1b1713}.tpl-green .grand,.tpl-yellow .grand{background:var(--accent);color:#111}.tpl-green .grand b,.tpl-yellow .grand b,.tpl-pop .grand b{color:#111}@media print{html,body{background:#fff}.invoice-page{box-shadow:none;margin:0;min-height:297mm;height:auto}}';
    css += 'html,body{width:210mm!important;min-height:297mm!important}.invoice-page{width:210mm!important;min-height:297mm!important;height:297mm!important;padding:14mm 15mm 11mm!important;overflow:hidden!important;display:flex!important;flex-direction:column!important}.brand-rule{height:5px!important;margin-bottom:10mm!important;flex:0 0 auto}.invoice-head{grid-template-columns:minmax(0,1fr) 62mm!important;gap:12mm!important;margin-bottom:9mm!important;padding-bottom:8mm!important;flex:0 0 auto}.logo-img{max-height:22mm!important;margin-bottom:4mm!important}.logo-box{width:29mm!important;height:17mm!important;margin-bottom:4mm!important}.biz-name{font-size:26px!important}.muted{font-size:11.5px!important;line-height:1.55!important}.invoice-title h1{font-size:42px!important;letter-spacing:5px!important}.invoice-title .num{font-size:12.5px!important;margin-top:4mm!important}.invoice-title .meta{font-size:11px!important;line-height:1.7!important;margin-top:4mm!important}.parties{gap:18mm!important;padding-bottom:9mm!important;margin-bottom:9mm!important;flex:0 0 auto}.label{font-size:9px!important;margin-bottom:3mm!important}.party-name{font-size:15px!important;margin-bottom:2mm!important}.items{margin-bottom:10mm!important;break-inside:auto!important;page-break-inside:auto!important;flex:0 0 auto}.items thead{display:table-header-group}.items tr{break-inside:avoid;page-break-inside:avoid}.items th{font-size:9px!important;padding:0 9px 8px!important}.items td{font-size:12px!important;line-height:1.4!important;padding:10px 9px!important}.line-item-description{grid-template-columns:20px minmax(0,1fr)!important;column-gap:7px!important}.line-no{min-width:0!important;margin-right:0!important}.invoice-bottom{grid-template-columns:minmax(0,1fr) 76mm!important;gap:14mm!important;margin-top:auto!important;break-inside:avoid;page-break-inside:avoid;flex:0 0 auto}.notes{min-height:25mm!important}.note-text,.money-row{font-size:11.5px!important}.money-row{padding:7px 0!important}.grand{margin-top:4mm!important;padding:13px 14px!important}.grand b{font-size:19px!important}.powered{margin-top:9mm!important;padding-top:5mm!important;font-size:9px!important;break-inside:avoid;page-break-inside:avoid;flex:0 0 auto}.invoice-head,.parties{break-inside:avoid;page-break-inside:avoid}.density-compact{padding:11mm 13mm 9mm!important}.density-compact .brand-rule{margin-bottom:6mm!important}.density-compact .invoice-head{margin-bottom:6mm!important;padding-bottom:5mm!important}.density-compact .logo-img{max-height:16mm!important;margin-bottom:2mm!important}.density-compact .biz-name{font-size:23px!important}.density-compact .invoice-title h1{font-size:36px!important}.density-compact .parties{padding-bottom:5mm!important;margin-bottom:5mm!important}.density-compact .items{margin-bottom:5mm!important}.density-compact .items td{font-size:10.5px!important;padding:7px 8px!important}.density-compact .invoice-bottom{margin-top:auto!important}.density-compact .notes{min-height:0!important}.density-compact .money-row{font-size:10.5px!important;padding:5px 0!important}.density-compact .grand{padding:10px 12px!important}.density-compact .powered{margin-top:5mm!important;padding-top:3mm!important}.density-tight{padding:9mm 11mm 7mm!important}.density-tight .brand-rule{margin-bottom:4mm!important}.density-tight .invoice-head{margin-bottom:4mm!important;padding-bottom:4mm!important}.density-tight .logo-img{max-height:13mm!important;margin-bottom:1.5mm!important}.density-tight .logo-box{height:12mm!important;margin-bottom:1.5mm!important}.density-tight .biz-name{font-size:21px!important}.density-tight .muted{font-size:9.5px!important;line-height:1.35!important}.density-tight .invoice-title h1{font-size:32px!important}.density-tight .invoice-title .meta{font-size:9.5px!important;line-height:1.4!important;margin-top:2mm!important}.density-tight .parties{padding-bottom:3mm!important;margin-bottom:3mm!important}.density-tight .label{font-size:7.5px!important;margin-bottom:1.5mm!important}.density-tight .party-name{font-size:12px!important}.density-tight .items{margin-bottom:3mm!important}.density-tight .items th{font-size:7.5px!important;padding-bottom:4px!important}.density-tight .items td{font-size:9px!important;line-height:1.2!important;padding:5px 6px!important}.density-tight .line-item-description{grid-template-columns:16px minmax(0,1fr)!important;column-gap:5px!important}.density-tight .invoice-bottom{margin-top:auto!important;grid-template-columns:minmax(0,1fr) 66mm!important;gap:8mm!important}.density-tight .notes{min-height:0!important}.density-tight .note-text,.density-tight .money-row{font-size:9px!important}.density-tight .money-row{padding:4px 0!important}.density-tight .grand{margin-top:2mm!important;padding:8px 9px!important}.density-tight .grand b{font-size:14px!important}.density-tight .powered{margin-top:3mm!important;padding-top:2mm!important;font-size:8px!important}@media print{html,body{width:210mm!important;min-height:297mm!important;height:297mm!important}.invoice-page{width:210mm!important;min-height:297mm!important;height:297mm!important;overflow:hidden!important}}';
    css += '.items th{background:#fff!important;color:#18130f!important;border-bottom:2px solid var(--dark)!important}';
    css += 'body{background:#fff!important}@media print{html,body{background:#fff!important}}';
    css += invoiceCustomTemplateCss(theme.layout);
    var notesHtml = note ? '<div class="label">Notes</div><div class="note-text">' + invoiceBreaks(note) + '</div>' : '';
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + invoiceEscape(title) + '</title><style>' + css + '</style></head><body>' +
      '<div class="invoice-page tpl-' + cssLayout + ' view-' + view + densityClass + '"><div class="brand-rule"></div>' +
      '<section class="invoice-head"><div class="brand">' + logo + '<div class="biz-name">' + invoiceEscape(s.biz) + '</div><div class="muted">' + invoiceBreaks(s.addr) + (s.email ? '<br>' + invoiceEscape(s.email) : '') + (s.vat ? '<br>VAT: ' + invoiceEscape(s.vat) : '') + '</div></div><div class="invoice-title"><h1>' + invoiceEscape(documentLabel) + '</h1><div class="num">' + invoiceEscape(title) + '</div>' + (documentLabel === 'Invoice' ? '<div class="payment-state ' + invoiceEscape(status) + '">' + invoiceEscape(statusLabel) + '</div>' : '') + '<div class="meta"><div>Date: ' + humanDate(inv.date) + '</div><div>' + (documentLabel === 'Invoice' ? 'Due' : 'Valid until') + ': ' + humanDate(inv.due) + '</div><div>Terms: ' + invoiceEscape(inv.terms || 'Net 30') + '</div></div></div></section>' +
      '<section class="parties"><div><div class="label">Bill To</div><div class="party-name">' + invoiceEscape(inv.client || 'Customer') + '</div><div class="muted">' + invoiceCustomerDetails(inv) + '</div></div></section>' +
      '<table class="items"><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<section class="invoice-bottom"><div class="notes">' + notesHtml + bankHtml + '</div><div class="totals"><div class="money-row"><span>Subtotal</span><b>' + invoiceMoney(cur, sub) + '</b></div>' + (discAmount ? '<div class="money-row"><span>Discount</span><b>- ' + invoiceMoney(cur, discAmount) + '</b></div>' : '') + (vat ? '<div class="money-row"><span>Tax / VAT</span><b>' + invoiceMoney(cur, vat) + '</b></div>' : '') + (documentLabel === 'Invoice' && paid > 0.01 ? '<div class="money-row"><span>Invoice total</span><b>' + invoiceMoney(cur, total) + '</b></div><div class="money-row"><span>Paid</span><b>- ' + invoiceMoney(cur, paid) + '</b></div>' : '') + '<div class="money-row grand' + (status === 'paid' && documentLabel === 'Invoice' ? ' settled' : '') + '"><span>' + (documentLabel !== 'Invoice' ? 'Total' : (status === 'partial' || status === 'paid' ? 'Balance due' : 'Total due')) + '</span><b>' + invoiceMoney(cur, documentLabel === 'Invoice' && paid > 0.01 ? balance : total) + '</b></div></div></section>' +
      '<div class="powered"><b>' + DEFAULT_INVOICE_FOOTER + '</b></div></div></body></html>';
  };

  window.clsBuildInvoicePreviewFrame = function(opts) {
    opts = opts || {};
    var html = window.clsBuildInvoicePrintHtml(opts);
    html = html.replace('</style>', '@media screen{html,body{width:100%;min-height:100%;background:#f7f3ed}.invoice-page{margin:0 auto!important;box-shadow:0 12px 32px rgba(44,31,20,.12)}}</style>');
    return '<iframe class="cls-invoice-preview-frame" title="Invoice preview — same A4 layout used for PDF" scrolling="no" srcdoc="' + invoiceEscape(html) + '"></iframe>';
  };

  window.clsFitInvoicePreviewFrame = function(container) {
    if (!container) return 1;
    var frame = container.querySelector('.cls-invoice-preview-frame');
    if (!frame) return 1;
    var baseWidth = 794;
    var baseHeight = 1123;
    var styles = window.getComputedStyle(container);
    var horizontalPadding = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    var available = Math.max(1, container.clientWidth - horizontalPadding);
    var scale = Math.min(1, available / baseWidth);
    frame.style.width = baseWidth + 'px';
    frame.style.height = baseHeight + 'px';
    frame.style.maxWidth = 'none';
    frame.style.margin = '0';
    frame.style.transformOrigin = 'top left';
    frame.style.transform = 'scale(' + scale + ')';
    container.style.height = Math.ceil(baseHeight * scale + (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0)) + 'px';
    container.style.minHeight = '0';
    container.style.overflow = 'hidden';
    return scale;
  };

  window.clsFitAllInvoicePreviews = function() {
    Array.prototype.forEach.call(document.querySelectorAll('.settings-invoice-preview'), function(container) {
      window.clsFitInvoicePreviewFrame(container);
    });
  };

  window.clsPrepareInvoiceLogo = function(file) {
    return new Promise(function(resolve, reject) {
      if (!file || !/^image\//i.test(file.type || '')) {
        reject(new Error('Please choose a PNG, JPG, or WebP image.'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('The logo must be smaller than 5 MB.'));
        return;
      }
      var reader = new FileReader();
      reader.onerror = function() { reject(new Error('The logo could not be read.')); };
      reader.onload = function() {
        var img = new Image();
        img.onerror = function() { reject(new Error('The selected image is not valid.')); };
        img.onload = function() {
          var scale = Math.min(1, 720 / img.naturalWidth, 360 / img.naturalHeight);
          var width = Math.max(1, Math.round(img.naturalWidth * scale));
          var height = Math.max(1, Math.round(img.naturalHeight * scale));
          var canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          var result = canvas.toDataURL('image/png');
          if (result.length > 420000) {
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, width, height);
            result = canvas.toDataURL('image/jpeg', 0.84);
          }
          if (result.length > 700000) {
            reject(new Error('The logo is still too large after optimization. Please use a simpler image.'));
            return;
          }
          resolve(result);
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  };

  function fieldTimestamp() {
    try {
      if (window.firebase && firebase.firestore && firebase.firestore.FieldValue) {
        return firebase.firestore.FieldValue.serverTimestamp();
      }
    } catch (e) {}
    return nowIso();
  }

  function makePaymentRequestToken(plan) {
    var prefix = 'CLS-' + String(plan || 'solo').toUpperCase().slice(0, 3) + '-';
    var randomPart = '';
    try {
      var arr = new Uint32Array(2);
      window.crypto.getRandomValues(arr);
      randomPart = Array.prototype.map.call(arr, function(n) {
        return n.toString(36).toUpperCase();
      }).join('');
    } catch (e) {
      randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
    }
    return prefix + Date.now().toString(36).toUpperCase() + '-' + randomPart.slice(0, 8);
  }

  function bestPlan(profile, plan) {
    return normalizePlan(plan)
      || normalizePlan(profile && profile.currentPlan)
      || normalizePlan(profile && profile.plan)
      || normalizePlan(profile && profile.requestedPlan)
      || normalizePlan(profile && profile.lastPlan)
      || rememberedPlan()
      || planFromPath()
      || 'solo';
  }

  function enforceRememberedPlanRoute() {
    var pathPlan = planFromPath();
    if (!pathPlan) return;
    var targetPlan = rememberedPlan();
    if (!targetPlan || planRank(targetPlan) <= planRank(pathPlan)) return;
    var user = getAuthUser();
    var savedUid = safeGet('cls-plan-uid');
    if (!user || !user.uid || !savedUid || savedUid !== user.uid) return;
    var dest = window.clsPlanFileFor(targetPlan);
    var current = (location.pathname || '').split('/').pop() || 'index.html';
    if (dest && current !== dest) window.location.replace(dest);
  }

  window.clsEnforceRememberedPlanRoute = enforceRememberedPlanRoute;
  window.addEventListener('pageshow', function() {
    enforceRememberedPlanRoute();
    setTimeout(enforceRememberedPlanRoute, 250);
  });

  window.clsIsProfilePaid = function clsIsProfilePaid(profile) {
    return isProfilePaidRecord(profile);
  };

  window.clsPaidLockedPlan = paidLockedPlan;

  window.clsIsAccountPaused = function clsIsAccountPaused(profile) {
    profile = profile || {};
    var status = String(profile.subscriptionStatus || '').toLowerCase();
    return profile.accountPaused === true || status === 'paused';
  };

  function profileName(profile, user) {
    return (profile && (profile.name || profile.displayName || profile.username))
      || (user && user.displayName)
      || '';
  }

  function profileEmail(profile, user) {
    return (profile && profile.email) || (user && user.email) || '';
  }

  function dateMs(value) {
    if (!value) return 0;
    if (value && typeof value.toDate === 'function') return value.toDate().getTime();
    var ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : 0;
  }

  function isHttpUrl(value) {
    return /^https?:\/\//i.test(String(value || '').trim());
  }

  function customPaymentLink(profile, plan, cycle) {
    profile = profile || {};
    plan = normalizePlan(plan) || bestPlan(profile, plan);
    cycle = cycle === 'monthly' ? 'monthly' : 'annual';
	    var expiresAt = dateMs(profile.paymentLinkExpiresAt || profile.customPaymentLinkExpiresAt);
	    if (expiresAt && expiresAt <= Date.now()) return '';
	    var linkCycle = String(profile.paymentLinkCycle || profile.customPaymentLinkCycle || '').toLowerCase();
	    if (linkCycle && linkCycle !== cycle && linkCycle !== 'any') return '';
	    var details = PLAN_DETAILS[plan] || PLAN_DETAILS.solo;
	    var defaultLink = cycle === 'monthly' ? details.monthlyPayLink : details.annualPayLink;
	    var otherDefaultLink = cycle === 'monthly' ? details.annualPayLink : details.monthlyPayLink;
	    var direct = profile.paymentCustomPayLink || profile.customPaymentLink || profile.paymentLink || '';
	    if (isHttpUrl(direct)) {
	      direct = String(direct).trim();
	      if (linkCycle || direct === defaultLink || direct !== otherDefaultLink) return direct;
	    }
	    var keyed = cycle === 'monthly'
	      ? (profile.paymentMonthlyPayLink || profile.monthlyPayLink || '')
	      : (profile.paymentAnnualPayLink || profile.annualPayLink || '');
	    if (isHttpUrl(keyed) && keyed !== defaultLink) return String(keyed).trim();
    return '';
  }

  function paymentLinkFor(profile, plan, cycle) {
    plan = bestPlan(profile, plan);
    cycle = cycle === 'monthly' ? 'monthly' : 'annual';
    var details = PLAN_DETAILS[plan] || PLAN_DETAILS.solo;
    return customPaymentLink(profile, plan, cycle) || planPaymentLink(details, cycle);
  }

  window.clsPaymentLinkFor = paymentLinkFor;

  window.clsRequestPlanChange = async function clsRequestPlanChange(targetPlan, profile, opts) {
    opts = opts || {};
    profile = profile || window._profile || {};
    targetPlan = normalizePlan(targetPlan);
    if (!targetPlan) return null;
    var currentPlan = paidLockedPlan(profile) || bestPlan(profile, opts.currentPlan);
    if (currentPlan === targetPlan) return null;
    if (planRank(targetPlan) <= planRank(currentPlan)) {
      if (opts.silent !== true) alert('Your assigned system is locked. Plan changes can only be completed by the CeylonryLabs administrator.');
      return null;
    }
    var user = getAuthUser();
    var uid = opts.uid || (user && user.uid) || profile.uid || profile.ownerUid || '';
    var db = getFirestore(opts.db);
    var details = PLAN_DETAILS[targetPlan] || PLAN_DETAILS.solo;
    var currentDetails = PLAN_DETAILS[currentPlan] || PLAN_DETAILS.solo;
    var direction = planRank(targetPlan) > planRank(currentPlan) ? 'upgrade' : 'plan change';
    var message = 'Plan ' + direction + ' request\n\n' +
      'Current plan: ' + currentDetails.name + '\n' +
      'Requested plan: ' + details.name + '\n' +
      'Name: ' + (profileName(profile, user) || 'Customer') + '\n' +
      'Email: ' + (profileEmail(profile, user) || '') + '\n' +
      'Page: ' + location.href;
    var payload = {
      uid: uid,
      ownerUid: plainText(profile.ownerUid || uid, 160),
      name: plainText(profileName(profile, user), 180),
      email: plainText(profileEmail(profile, user), 180).toLowerCase(),
      currentPlan: currentPlan,
      requestedPlan: targetPlan,
      requestedPlanName: details.name,
      requestType: direction,
      status: 'open',
      notifyEmail: 'hello@ceylonrylabs.io',
      source: opts.source || 'customer-plan-change',
      page: location.href,
      message: message,
      updatedAt: fieldTimestamp(),
      updatedAtUtc: nowIso()
    };
    var requestId = 'plan-change-' + (uid || 'guest') + '-' + targetPlan;
    var sentKey = 'cls-plan-change-request-' + requestId;
    var alreadySent = safeGet(sentKey);
    var pendingOpenRequest = false;
    try {
      if (db && uid) {
        var ref = db.collection('upgradeRequests').doc(requestId);
        var snap = await ref.get();
        pendingOpenRequest = !!(snap.exists && String((snap.data() || {}).status || 'open').toLowerCase() !== 'closed');
        if (!snap.exists) {
          payload.createdAt = fieldTimestamp();
          payload.createdAtUtc = nowIso();
        }
        await ref.set(payload, { merge: true });
      }
      if (!pendingOpenRequest && (!alreadySent || Date.now() - Number(alreadySent || 0) > 86400000)) {
        try {
          await fetch('/.netlify/functions/submit-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: payload.name || 'Customer',
              email: payload.email,
              type: 'Plan upgrade request',
              priority: 'High',
              message: message,
              page: location.href,
              uid: uid,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
              utcAt: nowIso()
            })
          });
        } catch (e) {
          if (db && uid) {
            await db.collection('supportTickets').add(Object.assign({}, payload, {
              type: 'Plan upgrade request',
              priority: 'High',
              createdAt: fieldTimestamp()
            }));
          }
        }
        safeSet(sentKey, String(Date.now()));
      }
      if (opts.silent !== true) alert(pendingOpenRequest
        ? 'Your upgrade request is already pending. Your current system remains active until the administrator confirms payment and completes the upgrade.'
        : 'Your upgrade request has been sent to CeylonryLabs. Your current system remains active until the administrator confirms payment and completes the upgrade.');
      return payload;
    } catch (e) {
      console.warn('Plan change request failed:', e);
      if (opts.silent !== true) {
        alert('Could not send the request automatically. Please email hello@ceylonrylabs.io with your requested plan.');
      }
      throw e;
    }
  };

  window.clsOpenPlanWhatsApp = function clsOpenPlanWhatsApp(plan, profile) {
    plan = bestPlan(profile, plan);
    var details = PLAN_DETAILS[plan] || PLAN_DETAILS.solo;
    var user = getAuthUser();
    var msg = encodeURIComponent(
      'Hi CeylonryLabs! I would like to activate my ' + details.name +
      ' Plan (' + planAnnualLine(details) + ', ' + planMonthlyLine(details) + ').' +
      '\n\nName: ' + profileName(profile, user) +
      '\nEmail: ' + profileEmail(profile, user)
    );
    window.open('https://wa.me/94778815628?text=' + msg, '_blank');
  };

  function planPaymentLink(details, cycle) {
    details = details || PLAN_DETAILS.solo;
    return cycle === 'monthly' ? details.monthlyPayLink : details.annualPayLink;
  }

  window.clsOpenGeniePayment = function clsOpenGeniePayment(plan, cycle, opts) {
    opts=opts||{};return window.clsOpenBankTransferPayment(plan,opts.profile||window._profile||{});
  };

  window.clsStartPayableCheckout = async function clsStartPayableCheckout(plan, opts) {
    opts = opts || {};
    var profile = opts.profile || window._profile || null;
    plan = bestPlan(profile, plan || opts.plan);
    var details = PLAN_DETAILS[plan] || PLAN_DETAILS.solo;
    var monthlyPayLink = paymentLinkFor(profile, plan, 'monthly');
    var annualPayLink = paymentLinkFor(profile, plan, 'annual');
    var customPayLink = customPaymentLink(profile, plan, 'monthly') || customPaymentLink(profile, plan, 'annual');
    var paymentLinkExpiresAt = plainText(profile.paymentLinkExpiresAt || profile.customPaymentLinkExpiresAt || '', 80);
    if (!opts.forcePayable && details.annualPayLink) {
      window.clsOpenGeniePayment(plan, 'annual', opts);
      return;
    }
    var user = getAuthUser();
    if (!user || !user.getIdToken) {
      alert('Please sign in again before starting payment.');
      window.location.href = 'signin.html';
      return;
    }

    var btn = opts.button || (document.activeElement && document.activeElement.tagName ? document.activeElement : null);
    var oldText = btn && 'textContent' in btn ? btn.textContent : '';
    if (btn && 'disabled' in btn) {
      btn.disabled = true;
      btn.textContent = 'Opening payment...';
    }

    try {
      var token = await user.getIdToken();
      var res = await fetch('/.netlify/functions/payable-create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          plan: plan,
          amount: details.price,
          currency: 'LKR',
          billingCycle: 'monthly',
          uid: user.uid,
          email: profileEmail(profile, user),
          name: profileName(profile, user),
          returnUrl: location.origin + '/payable-return.html?plan=' + encodeURIComponent(plan),
          cancelUrl: location.href
        })
      });
      var out = await res.json().catch(function() { return {}; });
      if (!res.ok || !out.ok) {
        throw new Error(out.error || 'Could not start checkout.');
      }
      if (!out.checkoutUrl) {
        throw new Error('Payment provider did not return a checkout URL.');
      }
      window.location.href = out.checkoutUrl;
    } catch (e) {
      console.error('Checkout error:', e);
      alert((e && e.message ? e.message : 'Could not start checkout.') + '\n\nYou can still activate through WhatsApp while payment is being configured.');
      window.clsOpenPlanWhatsApp(plan, profile);
      if (btn && 'disabled' in btn) {
        btn.disabled = false;
        btn.textContent = oldText;
      }
    }
  };

  window.clsStartCurrentPlanPayment = function clsStartCurrentPlanPayment() {
    return window.clsStartPayableCheckout();
  };

  window.clsEnsurePaymentRequest = async function clsEnsurePaymentRequest(profile, opts) {
    opts = opts || {};
    profile = profile || {};
    var user = getAuthUser();
    var db = getFirestore(opts.db);
    if (!user || !user.uid || !db) return null;
    if (!opts.force && (window.clsIsProfilePaid(profile) || window.clsIsAccountPaused(profile))) return null;

    var trialEnd = profile.trialEnd ? new Date(profile.trialEnd) : null;
    if (!opts.force && (!trialEnd || isNaN(trialEnd.getTime()) || Date.now() <= trialEnd.getTime())) return null;

    var plan = bestPlan(profile, opts.plan);
    var details = PLAN_DETAILS[plan] || PLAN_DETAILS.solo;
    var storageKey = 'cls-payment-request-' + user.uid + '-' + plan;
    var token = plainText(profile.paymentRequestToken || safeGet(storageKey), 80);
    if (!token) {
      token = makePaymentRequestToken(plan);
      safeSet(storageKey, token);
    }

    var request = {
      token: token,
      uid: user.uid,
      ownerUid: plainText(profile.ownerUid || user.uid, 160),
      name: plainText(profileName(profile, user), 180),
      email: plainText(profileEmail(profile, user), 180).toLowerCase(),
      businessName: plainText(profile.bizName || profile.invoiceBiz || profile.businessName || '', 180),
      plan: plan,
      planName: details.name,
      amount: details.monthlyPrice || 0,
      monthlyAmount: details.monthlyPrice || 0,
      annualAmount: details.price,
      monthlyPayLink: monthlyPayLink || '',
      annualPayLink: annualPayLink || '',
      defaultMonthlyPayLink: details.monthlyPayLink || '',
      defaultAnnualPayLink: details.annualPayLink || '',
	      paymentLink: monthlyPayLink || '',
	      customPaymentLink: customPayLink || '',
	      paymentLinkCycle: 'monthly',
	      paymentLinkExpiresAt: paymentLinkExpiresAt,
      paymentProvider: 'bank-transfer',
      billingCycle: 'monthly',
      currency: 'LKR',
      trialEnd: trialEnd && !isNaN(trialEnd.getTime()) ? trialEnd.toISOString() : '',
      status: 'pending',
      source: opts.source || 'trial-expired',
      page: location.pathname,
      updatedAt: fieldTimestamp(),
      updatedAtUtc: nowIso()
    };
    var userUpdate = {
      paymentRequestToken: token,
      paymentRequestStatus: 'pending',
      paymentRequestPlan: plan,
      paymentRequestAmount: details.monthlyPrice || 0,
      paymentRequestMonthlyAmount: details.monthlyPrice || 0,
      paymentRequestAnnualAmount: details.price,
      paymentProvider: 'bank-transfer',
      paymentMonthlyPayLink: monthlyPayLink || '',
      paymentAnnualPayLink: annualPayLink || '',
	      paymentLink: monthlyPayLink || '',
	      customPaymentLink: customPayLink || '',
	      paymentLinkCycle: 'monthly',
	      paymentLinkExpiresAt: paymentLinkExpiresAt,
      billingCycle: 'monthly',
      manualPaymentStatus: 'payment-requested',
      updatedAt: fieldTimestamp()
    };

    try {
      var requestRef = db.collection('paymentRequests').doc(token);
      var existing = await requestRef.get();
      var existingData = existing.exists ? (existing.data() || {}) : {};
      if (!existing.exists) {
        request.createdAt = fieldTimestamp();
        request.createdAtUtc = nowIso();
      } else {
        delete request.status;
        delete request.createdAt;
        delete request.createdAtUtc;
      }
      await requestRef.set(request, { merge: true });
      if (existingData.status) userUpdate.paymentRequestStatus = existingData.status;
      await db.collection('users').doc(user.uid).set(userUpdate, { merge: true });
      profile.paymentRequestToken = token;
      profile.paymentRequestStatus = userUpdate.paymentRequestStatus;
      profile.paymentRequestPlan = plan;
      profile.paymentRequestAmount = details.monthlyPrice || 0;
      return request;
    } catch (e) {
      console.warn('Payment request token could not be saved:', e);
      return { token: token, plan: plan, planName: details.name, amount: details.monthlyPrice || 0, unsaved: true };
    }
  };

	  window.clsRenderSubscriptionPaywall = function clsRenderSubscriptionPaywall(profile, opts) {
    opts = opts || {};
    if (document.getElementById('cls-paywall')) return;
    profile = profile || {};
    var plan = bestPlan(profile, opts.plan);
    var details = PLAN_DETAILS[plan] || PLAN_DETAILS.solo;
    var user = getAuthUser();
    var trialEnd = profile.trialEnd ? new Date(profile.trialEnd) : null;
    var trialText = trialEnd && !isNaN(trialEnd.getTime())
      ? 'Your 15-day free trial ended on ' + trialEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '.'
      : 'Your 15-day free trial has ended.';

    var ov = document.createElement('div');
    ov.id = 'cls-paywall';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(26,23,20,.96);backdrop-filter:blur(12px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:2rem;font-family:DM Sans,Inter,Arial,sans-serif;';
    ov.innerHTML =
      '<div style="background:#fff;max-width:540px;width:100%;padding:3rem;text-align:center;color:#1a1714;">' +
        '<div style="font-family:Cormorant Garamond,Georgia,serif;font-size:2rem;font-weight:300;margin-bottom:.55rem">Payment required</div>' +
        '<div style="font-size:.86rem;color:#6B6258;line-height:1.7;margin-bottom:1.6rem">' + trialText + '<br>Pay your <strong>CLS ' + details.name + '</strong> monthly package by bank transfer to continue using your dashboard and data.</div>' +
        '<div style="background:#F7F5F0;border:1px solid rgba(184,146,42,.25);padding:1.45rem;margin-bottom:1.5rem">' +
          '<div style="font-family:Cormorant Garamond,Georgia,serif;font-size:2.25rem;font-weight:300">' + money(details.monthlyPrice) + '<span style="font-size:1rem;color:#6B6258">/mo</span></div>' +
          '<div style="font-size:.78rem;color:#6B6258;margin-top:.25rem">' + details.name + ' Plan · monthly bank transfer</div>' +
        '</div>' +
        '<div id="cls-payment-request-token" style="background:#fff8ea;border:1px solid rgba(184,146,42,.28);padding:.8rem 1rem;margin:-.5rem 0 1rem;color:#6B6258;font-size:.74rem;line-height:1.55">Creating a manual payment request for admin...</div>' +
        '<button id="cls-genie-action" type="button" style="display:block;width:100%;background:#1a1714;color:#fff;border:0;padding:1rem;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700;cursor:pointer;margin-bottom:.75rem;font-family:inherit">Pay by bank transfer</button>' +
        '<button id="cls-wa-action" type="button" style="display:block;width:100%;background:#fff;color:#6B6258;border:1px solid rgba(184,146,42,.35);padding:.85rem;font-size:.74rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700;cursor:pointer;font-family:inherit">Activate via WhatsApp</button>' +
        '<button onclick="window.clsSignOut&&window.clsSignOut()" type="button" style="margin-top:1rem;background:transparent;border:0;color:#A8A29A;font-size:.72rem;cursor:pointer;font-family:inherit">Sign out</button>' +
        '<div style="font-size:.68rem;color:#A8A29A;margin-top:1rem">Your data stays saved while payment is completed.</div>' +
      '</div>';
    document.body.appendChild(ov);
    window.clsEnsurePaymentRequest(profile, { plan: plan, force: true }).then(function(req) {
      var tokenEl = document.getElementById('cls-payment-request-token');
      if (!tokenEl) return;
      if (req && req.token) {
        tokenEl.innerHTML = 'Manual payment request token: <strong style="color:#1a1714;letter-spacing:.06em">' + escapeHtml(req.token) + '</strong><br>CeylonryLabs admin can use this token to send the invoice manually.';
      } else {
        tokenEl.textContent = 'Admin will be able to review this expired trial from the payment request list.';
      }
    });
    document.getElementById('cls-genie-action').addEventListener('click', function() {
      window.clsOpenBankTransferPayment(plan, profile);
    });
    document.getElementById('cls-wa-action').addEventListener('click', function() {
      window.clsOpenPlanWhatsApp(plan, profile || { email: user && user.email });
    });
	  };

  function bankDetailsHtml() {
    return '<div class="cls-bank-details"><strong>Bank Details</strong><div><span>Account Name</span><b>'+escapeHtml(CLS_BANK.accountName)+'</b></div><div><span>Bank</span><b>'+escapeHtml(CLS_BANK.bank)+'</b></div><div><span>Account Number</span><b>'+escapeHtml(CLS_BANK.accountNumber)+'</b></div><div><span>Branch</span><b>'+escapeHtml(CLS_BANK.branch)+'</b></div></div>';
  }
  function billingDueDate(profile) {
    profile=profile||{};var paid=isProfilePaidRecord(profile),raw=paid?(profile.nextPaymentDue||profile.subscriptionCurrentPeriodEnd):(profile.trialEnd||profile.trialEndsAt),ms=dateMs(raw);
    return ms?new Date(ms):new Date(Date.now()+(paid?30:0)*86400000);
  }
  function paymentTimelineHtml(profile) {
    profile=profile||{};var paid=isProfilePaidRecord(profile),due=billingDueDate(profile),reminder=new Date(due.getTime()-5*86400000),pause=new Date(due.getTime()+86400000),fmt=function(d){return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});};
    return '<div class="cls-payment-timeline"><strong>'+(paid?'Current monthly cycle':'Trial to paid timeline')+'</strong><div><i></i><span><b>'+fmt(reminder)+'</b> · '+(paid?'Monthly payment reminder':'Trial ending reminder')+'</span></div><div><i></i><span><b>'+fmt(due)+'</b> · '+(paid?'Next monthly payment due':'Trial ends · first payment becomes due')+'</span></div><div><i></i><span><b>'+(paid?fmt(pause):'After receipt')+'</b> · '+(paid?'Access pauses if no slip is uploaded':'First paid month begins and the next due date is set one month later')+'</span></div></div>';
  }
  function readReceiptFile(file) { return new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){resolve(String(reader.result||'').split(',')[1]||'');};reader.onerror=function(){reject(new Error('Could not read the payment slip.'));};reader.readAsDataURL(file);}); }
  window.clsSubmitSubscriptionReceipt=async function clsSubmitSubscriptionReceipt(file, profile, plan, statusEl) {
    profile=profile||window._profile||{};var details=PLAN_DETAILS[plan]||PLAN_DETAILS.solo,user=getAuthUser();
    if(!file)throw new Error('Choose a PDF or image of the payment slip.');
    if(file.size>3000000)throw new Error('Payment slip must be smaller than 3 MB.');
    var allowed=/^(application\/pdf|image\/(png|jpe?g|webp))$/i;if(!allowed.test(file.type))throw new Error('Upload a PDF, PNG, JPG, or WebP payment slip.');
    if(statusEl)statusEl.textContent='Uploading payment slip…';
    var base64=await readReceiptFile(file),period=new Date().toISOString().slice(0,7);
    var res=await fetch('/.netlify/functions/submit-subscription-receipt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fileBase64:base64,fileName:file.name,mimeType:file.type,name:profileName(profile,user),email:profileEmail(profile,user),businessName:profile.bizName||profile.invoiceBiz||profile.businessName||'',plan:details.name,amount:money(details.monthlyPrice),period:period})});
    var out=await res.json().catch(function(){return{};});if(!res.ok||!out.sent)throw new Error(out.error||'Payment slip could not be sent.');
    var next=new Date();next.setMonth(next.getMonth()+1);var update={paid:true,accountPaused:false,subscriptionStatus:'receipt-submitted',manualPaymentStatus:'receipt-submitted',lastPaymentSlipAt:fieldTimestamp(),lastPaymentSlipAtUtc:nowIso(),lastPaymentSlipName:cleanString(file.name,180),lastPaymentSlipType:cleanString(file.type,100),lastPaymentPeriod:period,nextPaymentDue:next.toISOString(),updatedAt:fieldTimestamp()};
    var db=getFirestore(),uid=profile.ownerUid||(user&&user.uid)||profile.uid||'';
    if(db&&uid){
      await db.collection('users').doc(uid).set(update,{merge:true});
      try{await db.collection('subscriptionPayments').doc(uid+'-'+period).set({uid:uid,email:profileEmail(profile,user),businessName:profile.bizName||profile.invoiceBiz||profile.businessName||'',plan:plan,period:period,amountLkr:details.monthlyPrice,currency:'LKR',status:'receipt-submitted',source:'bank-receipt',receiptName:cleanString(file.name,180),receivedAt:fieldTimestamp(),receivedAtUtc:nowIso()},{merge:true});}catch(ledgerError){console.warn('Subscription revenue ledger could not be updated:',ledgerError);}
    }
    Object.assign(profile,update);if(statusEl)statusEl.textContent='Thank you so much — your payment slip was sent to accounts@ceylonrylabs.io and access is active.';setTimeout(function(){var wall=document.getElementById('cls-paywall');if(wall)wall.remove();},1000);return true;
  };
  window.clsOpenBankTransferPayment=function clsOpenBankTransferPayment(plan,profile){
    profile=profile||window._profile||{};var trialMs=dateMs(profile.trialEnd||profile.trialEndsAt);if(!isProfilePaidRecord(profile)&&trialMs&&Date.now()<trialMs){alert('Your free trial is still active. Your first payment becomes due when the 15-day trial ends.');return;}plan=bestPlan(profile,plan);var details=PLAN_DETAILS[plan]||PLAN_DETAILS.solo,old=document.getElementById('cls-bank-payment-modal');if(old)old.remove();var wrap=document.createElement('div');wrap.id='cls-bank-payment-modal';wrap.className='cls-bank-modal';wrap.innerHTML='<div class="cls-bank-card"><button class="cls-bank-close" aria-label="Close">×</button><div class="cls-billing-kicker">Monthly subscription</div><h2>Start your paid month</h2><p>Transfer <b>'+escapeHtml(money(details.monthlyPrice))+'</b> for your '+escapeHtml(details.name)+' plan, then upload the payment slip. Your first paid month begins when the receipt is submitted.</p>'+bankDetailsHtml()+paymentTimelineHtml(profile)+'<label class="cls-receipt-upload">Payment slip<input type="file" accept="application/pdf,image/png,image/jpeg,image/webp"></label><button class="cls-bank-submit">Upload slip and start monthly cycle</button><div class="cls-bank-status">The attachment will be emailed securely to '+escapeHtml(CLS_BANK.email)+'.</div></div>';document.body.appendChild(wrap);wrap.querySelector('.cls-bank-close').onclick=function(){wrap.remove();};wrap.addEventListener('click',function(e){if(e.target===wrap)wrap.remove();});wrap.querySelector('.cls-bank-submit').onclick=async function(){var btn=this,status=wrap.querySelector('.cls-bank-status'),file=wrap.querySelector('input').files[0];try{btn.disabled=true;await window.clsSubmitSubscriptionReceipt(file,profile,plan,status);btn.textContent='Thank you — monthly cycle started';setTimeout(function(){wrap.remove();},1300);}catch(e){status.textContent=e.message||'Upload failed.';btn.disabled=false;}};
  };
  window.clsStartCurrentPlanPayment=function(){return window.clsOpenBankTransferPayment(null,window._profile||{});};
  window.clsRenderSubscriptionPaywall=function(profile,opts){opts=opts||{};if(document.getElementById('cls-paywall'))return;var plan=bestPlan(profile,opts.plan),details=PLAN_DETAILS[plan]||PLAN_DETAILS.solo,ov=document.createElement('div');ov.id='cls-paywall';ov.className='cls-bank-modal';ov.innerHTML='<div class="cls-bank-card cls-bank-paused"><div class="cls-billing-kicker">Payment overdue</div><h2>Access is temporarily paused</h2><p>Your monthly payment is more than one day overdue. Your data is safe. Transfer <b>'+escapeHtml(money(details.monthlyPrice))+'</b> and upload the payment slip to continue.</p>'+bankDetailsHtml()+paymentTimelineHtml(profile)+'<label class="cls-receipt-upload">Payment slip<input type="file" accept="application/pdf,image/png,image/jpeg,image/webp"></label><button class="cls-bank-submit">Upload slip and restore access</button><div class="cls-bank-status">The attachment will be emailed to '+escapeHtml(CLS_BANK.email)+'.</div><button class="cls-bank-signout" onclick="window.clsSignOut&&window.clsSignOut()">Sign out</button></div>';document.body.appendChild(ov);ov.querySelector('.cls-bank-submit').onclick=async function(){var btn=this,status=ov.querySelector('.cls-bank-status'),file=ov.querySelector('input').files[0];try{btn.disabled=true;await window.clsSubmitSubscriptionReceipt(file,profile,plan,status);btn.textContent='Thank you — access restored';}catch(e){status.textContent=e.message||'Upload failed.';btn.disabled=false;}};};

  function trialStartForPrompt(profile) {
    profile = profile || {};
    var start = dateMs(profile.trialStart || profile.trialStartedAt || profile.createdAt || profile.createdAtUtc);
    if (start) return start;
    var end = dateMs(profile.trialEnd || profile.trialEndsAt);
    return end ? end - (10 * 24 * 60 * 60 * 1000) : 0;
  }

  function injectTrialPromptStyle() {
    if (document.getElementById('cls-trial-day5-style')) return;
    var style = document.createElement('style');
    style.id = 'cls-trial-day5-style';
    style.textContent =
      '#cls-trial-day5-prompt{position:fixed;inset:0;background:rgba(26,23,20,.42);backdrop-filter:blur(5px);z-index:9998;display:flex;align-items:center;justify-content:center;padding:1.25rem;font-family:DM Sans,Inter,Arial,sans-serif;color:#1C1814}' +
      '#cls-trial-day5-prompt .cls-trial-card{position:relative;max-width:560px;width:100%;background:#fff;border:1px solid #DED7CC;box-shadow:0 24px 80px rgba(26,23,20,.24);padding:2.15rem}' +
      '#cls-trial-day5-prompt .cls-trial-close{position:absolute;right:.9rem;top:.85rem;width:34px;height:34px;border:1px solid #DED7CC;background:#fff;color:#1C1814;font-size:1.2rem;line-height:1;cursor:pointer}' +
      '#cls-trial-day5-prompt .cls-trial-kicker{font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:#B8922A;font-weight:800;margin-bottom:.35rem}' +
      '#cls-trial-day5-prompt .cls-trial-title{font-family:Cormorant Garamond,Georgia,serif;font-size:2.05rem;line-height:1.05;margin:0 2rem .7rem 0;font-weight:400}' +
      '#cls-trial-day5-prompt .cls-trial-copy{font-size:.9rem;line-height:1.7;color:#6B6258;margin-bottom:1.15rem}' +
      '#cls-trial-day5-prompt .cls-trial-price{border:1px solid rgba(184,146,42,.25);background:#F7F5F0;padding:1rem;margin-bottom:1rem;display:flex;justify-content:space-between;gap:.8rem;align-items:center;flex-wrap:wrap}' +
      '#cls-trial-day5-prompt .cls-trial-price strong{font-family:Cormorant Garamond,Georgia,serif;font-size:1.65rem;font-weight:500;color:#1C1814}' +
      '#cls-trial-day5-prompt .cls-trial-actions{display:grid;grid-template-columns:1fr 1fr;gap:.7rem;margin-top:1rem}' +
      '#cls-trial-day5-prompt button{font-family:inherit}' +
      '#cls-trial-day5-prompt .cls-trial-primary{border:0;background:#1C1814;color:#fff;padding:.95rem 1rem;font-size:.72rem;letter-spacing:.13em;text-transform:uppercase;font-weight:800;cursor:pointer}' +
      '#cls-trial-day5-prompt .cls-trial-secondary{border:1px solid rgba(184,146,42,.35);background:#fff;color:#6B6258;padding:.95rem 1rem;font-size:.72rem;letter-spacing:.13em;text-transform:uppercase;font-weight:800;cursor:pointer}' +
      '#cls-trial-day5-prompt .cls-trial-status{font-size:.68rem;color:#8B8176;line-height:1.5;margin-top:.85rem}' +
      '@media(max-width:640px){#cls-trial-day5-prompt{align-items:flex-end;padding:.8rem}#cls-trial-day5-prompt .cls-trial-card{padding:1.55rem}#cls-trial-day5-prompt .cls-trial-actions{grid-template-columns:1fr}#cls-trial-day5-prompt .cls-trial-title{font-size:1.7rem}}' +
      '@media print{#cls-trial-day5-prompt{display:none!important}}';
    document.head.appendChild(style);
  }

  function dismissTrialPrompt(key) {
    safeSet(key, new Date().toISOString().slice(0, 10));
    var prompt = document.getElementById('cls-trial-day5-prompt');
    if (prompt && prompt.parentNode) prompt.parentNode.removeChild(prompt);
  }

  window.clsMaybeShowDay5PaymentPrompt = function clsMaybeShowDay5PaymentPrompt(profile, opts) {
    opts = opts || {};
    if (!isPortalPath()) return;
    if (document.getElementById('cls-paywall') || document.getElementById('cls-trial-day5-prompt')) return;
    profile = profile || window._profile || {};
    if ((!profile || !Object.keys(profile).length) && (opts.retries || 0) < 12) {
      setTimeout(function() {
        window.clsMaybeShowDay5PaymentPrompt(window._profile, { retries: (opts.retries || 0) + 1 });
      }, 1200);
      return;
    }
    if (window.clsIsProfilePaid(profile) || window.clsIsAccountPaused(profile)) return;
    var start = trialStartForPrompt(profile);
    var trialEndMs = dateMs(profile.trialEnd || profile.trialEndsAt);
    if (!start) return;
    var day5 = start + (5 * 24 * 60 * 60 * 1000);
    if (Date.now() < day5 || (trialEndMs && Date.now() > trialEndMs)) return;
    var user = getAuthUser();
    var plan = bestPlan(profile, opts.plan || planFromPath());
    var details = PLAN_DETAILS[plan] || PLAN_DETAILS.solo;
    var key = 'cls-day5-payment-prompt-' + ((user && user.uid) || profile.email || plan);
    if (safeGet(key) === new Date().toISOString().slice(0, 10)) return;

    injectTrialPromptStyle();
    var ov = document.createElement('div');
    ov.id = 'cls-trial-day5-prompt';
    ov.innerHTML =
      '<div class="cls-trial-card" role="dialog" aria-modal="true" aria-labelledby="cls-trial-day5-title">' +
        '<button type="button" class="cls-trial-close" aria-label="Close">×</button>' +
        '<div class="cls-trial-kicker">Day 5 check-in</div>' +
        '<h2 id="cls-trial-day5-title" class="cls-trial-title">Are you happy with the system?</h2>' +
        '<div class="cls-trial-copy">If so, shall we proceed to the paid version? Your 15-day trial remains active, but activating now keeps your account uninterrupted after the trial.</div>' +
        '<div class="cls-trial-price"><span>' + escapeHtml(details.name) + ' monthly package</span><strong>' + escapeHtml(money(details.monthlyPrice || 0)) + '<span style="font-family:inherit;font-size:.9rem;color:#6B6258"> / mo</span></strong></div>' +
        '<div class="cls-trial-actions">' +
          '<button type="button" class="cls-trial-primary" data-trial-pay-monthly>Pay monthly</button>' +
          '<button type="button" class="cls-trial-secondary" data-trial-pay-annual>Annual option</button>' +
        '</div>' +
        '<button type="button" class="cls-trial-secondary" data-trial-later style="width:100%;margin-top:.7rem">Not now</button>' +
        '<div class="cls-trial-status" data-trial-status>We will create an admin payment request so support can follow up if the Bank transfer instructions expires.</div>' +
      '</div>';
    document.body.appendChild(ov);

    window.clsEnsurePaymentRequest(profile, { plan: plan, force: true, source: 'trial-day-5' }).then(function(req) {
      var status = ov.querySelector('[data-trial-status]');
      if (status && req && req.token) status.textContent = 'Payment request token: ' + req.token + '. Admin can update the Bank transfer instructions from the admin panel if it expires.';
    }).catch(function() {});

    ov.querySelector('.cls-trial-close').addEventListener('click', function() { dismissTrialPrompt(key); });
    ov.querySelector('[data-trial-later]').addEventListener('click', function() { dismissTrialPrompt(key); });
    ov.querySelector('[data-trial-pay-monthly]').addEventListener('click', function() {
      safeSet(key, new Date().toISOString().slice(0, 10));
      window.clsOpenBankTransferPayment(plan, profile);
    });
    ov.querySelector('[data-trial-pay-annual]').addEventListener('click', function() {
      safeSet(key, new Date().toISOString().slice(0, 10));
      window.clsOpenBankTransferPayment(plan, profile);
    });
  };

  window.clsRenderAccountPaused = function clsRenderAccountPaused(profile, opts) {
    opts = opts || {};
    if (document.getElementById('cls-paywall')) return;
    profile = profile || {};
    var plan = bestPlan(profile, opts.plan);
    var details = PLAN_DETAILS[plan] || PLAN_DETAILS.solo;
    var ov = document.createElement('div');
    ov.id = 'cls-paywall';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(26,23,20,.96);backdrop-filter:blur(12px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:2rem;font-family:DM Sans,Inter,Arial,sans-serif;';
    ov.innerHTML =
      '<div style="background:#fff;max-width:540px;width:100%;padding:3rem;text-align:center;color:#1a1714;">' +
        '<div style="font-family:Cormorant Garamond,Georgia,serif;font-size:2rem;font-weight:300;margin-bottom:.55rem">Account paused</div>' +
        '<div style="font-size:.86rem;color:#6B6258;line-height:1.7;margin-bottom:1.6rem">This <strong>CLS ' + details.name + '</strong> account has been paused by CeylonryLabs support. Your data is still saved.</div>' +
        '<button id="cls-wa-action" type="button" style="display:block;width:100%;background:#1a1714;color:#fff;border:0;padding:1rem;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700;cursor:pointer;margin-bottom:.75rem;font-family:inherit">Contact support</button>' +
        '<button onclick="window.clsSignOut&&window.clsSignOut()" type="button" style="background:transparent;border:0;color:#A8A29A;font-size:.72rem;cursor:pointer;font-family:inherit">Sign out</button>' +
        '<div style="font-size:.68rem;color:#A8A29A;margin-top:1rem">Admin can unpause this account after a manual payment or account review.</div>' +
      '</div>';
    document.body.appendChild(ov);
    document.getElementById('cls-wa-action').addEventListener('click', function() {
      var user = getAuthUser();
      var msg = encodeURIComponent('Hi CeylonryLabs! My Cashflow System account is paused. Please help me reactivate it.\n\nEmail: ' + profileEmail(profile, user));
      window.open('https://wa.me/94778815628?text=' + msg, '_blank');
    });
  };

  window.clsMountInvoiceNotifications = function clsMountInvoiceNotifications(opts) {
    opts = opts || {};
    var invoices = Array.isArray(opts.invoices) ? opts.invoices : [];
    var target = document.querySelector(opts.target || '.top-bar-right') || document.querySelector('.tb-right');
    if (!target) return;

    if (!document.getElementById('cls-notification-style')) {
      var style = document.createElement('style');
      style.id = 'cls-notification-style';
      style.textContent =
        '.cls-notify{position:relative;display:inline-flex;align-items:center;z-index:40}' +
        '.cls-notify-btn{position:relative;border:1px solid rgba(184,146,42,.36);background:#fff;color:#1a1714;min-width:38px;height:38px;padding:0 10px;font-family:DM Sans,Inter,Arial,sans-serif;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}' +
        '.cls-notify-btn.muted{opacity:.55}' +
        '.cls-notify-badge{position:absolute;right:-6px;top:-7px;min-width:18px;height:18px;border-radius:999px;background:#c0392b;color:#fff;font-size:10px;line-height:18px;text-align:center;padding:0 5px}' +
        '.cls-notify-panel{position:absolute;right:0;top:calc(100% + 10px);width:min(360px,calc(100vw - 28px));background:#fff;border:1px solid #DED7CC;box-shadow:0 18px 54px rgba(0,0,0,.18);padding:14px;display:none;color:#1a1714;text-align:left}' +
        '.cls-notify.open .cls-notify-panel{display:block}' +
        '.cls-notify-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;border-bottom:1px solid #E7DFD2;padding-bottom:10px;margin-bottom:10px}' +
        '.cls-notify-title{font-family:Cormorant Garamond,Georgia,serif;font-size:22px;line-height:1}' +
        '.cls-notify-copy{font-size:12px;color:#6B6258;line-height:1.45;margin-top:3px}' +
        '.cls-notify-mute{background:transparent;border:1px solid #DCD4C8;color:#6B6258;padding:7px 9px;font-family:inherit;font-size:10px;letter-spacing:.11em;text-transform:uppercase;font-weight:800;cursor:pointer;white-space:nowrap}' +
        '.cls-notify-list{display:grid;gap:8px;max-height:280px;overflow:auto}' +
        '.cls-notify-item{border-left:3px solid #B8922A;background:#F7F5F0;padding:9px 34px 9px 10px;font-size:12px;line-height:1.45;position:relative}' +
        '.cls-notify-item.bad{border-left-color:#c0392b;background:#FDECEA}' +
        '.cls-notify-item.warn{border-left-color:#B8922A;background:#FFF8EA}' +
        '.cls-notify-dismiss{position:absolute;right:7px;top:7px;width:22px;height:22px;border:0;background:transparent;color:#6B6258;font-size:17px;line-height:20px;cursor:pointer;border-radius:50%}.cls-notify-dismiss:hover,.cls-notify-dismiss:focus{background:#fff;color:#c0392b;outline:1px solid #DCD4C8}' +
        '.cls-notify-meta{font-size:10px;color:#6B6258;margin-top:3px}' +
        '@media(max-width:760px){.cls-notify-panel{right:-6px;width:calc(100vw - 22px)}}' +
        '@media print{.cls-notify{display:none!important}}';
      document.head.appendChild(style);
    }

    function amount(inv) {
      return Number(inv.amount != null ? inv.amount : (inv.total != null ? inv.total : 0)) || 0;
    }
    function paid(inv) {
      return Number(inv.paidAmount != null ? inv.paidAmount : (inv.paid != null ? inv.paid : 0)) || 0;
    }
    function balance(inv) {
      return Math.max(0, amount(inv) - paid(inv));
    }
    function dueMs(inv) {
      var raw = String(inv.due || inv.dueDate || inv.date || '').slice(0, 10);
      var ms = Date.parse(raw + 'T00:00:00');
      return Number.isFinite(ms) ? ms : 0;
    }
    function invoiceNo(inv) {
      return cleanString(typeof opts.getNumber === 'function' ? opts.getNumber(inv) : (inv.num || inv.id || 'Invoice'), 80);
    }
    function customer(inv) {
      return cleanString(typeof opts.getCustomer === 'function' ? opts.getCustomer(inv) : (inv.client || inv.customer || inv.name || 'Customer'), 120);
    }
    function formatAmount(n) {
      if (typeof opts.formatAmount === 'function') return opts.formatAmount(n);
      return money(n);
    }

    var today = new Date();
    var todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    var items = [];
    invoices.forEach(function(inv) {
      inv = inv || {};
      var status = String(inv.status || '').toLowerCase();
      var bal = balance(inv);
      if (status === 'paid' || bal <= 0.01) return;
      var due = dueMs(inv);
      var diff = due ? Math.floor((due - todayStart) / 86400000) : null;
      if (diff != null && diff < 0) {
        items.push({ cls: 'bad', title: invoiceNo(inv) + ' is overdue', meta: customer(inv) + ' · ' + Math.abs(diff) + ' day' + (Math.abs(diff) === 1 ? '' : 's') + ' late · ' + formatAmount(bal) });
      } else if (diff === 0) {
        items.push({ cls: 'warn', title: invoiceNo(inv) + ' is due today', meta: customer(inv) + ' · ' + formatAmount(bal) + ' outstanding' });
      } else if (diff != null && diff <= 7) {
        items.push({ cls: 'warn', title: invoiceNo(inv) + ' is due soon', meta: customer(inv) + ' · in ' + diff + ' day' + (diff === 1 ? '' : 's') + ' · ' + formatAmount(bal) });
      } else {
        items.push({ cls: '', title: invoiceNo(inv) + ' is pending', meta: customer(inv) + ' · ' + formatAmount(bal) + ' outstanding' });
      }
    });

    items.sort(function(a, b) {
      var order = { bad: 0, warn: 1, '': 2 };
      var av = Object.prototype.hasOwnProperty.call(order, a.cls) ? order[a.cls] : 2;
      var bv = Object.prototype.hasOwnProperty.call(order, b.cls) ? order[b.cls] : 2;
      return av - bv;
    });

    var user = getAuthUser();
    var key = 'cls-notifications-muted-' + (user && user.uid ? user.uid : (opts.plan || rememberedPlan() || planFromPath() || 'anon'));
    var dismissKey = 'cls-notifications-dismissed-' + (user && user.uid ? user.uid : (opts.plan || rememberedPlan() || planFromPath() || 'anon'));
    var dismissed = [];
    try { dismissed = JSON.parse(safeGet(dismissKey) || '[]'); } catch (e) { dismissed = []; }
    if (!Array.isArray(dismissed)) dismissed = [];
    function notificationId(item) {
      var raw = String(item.title || '') + '|' + String(item.meta || '');
      var hash = 0;
      for (var i = 0; i < raw.length; i++) hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
      return 'n' + Math.abs(hash);
    }
    items.forEach(function(item) { item.id = notificationId(item); });
    items = items.filter(function(item) { return dismissed.indexOf(item.id) === -1; });
    var muted = safeGet(key) === '1';
    var wrap = document.getElementById('cls-invoice-notifications');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'cls-invoice-notifications';
      wrap.className = 'cls-notify';
      target.insertBefore(wrap, target.firstChild || null);
    }
    var count = items.length;
    wrap.innerHTML =
      '<button type="button" class="cls-notify-btn ' + (muted ? 'muted' : '') + '" aria-label="Invoice notifications">🔔' +
        (!muted && count ? '<span class="cls-notify-badge">' + (count > 99 ? '99+' : count) + '</span>' : '') +
      '</button>' +
      '<div class="cls-notify-panel">' +
        '<div class="cls-notify-head"><div><div class="cls-notify-title">Invoice alerts</div><div class="cls-notify-copy">' + (count ? count + ' invoice' + (count === 1 ? '' : 's') + ' need attention.' : 'Nothing urgent right now.') + '</div></div><button type="button" class="cls-notify-mute">' + (muted ? 'Unmute' : 'Mute') + '</button></div>' +
        '<div class="cls-notify-list">' + (count ? items.slice(0, 12).map(function(item) {
          return '<div class="cls-notify-item ' + item.cls + '" data-notification-id="' + escapeHtml(item.id) + '"><button type="button" class="cls-notify-dismiss" aria-label="Dismiss ' + escapeHtml(item.title) + '">×</button><strong>' + escapeHtml(item.title) + '</strong><div class="cls-notify-meta">' + escapeHtml(item.meta) + '</div></div>';
        }).join('') : '<div class="cls-notify-copy">Paid and pending invoices will appear here when they need follow-up.</div>') + '</div>' +
      '</div>';
    wrap.querySelector('.cls-notify-btn').addEventListener('click', function(ev) {
      ev.stopPropagation();
      wrap.classList.toggle('open');
    });
    wrap.querySelector('.cls-notify-mute').addEventListener('click', function(ev) {
      ev.stopPropagation();
      safeSet(key, muted ? '' : '1');
      window.clsMountInvoiceNotifications(opts);
    });
    wrap.querySelectorAll('.cls-notify-dismiss').forEach(function(button) {
      button.addEventListener('click', function(ev) {
        ev.stopPropagation();
        var item = button.closest('[data-notification-id]');
        var id = item && item.getAttribute('data-notification-id');
        if (!id) return;
        if (dismissed.indexOf(id) === -1) dismissed.push(id);
        safeSet(dismissKey, JSON.stringify(dismissed.slice(-200)));
        window.clsMountInvoiceNotifications(opts);
      });
    });
    if (!window.__clsNotifyDismissBound) {
      window.__clsNotifyDismissBound = true;
      document.addEventListener('click', function(ev) {
        var node = document.getElementById('cls-invoice-notifications');
        if (node && !node.contains(ev.target)) node.classList.remove('open');
      });
    }
  };

  window.clsMountTrialCountdown = function clsMountTrialCountdown(opts) {
    opts = opts || {};
    var old = document.getElementById('cls-trial-countdown');
    if (old) old.remove();

    var profile = opts.profile || {};
    var end = opts.trialEnd ? new Date(opts.trialEnd) : new Date(profile.trialEnd || Date.now());
    if (!end || isNaN(end.getTime()) || window.clsIsProfilePaid(profile) || window.clsIsAccountPaused(profile)) return;

    var bar = document.createElement('div');
    bar.id = 'cls-trial-countdown';
    bar.innerHTML =
      '<div class="cls-trial-left">' +
        '<span class="cls-trial-dot"></span>' +
        '<span><strong>' + (opts.planName || 'Free') + ' trial</strong></span>' +
        '<span id="cls-trial-clock">Calculating...</span>' +
        '<span class="cls-trial-muted">left in your 15-day trial</span>' +
      '</div>' +
      '<button type="button" id="cls-trial-action">' + (opts.actionText || 'View plan') + '</button>';
    var dashboardView = document.getElementById('view-dashboard');
    if (dashboardView) {
      dashboardView.insertBefore(bar, dashboardView.firstElementChild || null);
    } else {
      document.body.appendChild(bar);
    }

    if (!document.getElementById('cls-platform-style')) {
      var style = document.createElement('style');
      style.id = 'cls-platform-style';
      style.textContent =
        '#cls-trial-countdown{position:static;width:100%;margin:0 0 18px;background:#1a1714;color:#fff;border:1px solid rgba(184,146,42,.35);box-shadow:0 10px 28px rgba(0,0,0,.08);padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:16px;font-family:DM Sans,Inter,Arial,sans-serif;font-size:13px}' +
        '#cls-trial-countdown .cls-trial-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
        '#cls-trial-countdown strong{letter-spacing:.08em;text-transform:uppercase;font-size:11px}' +
        '#cls-trial-clock{font-weight:700;color:#D4A840}' +
        '#cls-trial-countdown .cls-trial-muted{color:rgba(255,255,255,.65)}' +
        '#cls-trial-countdown .cls-trial-dot{width:8px;height:8px;border-radius:999px;background:#1a9e5c;box-shadow:0 0 0 5px rgba(26,158,92,.15)}' +
        '#cls-trial-action{background:#B8922A;color:#fff;border:0;padding:9px 16px;font-family:inherit;font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;cursor:pointer;white-space:nowrap}' +
        '#cls-trial-action:hover{background:#D4A840;transform:translateY(-1px)}' +
        '#cls-support-launcher{position:fixed;right:18px;bottom:86px;z-index:9300;background:#1a1714;color:#fff;border:1px solid rgba(184,146,42,.45);box-shadow:0 14px 38px rgba(0,0,0,.18);padding:11px 15px;font-family:DM Sans,Inter,Arial,sans-serif;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;cursor:pointer}' +
        '#cls-support-panel{position:fixed;right:18px;bottom:140px;z-index:9301;width:min(380px,calc(100vw - 36px));background:#fff;border:1px solid #E2DDD4;box-shadow:0 22px 70px rgba(0,0,0,.2);font-family:DM Sans,Inter,Arial,sans-serif;color:#1C1814;display:none}' +
        '#cls-support-panel.open{display:block}' +
        '#cls-support-panel .cls-sp-head{padding:16px 18px;border-bottom:2px solid #1a1714;display:flex;justify-content:space-between;align-items:center}' +
        '#cls-support-panel .cls-sp-title{font-family:Cormorant Garamond,Georgia,serif;font-size:24px}' +
        '#cls-support-panel .cls-sp-close{background:transparent;border:0;font-size:24px;color:#6B6258;cursor:pointer}' +
        '#cls-support-panel form{padding:16px 18px;display:grid;gap:10px}' +
        '#cls-support-panel label{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#6B6258;font-weight:700}' +
        '#cls-support-panel input,#cls-support-panel select,#cls-support-panel textarea{width:100%;border:1px solid #DCD4C8;background:#F7F5F0;padding:10px 12px;font-family:inherit;font-size:13px;color:#1C1814;outline:none}' +
        '#cls-support-panel textarea{min-height:96px;resize:vertical}' +
        '#cls-support-panel input:focus,#cls-support-panel select:focus,#cls-support-panel textarea:focus{border-color:#B8922A;background:#fff}' +
        '#cls-support-panel .cls-sp-submit{background:#1a1714;color:#fff;border:0;padding:12px 14px;font-size:11px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;cursor:pointer}' +
        '#cls-support-panel .cls-sp-submit:hover{background:#B8922A}' +
        '#cls-support-panel .cls-sp-status{font-size:12px;color:#6B6258;line-height:1.5}' +
        '@media(max-width:640px){#cls-trial-countdown{align-items:flex-start;flex-direction:column}#cls-trial-action{width:100%}}' +
        '@media print{#cls-trial-countdown,#cls-support-launcher,#cls-support-panel{display:none!important}}';
      document.head.appendChild(style);
    }

    var action = document.getElementById('cls-trial-action');
    if (action) {
      action.addEventListener('click', function() {
        if (typeof opts.onAction === 'function') opts.onAction();
      });
    }

    function renderClock() {
      var diff = end.getTime() - Date.now();
      var clock = document.getElementById('cls-trial-clock');
      if (!clock) return;
      if (diff <= 0) {
        clock.textContent = 'Trial ended';
        return;
      }
      var total = Math.floor(diff / 1000);
      var days = Math.floor(total / 86400);
      var hours = Math.floor((total % 86400) / 3600);
      var mins = Math.floor((total % 3600) / 60);
      var secs = total % 60;
      clock.textContent = days + 'd ' + String(hours).padStart(2, '0') + 'h ' + String(mins).padStart(2, '0') + 'm ' + String(secs).padStart(2, '0') + 's';
    }
    renderClock();
    return setInterval(renderClock, 1000);
  };

  async function currentUserPayload() {
    var user = getAuthUser();
    if (!user) return {};
    return { uid: user.uid, email: user.email || '', displayName: user.displayName || '' };
  }

	  function cleanString(value, max) {
	    value = String(value == null ? '' : value);
	    return max && value.length > max ? value.slice(0, max) : value;
	  }

  function escapeHtml(value) {
    return cleanString(value).replace(/[&<>"]/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  async function storeVisitFallback(payload) {
    return false;
  }

  function trackVisit() {
    if (location.protocol === 'file:') return;
    if (/ceylonry-admin\.html/i.test(location.pathname || '')) return;
    var visitorId = persistentId('cls-visitor-id', 'visitor');
    var sessionId = safeGet('cls-session-id');
    var sessionStarted = safeGet('cls-session-started');
    var sessionAge = sessionStarted ? Date.now() - Number(sessionStarted) : Infinity;
    if (!sessionId || !sessionStarted || sessionAge > 30 * 60 * 1000) {
      sessionId = newId('session');
      safeSet('cls-session-id', sessionId);
      safeSet('cls-session-started', String(Date.now()));
    }
    var payload = {
      eventType: 'page_view',
      visitId: newId('visit'),
      visitorId: visitorId,
      sessionId: sessionId,
      path: location.pathname,
      url: location.href,
      title: document.title || '',
      referrer: document.referrer || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      language: navigator.language || '',
      userAgent: navigator.userAgent || '',
      screen: (screen && screen.width ? screen.width + 'x' + screen.height : ''),
      utcAt: nowIso(),
      localAt: new Date().toString(),
      firstSeenAt: safeGet('cls-first-seen-at') || nowIso(),
      lastPlan: safeGet('cls-last-plan') || planFromPath(),
      pageKind: pageKind(),
      isLanding: isLandingPath(location.pathname),
      isPortal: isPortalPath()
    };
    if (!safeGet('cls-first-seen-at')) safeSet('cls-first-seen-at', payload.firstSeenAt);
    currentUserPayload().then(function(user) {
      Object.assign(payload, user);
      fetch('/.netlify/functions/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).then(function(res) {
        return res.json().catch(function() { return {}; });
      }).then(function(json) {
        if (!json || json.stored === false) return storeVisitFallback(payload);
        return true;
      }).catch(function() {
        return storeVisitFallback(payload);
      });
    });
  }

  async function saveSupportFallback(data) {
    var db = getFirestore();
    if (!db) throw new Error('Data storage is not available on this page.');
    var payload = Object.assign({}, data, {
      status: 'open',
      source: 'browser-fallback',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    var doc = await db.collection('supportTickets').add(payload);
    return doc.id;
  }

  function injectBillingCardStyle() {
    if (document.getElementById('cls-billing-card-style')) return;
    var style = document.createElement('style');
    style.id = 'cls-billing-card-style';
    style.textContent =
      'body [data-cls-fn="goBackToSolo"],body .btn-back-Studio,body [onclick*="goBackToStudio"]{display:none!important}' +
      '#cls-billing-widget{margin:0;border:1px solid #DED7CC;background:#fff;border-left:3px solid #1a9e5c;padding:1.35rem 1.45rem;font-family:DM Sans,Inter,Arial,sans-serif;color:#1C1814;min-width:0;border-radius:14px}' +
      '#cls-billing-widget .cls-billing-top{display:grid;grid-template-columns:1fr;gap:1.05rem;align-items:start}' +
      '#cls-billing-widget .cls-billing-kicker{font-size:.55rem;letter-spacing:.18em;text-transform:uppercase;color:#1a9e5c;font-weight:800;margin-bottom:.2rem}' +
      '#cls-billing-widget .cls-billing-title{font-family:Cormorant Garamond,Georgia,serif;font-size:1.7rem;line-height:1.08;margin-bottom:.35rem;color:#1C1814}' +
      '#cls-billing-widget .cls-billing-copy{font-size:.82rem;line-height:1.65;color:#6B6258;max-width:none}' +
      '#cls-billing-widget .cls-billing-price{font-family:Cormorant Garamond,Georgia,serif;font-size:2.15rem;line-height:1;color:#1C1814;margin-top:1rem}' +
      '#cls-billing-widget .cls-billing-sub{font-size:.76rem;color:#6B6258;margin-top:.35rem;line-height:1.45}' +
      '#cls-billing-widget .cls-billing-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem;align-items:stretch;width:100%}' +
      '#cls-billing-widget .cls-billing-pay,#cls-billing-widget .cls-billing-monthly,#cls-billing-widget .cls-billing-wa{border:0;background:#1C1814;color:#fff;padding:.82rem .9rem;font-family:inherit;font-size:.68rem;letter-spacing:.13em;text-transform:uppercase;font-weight:800;cursor:pointer;white-space:normal;min-height:44px;text-align:center}' +
      '#cls-billing-widget .cls-billing-monthly{background:#B8922A;color:#fff}' +
      '#cls-billing-widget .cls-billing-wa{background:#fff;color:#1C1814;border:1px solid rgba(184,146,42,.35);grid-column:1/-1}' +
      '#cls-billing-widget .cls-billing-pay:hover,#cls-billing-widget .cls-billing-monthly:hover{background:#1a9e5c}' +
      '#cls-billing-widget button:disabled{background:#e8e5dd!important;color:#777!important;cursor:not-allowed}' +
      '#cls-billing-widget .cls-billing-wa:hover{border-color:#B8922A;color:#B8922A}' +
      '#cls-billing-widget .cls-billing-status{margin-top:1rem;padding-top:.9rem;border-top:1px solid #E7DFD2;font-size:.74rem;color:#6B6258;line-height:1.5}' +
      '.cls-bank-modal{position:fixed;inset:0;background:rgba(8,8,8,.78);backdrop-filter:blur(8px);z-index:10000;display:grid;place-items:center;padding:1rem;overflow:auto}.cls-bank-card{position:relative;width:min(560px,100%);background:#fff;border-radius:22px;padding:clamp(1.25rem,4vw,2.3rem);box-shadow:0 24px 80px rgba(0,0,0,.28);font-family:Inter,Arial,sans-serif}.cls-bank-card h2{font-size:clamp(1.8rem,5vw,2.7rem);letter-spacing:-.055em;line-height:1;margin:.35rem 0 .8rem}.cls-bank-card>p{color:#60605b;line-height:1.55;font-size:.88rem}.cls-bank-close{position:absolute;right:1rem;top:1rem;border:0;background:#f1f0ec;border-radius:50%;width:36px;height:36px;font-size:1.4rem;cursor:pointer}.cls-bank-details{background:#f5f2ea;border-left:4px solid #d7a72f;padding:1rem;margin:1.1rem 0}.cls-bank-details>strong,.cls-payment-timeline>strong{display:block;margin-bottom:.65rem}.cls-bank-details>div{display:flex;justify-content:space-between;gap:1rem;padding:.27rem 0;font-size:.8rem}.cls-bank-details span{color:#68645d}.cls-bank-details b{text-align:right}.cls-payment-timeline{border:1px solid #dedbd4;border-radius:14px;padding:1rem;margin:1rem 0}.cls-payment-timeline>div{display:flex;gap:.65rem;align-items:center;padding:.28rem 0;font-size:.76rem;color:#605f5a}.cls-payment-timeline i{display:block;width:9px;height:9px;border-radius:50%;background:#d7a72f;flex:0 0 auto}.cls-receipt-upload{display:grid;gap:.4rem;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-top:1rem}.cls-receipt-upload input{width:100%;border:1px dashed #b8b3a9;border-radius:12px;padding:.85rem;background:#faf9f6}.cls-bank-submit{width:100%;margin-top:.8rem;border:0;border-radius:999px;background:#080808;color:#fff;padding:1rem;font:800 .72rem Inter,Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}.cls-bank-submit:disabled{opacity:.55}.cls-bank-status{margin-top:.75rem;font-size:.72rem;line-height:1.5;color:#68645d;text-align:center}.cls-bank-signout{display:block;margin:.75rem auto 0;border:0;background:none;color:#a23d32;cursor:pointer}.cls-billing-bank{margin-top:1rem;display:grid;gap:.75rem}.cls-billing-bank .cls-bank-details,.cls-billing-bank .cls-payment-timeline{margin:0}.cls-billing-bank .cls-bank-details{border-radius:12px}' +
      '.business-billing-clean,.studio-billing-clean{grid-template-columns:1fr!important}.business-plan-summary,.studio-billing-clean>div:first-child{display:none!important}' +
      '@media(min-width:1180px){#settings-billing-widgets #cls-billing-widget{padding:1.5rem 1.65rem}}' +
      '@media(max-width:760px){#settings-billing-widgets{margin-top:1rem!important}#cls-billing-widget{margin:0 0 1rem;padding:1.1rem}#cls-billing-widget .cls-billing-actions{grid-template-columns:1fr;gap:.8rem;margin-top:.2rem}#cls-billing-widget .cls-billing-pay,#cls-billing-widget .cls-billing-monthly,#cls-billing-widget .cls-billing-wa{width:100%}}' +
      '@media print{#cls-billing-widget{display:none!important}}';
    document.head.appendChild(style);
  }

  window.clsCanDirectTrialPlanSwitch=function clsCanDirectTrialPlanSwitch(){return false;};
  window.clsApplyTrialPlanSwitchVisibility=function clsApplyTrialPlanSwitchVisibility(profile){var allowed=window.clsCanDirectTrialPlanSwitch(profile);document.body.classList.toggle('cls-trial-ended',!allowed);return allowed;};

  function mountBillingWidget() {
    if (document.getElementById(BILLING_ID)) return;
    if (!isPortalPath()) return;
    var settingsView = document.getElementById('view-settings');
    if (!settingsView) {
      setTimeout(mountBillingWidget, 700);
      return;
    }
    injectBillingCardStyle();
	    var plan = normalizePlan((window._profile && (window._profile.currentPlan || window._profile.lockedPlan || window._profile.plan)) || planFromPath() || rememberedPlan()) || 'solo';
	    var details = PLAN_DETAILS[plan] || PLAN_DETAILS.solo;
	    var profile = window._profile || {};
	    var paid = window.clsIsProfilePaid(profile);
	    var canDirectSwitch=window.clsApplyTrialPlanSwitchVisibility(profile);
	    var nextPlan = canDirectSwitch?(plan === 'solo' ? 'studio' : (plan === 'studio' ? 'business' : '')):'';
	    var trialEndMs=dateMs(profile.trialEnd||profile.trialEndsAt),canPay=paid||!trialEndMs||Date.now()>=trialEndMs;
	    var nextDetails = nextPlan ? (PLAN_DETAILS[nextPlan] || PLAN_DETAILS.business) : null;
	    var periodEnd = profile.subscriptionCurrentPeriodEnd ? new Date(profile.subscriptionCurrentPeriodEnd) : null;
	    var periodCopy = periodEnd && !isNaN(periodEnd.getTime())
	      ? 'Active until ' + periodEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '.'
	      : (paid ? 'Your paid subscription is active.' : 'Your first payment becomes due when the 15-day trial ends. The monthly cycle begins after your receipt is submitted.');
	    var title = 'Monthly bank transfer';
	    var copy = 'Pay your CLS ' + details.name + ' monthly package directly to our Commercial Bank account. Upload the payment slip after transfer so it reaches our accounts team.';
	    var actionHtml = '<button type="button" class="cls-billing-monthly" data-billing-monthly'+(canPay?'':' disabled')+'>'+(canPay?'Pay by bank transfer':'Payment opens when trial ends')+'</button>'+(nextPlan?'<button type="button" class="cls-billing-pay" data-billing-request="'+escapeHtml(nextPlan)+'">Switch trial to '+escapeHtml(nextDetails.name)+'</button>':'');
	    var wrap = document.createElement('div');
	    wrap.id = BILLING_ID;
	    wrap.innerHTML =
	      '<div class="cls-billing-top">' +
	        '<div>' +
	          '<div class="cls-billing-kicker">Billing</div>' +
	          '<div class="cls-billing-title">' + escapeHtml(title) + '</div>' +
	          '<div class="cls-billing-copy">' + escapeHtml(copy) + '</div>' +
	          '<div class="cls-billing-price">' + escapeHtml(money(details.monthlyPrice || 0)) + '<span style="font-size:.9rem;color:#6B6258"> / mo</span></div>' +
	          '<div class="cls-billing-sub">' + escapeHtml(periodCopy) + '</div><div class="cls-billing-bank">'+bankDetailsHtml()+paymentTimelineHtml(profile)+'</div>' +
	        '</div>' +
	        '<div class="cls-billing-actions">' + actionHtml + '</div>' +
	      '</div>' +
	      '<div class="cls-billing-status" data-billing-status>After transfer, upload a PDF or image of the payment slip. It will be attached to an email sent to accounts@ceylonrylabs.io.</div>';
	    (document.getElementById('settings-billing-widgets') || settingsView).appendChild(wrap);
	    var monthlyBtn = wrap.querySelector('[data-billing-monthly]');
	    var annualBtn = wrap.querySelector('[data-billing-pay]');
	    var requestBtn = wrap.querySelector('[data-billing-request]');
	    var waBtn = wrap.querySelector('[data-billing-wa]');
	    if (monthlyBtn&&!monthlyBtn.disabled) monthlyBtn.addEventListener('click', function() { window.clsOpenBankTransferPayment(plan,window._profile||profile); });
	    if (requestBtn) requestBtn.addEventListener('click', function() {
	      var target = this.getAttribute('data-billing-request');
	      window.clsRequestPlanChange(target, window._profile || profile, { source: 'settings-billing-widget' });
	    });
	    if (waBtn) waBtn.addEventListener('click', function() {
	      window.clsOpenPlanWhatsApp(plan, window._profile || profile);
	    });
  }

	  function injectSupportCardStyle() {
    if (document.getElementById('cls-support-card-style')) return;
    var style = document.createElement('style');
    style.id = 'cls-support-card-style';
    style.textContent =
      '#cls-support-widget.cls-settings-support-card{margin-top:1rem;border:1px solid #DED7CC;background:#fff;border-left:3px solid #B8922A;padding:1rem 1.1rem;font-family:DM Sans,Inter,Arial,sans-serif;color:#1C1814}' +
      '.cls-settings-support-card .cls-support-top{display:grid;grid-template-columns:1fr auto;gap:1rem;align-items:center}' +
      '.cls-settings-support-card .cls-support-kicker{font-size:.55rem;letter-spacing:.18em;text-transform:uppercase;color:#B8922A;font-weight:700;margin-bottom:.2rem}' +
      '.cls-settings-support-card .cls-support-title{font-family:Cormorant Garamond,Georgia,serif;font-size:1.25rem;line-height:1.1;margin-bottom:.15rem;color:#1C1814}' +
      '.cls-settings-support-card .cls-support-copy{font-size:.76rem;line-height:1.55;color:#6B6258;max-width:560px}' +
      '.cls-settings-support-card .cls-support-toggle,.cls-settings-support-card .cls-sp-submit{border:0;background:#1C1814;color:#fff;padding:.72rem 1rem;font-family:inherit;font-size:.68rem;letter-spacing:.13em;text-transform:uppercase;font-weight:700;cursor:pointer;white-space:nowrap}' +
      '.cls-settings-support-card .cls-support-toggle:hover,.cls-settings-support-card .cls-sp-submit:hover{background:#B8922A}' +
      '.cls-settings-support-card .cls-support-form{display:none;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem;margin-top:1rem;padding-top:1rem;border-top:1px solid #E7DFD2}' +
      '.cls-settings-support-card.open .cls-support-form{display:grid}' +
      '.cls-settings-support-card .full{grid-column:1/-1}' +
      '.cls-settings-support-card label{display:block;font-size:.55rem;letter-spacing:.16em;text-transform:uppercase;color:#6B6258;font-weight:700;margin-bottom:.35rem}' +
      '.cls-settings-support-card input,.cls-settings-support-card select,.cls-settings-support-card textarea{width:100%;border:1px solid #DCD4C8;background:#F7F5F0;padding:.75rem .8rem;font-family:inherit;font-size:.78rem;color:#1C1814;outline:none;border-radius:0}' +
      '.cls-settings-support-card textarea{min-height:88px;resize:vertical}' +
	      '.cls-settings-support-card input:focus,.cls-settings-support-card select:focus,.cls-settings-support-card textarea:focus{border-color:#B8922A;background:#fff}' +
	      '.cls-settings-support-card .cls-sp-status{font-size:.72rem;color:#6B6258;line-height:1.5;align-self:center}' +
	      '.cls-settings-support-card .cls-ticket-list{grid-column:1/-1;border-top:1px solid #E7DFD2;margin-top:.9rem;padding-top:.9rem;display:grid;gap:.55rem}' +
	      '.cls-settings-support-card .cls-ticket-head{display:flex;justify-content:space-between;gap:.75rem;align-items:center}' +
	      '.cls-settings-support-card .cls-ticket-refresh{background:transparent;border:1px solid #DCD4C8;color:#6B6258;padding:.45rem .65rem;font-family:inherit;font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;font-weight:700;cursor:pointer}' +
	      '.cls-settings-support-card .cls-ticket-row{border:1px solid #E7DFD2;background:#F7F5F0;padding:.75rem;display:grid;gap:.35rem}' +
	      '.cls-settings-support-card .cls-ticket-meta{display:flex;gap:.45rem;flex-wrap:wrap;align-items:center;font-size:.66rem;color:#6B6258}' +
	      '.cls-settings-support-card .cls-ticket-pill{border-radius:999px;padding:.22rem .48rem;background:#fff2db;color:#a66f00;font-weight:800;text-transform:capitalize}' +
	      '.cls-settings-support-card .cls-ticket-pill.closed{background:#e2f5ea;color:#10834c}' +
	      '.cls-settings-support-card .cls-ticket-pill.open{background:#fde8e4;color:#c0392b}' +
	      '.cls-settings-support-card .cls-ticket-msg{font-size:.74rem;color:#1C1814;line-height:1.45;white-space:pre-wrap}' +
	      '.cls-settings-support-card .cls-ticket-close{justify-self:start;background:#fff;color:#1C1814;border:1px solid rgba(184,146,42,.35);padding:.45rem .7rem;font-family:inherit;font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;font-weight:800;cursor:pointer}' +
	      '.cls-settings-support-card .cls-live-chat{border-top:1px solid #E7DFD2;margin-top:1rem;padding-top:1rem;display:grid;gap:.75rem}' +
	      '.cls-settings-support-card .cls-chat-messages{border:1px solid #E7DFD2;background:#F7F5F0;min-height:150px;max-height:300px;overflow:auto;padding:.75rem;display:grid;gap:.55rem}' +
	      '.cls-settings-support-card .cls-chat-row{display:grid;gap:.18rem;max-width:86%;justify-self:start}' +
	      '.cls-settings-support-card .cls-chat-row.admin{justify-self:end;text-align:right}' +
	      '.cls-settings-support-card .cls-chat-bubble{background:#fff;border:1px solid #E7DFD2;padding:.65rem .75rem;font-size:.76rem;color:#1C1814;line-height:1.45;white-space:pre-wrap}' +
	      '.cls-settings-support-card .cls-chat-row.admin .cls-chat-bubble{background:#1C1814;color:#fff;border-color:#1C1814}' +
	      '.cls-settings-support-card .cls-chat-meta{font-size:.58rem;color:#8b8176;letter-spacing:.04em}' +
	      '.cls-settings-support-card .cls-chat-compose{display:grid;grid-template-columns:1fr auto;gap:.65rem;align-items:start}' +
	      '.cls-settings-support-card .cls-chat-compose textarea{min-height:54px}' +
	      '@media(max-width:760px){.cls-settings-support-card .cls-support-top,.cls-settings-support-card .cls-support-form{grid-template-columns:1fr}.cls-settings-support-card .cls-support-toggle,.cls-settings-support-card .cls-sp-submit{width:100%}}' +
	      '@media(max-width:760px){.cls-settings-support-card .cls-chat-compose{grid-template-columns:1fr}.cls-settings-support-card .cls-chat-row{max-width:100%}}' +
      '@media print{#cls-support-widget{display:none!important}}';
	    document.head.appendChild(style);
	  }

  function injectDangerZoneStyle() {
    if (document.getElementById('cls-danger-zone-style')) return;
    var style = document.createElement('style');
    style.id = 'cls-danger-zone-style';
    style.textContent =
      '#cls-danger-zone-widget{margin-top:1rem;border:1px solid #efc8c3;background:#fff;border-left:3px solid #c0392b;padding:1rem 1.1rem;font-family:DM Sans,Inter,Arial,sans-serif;color:#1C1814}' +
      '#cls-danger-zone-widget .cls-danger-top{display:grid;grid-template-columns:1fr auto;gap:1rem;align-items:center}' +
      '#cls-danger-zone-widget .cls-danger-kicker,.cls-danger-modal .cls-danger-kicker{font-size:.55rem;letter-spacing:.18em;text-transform:uppercase;color:#c0392b;font-weight:800;margin-bottom:.2rem}' +
      '#cls-danger-zone-widget .cls-danger-title,.cls-danger-modal .cls-danger-title{font-family:Cormorant Garamond,Georgia,serif;font-size:1.28rem;line-height:1.1;margin-bottom:.18rem;color:#1C1814}' +
      '#cls-danger-zone-widget .cls-danger-copy,.cls-danger-modal .cls-danger-copy{font-size:.76rem;line-height:1.58;color:#6B6258;max-width:680px}' +
      '#cls-danger-zone-widget .cls-danger-actions{display:flex;gap:.65rem;flex-wrap:wrap;justify-content:flex-end}' +
      '#cls-danger-zone-widget .cls-danger-btn,.cls-danger-modal .cls-danger-btn{border:1px solid #c0392b;background:#fff;color:#c0392b;padding:.72rem .9rem;font-family:inherit;font-size:.64rem;letter-spacing:.12em;text-transform:uppercase;font-weight:800;cursor:pointer;white-space:nowrap}' +
      '#cls-danger-zone-widget .cls-danger-btn.fill,.cls-danger-modal .cls-danger-btn.fill{background:#c0392b;color:#fff}' +
      '#cls-danger-zone-widget .cls-danger-btn:hover,.cls-danger-modal .cls-danger-btn:hover{background:#1C1814;border-color:#1C1814;color:#fff}' +
      '.cls-danger-modal{position:fixed;inset:0;z-index:10000;background:rgba(28,24,20,.74);display:flex;align-items:center;justify-content:center;padding:1.2rem;font-family:DM Sans,Inter,Arial,sans-serif;color:#1C1814}' +
      '.cls-danger-dialog{width:min(620px,100%);background:#fff;border:1px solid #efc8c3;box-shadow:0 24px 70px rgba(0,0,0,.25)}' +
      '.cls-danger-head{padding:1.25rem 1.35rem;border-bottom:1px solid #E7DFD2;display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}' +
      '.cls-danger-close{border:0;background:transparent;color:#6B6258;font-size:1.45rem;line-height:1;cursor:pointer}' +
      '.cls-danger-body{padding:1.25rem 1.35rem;display:grid;gap:.85rem}' +
      '.cls-danger-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem}' +
      '.cls-danger-step{height:4px;background:#eadfd3}.cls-danger-step.active{background:#c0392b}' +
      '.cls-danger-modal label{display:block;font-size:.55rem;letter-spacing:.16em;text-transform:uppercase;color:#6B6258;font-weight:800;margin-bottom:.35rem}' +
      '.cls-danger-modal select,.cls-danger-modal textarea,.cls-danger-modal input{width:100%;border:1px solid #DCD4C8;background:#F7F5F0;padding:.78rem .85rem;font-family:inherit;font-size:.82rem;color:#1C1814;outline:none;border-radius:0}' +
      '.cls-danger-modal textarea{min-height:130px;resize:vertical;line-height:1.5}' +
      '.cls-danger-modal select:focus,.cls-danger-modal textarea:focus,.cls-danger-modal input:focus{border-color:#c0392b;background:#fff}' +
      '.cls-danger-confirm{border:1px solid #efc8c3;background:#fff8f7;padding:.85rem;color:#6B6258;font-size:.76rem;line-height:1.55}' +
      '.cls-danger-status{font-size:.74rem;color:#6B6258;min-height:1.2rem}' +
      '.cls-danger-foot{padding:1rem 1.35rem;border-top:1px solid #E7DFD2;display:flex;justify-content:space-between;gap:.75rem;align-items:center}' +
      '@media(max-width:760px){#cls-danger-zone-widget .cls-danger-top{grid-template-columns:1fr}#cls-danger-zone-widget .cls-danger-actions{justify-content:stretch}#cls-danger-zone-widget .cls-danger-btn,.cls-danger-modal .cls-danger-btn{width:100%}.cls-danger-foot{display:grid}.cls-danger-steps{grid-template-columns:1fr 1fr 1fr}}' +
      '@media print{#cls-danger-zone-widget,.cls-danger-modal{display:none!important}}';
    document.head.appendChild(style);
  }

  function ticketTime(row) {
    var t = row && row.data || {};
    var raw = t.utcAt || t.createdAt || t.updatedAt || '';
    if (raw && raw.toDate) return raw.toDate().getTime();
    var ms = Date.parse(raw);
    return Number.isFinite(ms) ? ms : 0;
  }

  function ticketStatusClass(status) {
    status = String(status || 'open').toLowerCase();
    return status === 'closed' ? 'closed' : (status === 'open' ? 'open' : '');
  }

  async function readMySupportTickets() {
    var db = getFirestore();
    var user = getAuthUser();
    if (!db || !user) return [];
    var rows = {};
    async function collect(query) {
      try {
        var snap = await query.limit(12).get();
        snap.forEach(function(doc) {
          rows[doc.id] = { id: doc.id, data: doc.data() || {} };
        });
      } catch (e) {}
    }
    var reads = [collect(db.collection('supportTickets').where('uid', '==', user.uid))];
    if (user.email) reads.push(collect(db.collection('supportTickets').where('email', '==', String(user.email).toLowerCase())));
    await Promise.all(reads);
    return Object.keys(rows).map(function(id) { return rows[id]; }).sort(function(a, b) {
      return ticketTime(b) - ticketTime(a);
    }).slice(0, 8);
  }

  function renderMyTickets(target, tickets) {
    if (!target) return;
    if (!tickets.length) {
      target.innerHTML = '<div class="cls-sp-status">No support tickets yet.</div>';
      return;
    }
    target.innerHTML = tickets.map(function(row) {
      var t = row.data || {};
      var status = String(t.status || 'open').toLowerCase();
      var canClose = status !== 'closed';
      var msg = cleanString(t.message || '', 180);
      var when = t.utcAt || t.createdAt || '';
      return '<div class="cls-ticket-row">' +
        '<div class="cls-ticket-meta"><span class="cls-ticket-pill ' + ticketStatusClass(status) + '">' + escapeHtml(cleanString(status, 40)) + '</span><span>' + escapeHtml(cleanString(t.type || 'Question', 80)) + '</span><span>' + escapeHtml(cleanString(when, 28)) + '</span></div>' +
        '<div class="cls-ticket-msg">' + escapeHtml(cleanString(msg, 180)) + '</div>' +
        (canClose ? '<button type="button" class="cls-ticket-close" data-close-ticket="' + escapeHtml(row.id) + '">Close ticket</button>' : '') +
      '</div>';
    }).join('');
  }

  async function refreshMyTickets(wrap) {
    var list = wrap && wrap.querySelector('[data-ticket-list]');
    if (!list) return;
    list.innerHTML = '<div class="cls-sp-status">Loading tickets...</div>';
    try {
      renderMyTickets(list, await readMySupportTickets());
    } catch (e) {
      list.innerHTML = '<div class="cls-sp-status">Could not load your tickets right now.</div>';
    }
  }

  async function closeMyTicket(id, wrap) {
    var db = getFirestore();
    if (!db) throw new Error('Data storage is not available on this page.');
    var stamp = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('supportTickets').doc(id).set({
      status: 'closed',
      closedBy: 'customer',
      customerClosedAt: stamp,
      updatedAt: stamp
    }, { merge: true });
    await refreshMyTickets(wrap);
  }

  var supportChatUnsubscribe = null;

  function chatThreadId(user) {
    var uid = user && user.uid ? user.uid : persistentId('cls-chat-visitor-id', 'visitor');
    return 'chat-' + String(uid).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  }

  function chatMessageTime(data) {
    data = data || {};
    var raw = data.createdAt || data.createdAtUtc || data.updatedAt || '';
    if (raw && raw.toDate) return raw.toDate().getTime();
    var ms = Date.parse(raw);
    return Number.isFinite(ms) ? ms : 0;
  }

  function chatWhen(data) {
    var ms = chatMessageTime(data);
    if (!ms) return cleanString(data && data.createdAtUtc || '', 24);
    try {
      return new Date(ms).toLocaleString([], { month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit' });
    } catch (e) {
      return new Date(ms).toISOString();
    }
  }

  async function ensureChatThread(db, user) {
    if (!db) throw new Error('Data storage is not available on this page.');
    if (!user) throw new Error('Please sign in to chat with support.');
    var ref = db.collection('chatThreads').doc(chatThreadId(user));
    var stamp = firebase.firestore.FieldValue.serverTimestamp();
    var payload = {
      uid: user.uid,
      email: cleanString(user.email || '', 180).toLowerCase(),
      displayName: cleanString(user.displayName || '', 180),
      name: cleanString(user.displayName || user.email || 'Customer', 180),
      status: 'open',
      assignedTo: 'Mrs. Gamage',
      source: 'portal-chat',
      page: location.href,
      lastSeenPath: location.pathname,
      updatedAt: stamp,
      updatedAtUtc: nowIso()
    };
    try {
      var snap = await ref.get();
      if (!snap.exists) {
        payload.createdAt = stamp;
        payload.createdAtUtc = nowIso();
      }
    } catch (e) {
      payload.createdAt = stamp;
      payload.createdAtUtc = nowIso();
    }
    await ref.set(payload, { merge: true });
    return ref;
  }

  function renderChatMessages(target, rows) {
    if (!target) return;
    rows = rows || [];
    if (!rows.length) {
      target.innerHTML = '<div class="cls-sp-status">Start a chat with Priority Support. You will receive a reply within 30 minutes.</div>';
      return;
    }
    target.innerHTML = rows.map(function(row) {
      var data = row.data || {};
      var role = String(data.authorRole || '').toLowerCase();
      var isAdmin = role === 'admin' || role === 'support';
      var who = isAdmin ? cleanString(data.authorName || 'Mrs. Gamage', 80) : cleanString(data.authorName || data.email || 'You', 80);
      return '<div class="cls-chat-row ' + (isAdmin ? 'admin' : 'customer') + '">' +
        '<div class="cls-chat-meta">' + escapeHtml(who) + ' · ' + escapeHtml(chatWhen(data)) + '</div>' +
        '<div class="cls-chat-bubble">' + escapeHtml(cleanString(data.text || '', 1200)) + '</div>' +
      '</div>';
    }).join('');
    target.scrollTop = target.scrollHeight;
  }

  async function refreshChat(wrap, silent) {
    var list = wrap && wrap.querySelector('[data-chat-list]');
    if (!list) return;
    var db = getFirestore();
    var user = getAuthUser();
    if (!db || !user) {
      list.innerHTML = '<div class="cls-sp-status">Please sign in to chat with support.</div>';
      return;
    }
    if (!silent) list.innerHTML = '<div class="cls-sp-status">Loading chat...</div>';
    try {
      var thread = db.collection('chatThreads').doc(chatThreadId(user));
      var snap = await thread.collection('messages').orderBy('createdAt', 'asc').limit(80).get();
      var rows = [];
      snap.forEach(function(doc) { rows.push({ id: doc.id, data: doc.data() || {} }); });
      renderChatMessages(list, rows);
      thread.set({
        unreadForUser: false,
        lastUserReadAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastUserReadAtUtc: nowIso()
      }, { merge: true }).catch(function() {});
    } catch (e) {
      list.innerHTML = '<div class="cls-sp-status">Could not load chat right now.</div>';
    }
  }

  async function subscribeChat(wrap) {
    if (supportChatUnsubscribe) {
      try { supportChatUnsubscribe(); } catch (e) {}
      supportChatUnsubscribe = null;
    }
    var list = wrap && wrap.querySelector('[data-chat-list]');
    var db = getFirestore();
    var user = getAuthUser();
    if (!list || !db || !user) {
      if (list) list.innerHTML = '<div class="cls-sp-status">Please sign in to chat with support.</div>';
      return;
    }
    try {
      var thread = db.collection('chatThreads').doc(chatThreadId(user));
      var messages = thread.collection('messages').orderBy('createdAt', 'asc').limit(80);
      supportChatUnsubscribe = messages.onSnapshot(function(snap) {
        var rows = [];
        snap.forEach(function(doc) { rows.push({ id: doc.id, data: doc.data() || {} }); });
        renderChatMessages(list, rows);
        thread.set({
          unreadForUser: false,
          lastUserReadAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastUserReadAtUtc: nowIso()
        }, { merge: true }).catch(function() {});
      }, function() {
        refreshChat(wrap);
      });
    } catch (e) {
      list.innerHTML = '<div class="cls-sp-status">Could not start chat right now.</div>';
    }
  }

  async function sendChatMessage(wrap, text) {
    text = cleanString(text, 1200).trim();
    if (!text) throw new Error('Please type a message first.');
    var db = getFirestore();
    var user = getAuthUser();
    var thread = db.collection('chatThreads').doc(chatThreadId(user));
    var stamp = firebase.firestore.FieldValue.serverTimestamp();
    var authorName = cleanString(user.displayName || user.email || 'Customer', 180);
    var list = wrap && wrap.querySelector('[data-chat-list]');
    if (list) {
      var pending = document.createElement('div');
      pending.className = 'cls-chat-row customer cls-chat-pending';
      pending.innerHTML = '<div class="cls-chat-meta">' + escapeHtml(authorName) + ' · Sending...</div>' +
        '<div class="cls-chat-bubble">' + escapeHtml(text) + '</div>';
      list.appendChild(pending);
      list.scrollTop = list.scrollHeight;
    }
    var messageWrite = thread.collection('messages').add({
      uid: user.uid,
      email: cleanString(user.email || '', 180).toLowerCase(),
      authorRole: 'customer',
      authorName: authorName,
      text: text,
      page: location.href,
      createdAt: stamp,
      createdAtUtc: nowIso()
    });
    var threadWrite = thread.set({
      uid: user.uid,
      email: cleanString(user.email || '', 180).toLowerCase(),
      displayName: cleanString(user.displayName || '', 180),
      name: cleanString(user.displayName || user.email || 'Customer', 180),
      source: 'portal-chat',
      page: location.href,
      lastSeenPath: location.pathname,
      status: 'open',
      assignedTo: 'Mrs. Gamage',
      lastMessage: cleanString(text, 240),
      lastMessageBy: 'customer',
      lastMessageAt: stamp,
      lastMessageAtUtc: nowIso(),
      unreadForAdmin: true,
      unreadForUser: false,
      updatedAt: stamp,
      updatedAtUtc: nowIso()
    }, { merge: true });
    try {
      await Promise.all([messageWrite, threadWrite]);
      var noticeResponse = await fetch('/.netlify/functions/submit-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notifyOnly: true,
          threadId: chatThreadId(user),
          name: authorName,
          displayName: authorName,
          email: cleanString(user.email || '', 180).toLowerCase(),
          type: 'Priority Support live chat',
          priority: 'High',
          message: text,
          page: location.href,
          uid: user.uid,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
          utcAt: nowIso()
        })
      });
      var noticeResult = await noticeResponse.json().catch(function() { return {}; });
      if (!noticeResponse.ok || noticeResult.ok === false || noticeResult.emailed === false) {
        throw new Error(noticeResult.error || 'Message saved, but the support email notification could not be sent.');
      }
      refreshChat(wrap, true);
    } catch (error) {
      if (pending) pending.remove();
      throw error;
    }
  }

  function dangerActionName(action) {
    return action === 'deleteAccount' ? 'Delete Account' : 'Reset Data';
  }

  function dangerConfirmPhrase(action) {
    return action === 'deleteAccount' ? 'DELETE ACCOUNT' : 'RESET DATA';
  }

  function dangerReasons(action) {
    if (action === 'deleteAccount') {
      return [
        'Too expensive',
        'Missing a feature I need',
        'Too slow or unreliable',
        'Moving to another system',
        'Business closed or paused',
        'Created by mistake',
        'Other'
      ];
    }
    return [
      'Testing with a clean account',
      'Imported wrong data',
      'Data conflict or duplicate records',
      'Starting a new business file',
      'Performance feels slow',
      'Other'
    ];
  }

  function dangerReasonOptions(action, selected) {
    return '<option value="">Choose a reason</option>' + dangerReasons(action).map(function(reason) {
      return '<option value="' + escapeHtml(reason) + '"' + (reason === selected ? ' selected' : '') + '>' + escapeHtml(reason) + '</option>';
    }).join('');
  }

  function dangerStepBody(flow) {
    if (flow.step === 1) {
      return '<label>Reason</label>' +
        '<select data-danger-reason>' + dangerReasonOptions(flow.action, flow.reasonCategory) + '</select>' +
        '<div class="cls-danger-copy">This is saved for the admin backlog before any account action runs.</div>';
    }
    if (flow.step === 2) {
      return '<label>What happened?</label>' +
        '<textarea data-danger-details placeholder="Tell us what went wrong or what you are trying to clean up.">' + escapeHtml(flow.reasonDetails) + '</textarea>' +
        '<label>What would have helped?</label>' +
        '<textarea data-danger-improvement placeholder="Optional: mention the missing feature, support issue, speed issue, or expectation.">' + escapeHtml(flow.improvementRequest) + '</textarea>';
    }
    var phrase = dangerConfirmPhrase(flow.action);
    var actionCopy = flow.action === 'deleteAccount'
      ? 'This deletes your login account and removes your saved workspace records. This cannot be undone from the app.'
      : 'This keeps your login, plan, billing status, and business profile, but clears invoices, transactions, expenses, customers, suppliers, payables, and edit logs.';
    return '<div class="cls-danger-confirm">' + escapeHtml(actionCopy) + '</div>' +
      '<label>Type ' + escapeHtml(phrase) + '</label>' +
      '<input data-danger-confirm autocomplete="off" value="' + escapeHtml(flow.confirmText) + '" placeholder="' + escapeHtml(phrase) + '">';
  }

  function readDangerStep(flow, modal) {
    var reason = modal.querySelector('[data-danger-reason]');
    var details = modal.querySelector('[data-danger-details]');
    var improvement = modal.querySelector('[data-danger-improvement]');
    var confirm = modal.querySelector('[data-danger-confirm]');
    if (reason) flow.reasonCategory = cleanString(reason.value, 160).trim();
    if (details) flow.reasonDetails = cleanString(details.value, 3000).trim();
    if (improvement) flow.improvementRequest = cleanString(improvement.value, 2000).trim();
    if (confirm) flow.confirmText = cleanString(confirm.value, 80).trim();
  }

  function dangerValidation(flow) {
    if (flow.step === 1 && !flow.reasonCategory) return 'Please choose a reason.';
    if (flow.step === 2 && cleanString(flow.reasonDetails, 3000).trim().length < 12) return 'Please add a little more detail.';
    if (flow.step === 3 && flow.confirmText.toUpperCase() !== dangerConfirmPhrase(flow.action)) return 'Type ' + dangerConfirmPhrase(flow.action) + ' to confirm.';
    return '';
  }

  function clearAccountLocalBackups(uid, ownerUid) {
    try {
      var ids = [uid, ownerUid].filter(Boolean);
      var prefixes = ['cls-solo-data-backup:', 'cls-starter-data-backup:', 'cls-business-data-backup:'];
      ids.forEach(function(id) {
        prefixes.forEach(function(prefix) { localStorage.removeItem(prefix + id); });
      });
      localStorage.removeItem('cls-solo-backup');
      localStorage.removeItem('cls-starter-backup');
      localStorage.removeItem('cls-solo-demo-backup');
      localStorage.removeItem('cls-starter-demo-backup');
    } catch (e) {}
  }

  async function submitDangerAction(flow) {
    var user = getAuthUser();
    if (!user || !user.getIdToken) throw new Error('Please sign in again.');
    var token = await user.getIdToken();
    var res = await fetch('/.netlify/functions/account-danger-zone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({
        action: flow.action,
        plan: planFromPath() || rememberedPlan(),
        reasonCategory: flow.reasonCategory,
        reasonDetails: flow.reasonDetails,
        improvementRequest: flow.improvementRequest,
        confirmText: flow.confirmText,
        page: location.href,
        userAgent: navigator.userAgent || ''
      })
    });
    var json = await res.json().catch(function() { return {}; });
    if (!res.ok || json.ok === false) throw new Error(json.error || 'Could not complete account action.');
    return json;
  }

  function openDangerFlow(action) {
    injectDangerZoneStyle();
    var existing = document.querySelector('.cls-danger-modal');
    if (existing) existing.remove();
    var flow = {
      action: action,
      step: 1,
      reasonCategory: '',
      reasonDetails: '',
      improvementRequest: '',
      confirmText: ''
    };
    var modal = document.createElement('div');
    modal.className = 'cls-danger-modal';
    document.body.appendChild(modal);

    function close() {
      modal.remove();
    }

    function setStatus(message, isError) {
      var node = modal.querySelector('[data-danger-status]');
      if (node) {
        node.textContent = message || '';
        node.style.color = isError ? '#c0392b' : '#6B6258';
      }
    }

    function render() {
      var title = dangerActionName(flow.action);
      modal.innerHTML =
        '<div class="cls-danger-dialog" role="dialog" aria-modal="true" aria-label="' + escapeHtml(title) + '">' +
          '<div class="cls-danger-head"><div><div class="cls-danger-kicker">Danger Zone</div><div class="cls-danger-title">' + escapeHtml(title) + '</div><div class="cls-danger-copy">Step ' + flow.step + ' of 3</div></div><button type="button" class="cls-danger-close" data-danger-close aria-label="Close">x</button></div>' +
          '<div class="cls-danger-body"><div class="cls-danger-steps"><div class="cls-danger-step active"></div><div class="cls-danger-step' + (flow.step >= 2 ? ' active' : '') + '"></div><div class="cls-danger-step' + (flow.step >= 3 ? ' active' : '') + '"></div></div>' + dangerStepBody(flow) + '<div class="cls-danger-status" data-danger-status></div></div>' +
          '<div class="cls-danger-foot"><button type="button" class="cls-danger-btn" data-danger-back>' + (flow.step === 1 ? 'Cancel' : 'Back') + '</button><button type="button" class="cls-danger-btn fill" data-danger-next>' + (flow.step === 3 ? title : 'Continue') + '</button></div>' +
        '</div>';
      modal.querySelector('[data-danger-close]').addEventListener('click', close);
      modal.querySelector('[data-danger-back]').addEventListener('click', function() {
        readDangerStep(flow, modal);
        if (flow.step === 1) close();
        else {
          flow.step -= 1;
          render();
        }
      });
      modal.querySelector('[data-danger-next]').addEventListener('click', async function(ev) {
        readDangerStep(flow, modal);
        var error = dangerValidation(flow);
        if (error) {
          setStatus(error, true);
          return;
        }
        if (flow.step < 3) {
          flow.step += 1;
          render();
          return;
        }
        var btn = ev.currentTarget;
        btn.disabled = true;
        btn.textContent = 'Working...';
        setStatus('Saving feedback and processing request...', false);
        try {
          var result = await submitDangerAction(flow);
          var user = getAuthUser();
          clearAccountLocalBackups(user && user.uid, result.ownerUid);
          if (flow.action === 'resetData') {
            setStatus('Data reset. Reloading your clean workspace...', false);
            setTimeout(function() { location.reload(); }, 900);
          } else {
            setStatus('Account deleted. Signing out...', false);
            try {
              if (window.firebase && firebase.auth) await firebase.auth().signOut();
            } catch (e) {}
            setTimeout(function() { location.href = 'signin.html?account=deleted'; }, 700);
          }
        } catch (err) {
          btn.disabled = false;
          btn.textContent = dangerActionName(flow.action);
          setStatus(err.message || 'Could not complete account action.', true);
        }
      });
    }

    render();
  }

  function mountDangerZoneWidget() {
    if (document.getElementById(DANGER_ID)) return;
    if (!isPortalPath()) return;
    var settingsView = document.getElementById('view-settings');
    if (!settingsView) {
      setTimeout(mountDangerZoneWidget, 700);
      return;
    }
    injectDangerZoneStyle();
    var wrap = document.createElement('div');
    wrap.id = DANGER_ID;
    wrap.innerHTML =
      '<div class="cls-danger-top">' +
        '<div><div class="cls-danger-kicker">Danger Zone</div><div class="cls-danger-title">Account Controls</div><div class="cls-danger-copy">Reset clears operational records while keeping your account. Delete removes the login account after feedback is saved.</div></div>' +
        '<div class="cls-danger-actions"><button type="button" class="cls-danger-btn" data-danger-action="resetData">Reset Data</button><button type="button" class="cls-danger-btn fill" data-danger-action="deleteAccount">Delete Account</button></div>' +
      '</div>';
    var profilePanel = settingsView.querySelector('[data-account-panel="profile"]');
    (document.getElementById('settings-account-security-widgets') || profilePanel || document.getElementById('settings-security-widgets') || settingsView).appendChild(wrap);
    wrap.addEventListener('click', function(ev) {
      var btn = ev.target.closest('[data-danger-action]');
      if (!btn) return;
      openDangerFlow(btn.getAttribute('data-danger-action'));
    });
  }

	  function mountSupportWidget() {
    if (document.getElementById(SUPPORT_ID)) return;
    if (/ceylonry-admin\.html/i.test(location.pathname)) return;
    if (!isPortalPath()) return;

    var settingsView = document.getElementById('view-settings');
    if (!settingsView) {
      setTimeout(mountSupportWidget, 700);
      return;
    }

    injectSupportCardStyle();

    var wrap = document.createElement('div');
    wrap.id = SUPPORT_ID;
    wrap.className = 'cls-settings-support-card';
    wrap.innerHTML =
	      '<div class="cls-live-chat">' +
	        '<div class="cls-ticket-head"><div><div class="cls-support-kicker">Priority Support Chat</div><div class="cls-support-title">How can we help?</div><div class="cls-support-copy">Send us a message and receive a reply within 30 minutes.</div></div><button type="button" class="cls-ticket-refresh" data-refresh-chat>Refresh</button></div>' +
	        '<div class="cls-chat-messages" data-chat-list><div class="cls-sp-status">Loading chat...</div></div>' +
	        '<form class="cls-chat-compose" data-chat-form><textarea name="chatMessage" required placeholder="Type your message..."></textarea><button class="cls-sp-submit" type="submit">Send</button></form>' +
	        '<div class="cls-sp-status" data-chat-status>Messages stay with your account so the conversation can continue here.</div>' +
	      '</div>';
    (document.getElementById('settings-support-widgets') || document.getElementById('settings-security-widgets') || settingsView).appendChild(wrap);

    var supportActivityLoaded = false;
    function loadSupportActivity() {
      if (supportActivityLoaded) return;
      supportActivityLoaded = true;
      subscribeChat(wrap);
    }
    document.addEventListener('cls:settings-tab', function(ev) {
      if (ev && ev.detail && ev.detail.tab === 'support') loadSupportActivity();
    });

    wrap.querySelector('[data-refresh-chat]').addEventListener('click', function() {
      supportActivityLoaded = true;
      refreshChat(wrap);
    });

    try {
      if (window.firebase && firebase.apps && firebase.apps.length && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(nextUser) {
          if (supportActivityLoaded) {
            subscribeChat(wrap);
          }
        });
      }
    } catch (e) {}

    var chatForm = wrap.querySelector('[data-chat-form]');
    if (chatForm) {
      chatForm.addEventListener('submit', async function(ev) {
        ev.preventDefault();
        var field = chatForm.querySelector('[name="chatMessage"]');
        var status = wrap.querySelector('[data-chat-status]');
        var text = field ? field.value : '';
        if (status) status.textContent = 'Sending...';
        try {
          await sendChatMessage(wrap, text);
          if (field) field.value = '';
          if (status) status.textContent = 'Sent. Priority Support will reply within 30 minutes.';
        } catch (e) {
          if (status) status.textContent = e.message || 'Could not send message right now.';
        }
      });
    }

    var supportPanel = wrap.closest('[data-account-panel="support"],[data-settings-panel="support"]');
    if (supportPanel && !supportPanel.hidden) loadSupportActivity();
  }

  window.clsMountSupportWidget = mountSupportWidget;

  function normalizeInvoiceWhatsAppNumber(value) {
    var raw = cleanString(value, 40);
    if (!raw) return { ok: false, reason: 'missing', number: '' };
    var hadPlus = /^\s*\+/.test(raw);
    var hadInternationalPrefix = /^\s*00/.test(raw);
    var digits = raw.replace(/\D/g, '');
    if (hadInternationalPrefix && digits.indexOf('00') === 0) digits = digits.slice(2);
    if (!hadPlus && !hadInternationalPrefix && /^0\d{9}$/.test(digits)) digits = '94' + digits.slice(1);
    if (!/^\d{8,15}$/.test(digits) || digits.charAt(0) === '0') {
      return { ok: false, reason: 'invalid', number: '' };
    }
    return { ok: true, reason: '', number: digits };
  }

  function invoiceReminderFinancials(invoice) {
    invoice = invoice || {};
    var total = Number(invoice.total != null ? invoice.total : invoice.amount) || 0;
    var paid = Number(invoice.paid != null ? invoice.paid : invoice.paidAmount) || 0;
    return { total: total, outstanding: Math.max(0, total - paid) };
  }

  var invoiceReminderRequests = {};

  window.clsNormalizeInvoiceWhatsAppNumber = normalizeInvoiceWhatsAppNumber;

  window.clsInvoiceReminderMeta = function clsInvoiceReminderMeta(invoice) {
    invoice = invoice || {};
    var count = Math.max(0, Number(invoice.whatsappReminderCount) || 0);
    if (!count) return '';
    var date = new Date(invoice.lastWhatsappReminderAt || '');
    var dateText = isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(date);
    return (dateText ? 'Last WA ' + dateText + ' · ' : '') + count + ' message' + (count === 1 ? '' : 's');
  };

  window.clsOpenInvoiceWhatsAppReminder = async function clsOpenInvoiceWhatsAppReminder(options) {
    options = options || {};
    var invoice = options.invoice || {};
    var invoiceId = cleanString(options.invoiceId || invoice.num || invoice.id, 240);
    var phone = normalizeInvoiceWhatsAppNumber(options.phone || invoice.cphone || invoice.phone || '');
    if (phone.reason === 'missing') {
      alert('Please add the customer\u2019s WhatsApp number before sending this invoice message.');
      return false;
    }
    if (!phone.ok) {
      alert('Please enter a valid WhatsApp number including the country code.');
      return false;
    }
    var financials = invoiceReminderFinancials(invoice);
    if (!invoiceId || invoiceReminderRequests[invoiceId]) return false;

    var user = getAuthUser();
    if (!user || typeof user.getIdToken !== 'function') {
      alert('Please sign in again before sending this reminder.');
      return false;
    }

    invoiceReminderRequests[invoiceId] = true;
    var popup = window.open('', '_blank');
    if (popup) {
      try {
        popup.document.title = 'Opening WhatsApp';
        popup.document.body.innerHTML = '<p style="font:16px Arial,sans-serif;padding:28px;color:#1a1714">Preparing the secure invoice message...</p>';
      } catch (e) {}
    }
    try {
      var token = await user.getIdToken();
      if (!token) throw new Error('Please sign in again before sending this reminder.');
      var res = await fetch('/.netlify/functions/invoice-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          ownerUid: options.ownerUid || user.uid,
          invoiceId: invoiceId,
          invoiceNumber: cleanString(invoice.num || invoice.invoiceNumber || invoice.id, 120),
          customerId: options.customerId || '',
          plan: options.plan || ''
        })
      });
      var json = await res.json().catch(function() { return {}; });
      if (!res.ok || !json.ok || !json.whatsappUrl) {
        throw new Error(json.error || 'Could not generate the invoice link. Please try again.');
      }
      invoice.publicToken = json.publicToken;
      invoice.publicInvoiceActive = true;
      invoice.publicInvoiceUrl = json.publicInvoiceUrl;
      invoice.publicInvoiceCreatedAt = json.publicInvoiceCreatedAt || invoice.publicInvoiceCreatedAt || json.lastReminderAt;
      invoice.whatsappReminderCount = json.reminderCount;
      invoice.lastWhatsappReminderAt = json.lastReminderAt;
      if (json.reminderEntry) {
        invoice.whatsappReminderHistory = Array.isArray(invoice.whatsappReminderHistory)
          ? invoice.whatsappReminderHistory.slice(-99).concat(json.reminderEntry)
          : [json.reminderEntry];
      }
      if (typeof options.onUpdated === 'function') options.onUpdated(invoice, json);
      if (popup && !popup.closed) popup.location.replace(json.whatsappUrl);
      else window.location.href = json.whatsappUrl;
      return true;
    } catch (error) {
      if (popup && !popup.closed) popup.close();
      alert(error && error.message ? error.message : 'Could not generate the invoice link. Please try again.');
      return false;
    } finally {
      delete invoiceReminderRequests[invoiceId];
    }
  };

  function prefetchPortalPages() {
    if (!isPortalPath()) return;
    var current = (location.pathname || '').split('/').pop() || '';
    Object.keys(PLAN_FILES).forEach(function(plan) {
      var href = PLAN_FILES[plan];
      if (!href || href === current || document.querySelector('link[data-cls-prefetch="' + href + '"]')) return;
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'document';
      link.href = href;
      link.setAttribute('data-cls-prefetch', href);
      document.head.appendChild(link);
    });
  }

  function greetingFirstName(profile, user, fallback) {
    profile = profile || {};
    user = user || {};
    var metadata = user.user_metadata || {};
    var raw = profile.firstName || profile.givenName || profile.given_name ||
      metadata.first_name || metadata.given_name ||
      profile.name || user.displayName || metadata.full_name || metadata.name ||
      profile.email || user.email || fallback || 'there';
    raw = String(raw || '').trim();
    if (raw.indexOf('@') > -1) raw = raw.split('@')[0].replace(/[._-]+/g, ' ');
    var first = raw.split(/\s+/)[0].replace(/[^\p{L}\p{N}'’-]/gu, '');
    if (!first || /^(business|studio|solo|account|user)$/i.test(first)) first = String(fallback || 'there');
    return first.charAt(0).toUpperCase() + first.slice(1);
  }

  window.clsUpdateTimeGreeting = function(elementId, profile, user, fallback) {
    var target = document.getElementById(elementId);
    if (!target) return '';
    var hour = new Date().getHours();
    var greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    var text = greeting + ', ' + greetingFirstName(profile, user, fallback) + '! 🌿';
    target.textContent = text;
    return text;
  };

  function initMobileApplicationDrawer() {
    var sidebar = document.querySelector('#sidebar, #sb');
    var opener = document.querySelector('.mobile-portal-menu');
    var closer = document.querySelector('.mobile-sidebar-close');
    var backdrop = document.querySelector('.mobile-sidebar-backdrop');
    if (!sidebar || !opener || !backdrop || opener.dataset.drawerReady === 'true') return;
    opener.dataset.drawerReady = 'true';
    function setOpen(open) {
      sidebar.classList.toggle('mobile-open', open);
      backdrop.classList.toggle('open', open);
      backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
      opener.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.classList.toggle('mobile-drawer-open', open);
    }
    window.clsSetMobileDrawer = setOpen;
    opener.addEventListener('click', function() { setOpen(true); });
    if (closer) closer.addEventListener('click', function() { setOpen(false); });
    backdrop.addEventListener('click', function() { setOpen(false); });
    sidebar.addEventListener('click', function(event) {
      if (event.target.closest('[data-nav], [data-view]')) setOpen(false);
    });
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', function() {
      if (window.innerWidth > 760) setOpen(false);
    });
  }

  function initDelegatedMobileDrawer() {
    if (document.documentElement.dataset.mobileDrawerReady === 'true') return;
    document.documentElement.dataset.mobileDrawerReady = 'true';
    document.addEventListener('click', function(event) {
      var openButton = event.target.closest('.mobile-portal-menu');
      var side = document.querySelector('#sidebar, #sb');
      var shade = document.querySelector('.mobile-sidebar-backdrop');
      if (openButton && side && shade) {
        side.classList.add('mobile-open');
        shade.classList.add('open');
        shade.setAttribute('aria-hidden', 'false');
        openButton.setAttribute('aria-expanded', 'true');
        document.documentElement.classList.add('mobile-drawer-open');
        return;
      }
      if ((event.target.closest('.mobile-sidebar-close, .mobile-sidebar-backdrop, [data-nav], [data-view]')) && side && shade) {
        side.classList.remove('mobile-open');
        shade.classList.remove('open');
        shade.setAttribute('aria-hidden', 'true');
        var currentButton = document.querySelector('.mobile-portal-menu');
        if (currentButton) currentButton.setAttribute('aria-expanded', 'false');
        document.documentElement.classList.remove('mobile-drawer-open');
      }
    });
  }

  function mobileizeDataTables(root) {
    if (!window.matchMedia || !window.matchMedia('(max-width:760px)').matches) return;
    (root || document).querySelectorAll('table').forEach(function(table) {
      if (table.hasAttribute('data-cls-mobile-keep-table') || table.matches('.li-table,.invoice-table,.inv-table,.invoice-preview-table,.customer-invoice-preview table') || table.closest('#view-invoices,#inv-modal,#print-inv,.cls-invoice-preview-frame')) return;
      var headers = Array.from(table.querySelectorAll('thead th')).map(function(th) { return String(th.textContent || '').trim(); });
      if (!headers.length) return;
      table.classList.add('cls-mobile-table');
      table.querySelectorAll('tbody tr').forEach(function(row) {
        Array.from(row.children).forEach(function(cell, index) {
          if (cell.tagName === 'TD') cell.setAttribute('data-mobile-label', headers[index] || 'Details');
        });
      });
    });
  }

  function initMobileDataTables() {
    mobileizeDataTables(document);
    if (!window.MutationObserver || document.documentElement.dataset.mobileTableObserver === 'true') return;
    document.documentElement.dataset.mobileTableObserver = 'true';
    var queued = false;
    new MutationObserver(function() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function() { queued = false; mobileizeDataTables(document); });
    }).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('resize', function() { mobileizeDataTables(document); }, { passive:true });
  }

  function setInvoiceWizardStep(modal, requestedStep) {
    if (!modal) return;
    var body = modal.querySelector('.invoice-modal-body,.invoice-mo-body');
    if (!body) return;
    var isMobile = !!(window.matchMedia && window.matchMedia('(max-width:760px)').matches);
    var nav = modal.querySelector('.cls-invoice-wizard-nav');
    var previous = modal.querySelector('.cls-invoice-wizard-prev');
    var next = modal.querySelector('.cls-invoice-wizard-next');
    var footer = modal.querySelector('.invoice-modal-foot,.invoice-mo-footer');
    if (!isMobile) {
      Array.prototype.forEach.call(modal.querySelectorAll('[data-cls-wizard-step]'), function(node) {
        node.hidden = false;
      });
      if (nav) nav.hidden = true;
      if (previous) previous.hidden = true;
      if (next) next.hidden = true;
      body.removeAttribute('data-cls-wizard-current');
      modal.removeAttribute('data-cls-wizard-current');
      if (footer) footer.removeAttribute('data-cls-wizard-current');
      return;
    }
    if (nav) nav.hidden = false;
    var step = Math.max(0, Math.min(3, Number(requestedStep) || 0));
    body.setAttribute('data-cls-wizard-current', String(step));
    modal.setAttribute('data-cls-wizard-current', String(step));
    Array.prototype.forEach.call(modal.querySelectorAll('[data-cls-wizard-step]'), function(node) {
      node.hidden = Number(node.getAttribute('data-cls-wizard-step')) !== step;
    });
    Array.prototype.forEach.call(modal.querySelectorAll('.cls-invoice-wizard-step'), function(button, index) {
      var active = index === step;
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'step' : 'false');
    });
    if (previous) previous.hidden = step === 0;
    if (next) next.hidden = step === 3;
    if (footer) footer.setAttribute('data-cls-wizard-current', String(step));
    body.scrollTop = 0;
  }

  window.clsInvoiceWizardNext = function clsInvoiceWizardNext(modalId) {
    var modal = document.getElementById(modalId);
    if (!modal) return;
    setInvoiceWizardStep(modal, Number(modal.getAttribute('data-cls-wizard-current') || 0) + 1);
  };

  window.clsInvoiceWizardPrev = function clsInvoiceWizardPrev(modalId) {
    var modal = document.getElementById(modalId);
    if (!modal) return;
    setInvoiceWizardStep(modal, Number(modal.getAttribute('data-cls-wizard-current') || 0) - 1);
  };

  function initMobileInvoiceWizard() {
    var modal = document.getElementById('mo-inv') || document.getElementById('inv-modal');
    if (!modal) return;
    if (modal.dataset.clsInvoiceWizard === 'true') {
      setInvoiceWizardStep(modal, Number(modal.getAttribute('data-cls-wizard-current') || 0));
      return;
    }
    if (!window.matchMedia || !window.matchMedia('(max-width:760px)').matches) return;
    var body = modal.querySelector('.invoice-modal-body,.invoice-mo-body');
    var footer = modal.querySelector('.invoice-modal-foot,.invoice-mo-footer');
    if (!body || !footer) return;
    modal.dataset.clsInvoiceWizard = 'true';
    modal.classList.add('cls-invoice-wizard-modal');

    var nav = document.createElement('div');
    nav.className = 'cls-invoice-wizard-nav';
    nav.setAttribute('aria-label', 'Invoice creation steps');
    ['Customer','Details','Items','Review'].forEach(function(label, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'cls-invoice-wizard-step';
      button.innerHTML = '<span>' + (index + 1) + '</span><b>' + label + '</b>';
      button.addEventListener('click', function() { setInvoiceWizardStep(modal, index); });
      nav.appendChild(button);
    });
    body.insertBefore(nav, body.firstChild);

    if (modal.id === 'mo-inv') {
      var businessFields = body.querySelector('.business-invoice-fields');
      var businessSections = body.querySelectorAll(':scope > .fsec');
      if (businessFields) {
        businessFields.classList.add('cls-wizard-shared-container');
        Array.prototype.forEach.call(businessFields.children, function(node, index) {
          node.setAttribute('data-cls-wizard-step', index === businessFields.children.length - 1 ? '1' : '0');
        });
      }
      if (businessSections[0]) businessSections[0].setAttribute('data-cls-wizard-step', '0');
      if (businessSections[1]) businessSections[1].setAttribute('data-cls-wizard-step', '2');
      var businessItems = body.querySelector('.litbl');
      var businessAdd = body.querySelector('.li-add');
      var businessClosing = body.querySelector('.business-invoice-closing');
      if (businessItems) businessItems.setAttribute('data-cls-wizard-step', '2');
      if (businessAdd) businessAdd.setAttribute('data-cls-wizard-step', '2');
      if (businessClosing) businessClosing.setAttribute('data-cls-wizard-step', '3');
    } else {
      var customerBar = body.querySelector('.client-select-bar');
      var columns = body.querySelector('.invoice-form-columns');
      var panels = columns ? columns.querySelectorAll('.invoice-form-panel') : [];
      var standardSections = body.querySelectorAll(':scope > .f-section');
      var standardItems = body.querySelector('.li-table');
      var standardAdd = body.querySelector('.btn-add-li');
      var standardClosing = body.querySelector('.invoice-closing-grid');
      if (customerBar) customerBar.setAttribute('data-cls-wizard-step', '0');
      if (columns) columns.classList.add('cls-wizard-shared-container');
      if (panels[0]) panels[0].setAttribute('data-cls-wizard-step', '0');
      if (panels[1]) panels[1].setAttribute('data-cls-wizard-step', '1');
      if (standardSections[0]) standardSections[0].setAttribute('data-cls-wizard-step', '2');
      if (standardItems) standardItems.setAttribute('data-cls-wizard-step', '2');
      if (standardAdd) standardAdd.setAttribute('data-cls-wizard-step', '2');
      if (standardClosing) standardClosing.setAttribute('data-cls-wizard-step', '3');
    }

    var previous = document.createElement('button');
    previous.type = 'button';
    previous.className = 'btn-act-outline btn bo cls-invoice-wizard-prev';
    previous.textContent = '← Back';
    previous.addEventListener('click', function() { window.clsInvoiceWizardPrev(modal.id); });
    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn-act btn bd cls-invoice-wizard-next';
    next.textContent = 'Next →';
    next.addEventListener('click', function() { window.clsInvoiceWizardNext(modal.id); });
    footer.insertBefore(previous, footer.firstChild);
    footer.appendChild(next);
    setInvoiceWizardStep(modal, 0);

    new MutationObserver(function() {
      if (modal.classList.contains('open')) setInvoiceWizardStep(modal, 0);
    }).observe(modal, { attributes:true, attributeFilter:['class'] });
  }

  window.clsEnsurePdfLibrary = async function clsEnsurePdfLibrary() {
    if (window.jspdf && window.jspdf.jsPDF) return true;
    if (!window.clsLoadScriptOnce) return false;
    try {
      await window.clsLoadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'cls-jspdf');
      return !!(window.jspdf && window.jspdf.jsPDF);
    } catch (error) {
      console.warn('PDF library could not be loaded:', error);
      return false;
    }
  };

  window.clsEnsureBrandedPdfTools = async function clsEnsureBrandedPdfTools() {
    var pdfReady = await window.clsEnsurePdfLibrary();
    if (!pdfReady) return false;
    if (window.html2canvas) return true;
    if (!window.clsLoadScriptOnce) return false;
    try {
      await window.clsLoadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'cls-html2canvas');
      return !!window.html2canvas;
    } catch (error) {
      console.warn('Branded PDF renderer could not be loaded:', error);
      return false;
    }
  };

  function waitForInvoiceFrame(frame) {
    return new Promise(function(resolve, reject) {
      var settled = false;
      var finish = function(error) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error); else resolve();
      };
      var timer = setTimeout(function() { finish(new Error('The branded invoice took too long to prepare.')); }, 10000);
      frame.addEventListener('load', function() { finish(); }, { once:true });
      frame.addEventListener('error', function() { finish(new Error('The branded invoice could not be prepared.')); }, { once:true });
    });
  }

  function waitForInvoiceImages(doc) {
    var images = Array.prototype.slice.call(doc.querySelectorAll('img'));
    return Promise.all(images.map(function(img) {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      if (typeof img.decode === 'function') return img.decode().catch(function() {});
      return new Promise(function(resolve) {
        var done = function() { resolve(); };
        img.addEventListener('load', done, { once:true });
        img.addEventListener('error', done, { once:true });
        setTimeout(done, 4000);
      });
    }));
  }

  window.clsBuildBrandedInvoicePdfFile = async function clsBuildBrandedInvoicePdfFile(options, filename) {
    options = options || {};
    if (!window.clsBuildInvoicePrintHtml) throw new Error('The branded invoice template is unavailable.');
    if (!(await window.clsEnsureBrandedPdfTools())) throw new Error('The branded PDF tools could not be loaded.');
    var frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;opacity:0;pointer-events:none;background:#fff;';
    document.body.appendChild(frame);
    try {
      var loaded = waitForInvoiceFrame(frame);
      frame.srcdoc = window.clsBuildInvoicePrintHtml(options);
      await loaded;
      var frameDoc = frame.contentDocument;
      var page = frameDoc && frameDoc.querySelector('.invoice-page');
      if (!page) throw new Error('The branded A4 invoice could not be rendered.');
      if (frameDoc.fonts && frameDoc.fonts.ready) await frameDoc.fonts.ready.catch(function() {});
      await waitForInvoiceImages(frameDoc);
      page.style.width = '794px';
      page.style.minHeight = '1123px';
      page.style.height = '1123px';
      page.style.margin = '0';
      page.style.boxSizing = 'border-box';
      frameDoc.documentElement.style.background = '#fff';
      frameDoc.body.style.background = '#fff';
      await new Promise(function(resolve) { requestAnimationFrame(function() { requestAnimationFrame(resolve); }); });
      var canvas = await window.html2canvas(page, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
        scrollX: 0,
        scrollY: 0
      });
      var jsPDF = window.jspdf.jsPDF;
      var pdf = new jsPDF({ unit:'pt', format:'a4', orientation:'portrait', compress:true });
      var pageWidth = pdf.internal.pageSize.getWidth();
      var pageHeight = pdf.internal.pageSize.getHeight();
      var title = String((options.inv && (options.inv.num || options.inv.id)) || 'Invoice');
      if (typeof pdf.setProperties === 'function') pdf.setProperties({ title:'Invoice ' + title, subject:'A4 invoice', creator:'Cashflow System - CeylonryLabs.io' });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      var blob = pdf.output('blob');
      var safeName = filename || (String(title).replace(/[^a-z0-9_-]+/gi, '-') + '.pdf');
      return typeof File === 'function' ? new File([blob], safeName, { type:'application/pdf' }) : blob;
    } finally {
      frame.remove();
    }
  };

  window.clsDownloadBlobFile = function clsDownloadBlobFile(blob, filename) {
    if (!blob) return false;
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename || 'invoice.pdf';
    if (window.matchMedia && window.matchMedia('(max-width:760px)').matches) anchor.target = '_blank';
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    document.documentElement.setAttribute('data-cls-last-download', filename || 'invoice.pdf');
    window.dispatchEvent(new CustomEvent('cls:file-download', { detail:{ filename:filename || 'invoice.pdf', type:blob.type || '' } }));
    setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
    return true;
  };

  function fitMobilePdfPreview(modal) {
    if (!modal) return;
    var stage = modal.querySelector('.cls-mobile-pdf-stage');
    var frame = modal.querySelector('.cls-invoice-preview-frame');
    if (!stage || !frame) return;
    var baseWidth = 794, baseHeight = 1123;
    var scale = Math.min(1, Math.max(0.1, (stage.clientWidth - 16) / baseWidth), Math.max(0.1, (stage.clientHeight - 16) / baseHeight));
    frame.style.width = baseWidth + 'px';
    frame.style.height = baseHeight + 'px';
    frame.style.maxWidth = 'none';
    frame.style.transformOrigin = 'top left';
    frame.style.transform = 'scale(' + scale + ')';
    frame.style.margin = '0';
    var holder = modal.querySelector('.cls-mobile-pdf-holder');
    if (holder) { holder.style.width = Math.ceil(baseWidth * scale) + 'px'; holder.style.height = Math.ceil(baseHeight * scale) + 'px'; }
  }

  window.clsCloseMobilePdfPreview = function clsCloseMobilePdfPreview() {
    var modal = document.getElementById('cls-mobile-pdf-preview');
    if (modal) modal.remove();
    document.documentElement.classList.remove('cls-pdf-preview-open');
  };

  window.clsOpenMobilePdfPreview = function clsOpenMobilePdfPreview(options) {
    options = options || {};
    window.clsCloseMobilePdfPreview();
    var modal = document.createElement('div');
    modal.id = 'cls-mobile-pdf-preview';
    modal.className = 'cls-mobile-pdf-preview';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'A4 invoice PDF preview');
    var toolbar = document.createElement('div');
    toolbar.className = 'cls-mobile-pdf-toolbar';
    var back = document.createElement('button');
    back.type = 'button';
    back.className = 'cls-mobile-pdf-back';
    back.textContent = '← Back to system';
    back.addEventListener('click', window.clsCloseMobilePdfPreview);
    var heading = document.createElement('div');
    heading.className = 'cls-mobile-pdf-heading';
    var headingTitle = document.createElement('strong');
    headingTitle.textContent = String(options.title || 'Invoice PDF');
    var headingMeta = document.createElement('span');
    headingMeta.textContent = 'Full A4 preview';
    heading.appendChild(headingTitle);
    heading.appendChild(headingMeta);
    var download = document.createElement('button');
    download.type = 'button';
    download.className = 'cls-mobile-pdf-download';
    download.textContent = 'Download A4 PDF';
    download.addEventListener('click', function() { window.clsDownloadBlobFile(options.blob, options.filename || 'invoice.pdf'); });
    toolbar.appendChild(back); toolbar.appendChild(heading); toolbar.appendChild(download);
    var stage = document.createElement('div');
    stage.className = 'cls-mobile-pdf-stage';
    var holder = document.createElement('div');
    holder.className = 'cls-mobile-pdf-holder';
    if (options.previewOptions && window.clsBuildInvoicePreviewFrame) holder.innerHTML = window.clsBuildInvoicePreviewFrame(options.previewOptions);
    else holder.innerHTML = '<div class="cls-mobile-pdf-ready">Your A4 invoice is ready to download.</div>';
    stage.appendChild(holder);
    modal.appendChild(toolbar); modal.appendChild(stage); document.body.appendChild(modal);
    document.documentElement.classList.add('cls-pdf-preview-open');
    requestAnimationFrame(function() { fitMobilePdfPreview(modal); });
    window.addEventListener('resize', function resizePreview() { if (!document.body.contains(modal)) { window.removeEventListener('resize', resizePreview); return; } fitMobilePdfPreview(modal); }, { passive:true });
    return true;
  };

  window.clsBuildInvoicePdfBlob = function clsBuildInvoicePdfBlob(options) {
    options = options || {};
    var ascii = function(value) {
      return String(value == null ? '' : value)
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201c\u201d]/g, '"')
        .replace(/[^\x20-\x7e\n]/g, '?');
    };
    var pdfText = function(value) {
      return ascii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    };
    var wrap = function(value, width) {
      var words = ascii(value).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
      var rows = [], line = '';
      words.forEach(function(word) {
        var next = line ? line + ' ' + word : word;
        if (next.length > width && line) { rows.push(line); line = word; }
        else line = next;
      });
      if (line) rows.push(line);
      return rows.length ? rows : [''];
    };
    var number = function(value) {
      var amount = Number(value || 0);
      return amount.toLocaleString('en', { minimumFractionDigits:2, maximumFractionDigits:2 });
    };
    var currency = ascii(options.currency || 'LKR');
    var money = function(value) { return currency + ' ' + number(value); };
    var lines = Array.isArray(options.lines) && options.lines.length ? options.lines : [
      { desc:'Professional Services', qty:1, price:options.total || 0, total:options.total || 0 }
    ];
    var pages = [], commands = [], y = 0;
    var text = function(value, x, top, size, bold) {
      commands.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + (size || 9) + ' Tf ' + x + ' ' + (842 - top) + ' Td (' + pdfText(value) + ') Tj ET');
    };
    var line = function(x1, top1, x2, top2, color, width) {
      commands.push((color || '0.72 0.57 0.16') + ' RG ' + (width || 1) + ' w ' + x1 + ' ' + (842 - top1) + ' m ' + x2 + ' ' + (842 - top2) + ' l S');
    };
    var fill = function(x, top, width, height, color) {
      commands.push((color || '0.10 0.09 0.08') + ' rg ' + x + ' ' + (842 - top - height) + ' ' + width + ' ' + height + ' re f');
    };
    var finishPage = function() {
      pages.push(commands.join('\n'));
      commands = [];
    };
    var pageHeader = function(first) {
      text(options.businessName || 'Your Business', 48, 54, first ? 18 : 13, true);
      if (first) {
        wrap(options.businessAddress || '', 48).slice(0,2).forEach(function(row, index) { text(row, 48, 72 + index * 11, 8, false); });
        if (options.businessEmail) text(options.businessEmail, 48, 99, 8, false);
        text('INVOICE', 390, 54, 27, true);
        text(options.invoiceNumber || '', 390, 78, 10, true);
        text('Date: ' + ascii(options.date || ''), 390, 96, 8, false);
        text('Due: ' + ascii(options.due || ''), 390, 109, 8, false);
        line(48, 132, 547, 132);
        text('BILL TO', 48, 160, 9, true);
        text(options.customer || 'Customer', 48, 180, 13, true);
        wrap(options.customerDetails || '', 48).slice(0,3).forEach(function(row, index) { text(row, 48, 197 + index * 11, 8, false); });
        text('TOTAL DUE', 390, 168, 9, true);
        text(money(options.total), 390, 191, 16, true);
        y = 246;
      } else {
        text('Invoice ' + ascii(options.invoiceNumber || ''), 390, 54, 10, true);
        line(48, 72, 547, 72);
        y = 94;
      }
      fill(48, y, 499, 24);
      commands.push('1 1 1 rg');
      text('DESCRIPTION', 58, y + 16, 8, true);
      text('QTY', 318, y + 16, 8, true);
      text('UNIT PRICE', 365, y + 16, 8, true);
      text('AMOUNT', 468, y + 16, 8, true);
      commands.push('0.10 0.09 0.08 rg');
      y += 42;
    };
    pageHeader(true);
    lines.forEach(function(item) {
      var descRows = wrap(item.desc || item.description || 'Item', 43).slice(0,3);
      var rowHeight = Math.max(26, descRows.length * 11 + 8);
      if (y + rowHeight > 675) { finishPage(); pageHeader(false); }
      descRows.forEach(function(row, index) { text(row, 58, y + index * 11, 9, index === 0); });
      var qty = Number(item.qty || item.quantity || 1);
      var price = Number(item.price || item.unitPrice || 0);
      var total = item.total != null ? Number(item.total) : qty * price;
      text(String(qty), 318, y, 9, false);
      text(money(price), 365, y, 9, false);
      text(money(total), 468, y, 9, true);
      y += rowHeight;
      line(48, y - 6, 547, y - 6, '0.88 0.86 0.82', 0.6);
    });
    if (y > 625) { finishPage(); pageHeader(false); }
    y += 12;
    var subtotal = options.subtotal != null ? options.subtotal : options.total;
    text('Subtotal', 365, y, 9, false); text(money(subtotal), 468, y, 9, false); y += 17;
    if (Number(options.tax || 0)) { text('Tax / VAT', 365, y, 9, false); text(money(options.tax), 468, y, 9, false); y += 17; }
    if (Number(options.discount || 0)) { text('Discount', 365, y, 9, false); text(money(options.discount), 468, y, 9, false); y += 17; }
    fill(350, y, 197, 34, '0.10 0.09 0.08'); commands.push('1 1 1 rg');
    text('GRAND TOTAL', 365, y + 22, 9, true); text(money(options.total), 455, y + 22, 11, true); commands.push('0.10 0.09 0.08 rg');
    y += 58;
    text('NOTES', 48, y, 9, true); y += 16;
    wrap(options.notes || 'Invoice by Cashflow System - Ceylonry Labs.io', 88).slice(0,5).forEach(function(row) { text(row, 48, y, 8, false); y += 11; });
    text('Invoice generated by ' + ascii(options.systemName || 'Cashflow System') + ' - CeylonryLabs.io', 48, 795, 8, false);
    finishPage();

    var objects = [];
    var pageRefs = [];
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
    pages.forEach(function(stream, index) {
      var pageNumber = 5 + index * 2;
      var streamNumber = pageNumber + 1;
      pageRefs.push(pageNumber + ' 0 R');
      objects[pageNumber] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + streamNumber + ' 0 R >>';
      objects[streamNumber] = '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream';
    });
    objects[2] = '<< /Type /Pages /Kids [' + pageRefs.join(' ') + '] /Count ' + pageRefs.length + ' >>';
    var pdf = '%PDF-1.4\n', offsets = [0];
    for (var index = 1; index < objects.length; index += 1) {
      offsets[index] = pdf.length;
      pdf += index + ' 0 obj\n' + objects[index] + '\nendobj\n';
    }
    var xref = pdf.length;
    pdf += 'xref\n0 ' + objects.length + '\n0000000000 65535 f \n';
    for (var objectIndex = 1; objectIndex < objects.length; objectIndex += 1) pdf += String(offsets[objectIndex]).padStart(10, '0') + ' 00000 n \n';
    pdf += 'trailer\n<< /Size ' + objects.length + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
    return new Blob([pdf], {type:'application/pdf'});
  };

  function initExclusiveInvoiceMoreMenus() {
    if (document.documentElement.getAttribute('data-cls-invoice-more-ready') === 'true') return;
    document.documentElement.setAttribute('data-cls-invoice-more-ready', 'true');

    function closeInvoiceMenus(except) {
      document.querySelectorAll('details.invoice-more[open]').forEach(function(menu) {
        if (menu !== except) menu.open = false;
      });
    }

    document.addEventListener('click', function(event) {
      var target = event.target && event.target.closest ? event.target : null;
      if (!target) return;
      var menu = target.closest('details.invoice-more');
      var summary = target.closest('summary');
      if (menu && summary && summary.parentElement === menu) {
        closeInvoiceMenus(menu);
        return;
      }
      if (menu) {
        if (target.closest('.invoice-more-menu button, .invoice-more-menu a')) menu.open = false;
        return;
      }
      closeInvoiceMenus(null);
    }, true);

    document.addEventListener('toggle', function(event) {
      var menu = event.target;
      if (menu && menu.matches && menu.matches('details.invoice-more') && menu.open) closeInvoiceMenus(menu);
    }, true);
  }

	  function boot() {
    var pathPlan = planFromPath();
    if (pathPlan) safeSet('cls-last-plan', pathPlan);
	    afterFirstPaint(prefetchPortalPages, 1400);
	    afterFirstPaint(trackVisit, 5000);
	    afterFirstPaint(mountBillingWidget, 2300);
	    afterFirstPaint(function(){window.clsApplyTrialPlanSwitchVisibility(window._profile||{});},2600);
	    setInterval(function(){if(isPortalPath())window.clsApplyTrialPlanSwitchVisibility(window._profile||{});},60000);
	    afterFirstPaint(mountDangerZoneWidget, 2800);
	    afterFirstPaint(mountSupportWidget, 3500);
	    afterFirstPaint(function() {
	      window.clsMaybeShowDay5PaymentPrompt(window._profile, { retries: 0 });
	    }, 4200);
	    window.addEventListener('resize', window.clsFitAllInvoicePreviews, { passive: true });
	    initMobileApplicationDrawer();
	    initDelegatedMobileDrawer();
	    initMobileDataTables();
	    initMobileInvoiceWizard();
	    initExclusiveInvoiceMoreMenus();
	    if (window.matchMedia) {
	      var invoiceWizardMedia = window.matchMedia('(max-width:760px)');
	      var syncInvoiceWizard = function() {
	        initMobileInvoiceWizard();
	        var invoiceModal = document.getElementById('mo-inv') || document.getElementById('inv-modal');
	        if (invoiceModal && invoiceModal.dataset.clsInvoiceWizard === 'true') {
	          setInvoiceWizardStep(invoiceModal, Number(invoiceModal.getAttribute('data-cls-wizard-current') || 0));
	        }
	      };
	      if (invoiceWizardMedia.addEventListener) invoiceWizardMedia.addEventListener('change', syncInvoiceWizard);
	      else if (invoiceWizardMedia.addListener) invoiceWizardMedia.addListener(syncInvoiceWizard);
	    }
	  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
