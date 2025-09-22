# Moorecoin
<<<<<<< HEAD
=======

25-09-22
>>>>>>> 19960971991655efd0514fc9deb690c3cd1663f3
A classroom / community reward system. Users earn “Moorecoins”, view leaderboards, lock coins in time-based bonds for yield, and redeem (exchange) coins. Admins can award coins, manage users, clear pending redemptions, and monitor system health.

Licensed under the [GNU AGPL v3](LICENSE).

## Table of Contents

- [Features](#features)
- [High-Level Data Model](#high-level-data-model)
- [Backend (Flask)](#backend-flask)
- [API Overview](#api-overview)
- [Error Conventions](#error-conventions)
- [Getting Started (Local)](#getting-started-local)
  - [1. Clone](#1-clone)
  - [2. Python env](#2-python-env)
  - [3. Service Account](#3-service-account)
  - [4. Run Dev Server](#4-run-dev-server)
  - [5. Gunicorn (production style)](#5-gunicorn-production-style)
  - [6. Frontend (if using Firebase Hosting)](#6-frontend-if-using-firebase-hosting)
- [Auth (Testing)](#auth-testing)
- [Example Requests](#example-requests)
- [Security Notes](#security-notes)
- [Operational Notes](#operational-notes)
- [Extending](#extending)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Disclaimer](#disclaimer)
- [Easter Eggs (Maintainers)](#easter-eggs-maintainers)

## Features

- Firebase Authentication (validated server-side with Admin SDK)
- Firestore data (user profiles, balances, stats, bonds, pending redemptions)
- Bond mechanism (lock principal, earn interest based on total supply)
- Hour grouping (assign class hour once; admins bulk-award per hour)
- Secure admin endpoints (role flag on user doc)
- Leaderboard + global stats
- Lazy bond redemption (auto processes on read after maturity)
- Pending redemption queue (manual fulfillment workflow)
- Lightweight health/status endpoint

## High-Level Data Model

Firestore collections / docs (simplified):

- users/{uid}
  - profile: { displayName, email, photoURL, createdAt, hour }
  - balances: { coins, totalEarned }
  - bond: { amount, termDays, purchasedAt, payoutAt, interestRate, expectedReturn, redeemed, redeemedAt? }
  - flags: { admin }
- stats/global
  - moorecoins (circulating supply)
  - users (count)
  - bondsOutstanding (locked principal)
- stats/pending
  - { uid: { amount, createdAt } ... }

Legacy fallback fields (coins, totalEarned, admin, hour) still respected.

## Backend (Flask)

File: app.py (Flask + firebase_admin + flask_cors)

Key helpers:

- verify_token(): extracts & verifies Firebase ID token (Authorization: Bearer \<token\>)
- compute\*bond_interest_rate(totalSupply): 0.1 + 0.65 \* e^(−0.000486 \_ supply)
- \_maybe_redeem_matured_bond(): transactional bond payout

## API Overview

Public:

- GET / Basic message
- GET /health Uptime + dependency latency

Authenticated (Bearer ID token):

- GET /user/exists Creates default user if missing
- GET /user/info Returns user doc (may auto-redeem matured bond)
- PATCH /user/hour Set hour once (1–6)
- GET /user/bond Current (or last) bond
- POST /purchase/bond { amount:int, term?:int }
- POST /purchase/exchange/{n} Spend n coins → queued in stats/pending

Stats / Leaderboard:

- GET /stats/moorecoins/total
- POST /stats/moorecoins/edit (admin)
- GET /stats/users/total
- GET /stats/users/leaderboard
- GET /stats/users/leaderboard/{limit}

Admin:

- GET /admin/users?limit=&order=&dir=
- PATCH /admin/users/{uid} (coins, admin, hour)
- POST /admin/hour/award { hour, coins }
- GET /admin/pending
- DELETE /admin/pending/{uid}

Bond lifecycle:

1. POST /purchase/bond (locks principal, increments bondsOutstanding)
2. After payoutAt, any read of /user/info or /user/bond triggers lazy redemption
3. Redemption mints ONLY interest portion to global supply, releases locked principal to user balance

## Error Conventions

JSON: { "error": "\<message\>" }  
HTTP 401 (auth), 403 (not admin), 400 (validation), 404 (missing), 503 (/health dependency failure).

## Getting Started (Local)

Prerequisites:

- Python 3.11+
- Firebase project (Firestore in Native mode enabled)
- Service Account key (JSON) with Firestore + Auth admin rights

Project layout (partial):

```
app.py
public/
firebase.json
firestore.rules
firestore.indexes.json
LICENSE
package.json (frontend scripts optionally)
secrets/
  moorecoin-service-key.json  (NOT committed)
```

### 1. Clone

```sh
git clone <repo-url>
cd Moorecoin
```

### 2. Python env

(windows)

```batch
python -m venv .venv
.venv\Scripts\activate
pip install flask firebase-admin flask-cors gunicorn
```

(linux/mac)

```sh
python3 -m venv .venv
. ./.venv/bin/activate
pip install flask firebase-admin flask-cors gunicorn
```

### 3. Service Account

Place JSON at:

```
secrets/moorecoin-service-key.json
```

Keep this file out of version control (add secrets/ to .gitignore).

### 4. Run Dev Server

```sh
python app.py
# or with auto-reload
set FLASK_APP=app.py
flask run
```

### 5. Gunicorn (production style)

```sh
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### 6. Frontend (if using Firebase Hosting)

```sh
npm i -g firebase-tools
firebase login
firebase emulators:start --only hosting
# deploy:
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

## Auth (Testing)

Obtain a Firebase ID token (client SDK signIn) then call:

```
Authorization: Bearer <ID_TOKEN>
```

## Example Requests

Health:

```sh
curl https://your-host/health
```

User bootstrap:

```sh
curl -H "Authorization: Bearer $TOKEN" https://your-host/user/exists
```

Purchase bond:

```sh
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"amount":100,"term":14}' https://your-host/purchase/bond
```

Award hour (admin):

```sh
curl -X POST -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"hour":3,"coins":5}' https://your-host/admin/hour/award
```

Exchange:

```sh
curl -X POST -H "Authorization: Bearer $TOKEN" https://your-host/purchase/exchange/25
```

## Security Notes

- All mutating endpoints verify Firebase ID token server-side.
- Admin role is stored on user doc (flags.admin). Change via PATCH /admin/users/{uid}.
- Do not expose service account JSON publicly.
- Consider rate limiting (not included).
- Ensure Firestore security rules block direct client writes to privileged fields (server performs authoritative updates).

## Operational Notes

- /health touches Auth (list_users) and stats/global (Firestore read).
- Response header X-Response-Time added for latency insights.
- Lazy bond redemption keeps cron jobs unnecessary.
- Pending redemptions require an out-of-band fulfillment process (e.g., mark delivered then DELETE entry).

## Extending

Ideas:

- Add pagination for /admin/users
- Add audit log collection
- Allow multiple concurrent bonds with an array
- Implement scheduled Cloud Function for bond redemption (optional)
- Add caching layer for leaderboard

## Troubleshooting

Issue: 401 errors  
Check: Token expired, wrong Firebase project, missing Authorization header.

Issue: Bond purchase fails with "Global stats missing"  
Create stats/global doc with fields:

```
{ "moorecoins": 0, "users": 0, "bondsOutstanding": 0 }
```

Issue: Hour award finds zero users  
Ensure users set hour via PATCH /user/hour first.

### CI/CD: Firebase Hosting preview channel

This repo includes a GitHub Actions workflow that deploys the `gambling` branch to a Firebase Hosting preview channel named `gambling` against the `test` Hosting target. Hosting targets are mapped in `.firebaserc`:

- `live` → site `mooreco-in`
- `test` → site `mooreco-in-test`

Workflow: `.github/workflows/firebase-hosting-gambling.yml`

Notes:

- Correct CLI syntax for preview channels is `firebase hosting:channel:deploy <channel> --only <target>`.
- Example used here: `--only test` to deploy only the "test" Hosting target.
- If you see "Hosting site or target channel:<name> not detected", you're likely mixing `firebase deploy --only hosting:channel:<id>` (invalid) with preview channel commands.

Auth in CI:

- Using `--token` with `FIREBASE_TOKEN` works but is deprecated; prefer Application Default Credentials (service account) with `GOOGLE_APPLICATION_CREDENTIALS`.
- Create a minimal-scoped service account (Firebase Hosting Admin), download JSON, store as an encrypted secret/artifact, and set env var `GOOGLE_APPLICATION_CREDENTIALS` in the job (or use GitHub OIDC to issue short‑lived credentials on-demand).

## License

Copyright (C) 2025 Noah Harper

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

See [LICENSE](LICENSE).

## Disclaimer

Educational / demonstration use; not financial currency.

## Easter Eggs (Maintainers)

Lightweight, purely cosmetic easter eggs are included via `public/easter-eggs.js` and loaded on user-facing pages. They’re intentionally mild and do not change balances or grant coins.

Discoverables:

- Konami code (↑ ↑ ↓ ↓ ← → ← → B A) → brief coin confetti + toast
- Hotkeys:
  - Shift+R → Retro mode (persists via `localStorage: egg-retro`)
  - Shift+M → Monochrome mode
  - Shift+D → Disco overlay (reduced-motion friendly)
- Click sequences:
  - Click the logo 5× within ~1.5s → playful spin + toast
  - Triple-click the Moorecoins balance number → pulse + randomized tip
  - On `404.html`, click the headline 3× → confetti + redirect home
  - Double-click the footer links area → small overlay credits card (auto-dismiss)
- Long-press hint: hover/touch-hold the “Moorecoin value” area (~1.2s) → decay curve tip
- Phrase triggers (type anywhere outside inputs):
  - moore, credits, stonks, retro (existing)
  - mono → enables monochrome
  - party → enables disco overlay
  - snow → ❄️ emoji confetti
  - bunny → ASCII bunny toast
  - idkfa → “no god mode” toast

Reduced Motion: if the user has “Reduce Motion” enabled, confetti is replaced by a simple toast.
