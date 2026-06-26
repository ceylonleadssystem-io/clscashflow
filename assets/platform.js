(function() {
  var VALID_PLANS = { solo: true, studio: true, business: true };
  var PLAN_FILES = { solo: 'solo.html', studio: 'starter.html', business: 'growth.html' };
  var PLAN_ALIASES = { starter: 'studio', growth: 'business', premium: 'business' };
  var PLAN_DETAILS = {
    solo: { name: 'Solo', price: 3500, file: 'solo.html' },
    studio: { name: 'Studio', price: 5500, file: 'starter.html' },
    business: { name: 'Business', price: 8500, file: 'growth.html' }
  };
  var PLAN_RANK = { solo: 1, studio: 2, business: 3 };
  var SUPPORT_ID = 'cls-support-widget';
  var FIREBASE_PROJECT_ID = 'ceylonry-labs';
  var FIREBASE_API_KEY = 'AIzaSyCyKT7FWZYdW7dgKf-nV95NFLpZcIGBAWI';

  function nowIso() {
    return new Date().toISOString();
  }

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

  function highestPlanFrom(values) {
    var best = '';
    (values || []).forEach(function(value) {
      var plan = normalizePlan(value);
      if (planRank(plan) > planRank(best)) best = plan;
    });
    return best;
  }

  function rememberedPlan() {
    return highestPlanFrom([safeGet('cls-current-plan'), safeGet('cls-last-plan')]);
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
    return highestPlanFrom([profile.currentPlan, profile.plan, profile.lastPlan, profile.requestedPlan]);
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

  function bestPlan(profile, plan) {
    return highestPlanFrom([
        plan,
        profile && profile.currentPlan,
        profile && profile.plan,
        profile && profile.lastPlan,
        profile && profile.requestedPlan
      ])
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
      ' Plan (' + money(details.price) + '/month).' +
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
          '<div style="font-family:Cormorant Garamond,Georgia,serif;font-size:2.25rem;font-weight:300">' + money(details.price) + '<span style="font-size:1rem;color:#6B6258">/month</span></div>' +
          '<div style="font-size:.78rem;color:#6B6258;margin-top:.25rem">' + details.name + ' Plan · Monthly subscription</div>' +
        '</div>' +
        '<button id="cls-payable-action" type="button" style="display:block;width:100%;background:#1a1714;color:#fff;border:0;padding:1rem;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700;cursor:pointer;margin-bottom:.75rem;font-family:inherit">Pay with Payable</button>' +
        '<button id="cls-wa-action" type="button" style="display:block;width:100%;background:#fff;color:#6B6258;border:1px solid rgba(184,146,42,.35);padding:.85rem;font-size:.74rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700;cursor:pointer;font-family:inherit">Activate via WhatsApp</button>' +
        '<button onclick="window.clsSignOut&&window.clsSignOut()" type="button" style="margin-top:1rem;background:transparent;border:0;color:#A8A29A;font-size:.72rem;cursor:pointer;font-family:inherit">Sign out</button>' +
        '<div style="font-size:.68rem;color:#A8A29A;margin-top:1rem">Your data stays saved while payment is completed.</div>' +
      '</div>';
    document.body.appendChild(ov);
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

  function firestoreValue(value) {
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number' && isFinite(value)) return { doubleValue: value };
    return { stringValue: cleanString(value, 1000) };
  }

  function firestoreFields(obj) {
    var fields = {};
    Object.keys(obj || {}).forEach(function(key) {
      if (obj[key] !== undefined && obj[key] !== null) fields[key] = firestoreValue(obj[key]);
    });
    return fields;
  }

  function safeVisitPayload(payload) {
    payload = payload || {};
    return {
      eventType: 'page_view',
      visitId: cleanString(payload.visitId || newId('visit'), 140),
      visitorId: cleanString(payload.visitorId, 180),
      sessionId: cleanString(payload.sessionId, 180),
      uid: cleanString(payload.uid, 140),
      email: cleanString(payload.email, 180),
      displayName: cleanString(payload.displayName, 180),
      path: cleanString(payload.path, 300),
      url: cleanString(payload.url, 900),
      title: cleanString(payload.title, 240),
      referrer: cleanString(payload.referrer, 900),
      timezone: cleanString(payload.timezone, 120),
      language: cleanString(payload.language, 80),
      userAgent: cleanString(payload.userAgent, 500),
      screen: cleanString(payload.screen, 80),
      lastPlan: cleanString(payload.lastPlan, 40),
      pageKind: cleanString(payload.pageKind, 80),
      isLanding: payload.isLanding === true,
      isPortal: payload.isPortal === true,
      utcAt: cleanString(payload.utcAt || nowIso(), 90),
      localAt: cleanString(payload.localAt, 180),
      firstSeenAt: cleanString(payload.firstSeenAt, 90),
      createdAt: nowIso(),
      source: 'browser-fallback'
    };
  }

  async function storeVisitFallback(payload) {
    if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY) return false;
    var body = { fields: firestoreFields(safeVisitPayload(payload)) };
    var url = 'https://firestore.googleapis.com/v1/projects/' +
      encodeURIComponent(FIREBASE_PROJECT_ID) +
      '/databases/(default)/documents/platformVisits?key=' +
      encodeURIComponent(FIREBASE_API_KEY);
    try {
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true
      });
      return res.ok;
    } catch (e) {
      return false;
    }
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
    if (!db) throw new Error('Firebase is not available on this page.');
    var payload = Object.assign({}, data, {
      status: 'open',
      source: 'browser-fallback',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    var doc = await db.collection('supportTickets').add(payload);
    return doc.id;
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
	      '@media(max-width:760px){.cls-settings-support-card .cls-support-top,.cls-settings-support-card .cls-support-form{grid-template-columns:1fr}.cls-settings-support-card .cls-support-toggle,.cls-settings-support-card .cls-sp-submit{width:100%}}' +
      '@media print{#cls-support-widget{display:none!important}}';
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
    if (!db) throw new Error('Firebase is not available on this page.');
    var stamp = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('supportTickets').doc(id).set({
      status: 'closed',
      closedBy: 'customer',
      customerClosedAt: stamp,
      updatedAt: stamp
    }, { merge: true });
    await refreshMyTickets(wrap);
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
          '<div class="cls-support-copy">Send a small support ticket to the Ceylonry Labs team. We will receive your account, page, and UTC timestamp with the issue.</div>' +
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
	      '<div class="cls-ticket-list">' +
	        '<div class="cls-ticket-head"><div><div class="cls-support-kicker">My tickets</div><div class="cls-support-copy">Track open, in progress, and closed support tickets.</div></div><button type="button" class="cls-ticket-refresh" data-refresh-tickets>Refresh</button></div>' +
	        '<div data-ticket-list><div class="cls-sp-status">Loading tickets...</div></div>' +
	      '</div>';
    settingsView.appendChild(wrap);

	    wrap.querySelector('.cls-support-toggle').addEventListener('click', function() {
	      wrap.classList.toggle('open');
	    });
    wrap.querySelector('[data-refresh-tickets]').addEventListener('click', function() {
      refreshMyTickets(wrap);
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

    wrap.querySelector('form').addEventListener('submit', async function(ev) {
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
    refreshMyTickets(wrap);
	  }

  function boot() {
    var pathPlan = planFromPath();
    if (pathPlan) safeSet('cls-last-plan', pathPlan);
    setTimeout(trackVisit, 900);
    mountSupportWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
