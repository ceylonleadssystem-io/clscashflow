(function() {
  'use strict';

  var SUPABASE_URL = 'https://iudcinvfqbdzaptnnzqg.supabase.co';
  var PUBLIC_SITE_ORIGIN = 'https://ceylonrylabs.io';
  var AUTH_STORAGE_KEY = 'cls-cashflow-auth';
  var SESSION_BACKUP_KEY = 'cls-cashflow-auth-backup';
  var supabaseClient = null;
  var clientPromise = null;
  var configPromise = null;
  var apps = [];
  var authListeners = [];
  var currentUserCache = null;
  var authNullTimer = null;
  var sessionRefreshPromise = null;
  var authStateVersion = 0;
  var explicitSignOutInProgress = false;
  var lastAuthSuccessAt = 0;

  function notifyAuthListeners(user) {
    authListeners.slice().forEach(function(cb) {
      try { cb(user); } catch (e) {}
    });
  }

  function setCurrentUser(user, notify, forceNotify) {
    var previousUid = currentUserCache && currentUserCache.uid ? currentUserCache.uid : '';
    var nextUid = user && user.uid ? user.uid : '';
    var changed = previousUid !== nextUid;
    currentUserCache = user || null;
    authStateVersion += 1;
    if (user) {
      lastAuthSuccessAt = Date.now();
      window.__CLS_LAST_AUTH_UID = user.uid || '';
      window.__CLS_LAST_AUTH_AT = lastAuthSuccessAt;
    }
    if (notify && (forceNotify || changed)) notifyAuthListeners(currentUserCache);
    return currentUserCache;
  }

  function persistSessionBackup(session) {
    if (!session || !session.user || !session.access_token || !session.refresh_token) return;
    try {
      localStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at || 0,
        user: {
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata || {}
        },
        savedAt: Date.now()
      }));
    } catch (e) {}
  }

  function readSessionBackup() {
    try {
      var raw = localStorage.getItem(SESSION_BACKUP_KEY);
      if (!raw) return null;
      var backup = JSON.parse(raw);
      if (!backup || !backup.access_token || !backup.refresh_token) return null;
      if (Date.now() - Number(backup.savedAt || 0) > 1000 * 60 * 60 * 24 * 14) return null;
      return backup;
    } catch (e) {
      return null;
    }
  }

  function clearSessionBackup() {
    try { localStorage.removeItem(SESSION_BACKUP_KEY); } catch (e) {}
  }

  async function currentSessionOnce() {
    if (!supabaseClient) return null;
    var session = await supabaseClient.auth.getSession();
    var s = session && session.data && session.data.session;
    if (s && s.user && s.expires_at && (s.expires_at * 1000 - Date.now()) < 30000) {
      if (!sessionRefreshPromise) {
        sessionRefreshPromise = supabaseClient.auth.refreshSession()
          .then(function(out) { return out && out.data ? out.data.session : null; })
          .catch(function() { return null; })
          .finally(function() { sessionRefreshPromise = null; });
      }
      var refreshed = await sessionRefreshPromise;
      if (refreshed && refreshed.user) s = refreshed;
    }
    if (s && s.user) persistSessionBackup(s);
    return s && s.user ? s : null;
  }

  async function sessionUserOnce() {
    var s = await currentSessionOnce();
    return s && s.user ? wrapUser(s.user, s) : null;
  }

  async function restoreSessionFromBackup() {
    if (!supabaseClient || explicitSignOutInProgress) return null;
    var backup = readSessionBackup();
    if (!backup) return null;
    var out = await supabaseClient.auth.setSession({
      access_token: backup.access_token,
      refresh_token: backup.refresh_token
    }).catch(function() { return null; });
    var session = out && out.data && out.data.session;
    if (session && session.user) {
      persistSessionBackup(session);
      return wrapUser(session.user, session);
    }
    return null;
  }

  async function confirmMissingSession() {
    for (var i = 0; i < 4; i += 1) {
      var user = await sessionUserOnce().catch(function() { return null; });
      if (user) return user;
      user = await restoreSessionFromBackup().catch(function() { return null; });
      if (user) return user;
      await sleep(450);
    }
    return null;
  }

  function scheduleVerifiedSignedOut(delayMs) {
    if (authNullTimer) clearTimeout(authNullTimer);
    var scheduledVersion = authStateVersion;
    authNullTimer = setTimeout(function() {
      authNullTimer = null;
      confirmMissingSession().then(function(user) {
        if (user) {
          setCurrentUser(user, true);
          return;
        }
        if (currentUserCache && authStateVersion !== scheduledVersion) return;
        if (currentUserCache && Date.now() - lastAuthSuccessAt < 15000) {
          scheduleVerifiedSignedOut(2500);
          return;
        }
        if (currentUserCache) {
          scheduleVerifiedSignedOut(30000);
          return;
        }
        setCurrentUser(null, true, true);
      }).catch(function() {
        if (!currentUserCache) setCurrentUser(null, true, true);
      });
    }, delayMs || 2500);
  }

  function randomId(prefix) {
    var id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
    return (prefix ? prefix + '_' : '') + id;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }

  function normalizePath(path) {
    return String(path || '').replace(/^\/+|\/+$/g, '');
  }

  function isLocalHost(hostname) {
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '[::1]';
  }

  function clearLegacyAuthStorage() {
    try {
      var keep = {};
      keep[AUTH_STORAGE_KEY] = true;
      var keys = [];
      for (var i = 0; i < localStorage.length; i += 1) keys.push(localStorage.key(i));
      keys.forEach(function(key) {
        if (!key || keep[key] || key === SESSION_BACKUP_KEY) return;
        if (/^sb-iudcinvfqbdzaptnnzqg-auth-token/.test(key) || key === 'supabase.auth.token') {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}
  }

  function siteOrigin() {
    if (!window.location || isLocalHost(window.location.hostname)) return PUBLIC_SITE_ORIGIN;
    return window.location.origin || PUBLIC_SITE_ORIGIN;
  }

  function authRedirectUrl(pathname, search) {
    var path = pathname || (window.location && window.location.pathname) || '/signin.html';
    var query = typeof search === 'string' ? search : ((window.location && window.location.search) || '');
    if (!path || path === '/') path = '/signin.html';
    return siteOrigin() + path + query;
  }

  function oauthRedirectUrl() {
    var path = (window.location && window.location.pathname) || '/signin.html';
    if (/\/accept-invite\.html$/i.test(path)) return authRedirectUrl('/accept-invite.html', window.location.search || '');
    if (/\/onboarding\.html$/i.test(path)) return authRedirectUrl('/onboarding.html', '');
    return authRedirectUrl('/signin.html', '');
  }

  function hasOAuthReturnParams() {
    var hash = (window.location && window.location.hash) || '';
    var search = (window.location && window.location.search) || '';
    return /access_token=|refresh_token=|provider_token=|code=/.test(hash + search);
  }

  async function refreshCurrentUserFromSession(notify) {
    var user = await sessionUserOnce();
    if (user) setCurrentUser(user, notify);
    return user || null;
  }

  function watchOAuthSessionReady() {
    if (!hasOAuthReturnParams()) return;
    var tries = 0;
    var timer = setInterval(function() {
      tries += 1;
      refreshCurrentUserFromSession(true).then(function(user) {
        if (user || tries >= 20) clearInterval(timer);
      }).catch(function() {
        if (tries >= 20) clearInterval(timer);
      });
    }, 250);
  }

  function fieldValueToPlain(value) {
    if (!value || typeof value !== 'object') return value;
    if (value.__serverTimestamp === true) return nowIso();
    if (value.__delete === true) return { __delete: true };
    if (Array.isArray(value)) return value.map(fieldValueToPlain);
    var out = {};
    Object.keys(value).forEach(function(key) {
      out[key] = fieldValueToPlain(value[key]);
    });
    return out;
  }

  function wrapTimestamp(value) {
    if (typeof value !== 'string') return value;
    var parsed = Date.parse(value);
    if (!Number.isFinite(parsed) || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return value;
    var str = value;
    return {
      toDate: function() { return new Date(str); },
      toMillis: function() { return new Date(str).getTime(); },
      toString: function() { return str; },
      valueOf: function() { return new Date(str).getTime(); }
    };
  }

  function dataFromPlain(value) {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(dataFromPlain);
    var out = {};
    Object.keys(value).forEach(function(key) {
      out[key] = wrapTimestamp(dataFromPlain(value[key]));
    });
    return out;
  }

  async function loadConfig() {
    if (configPromise) return configPromise;
    configPromise = fetch('/.netlify/functions/supabase-config')
      .then(function(res) { return res.json().then(function(json) { if (!res.ok || !json.ok) throw new Error(json.error || 'Supabase config failed.'); return json; }); })
      .catch(function(err) {
        if (window.CLS_SUPABASE_ANON_KEY) return { url: window.CLS_SUPABASE_URL || SUPABASE_URL, anonKey: window.CLS_SUPABASE_ANON_KEY };
        throw err;
      });
    return configPromise;
  }

  async function getClient() {
    if (supabaseClient) return supabaseClient;
    if (clientPromise) return clientPromise;
    clientPromise = (async function initSupabaseClient() {
      var cfg = await loadConfig();
      SUPABASE_URL = cfg.url || SUPABASE_URL;
      if (!window.supabase || !window.supabase.createClient) {
        throw new Error('Supabase browser library did not load.');
      }
      if (window.__CLS_SUPABASE_CLIENT) {
        supabaseClient = window.__CLS_SUPABASE_CLIENT;
      } else {
        clearLegacyAuthStorage();
        supabaseClient = window.supabase.createClient(SUPABASE_URL, cfg.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: AUTH_STORAGE_KEY
          }
        });
        window.__CLS_SUPABASE_CLIENT = supabaseClient;
        supabaseClient.auth.onAuthStateChange(function(_event, session) {
          if (session && session.user) {
            if (authNullTimer) {
              clearTimeout(authNullTimer);
              authNullTimer = null;
            }
            explicitSignOutInProgress = false;
            persistSessionBackup(session);
            setCurrentUser(wrapUser(session.user, session), true);
            return;
          }
          if (explicitSignOutInProgress) {
            explicitSignOutInProgress = false;
            clearSessionBackup();
            setCurrentUser(null, true, true);
            return;
          }
          scheduleVerifiedSignedOut();
        });
      }
      await refreshCurrentUserFromSession(false);
      watchOAuthSessionReady();
      return supabaseClient;
    })().catch(function(err) {
      clientPromise = null;
      throw err;
    });
    return clientPromise;
  }

  async function accessToken() {
    await getClient();
    var session = await currentSessionOnce();
    if (!session) {
      var restored = await restoreSessionFromBackup().catch(function() { return null; });
      if (restored) session = await currentSessionOnce();
    }
    return session && session.access_token ? session.access_token : '';
  }

  function wrapUser(user, session) {
    if (!user) return null;
    var meta = user.user_metadata || {};
    return {
      uid: user.id,
      id: user.id,
      email: user.email || '',
      displayName: meta.full_name || meta.name || user.email || '',
      photoURL: meta.avatar_url || '',
      getIdToken: async function() {
        return accessToken();
      },
      updateProfile: async function(profile) {
        profile = profile || {};
        var client = await getClient();
        var name = profile.displayName || profile.name || this.displayName || '';
        var avatar = profile.photoURL || this.photoURL || '';
        this.displayName = name;
        this.photoURL = avatar;
        var session = await client.auth.getSession();
        if (!session || !session.data || !session.data.session) return;
        var out = await client.auth.updateUser({ data: { full_name: name, name: name, avatar_url: avatar } });
        if (out.error) {
          var msg = String(out.error.message || '').toLowerCase();
          if (msg.indexOf('auth session missing') >= 0 || msg.indexOf('session') >= 0) return;
          throw out.error;
        }
      }
    };
  }

  async function docsRequest(payload) {
    async function send() {
      var token = await accessToken();
      return fetch('/.netlify/functions/supabase-docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? 'Bearer ' + token : ''
        },
        body: JSON.stringify(payload)
      });
    }
    var res = await send();
    if (res.status === 401) {
      await restoreSessionFromBackup().catch(function() { return null; });
      res = await send();
    }
    var json = await res.json().catch(function() { return {}; });
    if (!res.ok || !json.ok) throw new Error(json.error || 'Supabase document request failed.');
    return json;
  }

  function compatAuthError(error, fallbackCode) {
    if (!error) return error;
    var message = String(error.message || '').toLowerCase();
    var code = String(error.code || '').toLowerCase();
    if (code.indexOf('invalid_credentials') >= 0 || message.indexOf('invalid login') >= 0 || message.indexOf('invalid credentials') >= 0) {
      error.code = 'auth/invalid-credential';
    } else if (message.indexOf('already registered') >= 0 || message.indexOf('already exists') >= 0) {
      error.code = 'auth/email-already-in-use';
    } else if (message.indexOf('not enabled') >= 0 || message.indexOf('disabled') >= 0) {
      error.code = 'auth/operation-not-allowed';
    } else if (!error.code && fallbackCode) {
      error.code = fallbackCode;
    }
    return error;
  }

  function DocSnapshot(ref, doc) {
    this.ref = ref;
    this.id = ref.id;
    this.exists = !!doc;
    this._data = doc ? dataFromPlain(doc.data || {}) : null;
  }
  DocSnapshot.prototype.data = function() { return this._data ? Object.assign({}, this._data) : undefined; };

  function QuerySnapshot(docs) {
    this.docs = docs || [];
    this.empty = !this.docs.length;
    this.size = this.docs.length;
  }
  QuerySnapshot.prototype.forEach = function(cb) {
    this.docs.forEach(cb);
  };

  function DocumentRef(path, id) {
    this.path = normalizePath(path);
    this.id = id || randomId('doc');
  }
  DocumentRef.prototype.collection = function(name) {
    return new CollectionRef(this.path + '/' + this.id + '/' + name);
  };
  DocumentRef.prototype.get = async function() {
    var json = await docsRequest({ action: 'get', path: this.path, id: this.id });
    return new DocSnapshot(this, json.exists ? json.doc : null);
  };
  DocumentRef.prototype.getCollections = async function(names) {
    var json = await docsRequest({ action: 'getWorkspace', path: this.path, id: this.id, collections: names || [] });
    var profile = new DocSnapshot(this, json.exists ? json.doc : null);
    var collections = {};
    Object.keys(json.collections || {}).forEach(function(name) {
      collections[name] = new QuerySnapshot((json.collections[name] || []).map(function(doc) {
        return new DocSnapshot(new DocumentRef(this.path + '/' + this.id + '/' + name, doc.id), doc);
      }, this));
    }, this);
    return { profile: profile, collections: collections };
  };
  DocumentRef.prototype.set = async function(data, opts) {
    await docsRequest({ action: 'set', path: this.path, id: this.id, data: fieldValueToPlain(data || {}), merge: !!(opts && opts.merge) });
    return this;
  };
  DocumentRef.prototype.replaceCollections = async function(data, collections) {
    var payloadCollections = {};
    Object.keys(collections || {}).forEach(function(name) {
      var docs = Array.isArray(collections[name]) ? collections[name] : [];
      payloadCollections[name] = docs.map(function(doc, index) {
        var raw = doc && Object.prototype.hasOwnProperty.call(doc, 'data') ? doc.data : doc;
        raw = fieldValueToPlain(raw || {});
        var id = doc && doc.id != null ? doc.id : (raw.id != null ? raw.id : (raw._id != null ? raw._id : (raw.num != null ? raw.num : index)));
        return { id: String(id), data: raw };
      });
    });
    await docsRequest({
      action: 'replaceWorkspace',
      path: this.path,
      id: this.id,
      data: fieldValueToPlain(data || {}),
      collections: payloadCollections
    });
    return this;
  };
  DocumentRef.prototype.update = async function(data) {
    await docsRequest({ action: 'update', path: this.path, id: this.id, data: fieldValueToPlain(data || {}) });
    return this;
  };
  DocumentRef.prototype.delete = async function() {
    await docsRequest({ action: 'delete', path: this.path, id: this.id });
  };

  function CollectionRef(path, filters, order, limitValue) {
    this.path = normalizePath(path);
    this._filters = filters || [];
    this._order = order || null;
    this._limit = limitValue || 0;
  }
  CollectionRef.prototype.doc = function(id) {
    return new DocumentRef(this.path, id || randomId('doc'));
  };
  CollectionRef.prototype.add = async function(data) {
    var id = randomId('doc');
    await docsRequest({ action: 'add', path: this.path, id: id, data: fieldValueToPlain(data || {}) });
    return new DocumentRef(this.path, id);
  };
  CollectionRef.prototype.replaceAll = async function(docs) {
    docs = Array.isArray(docs) ? docs : [];
    await docsRequest({
      action: 'replaceCollection',
      path: this.path,
      docs: docs.map(function(doc, index) {
        var raw = doc && Object.prototype.hasOwnProperty.call(doc, 'data') ? doc.data : doc;
        raw = fieldValueToPlain(raw || {});
        var id = doc && doc.id != null ? doc.id : (raw.id != null ? raw.id : (raw._id != null ? raw._id : (raw.num != null ? raw.num : index)));
        return { id: String(id), data: raw };
      })
    });
    return this;
  };
  CollectionRef.prototype.where = function(field, op, value) {
    return new CollectionRef(this.path, this._filters.concat([{ field: field, op: op, value: value }]), this._order, this._limit);
  };
  CollectionRef.prototype.orderBy = function(field, dir) {
    return new CollectionRef(this.path, this._filters, { field: field, dir: dir || 'asc' }, this._limit);
  };
  CollectionRef.prototype.limit = function(n) {
    return new CollectionRef(this.path, this._filters, this._order, Number(n) || 0);
  };
  CollectionRef.prototype.get = async function() {
    var options = {
      filters: this._filters,
      order: this._order && this._order.field,
      dir: this._order && this._order.dir,
      limit: this._limit,
      fetchLimit: Math.max(this._limit || 0, 1000)
    };
    var json = await docsRequest({ action: 'query', path: this.path, options: options });
    var docs = (json.docs || []).map(function(doc) {
      return new DocSnapshot(new DocumentRef(this.path, doc.id), doc);
    }, this);
    return new QuerySnapshot(docs);
  };
  CollectionRef.prototype.onSnapshot = function(cb) {
    var closed = false;
    var ref = this;
    async function tick() {
      if (closed) return;
      try {
        cb(await ref.get());
      } catch (e) {}
    }
    tick();
    var timer = setInterval(tick, 7000);
    return function() {
      closed = true;
      clearInterval(timer);
    };
  };

  function FirestoreCompat() {}
  FirestoreCompat.prototype.collection = function(name) { return new CollectionRef(name); };
  FirestoreCompat.prototype.batch = function() {
    var ops = [];
    return {
      set: function(ref, data, opts) { ops.push(function() { return ref.set(data, opts); }); },
      update: function(ref, data) { ops.push(function() { return ref.update(data); }); },
      delete: function(ref) { ops.push(function() { return ref.delete(); }); },
      commit: function() { return Promise.all(ops.map(function(op) { return op(); })); }
    };
  };

  function AuthCompat() {}
  Object.defineProperty(AuthCompat.prototype, 'currentUser', {
    get: function() { return currentUserCache; }
  });
  AuthCompat.prototype.waitForCurrentUser = async function(timeoutMs) {
    var deadline = Date.now() + (timeoutMs || 4500);
    try {
      await getClient();
    } catch (e) {
      return null;
    }
    while (Date.now() <= deadline) {
      if (currentUserCache) return currentUserCache;
      var refreshed = await refreshCurrentUserFromSession(false).catch(function() { return null; });
      if (refreshed) return refreshed;
      var restored = await restoreSessionFromBackup().catch(function() { return null; });
      if (restored) return setCurrentUser(restored, false);
      await sleep(150);
    }
    return null;
  };
  AuthCompat.prototype.onAuthStateChanged = function(cb) {
    authListeners.push(cb);
    getClient().then(function(client) {
      return client.auth.getSession();
    }).then(function(session) {
      var s = session && session.data && session.data.session;
      if (s && s.user) {
        persistSessionBackup(s);
        setCurrentUser(wrapUser(s.user, s), false);
        cb(currentUserCache);
      }
      else scheduleVerifiedSignedOut();
    }).catch(function() { scheduleVerifiedSignedOut(); });
    return function() {
      authListeners = authListeners.filter(function(item) { return item !== cb; });
    };
  };
  AuthCompat.prototype.signInWithEmailAndPassword = async function(email, password) {
    var client = await getClient();
    var out = await client.auth.signInWithPassword({ email: email, password: password });
    if (out.error) throw compatAuthError(out.error, 'auth/invalid-credential');
    persistSessionBackup(out.data.session);
    var user = setCurrentUser(wrapUser(out.data.user, out.data.session), true, true);
    return { user: user };
  };
  AuthCompat.prototype.createUserWithEmailAndPassword = async function(email, password) {
    var client = await getClient();
    async function finishWithPasswordSignIn(existingError) {
      var signedIn = await client.auth.signInWithPassword({ email: email, password: password });
      if (signedIn.error) {
        if (existingError) throw compatAuthError(existingError, 'auth/email-already-in-use');
        throw compatAuthError(signedIn.error, 'auth/invalid-credential');
      }
      persistSessionBackup(signedIn.data.session);
      var user = setCurrentUser(wrapUser(signedIn.data.user, signedIn.data.session), true, true);
      return { user: user };
    }
    try {
      var res = await fetch('/.netlify/functions/supabase-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });
      var json = await res.json().catch(function() { return {}; });
      if (res.ok && json.ok) return finishWithPasswordSignIn();
      var err = new Error(json.error || 'Could not create account.');
      err.code = json.code || '';
      if (res.status === 409 || err.code === 'auth/email-already-in-use') return finishWithPasswordSignIn(err);
      throw err;
    } catch (fnErr) {
      if (String(fnErr && fnErr.code || '') === 'auth/email-already-in-use') return finishWithPasswordSignIn(fnErr);
      var out = await client.auth.signUp({ email: email, password: password });
      if (out.error) throw compatAuthError(out.error, 'auth/email-already-in-use');
      if (out.data && out.data.session) {
        persistSessionBackup(out.data.session);
        var createdUser = setCurrentUser(wrapUser(out.data.user, out.data.session), true, true);
        return { user: createdUser };
      }
      return finishWithPasswordSignIn();
    }
  };
  AuthCompat.prototype.sendPasswordResetEmail = async function(email, settings) {
    var client = await getClient();
    var out = await client.auth.resetPasswordForEmail(email, { redirectTo: settings && settings.url ? settings.url : authRedirectUrl('/reset-password.html', '') });
    if (out.error) throw compatAuthError(out.error);
  };
  AuthCompat.prototype.signOut = async function() {
    var client = await getClient();
    explicitSignOutInProgress = true;
    clearSessionBackup();
    await client.auth.signOut();
    setCurrentUser(null, true, true);
  };
  AuthCompat.prototype.signInWithPopup = async function(provider) {
    var client = await getClient();
    var providerName = provider && provider.providerId ? provider.providerId : 'google';
    var out = await client.auth.signInWithOAuth({ provider: providerName, options: { redirectTo: oauthRedirectUrl() } });
    if (out.error) throw compatAuthError(out.error);
    return new Promise(function() {});
  };

  function GoogleAuthProvider() {
    this.providerId = 'google';
  }

  var authCompat = new AuthCompat();
  var firestoreCompat = new FirestoreCompat();

  window.firebase = {
    apps: apps,
    initializeApp: function(config) {
      if (!apps.length) apps.push({ name: '[DEFAULT]', options: config || {} });
      getClient().catch(function(err) { console.warn('Supabase initialization failed:', err); });
      return apps[0];
    },
    auth: function() { return authCompat; },
    firestore: function() { return firestoreCompat; }
  };
  window.firebase.auth.GoogleAuthProvider = GoogleAuthProvider;
  window.firebase.firestore.FieldValue = {
    serverTimestamp: function() { return { __serverTimestamp: true }; },
    delete: function() { return { __delete: true }; }
  };
})();
