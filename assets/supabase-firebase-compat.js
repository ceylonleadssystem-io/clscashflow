(function() {
  'use strict';

  var SUPABASE_URL = 'https://iudcinvfqbdzaptnnzqg.supabase.co';
  var PUBLIC_SITE_ORIGIN = 'https://ceylonrylabs.io';
  var supabaseClient = null;
  var configPromise = null;
  var apps = [];
  var authListeners = [];
  var currentUserCache = null;

  function randomId(prefix) {
    var id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
    return (prefix ? prefix + '_' : '') + id;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function normalizePath(path) {
    return String(path || '').replace(/^\/+|\/+$/g, '');
  }

  function isLocalHost(hostname) {
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '[::1]';
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
    if (!supabaseClient) return null;
    var session = await supabaseClient.auth.getSession();
    var s = session && session.data && session.data.session;
    currentUserCache = s && s.user ? wrapUser(s.user, s) : null;
    if (notify && currentUserCache) {
      authListeners.slice().forEach(function(cb) { try { cb(currentUserCache); } catch (e) {} });
    }
    return currentUserCache;
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
    var cfg = await loadConfig();
    SUPABASE_URL = cfg.url || SUPABASE_URL;
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('Supabase browser library did not load.');
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    supabaseClient.auth.onAuthStateChange(function(_event, session) {
      currentUserCache = session && session.user ? wrapUser(session.user, session) : null;
      authListeners.slice().forEach(function(cb) { try { cb(currentUserCache); } catch (e) {} });
    });
    await refreshCurrentUserFromSession(false);
    watchOAuthSessionReady();
    return supabaseClient;
  }

  async function accessToken() {
    var client = await getClient();
    var session = await client.auth.getSession();
    return session && session.data && session.data.session ? session.data.session.access_token : '';
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
        if (session && session.access_token) return session.access_token;
        return accessToken();
      },
      updateProfile: async function(profile) {
        profile = profile || {};
        var client = await getClient();
        var name = profile.displayName || profile.name || this.displayName || '';
        var avatar = profile.photoURL || this.photoURL || '';
        var out = await client.auth.updateUser({ data: { full_name: name, name: name, avatar_url: avatar } });
        if (out.error) throw out.error;
        this.displayName = name;
        this.photoURL = avatar;
      }
    };
  }

  async function docsRequest(payload) {
    var token = await accessToken();
    var res = await fetch('/.netlify/functions/supabase-docs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? 'Bearer ' + token : ''
      },
      body: JSON.stringify(payload)
    });
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
  DocumentRef.prototype.set = async function(data, opts) {
    await docsRequest({ action: 'set', path: this.path, id: this.id, data: fieldValueToPlain(data || {}), merge: !!(opts && opts.merge) });
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
  AuthCompat.prototype.onAuthStateChanged = function(cb) {
    authListeners.push(cb);
    getClient().then(function(client) {
      return client.auth.getSession();
    }).then(function(session) {
      var s = session && session.data && session.data.session;
      currentUserCache = s && s.user ? wrapUser(s.user, s) : null;
      cb(currentUserCache);
    }).catch(function() { cb(null); });
    return function() {
      authListeners = authListeners.filter(function(item) { return item !== cb; });
    };
  };
  AuthCompat.prototype.signInWithEmailAndPassword = async function(email, password) {
    var client = await getClient();
    var out = await client.auth.signInWithPassword({ email: email, password: password });
    if (out.error) throw compatAuthError(out.error, 'auth/invalid-credential');
    currentUserCache = wrapUser(out.data.user, out.data.session);
    return { user: currentUserCache };
  };
  AuthCompat.prototype.createUserWithEmailAndPassword = async function(email, password) {
    var client = await getClient();
    var out = await client.auth.signUp({ email: email, password: password });
    if (out.error) throw compatAuthError(out.error, 'auth/email-already-in-use');
    currentUserCache = out.data.session ? wrapUser(out.data.user, out.data.session) : wrapUser(out.data.user, null);
    return { user: currentUserCache };
  };
  AuthCompat.prototype.sendPasswordResetEmail = async function(email, settings) {
    var client = await getClient();
    var out = await client.auth.resetPasswordForEmail(email, { redirectTo: settings && settings.url ? settings.url : authRedirectUrl('/signin.html', '') });
    if (out.error) throw compatAuthError(out.error);
  };
  AuthCompat.prototype.signOut = async function() {
    var client = await getClient();
    await client.auth.signOut();
    currentUserCache = null;
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
