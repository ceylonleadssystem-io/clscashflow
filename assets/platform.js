(function() {
  var VALID_PLANS = { solo: true, studio: true, business: true };
  var PLAN_FILES = { solo: 'solo.html', studio: 'starter.html', business: 'growth.html' };
  var PLAN_ALIASES = { starter: 'studio', growth: 'business', premium: 'business' };
  var PLAN_DETAILS = {
    solo: { name: 'Solo', monthlyPrice: 3500, price: 36000, file: 'solo.html' },
    studio: { name: 'Studio', monthlyPrice: 5500, price: 60000, file: 'starter.html' },
    business: { name: 'Business', monthlyPrice: 8500, price: 94800, file: 'growth.html' }
  };
  var PLAN_RANK = { solo: 1, studio: 2, business: 3 };
  var BILLING_ID = 'cls-billing-widget';
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
      billingCycle: 'annual',
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
              user = await auth.waitForCurrentUser(4500);
            }
          } catch (e) {}
        }
        pendingSigninRedirect = null;
        if (!user) window.location.href = 'signin.html';
        resolve(user || null);
      }, delayMs || 900);
    });
    return pendingSigninRedirect;
  };

  window.clsPlanFiles = PLAN_FILES;
  window.clsPlanDetails = PLAN_DETAILS;

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
    if (accountPlan && accountPlan !== expectedPlan) {
      var dest = window.clsPlanFileFor(accountPlan);
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
      await db.collection('users').doc(uid).set(update, { merge: true });
    } catch (e) {
      console.warn('Plan access check update skipped:', e);
    }
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
    return 'Package value: ' + money(details.monthlyPrice || 0) + '/mo';
  }

  function plainText(value, max) {
    value = String(value == null ? '' : value).trim();
    return max && value.length > max ? value.slice(0, max) : value;
  }

  var INVOICE_TEMPLATES = [
    { name: 'Furniture Pop', accent: '#ef92d8', dark: '#315ee8', paper: '#fbeddc', layout: 'pop' },
    { name: 'Orange Studio', accent: '#f16f4f', dark: '#171615', paper: '#fff8dc', layout: 'orange' },
    { name: 'Modern Mono', accent: '#1f2a24', dark: '#1f2a24', paper: '#fffdf8', layout: 'mono' },
    { name: 'Professional Script', accent: '#9b948c', dark: '#26211d', paper: '#fbf8f1', layout: 'script' },
    { name: 'Freelancer Wave', accent: '#3f4542', dark: '#191919', paper: '#ffffff', layout: 'wave' },
    { name: 'Editorial Serif', accent: '#111111', dark: '#111111', paper: '#f8f8f0', layout: 'editorial' },
    { name: 'Agency Clean', accent: '#111111', dark: '#111111', paper: '#fff1ec', layout: 'agency' },
    { name: 'Cafe Blue', accent: '#2046d9', dark: '#2046d9', paper: '#fffbe7', layout: 'cafe' },
    { name: 'Corporate Green', accent: '#84b735', dark: '#243449', paper: '#ffffff', layout: 'green' },
    { name: 'Yellow Corporate', accent: '#f4c400', dark: '#404042', paper: '#ffffff', layout: 'yellow' },
    { name: 'Pin Box', accent: '#111111', dark: '#111111', paper: '#f5f5f5', layout: 'pinbox' },
    { name: 'Kazuma Minimal', accent: '#3f4348', dark: '#3f4348', paper: '#ffffff', layout: 'kazuma' },
    { name: 'Architect Blue', accent: '#4263b4', dark: '#4263b4', paper: '#ffffff', layout: 'architect' }
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

  function normalizeInvoiceSettings(settings) {
    settings = settings || {};
    var biz = settings.bizName || settings.biz || settings.businessName || 'Your Business';
    var email = settings.email || settings.invoiceEmail || '';
    var footer = settings.footer || DEFAULT_INVOICE_FOOTER;
    var align = settings.logoAlign || 'left';
    var defaultX = align === 'right' ? 88 : (align === 'center' ? 50 : 8);
    return {
      biz: biz,
      user: settings.username || settings.user || '',
      addr: settings.addr || settings.address || '',
      email: email,
      vat: settings.vat || '',
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
    var dark = ['orange', 'green', 'yellow'].indexOf(theme.layout) !== -1;
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
  window.clsBuildInvoicePrintHtml = function(opts) {
    opts = opts || {};
    var inv = opts.inv || {};
    var s = normalizeInvoiceSettings(opts.settings || {});
    var idx = window.clsNormalizeInvoiceTemplate(opts.templateIndex != null ? opts.templateIndex : inv.tpl);
    var theme = invoiceTemplate(idx);
    var cur = inv.cur || inv.currency || 'LKR';
    var lines = invoiceLineItems(inv);
    var sub = lines.reduce(function(sum, line) { return sum + (line.total || 0); }, 0) || Number(inv.sub || inv.amount || inv.total || 0) || 0;
    var disc = Number(inv.disc || inv.discount || 0) || 0;
    var discAmount = disc > 0 && disc <= 100 ? sub * disc / 100 : disc;
    var vat = Number(inv.vat || inv.tax || 0) || 0;
    var total = Number(inv.amount || inv.total || (sub - discAmount + vat)) || 0;
    var balance = Math.max(0, total - Number(inv.paidAmount || inv.paid || 0));
    var status = inv.status || (balance <= 0 ? 'paid' : 'unpaid');
    var note = inv.notes || '';
    var footer = s.footer || DEFAULT_INVOICE_FOOTER;
    var noteBody = [note, footer].filter(function(part) { return String(part || '').trim(); }).join('\n\n') || DEFAULT_INVOICE_FOOTER;
    var rows = lines.map(function(line, i) {
      return '<tr><td><span class="item-no">' + String(i + 1).padStart(2, '0') + '</span><span class="desc">' + invoiceBreaks(line.desc) + '</span></td><td>' + line.qty + '</td><td>' + invoiceMoney(cur, line.price) + '</td><td>' + invoiceMoney(cur, line.total) + '</td></tr>';
    }).join('');
    var logo = invoiceLogoOverlay(s);
    var title = inv.num || inv.id || 'PREVIEW';
    var cssLayout = invoiceTemplateClass(theme.layout);
    var font = invoiceFont(s.invoiceFont);
    var view = invoiceView(s.invoiceView);
    var systemName = opts.systemName || 'Cashflow System';
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + invoiceEscape(title) + '</title><style>' +
      '@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{font-family:' + font.body + ';background:#ece8df;color:#17130f}.invoice-page{width:210mm;min-height:297mm;margin:0 auto;background:' + theme.paper + ';position:relative;padding:20mm 18mm 15mm;overflow:hidden;--accent:' + theme.accent + ';--dark:' + theme.dark + ';--paper:' + theme.paper + ';--line:rgba(23,19,15,.18);font-family:' + font.body + '}.invoice-main{position:relative;z-index:1;min-height:262mm;display:flex;flex-direction:column}.invoice-free-logo{position:absolute;max-height:95px;object-fit:contain;z-index:3}.invoice-head{display:grid;grid-template-columns:1fr 220px;gap:32px;align-items:start;margin-bottom:26px;padding-top:34px}.brand-name{font-family:' + font.title + ';font-size:29px;font-weight:700;line-height:1.05}.brand-small,.meta,.party-detail,.note-body,.permanent-footer{white-space:pre-line;color:#6d6258;font-size:12px;line-height:1.65}.invoice-title{text-align:right}.invoice-title h1{font-family:' + font.title + ';font-size:46px;letter-spacing:6px;text-transform:uppercase;color:var(--dark);line-height:1}.invoice-title .num{font-size:14px;font-weight:700;margin-top:8px;color:var(--accent)}.meta{margin-top:13px}.meta span{display:inline-block;width:70px;color:#9b8f82}.parties{display:grid;grid-template-columns:1fr 1fr 150px;gap:24px;margin:22px 0 28px}.label{font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:800;color:var(--dark);margin-bottom:8px}.party-name{font-size:16px;font-weight:800;margin-bottom:5px}.status-pill{display:inline-block;border:1px solid var(--line);padding:7px 10px;border-radius:999px;text-transform:capitalize;font-size:12px;font-weight:800;color:var(--dark);margin-bottom:10px}.invoice-table{width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:22px}.invoice-table th{font-size:10px;letter-spacing:2px;text-transform:uppercase;text-align:left;padding:12px 10px;border-bottom:2px solid var(--dark)}.invoice-table th:nth-child(1){width:52%}.invoice-table th:nth-child(2){width:12%}.invoice-table th:nth-child(3),.invoice-table th:nth-child(4){width:18%}.invoice-table th:nth-child(n+2),.invoice-table td:nth-child(n+2){text-align:right}.invoice-table td{padding:13px 10px;border-bottom:1px solid var(--line);vertical-align:top;font-size:12px}.invoice-table .desc{white-space:pre-line;font-weight:700;line-height:1.45}.item-no{display:inline-block;margin-right:10px;color:var(--accent);font-weight:800}.invoice-bottom{display:grid;grid-template-columns:1fr 305px;gap:38px;margin-top:10px}.note-card{border-left:4px solid var(--accent);padding-left:16px}.note-title{font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:800;margin-bottom:8px;color:var(--dark)}.totals{border-top:1px solid var(--line);padding-top:10px}.totals .row{display:flex;justify-content:space-between;gap:18px;padding:7px 0;font-size:12px;color:#5e554c}.totals b{color:#17130f}.grand{margin-top:10px;background:var(--dark);color:#fff!important;padding:17px 18px!important;align-items:center}.grand span{font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:800}.grand b{font-size:20px;color:#fff!important}.footer-zone{margin-top:auto;padding-top:16px;border-top:1px solid var(--line);display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:end}.permanent-footer{text-align:right}.powered{grid-column:1/-1;text-align:center;font-size:10px;letter-spacing:.08em;color:#aaa097;padding-top:10px}.powered b{color:var(--accent)}.invoice-view-classic.invoice-page{border:1px solid var(--line);box-shadow:inset 0 0 0 10px rgba(255,255,255,.38)}.invoice-view-classic .invoice-title h1{letter-spacing:4px}.invoice-view-classic .invoice-table th{background:rgba(23,19,15,.035)}.invoice-view-olden.invoice-page{background:#fbf3e5!important;border:4px double rgba(74,59,42,.35);padding:21mm 19mm 16mm}.invoice-view-olden .invoice-title h1{text-transform:none;letter-spacing:1px;font-style:italic;font-size:54px}.invoice-view-olden .invoice-table th{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:transparent!important}.invoice-view-olden .note-card{border-left:0;border-top:1px solid var(--line);padding-left:0;padding-top:12px}.invoice-view-minimal.invoice-page{background:#fff!important}.invoice-view-minimal .invoice-head{padding-top:0}.invoice-view-minimal .invoice-title h1{letter-spacing:2px}.invoice-view-minimal .note-card{border-left:0;padding-left:0}.invoice-view-minimal .grand{background:#17130f}.invoice-view-bold .invoice-head{border-left:8px solid var(--accent);padding-left:20px}.invoice-view-bold .invoice-title h1{font-size:54px;font-weight:900}.invoice-view-bold .invoice-table th{background:var(--dark);color:#fff;border:0}.tpl-pop .invoice-title h1{color:var(--dark)}.tpl-pop .invoice-table th,.tpl-pop .grand{background:var(--accent);color:var(--dark);border:0}.invoice-page.tpl-pop:before{content:"";position:absolute;left:0;right:0;top:0;height:42mm;background:rgba(239,146,216,.18)}.tpl-orange .invoice-head{background:var(--dark);color:#fff;margin:-20mm -18mm 24px;padding:22mm 18mm 18mm;border-radius:0 0 26px 0}.tpl-orange .brand-small,.tpl-orange .meta,.tpl-orange .meta span{color:rgba(255,255,255,.72)}.tpl-orange .invoice-title h1,.tpl-orange .invoice-title .num{color:#fff}.tpl-orange .grand,.tpl-orange .invoice-table th{background:var(--accent);border:0;color:#111}.tpl-mono .invoice-title h1{background:var(--dark);color:#fff;border-radius:0 999px 999px 0;padding:10px 20px;letter-spacing:3px}.tpl-script .invoice-title h1{font-style:italic;text-transform:none;letter-spacing:1px;font-size:58px}.tpl-script.invoice-page{border:1px solid var(--line)}.invoice-page.tpl-wave:after{content:"";position:absolute;left:-20mm;right:-20mm;bottom:-24mm;height:70mm;background:linear-gradient(160deg,#d8dadd 0 45%,#3f4542 46% 100%);z-index:0}.tpl-editorial .invoice-title h1,.tpl-agency .invoice-title h1{text-transform:none;letter-spacing:0}.tpl-cafe .invoice-title h1{font-size:58px;color:var(--accent)}.tpl-cafe .invoice-table th,.tpl-cafe .invoice-table td{border:1px solid var(--accent)}.tpl-green .invoice-head,.tpl-yellow .invoice-head{background:var(--dark);color:#fff;margin:-20mm -18mm 24px;padding:18mm}.tpl-green .invoice-title h1,.tpl-yellow .invoice-title h1,.tpl-green .invoice-title .num,.tpl-yellow .invoice-title .num{color:#fff}.tpl-green .brand-small,.tpl-yellow .brand-small,.tpl-green .meta,.tpl-yellow .meta,.tpl-green .meta span,.tpl-yellow .meta span{color:rgba(255,255,255,.7)}.tpl-green .invoice-table th{background:var(--accent);border:0}.tpl-yellow .invoice-table th{background:var(--accent);border:0}.tpl-pinbox .invoice-table th,.tpl-pinbox .invoice-table td{border-color:#111}.tpl-pinbox .invoice-title h1{letter-spacing:8px;text-transform:none}.tpl-kazuma .invoice-head{border-top:34px solid var(--dark);padding-top:20px}.tpl-kazuma .grand{background:linear-gradient(90deg,var(--dark),#6d7378)}.invoice-page.tpl-architect:before{content:"";position:absolute;left:0;right:0;top:0;height:38mm;background:var(--accent);z-index:0}.tpl-architect .invoice-head{padding-top:14mm;color:#111}.tpl-architect .invoice-title h1{color:#111}@media print{body{background:#fff}.invoice-page{margin:0;width:210mm;min-height:297mm;box-shadow:none}.invoice-free-logo{max-height:26mm}}' +
      '@media print{.invoice-table{display:table!important;width:100%!important;border-collapse:collapse!important;table-layout:fixed!important}.invoice-table thead{display:table-header-group!important}.invoice-table tbody{display:table-row-group!important}.invoice-table tr{display:table-row!important;margin:0!important;border:0!important;padding:0!important;background:transparent!important}.invoice-table th,.invoice-table td{display:table-cell!important;width:auto!important}.invoice-table td{padding:13px 10px!important;text-align:left!important;border-bottom:1px solid var(--line)!important}.invoice-table th:nth-child(n+2),.invoice-table td:nth-child(n+2){text-align:right!important}.invoice-table td:before{content:none!important;display:none!important}}' +
      '</style></head><body><div class="invoice-page tpl-' + cssLayout + ' invoice-view-' + invoiceEscape(view.id) + '">' + logo + '<main class="invoice-main">' +
      '<section class="invoice-head"><div><div class="brand-name">' + invoiceEscape(s.biz) + '</div><div class="brand-small">' + invoiceBreaks(s.addr) + (s.email ? '<br>' + invoiceEscape(s.email) : '') + (s.vat ? '<br>VAT: ' + invoiceEscape(s.vat) : '') + '</div></div><div class="invoice-title"><h1>Invoice</h1><div class="num">' + invoiceEscape(title) + '</div><div class="meta"><div><span>Date:</span>' + humanDate(inv.date) + '</div><div><span>Due:</span>' + humanDate(inv.due) + '</div><div><span>Terms:</span>' + invoiceEscape(inv.terms || 'Net 30') + '</div></div></div></section>' +
      '<section class="parties"><div><div class="label">From</div><div class="party-name">' + invoiceEscape(s.biz) + '</div><div class="party-detail">' + invoiceBreaks(s.addr) + '<br>' + invoiceEscape(s.email) + '</div></div><div><div class="label">Bill To</div><div class="party-name">' + invoiceEscape(inv.client || 'Customer') + '</div><div class="party-detail">' + invoiceBreaks(inv.caddr || '') + (inv.cemail ? '<br>' + invoiceEscape(inv.cemail) : '') + (inv.cphone ? '<br>' + invoiceEscape(inv.cphone) : '') + '</div></div><div><div class="label">Status</div><div class="status-pill">' + invoiceEscape(status) + '</div><div class="party-detail">Balance due<br><b>' + invoiceMoney(cur, balance) + '</b></div></div></section>' +
      '<table class="invoice-table"><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<section class="invoice-bottom"><div class="note-card"><div class="note-title">Notes</div><div class="note-body">' + invoiceBreaks(noteBody) + '</div></div><div class="totals"><div class="row"><span>Subtotal</span><b>' + invoiceMoney(cur, sub) + '</b></div>' + (discAmount ? '<div class="row"><span>Discount</span><b>- ' + invoiceMoney(cur, discAmount) + '</b></div>' : '') + (vat ? '<div class="row"><span>Tax / VAT</span><b>' + invoiceMoney(cur, vat) + '</b></div>' : '') + '<div class="row grand"><span>Total due</span><b>' + invoiceMoney(cur, total) + '</b></div></div></section>' +
      '<section class="footer-zone"><div><div class="label">Payment / Contact</div><div class="party-detail">' + invoiceEscape(s.biz) + '<br>' + invoiceBreaks(s.addr) + '<br>' + invoiceEscape(s.email) + '</div></div><div class="permanent-footer"></div><div class="powered"><b>' + DEFAULT_INVOICE_FOOTER + '</b></div></section>' +
      '</main></div></body></html>';
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
    profile = profile || {};
    var status = String(profile.subscriptionStatus || '').toLowerCase();
    return profile.paid === true || status === 'active' || status === 'manual-paid';
  };

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

  window.clsStartPayableCheckout = async function clsStartPayableCheckout(plan, opts) {
    opts = opts || {};
    var profile = opts.profile || window._profile || null;
    plan = bestPlan(profile, plan || opts.plan);
    var details = PLAN_DETAILS[plan] || PLAN_DETAILS.solo;
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
      btn.textContent = 'Opening Payable...';
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
          billingCycle: 'annual',
          uid: user.uid,
          email: profileEmail(profile, user),
          name: profileName(profile, user),
          returnUrl: location.origin + '/payable-return.html?plan=' + encodeURIComponent(plan),
          cancelUrl: location.href
        })
      });
      var out = await res.json().catch(function() { return {}; });
      if (!res.ok || !out.ok) {
        throw new Error(out.error || 'Could not start Payable checkout.');
      }
      if (!out.checkoutUrl) {
        throw new Error('Payable did not return a checkout URL.');
      }
      window.location.href = out.checkoutUrl;
    } catch (e) {
      console.error('Payable checkout error:', e);
      alert((e && e.message ? e.message : 'Could not start Payable checkout.') + '\n\nYou can still activate through WhatsApp while Payable is being configured.');
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
      amount: details.price,
      monthlyAmount: details.monthlyPrice || 0,
      billingCycle: 'annual',
      currency: 'LKR',
      trialEnd: trialEnd && !isNaN(trialEnd.getTime()) ? trialEnd.toISOString() : '',
      status: 'pending',
      source: 'trial-expired',
      page: location.pathname,
      updatedAt: fieldTimestamp(),
      updatedAtUtc: nowIso()
    };
    var userUpdate = {
      paymentRequestToken: token,
      paymentRequestStatus: 'pending',
      paymentRequestPlan: plan,
      paymentRequestAmount: details.price,
      paymentRequestMonthlyAmount: details.monthlyPrice || 0,
      billingCycle: 'annual',
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
      profile.paymentRequestAmount = details.price;
      return request;
    } catch (e) {
      console.warn('Payment request token could not be saved:', e);
      return { token: token, plan: plan, planName: details.name, amount: details.price, unsaved: true };
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
        '<div style="font-size:.86rem;color:#6B6258;line-height:1.7;margin-bottom:1.6rem">' + trialText + '<br>Activate your <strong>CLS ' + details.name + '</strong> subscription to continue using your dashboard and data.</div>' +
        '<div style="background:#F7F5F0;border:1px solid rgba(184,146,42,.25);padding:1.45rem;margin-bottom:1.5rem">' +
          '<div style="font-family:Cormorant Garamond,Georgia,serif;font-size:2.25rem;font-weight:300">' + money(details.price) + '<span style="font-size:1rem;color:#6B6258">/year</span></div>' +
          '<div style="font-size:.78rem;color:#6B6258;margin-top:.25rem">' + details.name + ' Plan · ' + planMonthlyLine(details) + '</div>' +
        '</div>' +
        '<div id="cls-payment-request-token" style="background:#fff8ea;border:1px solid rgba(184,146,42,.28);padding:.8rem 1rem;margin:-.5rem 0 1rem;color:#6B6258;font-size:.74rem;line-height:1.55">Creating a manual payment request for admin...</div>' +
        '<button id="cls-payable-action" type="button" style="display:block;width:100%;background:#1a1714;color:#fff;border:0;padding:1rem;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700;cursor:pointer;margin-bottom:.75rem;font-family:inherit">Pay with Payable</button>' +
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
    document.getElementById('cls-payable-action').addEventListener('click', function() {
      window.clsStartPayableCheckout(plan, { profile: profile, button: this });
    });
    document.getElementById('cls-wa-action').addEventListener('click', function() {
      window.clsOpenPlanWhatsApp(plan, profile || { email: user && user.email });
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
        '.cls-notify-item{border-left:3px solid #B8922A;background:#F7F5F0;padding:9px 10px;font-size:12px;line-height:1.45}' +
        '.cls-notify-item.bad{border-left-color:#c0392b;background:#FDECEA}' +
        '.cls-notify-item.warn{border-left-color:#B8922A;background:#FFF8EA}' +
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
          return '<div class="cls-notify-item ' + item.cls + '"><strong>' + escapeHtml(item.title) + '</strong><div class="cls-notify-meta">' + escapeHtml(item.meta) + '</div></div>';
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
      '#cls-billing-widget{margin-top:1rem;border:1px solid #DED7CC;background:#fff;border-left:3px solid #1a9e5c;padding:1rem 1.1rem;font-family:DM Sans,Inter,Arial,sans-serif;color:#1C1814}' +
      '#cls-billing-widget .cls-billing-top{display:grid;grid-template-columns:1fr auto;gap:1rem;align-items:center}' +
      '#cls-billing-widget .cls-billing-kicker{font-size:.55rem;letter-spacing:.18em;text-transform:uppercase;color:#1a9e5c;font-weight:800;margin-bottom:.2rem}' +
      '#cls-billing-widget .cls-billing-title{font-family:Cormorant Garamond,Georgia,serif;font-size:1.25rem;line-height:1.1;margin-bottom:.15rem;color:#1C1814}' +
      '#cls-billing-widget .cls-billing-copy{font-size:.76rem;line-height:1.55;color:#6B6258;max-width:640px}' +
      '#cls-billing-widget .cls-billing-price{font-family:Cormorant Garamond,Georgia,serif;font-size:1.8rem;line-height:1;color:#1C1814;margin-top:.65rem}' +
      '#cls-billing-widget .cls-billing-sub{font-size:.7rem;color:#6B6258;margin-top:.25rem}' +
      '#cls-billing-widget .cls-billing-actions{display:flex;gap:.55rem;flex-wrap:wrap;justify-content:flex-end}' +
      '#cls-billing-widget .cls-billing-pay,#cls-billing-widget .cls-billing-wa{border:0;background:#1C1814;color:#fff;padding:.72rem 1rem;font-family:inherit;font-size:.68rem;letter-spacing:.13em;text-transform:uppercase;font-weight:800;cursor:pointer;white-space:nowrap}' +
      '#cls-billing-widget .cls-billing-wa{background:#fff;color:#1C1814;border:1px solid rgba(184,146,42,.35)}' +
      '#cls-billing-widget .cls-billing-pay:hover{background:#1a9e5c}' +
      '#cls-billing-widget .cls-billing-wa:hover{border-color:#B8922A;color:#B8922A}' +
      '#cls-billing-widget .cls-billing-status{margin-top:.8rem;font-size:.72rem;color:#6B6258;line-height:1.5}' +
      '@media(max-width:760px){#cls-billing-widget .cls-billing-top{grid-template-columns:1fr}#cls-billing-widget .cls-billing-actions{justify-content:stretch}#cls-billing-widget .cls-billing-pay,#cls-billing-widget .cls-billing-wa{width:100%}}' +
      '@media print{#cls-billing-widget{display:none!important}}';
    document.head.appendChild(style);
  }

  function mountBillingWidget() {
    if (document.getElementById(BILLING_ID)) return;
    if (!isPortalPath()) return;
    var settingsView = document.getElementById('view-settings');
    if (!settingsView) {
      setTimeout(mountBillingWidget, 700);
      return;
    }
    injectBillingCardStyle();
    var plan = normalizePlan((window._profile && (window._profile.currentPlan || window._profile.plan)) || planFromPath() || rememberedPlan()) || 'solo';
    var details = PLAN_DETAILS[plan] || PLAN_DETAILS.solo;
    var profile = window._profile || {};
    var paid = window.clsIsProfilePaid(profile);
    var periodEnd = profile.subscriptionCurrentPeriodEnd ? new Date(profile.subscriptionCurrentPeriodEnd) : null;
    var periodCopy = periodEnd && !isNaN(periodEnd.getTime())
      ? 'Active until ' + periodEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '.'
      : (paid ? 'Your paid subscription is active.' : 'You can activate before or after the trial ends.');
    var wrap = document.createElement('div');
    wrap.id = BILLING_ID;
    wrap.innerHTML =
      '<div class="cls-billing-top">' +
        '<div>' +
          '<div class="cls-billing-kicker">Billing</div>' +
          '<div class="cls-billing-title">Pay with PAYable</div>' +
          '<div class="cls-billing-copy">Secure annual subscription payment for your CLS ' + escapeHtml(details.name) + ' account. PAYable returns here after payment, then the webhook activates your account in Supabase.</div>' +
          '<div class="cls-billing-price">' + escapeHtml(money(details.price)) + '<span style="font-size:.9rem;color:#6B6258"> / year</span></div>' +
          '<div class="cls-billing-sub">' + escapeHtml(planMonthlyLine(details)) + ' · ' + escapeHtml(periodCopy) + '</div>' +
        '</div>' +
        '<div class="cls-billing-actions">' +
          '<button type="button" class="cls-billing-pay" data-billing-pay>Pay annual</button>' +
          '<button type="button" class="cls-billing-wa" data-billing-wa>WhatsApp</button>' +
        '</div>' +
      '</div>' +
      '<div class="cls-billing-status" data-billing-status>Payment is processed through PAYable. No card details touch this website.</div>';
    (document.getElementById('settings-billing-widgets') || settingsView).appendChild(wrap);
    wrap.querySelector('[data-billing-pay]').addEventListener('click', function() {
      window.clsStartPayableCheckout(plan, { profile: window._profile || profile, button: this });
    });
    wrap.querySelector('[data-billing-wa]').addEventListener('click', function() {
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
    await collect(db.collection('supportTickets').where('uid', '==', user.uid));
    if (user.email) await collect(db.collection('supportTickets').where('email', '==', String(user.email).toLowerCase()));
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
      target.innerHTML = '<div class="cls-sp-status">Start a chat with Mrs. Gamage. Staff can see this in the admin panel and reply from there.</div>';
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

  async function refreshChat(wrap) {
    var list = wrap && wrap.querySelector('[data-chat-list]');
    if (!list) return;
    var db = getFirestore();
    var user = getAuthUser();
    if (!db || !user) {
      list.innerHTML = '<div class="cls-sp-status">Please sign in to chat with support.</div>';
      return;
    }
    list.innerHTML = '<div class="cls-sp-status">Loading chat...</div>';
    try {
      var thread = db.collection('chatThreads').doc(chatThreadId(user));
      var threadSnap = await thread.get();
      if (!threadSnap.exists) {
        renderChatMessages(list, []);
        return;
      }
      var snap = await thread.collection('messages').orderBy('createdAt', 'asc').limit(80).get();
      var rows = [];
      snap.forEach(function(doc) { rows.push({ id: doc.id, data: doc.data() || {} }); });
      renderChatMessages(list, rows);
      await thread.set({
        unreadForUser: false,
        lastUserReadAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastUserReadAtUtc: nowIso()
      }, { merge: true });
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
      var threadSnap = await thread.get();
      if (!threadSnap.exists) {
        renderChatMessages(list, []);
        return;
      }
      supportChatUnsubscribe = thread.collection('messages').orderBy('createdAt', 'asc').limit(80).onSnapshot(function(snap) {
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
    var thread = await ensureChatThread(db, user);
    var stamp = firebase.firestore.FieldValue.serverTimestamp();
    var authorName = cleanString(user.displayName || user.email || 'Customer', 180);
    await thread.collection('messages').add({
      uid: user.uid,
      email: cleanString(user.email || '', 180).toLowerCase(),
      authorRole: 'customer',
      authorName: authorName,
      text: text,
      page: location.href,
      createdAt: stamp,
      createdAtUtc: nowIso()
    });
    await thread.set({
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
    refreshChat(wrap);
    subscribeChat(wrap);
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
    (document.getElementById('settings-security-widgets') || settingsView).appendChild(wrap);
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
      '<div class="cls-support-top">' +
        '<div>' +
          '<div class="cls-support-kicker">Support</div>' +
          '<div class="cls-support-title">Need help?</div>' +
          '<div class="cls-support-copy">Chat with Mrs. Gamage for quick help, or send a support ticket for anything the team should track formally.</div>' +
        '</div>' +
        '<button type="button" class="cls-support-toggle">New ticket</button>' +
      '</div>' +
	      '<form id="cls-support-form" class="cls-support-form">' +
	        '<div><label>Name</label><input name="name" autocomplete="name"></div>' +
	        '<div><label>Email</label><input name="email" type="email" autocomplete="email" required></div>' +
	        '<div><label>Issue type</label><select name="type"><option>Question</option><option>Bug</option><option>Billing</option><option>Invoice/PDF issue</option><option>Account access</option></select></div>' +
	        '<div><label>Priority</label><select name="priority"><option>Normal</option><option>High</option><option>Urgent</option></select></div>' +
	        '<div class="full"><label>Message</label><textarea name="message" required placeholder="Tell us what happened..."></textarea></div>' +
	        '<button class="cls-sp-submit" type="submit">Send ticket</button>' +
	        '<div class="cls-sp-status" id="cls-support-status">This will be saved as a support ticket.</div>' +
	      '</form>' +
	      '<div class="cls-live-chat">' +
	        '<div class="cls-ticket-head"><div><div class="cls-support-kicker">Mrs. Gamage live chat</div><div class="cls-support-copy">Send a message to our 24/7 help line. Staff replies appear here and in the admin system.</div></div><button type="button" class="cls-ticket-refresh" data-refresh-chat>Refresh</button></div>' +
	        '<div class="cls-chat-messages" data-chat-list><div class="cls-sp-status">Loading chat...</div></div>' +
	        '<form class="cls-chat-compose" data-chat-form><textarea name="chatMessage" required placeholder="Type your message..."></textarea><button class="cls-sp-submit" type="submit">Send</button></form>' +
	        '<div class="cls-sp-status" data-chat-status>Messages are saved to your account so our team can continue the conversation.</div>' +
	      '</div>' +
	      '<div class="cls-ticket-list">' +
	        '<div class="cls-ticket-head"><div><div class="cls-support-kicker">My tickets</div><div class="cls-support-copy">Track open, in progress, and closed support tickets.</div></div><button type="button" class="cls-ticket-refresh" data-refresh-tickets>Refresh</button></div>' +
	        '<div data-ticket-list><div class="cls-sp-status">Loading tickets...</div></div>' +
	      '</div>';
    (document.getElementById('settings-security-widgets') || settingsView).appendChild(wrap);

    var supportActivityLoaded = false;
    function loadSupportActivity() {
      if (supportActivityLoaded) return;
      supportActivityLoaded = true;
      refreshMyTickets(wrap);
      subscribeChat(wrap);
    }

	    wrap.querySelector('.cls-support-toggle').addEventListener('click', function() {
	      wrap.classList.toggle('open');
      if (wrap.classList.contains('open')) loadSupportActivity();
	    });
    wrap.querySelector('[data-refresh-tickets]').addEventListener('click', function() {
      supportActivityLoaded = true;
      refreshMyTickets(wrap);
    });
    wrap.querySelector('[data-refresh-chat]').addEventListener('click', function() {
      supportActivityLoaded = true;
      refreshChat(wrap);
    });
    wrap.addEventListener('click', function(ev) {
      var btn = ev.target.closest('[data-close-ticket]');
      if (!btn) return;
      btn.disabled = true;
      btn.textContent = 'Closing...';
      closeMyTicket(btn.getAttribute('data-close-ticket'), wrap).catch(function(e) {
        btn.disabled = false;
        btn.textContent = 'Close ticket';
        alert(e.message || 'Could not close ticket.');
      });
    });

    var user = getAuthUser();
    if (user) {
      var nameInput = wrap.querySelector('input[name="name"]');
      var emailInput = wrap.querySelector('input[name="email"]');
      if (nameInput && user.displayName) nameInput.value = user.displayName;
      if (emailInput && user.email) emailInput.value = user.email;
    }

    try {
      if (window.firebase && firebase.apps && firebase.apps.length && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(nextUser) {
          var nameInput = wrap.querySelector('input[name="name"]');
          var emailInput = wrap.querySelector('input[name="email"]');
          if (nextUser) {
            if (nameInput && nextUser.displayName && !nameInput.value) nameInput.value = nextUser.displayName;
            if (emailInput && nextUser.email) emailInput.value = nextUser.email;
          }
          if (supportActivityLoaded) {
            refreshMyTickets(wrap);
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
          if (status) status.textContent = 'Sent. Mrs. Gamage will reply here.';
        } catch (e) {
          if (status) status.textContent = e.message || 'Could not send message right now.';
        }
      });
    }

    var supportForm = wrap.querySelector('#cls-support-form');
    supportForm.addEventListener('submit', async function(ev) {
      ev.preventDefault();
      var form = ev.currentTarget;
	      var status = document.getElementById('cls-support-status');
	      var data = Object.fromEntries(new FormData(form).entries());
	      data.email = cleanString(data.email, 180).toLowerCase();
	      data.page = location.href;
      data.utcAt = nowIso();
      data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      Object.assign(data, await currentUserPayload());
      status.textContent = 'Sending...';
      try {
        var res = await fetch('/.netlify/functions/submit-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        var json = await res.json().catch(function() { return {}; });
        if (!res.ok || json.ok === false) throw new Error(json.error || 'Could not send ticket');
        if (json.storage && json.storage.stored === false) {
          await saveSupportFallback(data);
        }
	        status.textContent = 'Ticket sent. Our team will check it.';
	        form.reset();
	        refreshMyTickets(wrap);
	      } catch (err) {
	        try {
	          await saveSupportFallback(data);
	          status.textContent = 'Ticket sent. Our team will check it.';
	          form.reset();
	          refreshMyTickets(wrap);
	        } catch (fallbackErr) {
	          status.textContent = 'Could not send ticket. Please email hello@ceylonrylabs.io.';
	        }
	      }
	    });
	  }

  function boot() {
    var pathPlan = planFromPath();
    if (pathPlan) safeSet('cls-last-plan', pathPlan);
    afterFirstPaint(trackVisit, 5000);
    afterFirstPaint(mountBillingWidget, 2300);
    afterFirstPaint(mountDangerZoneWidget, 2800);
    afterFirstPaint(mountSupportWidget, 3500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
