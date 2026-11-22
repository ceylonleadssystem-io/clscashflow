# Live support session: relay server and testing

How the live support session (issue #179) works on the network side, how to switch on the relay server, and what to test on tablets and slow networks.

## How the connection works
The client's POS and the support agent's admin portal connect directly (WebRTC). The `support-session` function only passes the connection details and never carries the live view. Direct connections need no setup.

Some networks (strict firewalls, some mobile networks) block direct connections. For those the two sides go through a **relay server** (TURN). Without one, a session on such a network will not connect.

## Who can use it: admin accounts and support-only accounts
Administrator accounts have a type. **admin** can do everything in the admin portal, including live support. **support** can use live support and nothing else: after signing in it sees only the Live support screen, and the server refuses every other portal function (accounts, billing, diagnostics) for it. An account with no type is an admin, so accounts that existed before keep working.

Create a support account:

```bash
node scripts/setup-admin-db.mjs        # once, on an existing database: adds the account type field
node scripts/hash-admin-password.mjs   # answer "support" to "Account type"
```

Leaving the account type empty when updating an existing account keeps its current type. Support accounts use a `@ceylonrylabs.io` address like every other administrator and sign in at the admin portal.

The older "Open client's POS" (a copy of a business' configuration) and "Sign in as client (live)" buttons were removed from the account page: live support replaces both, and the server no longer issues a sign-in token for a client.

## Relay server (coturn)
The functions hand out time-limited relay credentials (valid for 2 hours) built from a shared secret, so no password is stored in the web pages. Nothing happens until both settings below exist; without them only direct connections are used.

### 1. Install coturn on the server
Ubuntu example (planned for the new server, see `docs/migration/self-hosting-plan.md`):

```bash
sudo apt install coturn
```

`/etc/turnserver.conf` (replace the secret, realm and certificate paths):

```
listening-port=3478
tls-listening-port=5349
realm=turn.ceylonrylabs.io
server-name=turn.ceylonrylabs.io
fingerprint
use-auth-secret
static-auth-secret=CHANGE-ME-TO-A-LONG-RANDOM-SECRET
cert=/etc/letsencrypt/live/turn.ceylonrylabs.io/fullchain.pem
pkey=/etc/letsencrypt/live/turn.ceylonrylabs.io/privkey.pem
no-cli
no-multicast-peers
# the relay must never reach private networks
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=169.254.0.0-169.254.255.255
min-port=49152
max-port=65535
total-quota=100
```

Open on the firewall: `3478` (UDP and TCP), `5349` (TCP) and the UDP range `49152-65535`. Point `turn.ceylonrylabs.io` at the server.

### 2. Tell the functions about it
Set these environment variables on the site (the secret must be the same as `static-auth-secret`, at least 16 characters):

| Variable | Example |
| --- | --- |
| `SUPPORT_TURN_URLS` | `turn:turn.ceylonrylabs.io:3478?transport=udp,turns:turn.ceylonrylabs.io:5349?transport=tcp` |
| `SUPPORT_TURN_SECRET` | the same secret as above |

Only `stun:`, `turn:` and `turns:` addresses are accepted; anything else is ignored.

### 3. Check it works
Start a live session (Settings > Plan & Support > Live support) from a network that blocks direct connections, for example a phone hotspot, and join from the admin portal. The agent's view and the client's panel show a line such as **Through the relay, 180 ms**. A direct connection shows **Direct, 40 ms**.

## Reconnecting
If a connection drops, the client's POS tries again by itself for up to 2 minutes and the agent's view waits for it. After a reconnect the page copy starts again from a fresh snapshot, and **control has to be allowed again** by the client. Ending the session from either side ends it for both.

## Slow networks
When the link is busy, mouse and touch movement events are skipped first; page changes, clicks, typing and scrolling are always sent. A round trip above 500 ms is shown as **Slow**.

## Test checklist (tablets and slow networks)
Run each with a real client device and an agent on another computer. Note anything that fails.

- [ ] iPad (Safari): get a code, agent joins, the live view appears, the pointer / highlighter / arrow / spotlight / note show on the iPad.
- [ ] Android tablet (Chrome): same as above.
- [ ] Landscape and portrait: the top bar fits, **Open it / Not now / Allow / No / Pause control / End session** are all reachable.
- [ ] Ask to open a screen (Settings > Service Charge): the iPad asks, opens it after **Open it**, and stays put after **Not now**.
- [ ] Control: allow it, then the agent clicks a normal button, types in a field and scrolls. Void, Refund, Sign Out, the Pay screens and the PIN screen must stay with the client.
- [ ] The PIN and sign-in screens show nothing in the agent's view.
- [ ] Switch the client's Wi-Fi off for 10 seconds and on again: the session reconnects, the view returns, control is off.
- [ ] Switch the client's Wi-Fi off for 3 minutes: the session ends with a clear message on both sides.
- [ ] A phone hotspot or a restrictive network: with the relay set up, the session connects and shows **Through the relay**.
- [ ] A slow network (throttled connection): the view stays usable, and the pointer may lag but nothing else is lost.
- [ ] End session from the client, then from the agent: both sides return to normal and the code cannot be used again.
- [ ] A wrong code 5 times: the administrator is paused for a few minutes.
