const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// BUG 013 / 014: signing up while a session is open threw "Creation of a session is prohibited when a session is active",
// so pos-onboarding.html never saved the profile and business name. The shared browser layer now ends the old session first.
test('the browser sign-up and sign-in end an open session before creating a new one', async () => {
  const calls = [];
  let active = true;
  class Account {
    async get() { return { $id: 'u1', email: 'new@shop.lk', name: '', prefs: {} }; }
    async create() { calls.push('create'); }
    async deleteSession() { calls.push('deleteSession'); active = false; }
    async createEmailPasswordSession() {
      if (active) throw new Error('Creation of a session is prohibited when a session is active.');
      calls.push('createSession');
      active = true;
    }
  }
  class Client { setEndpoint() { return this; } setProject() { return this; } }
  const window = {};
  const ctx = vm.createContext({ window, Appwrite: { Client, Account, ID: { unique: () => 'id' } }, location: { origin: 'https://x' }, console, Promise, setTimeout });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'appwrite-compat.js'), 'utf8'), ctx);
  const auth = window.clsBackend.auth();
  await auth.createUserWithEmailAndPassword('new@shop.lk', 'secret123');
  assert.deepEqual(calls, ['create', 'deleteSession', 'createSession']);
  calls.length = 0;
  await auth.signInWithEmailAndPassword('new@shop.lk', 'secret123');
  assert.deepEqual(calls, ['deleteSession', 'createSession']);
});
