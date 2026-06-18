(function() {
  var VALID_PLANS = { starter: true, growth: true, premium: true };
  var PLAN_FILES = { starter: 'starter.html', growth: 'growth.html', premium: 'premium.html' };
  var SUPPORT_ID = 'cls-support-widget';

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
    return VALID_PLANS[plan] ? plan : '';
  }

  function planFromPath() {
    var path = (location.pathname || '').toLowerCase();
    if (path.indexOf('growth') !== -1) return 'growth';
    if (path.indexOf('premium') !== -1) return 'premium';
    if (path.indexOf('starter') !== -1) return 'starter';
    return '';
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

  window.clsRememberPlan = async function clsRememberPlan(plan, uid, db) {
    plan = normalizePlan(plan);
    if (!plan) return plan;
    safeSet('cls-last-plan', plan);
    safeSet('cls-current-plan', plan);
    safeSet('cls-last-plan-at', nowIso());

    var user = getAuthUser();
    uid = uid || (user && user.uid);
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

  window.clsRouteForProfile = function clsRouteForProfile(profile) {
    profile = profile || {};
    var plan = normalizePlan(profile.lastPlan)
      || normalizePlan(profile.currentPlan)
      || normalizePlan(profile.plan)
      || normalizePlan(safeGet('cls-last-plan'))
      || normalizePlan(safeGet('cls-current-plan'))
      || 'starter';
    return PLAN_FILES[plan] || PLAN_FILES.starter;
  };

  window.clsMountTrialCountdown = function clsMountTrialCountdown(opts) {
    opts = opts || {};
    var old = document.getElementById('cls-trial-countdown');
    if (old) old.remove();

    var profile = opts.profile || {};
    var end = opts.trialEnd ? new Date(opts.trialEnd) : new Date(profile.trialEnd || Date.now());
    if (!end || isNaN(end.getTime()) || profile.paid === true) return;

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
    document.body.appendChild(bar);

    if (!document.getElementById('cls-platform-style')) {
      var style = document.createElement('style');
      style.id = 'cls-platform-style';
      style.textContent =
        '#cls-trial-countdown{position:fixed;left:18px;right:18px;bottom:16px;z-index:9400;background:#1a1714;color:#fff;border:1px solid rgba(184,146,42,.35);box-shadow:0 18px 50px rgba(0,0,0,.2);padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:16px;font-family:DM Sans,Inter,Arial,sans-serif;font-size:13px}' +
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
        '@media(max-width:640px){#cls-trial-countdown{left:10px;right:10px;bottom:10px;align-items:flex-start;flex-direction:column}#cls-trial-action{width:100%}#cls-support-launcher{bottom:124px}}' +
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

  function trackVisit() {
    if (location.protocol === 'file:') return;
    var payload = {
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
      lastPlan: safeGet('cls-last-plan') || planFromPath()
    };
    currentUserPayload().then(function(user) {
      Object.assign(payload, user);
      fetch('/.netlify/functions/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function() {});
    });
  }

  function mountSupportWidget() {
    if (document.getElementById(SUPPORT_ID)) return;
    if (/ceylonry-admin\.html/i.test(location.pathname)) return;

    var launcher = document.createElement('button');
    launcher.id = 'cls-support-launcher';
    launcher.type = 'button';
    launcher.textContent = 'Help';

    var panel = document.createElement('div');
    panel.id = 'cls-support-panel';
    panel.innerHTML =
      '<div class="cls-sp-head"><div class="cls-sp-title">Need help?</div><button type="button" class="cls-sp-close" aria-label="Close">&times;</button></div>' +
      '<form id="cls-support-form">' +
        '<div><label>Name</label><input name="name" autocomplete="name"></div>' +
        '<div><label>Email</label><input name="email" type="email" autocomplete="email" required></div>' +
        '<div><label>Issue type</label><select name="type"><option>Question</option><option>Bug</option><option>Billing</option><option>Invoice/PDF issue</option><option>Account access</option></select></div>' +
        '<div><label>Priority</label><select name="priority"><option>Normal</option><option>High</option><option>Urgent</option></select></div>' +
        '<div><label>Message</label><textarea name="message" required placeholder="Tell us what happened..."></textarea></div>' +
        '<button class="cls-sp-submit" type="submit">Send ticket</button>' +
        '<div class="cls-sp-status" id="cls-support-status">We will receive this as a support ticket.</div>' +
      '</form>';

    var wrap = document.createElement('div');
    wrap.id = SUPPORT_ID;
    wrap.appendChild(launcher);
    wrap.appendChild(panel);
    document.body.appendChild(wrap);

    launcher.addEventListener('click', function() { panel.classList.toggle('open'); });
    panel.querySelector('.cls-sp-close').addEventListener('click', function() { panel.classList.remove('open'); });

    var user = getAuthUser();
    if (user) {
      var nameInput = panel.querySelector('input[name="name"]');
      var emailInput = panel.querySelector('input[name="email"]');
      if (nameInput && user.displayName) nameInput.value = user.displayName;
      if (emailInput && user.email) emailInput.value = user.email;
    }

    panel.querySelector('form').addEventListener('submit', async function(ev) {
      ev.preventDefault();
      var form = ev.currentTarget;
      var status = document.getElementById('cls-support-status');
      var data = Object.fromEntries(new FormData(form).entries());
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
        status.textContent = 'Ticket sent. Our team will check it.';
        form.reset();
      } catch (err) {
        status.textContent = 'Could not send ticket. Please email hello@ceylonrylabs.io.';
      }
    });
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
