# Moorecoin API Documentation

Version: 2025-09-12
Base URL: (local) `http://localhost:5000` or your deployed host.
All responses are JSON.

## Authentication

All protected endpoints require a Firebase ID token via the HTTP header:

```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

If the header is missing or invalid you will receive `401 {"error":"..."}`.

## Schemas (New vs Legacy)

The backend is migrating from a legacy flat schema to a nested schema.

New user document shape:

```
{
  profile: {
    displayName: string|null,
    photoURL: string|null,
    email: string|null,
    createdAt: FirestoreTimestamp,
    hour: int? (1-6)
  },
  balances: {
    coins: number,          // spendable balance (rounded to 2 decimals in responses)
    totalEarned: number     // lifetime earned (rounded to 2 decimals in responses; excludes starting principal of bonds)
  },
  bond: { ... } | null,
  flags: { admin: bool },
  lastUpdated?: FirestoreTimestamp
}
```

Legacy fallbacks (still read / updated if present): `coins`, `totalEarned`, `displayName`, `photoURL`, `email`, `admin`, `hour`.

When both exist, the API prefers the new structure.

## Conventions

- Error responses: `{ "error": "message" }`
- Firestore server timestamps appear as `{seconds: <int>, nanoseconds: <int>}` when read directly.
- Date/time strings inside bond objects are ISO-8601 UTC strings.
- All coin / monetary numeric fields in responses are rounded to 2 decimal places (JSON numbers, not strings). Internal precision may be higher.

---

## Public / Health

### GET `/`

Health/info.
Response 200:

```
{ "message": "hosted with gunicorn via docker\nlove from noah (moorecoin dev)" }
```

No auth.

---

## User Endpoints

### GET `/user/exists` (auth)

Creates a default user document if missing. Returns existence & data.
Success 200:

```
{ "exists": true|false, "data": <userDocument> }
```

Errors: 401.

### GET `/user/info` (auth)

Returns full user doc (merged) and lazily auto-redeems matured bond if any.
Success 200: `<userDocument>` (root object fields, not wrapped).
Errors: 401, 404.

### PATCH `/user/hour` (auth)

One-time set of class hour.
Body:

```
{ "hour": int (1-6) }
```

Success 200: `{ "hour": <int> }`
Errors: 400 (validation), 401 (auth), 404 (user doc missing), 409 (already set).

### GET `/user/bond` (auth)

Returns current (or last) bond after attempting lazy redemption.
Success 200: `{ "bond": <bondObject|null> }`
Errors: 401, 404.

### POST `/purchase/bond` (auth)

Create a single active bond.
Body:

```
{ "amount": int>0, "term": int (days, optional, default 14, 1-60) }
```

Bond object:

```
{
  amount: int,
  termDays: int,
  purchasedAt: ISOString,
  payoutAt: ISOString,
  interestRate: float,          // yield (not incl. principal)
  expectedReturn: float,        // principal + interest (rounded to 2 decimals in responses)
  redeemed: bool
}
```

Success 200:

```
{ "bond": <bondObject>, "moorecoins": <newUserBalance> }
```

Errors: 400 (validation / insufficient / active bond), 401, 500.

### POST `/purchase/exchange/{num}` (auth)

Spend (exchange) coins; moves them to a `stats/pending` document keyed by user id.
Path param: `num` positive integer.
Success 200:

```
{
  "exchanged": num,
  "userCoins": newUserBalance,
  "globalMoorecoins": newGlobalSupply,
  "pendingTotal": totalPendingForUser
}
```

Errors: 400 (validation/insufficient), 401, 404 (stats missing), 500.

---

## Stats & Leaderboard

### GET `/stats/moorecoins/total`

Returns global coin supply.
Success 200: `{ "moorecoins": number }`
Errors: 404.

### POST `/stats/moorecoins/edit` (admin)

Adjust global coin supply by delta.
Body: `{ "moorecoins": intDelta }`
Success 200: `{ "moorecoins": newTotal }`
Errors: 401, 403, 404.

### GET `/stats/users/total`

Count of user documents.
Success 200: `{ "total": int }`

### GET `/stats/users/leaderboard`

Top 10 users by balance.
Success 200:

```
{ "leaderboard": [ { uid, coins, displayName, photoURL } ... ] }
```

### GET `/stats/users/leaderboard/{limit}`

Same, custom limit (int). Returns 200.

---

## Admin User Management (admin auth)

All require admin privileges (user.flags.admin / legacy user.admin).

### GET `/admin/users`

Query params:

- `limit` (default 50, max 500)
- `order` one of: coins, totalEarned, createdAt, name (default coins)
- `dir` asc|desc (default desc)
  Success 200:

```
{
  users: [
    { uid, coins, totalEarned, displayName, email, photoURL, admin, createdAt, hour }
  ],
  count, order, dir
}
```

### PATCH `/admin/users/{uid}`

Body (any subset):

```
{
  "coins": int (absolute new balance),
  "admin": bool,
  "hour": int (1-6) | "" to clear
}
```

Effects:

- Adjusts global supply by coin delta.
- Increments totalEarned only if coins increased.
  Success 200: user subset + delta info.
  Errors: 400, 401, 403, 404, 500.

### POST `/admin/hour/award`

Body:

```
{ "hour": int 1-6, "coins": int>0 }
```

Awards coins to every user in that hour (new + legacy fields). Batched writes.
Success 200:

```
{ hour, coinsPerUser, userCount, totalAwarded, batches }
```

Errors: 400, 401, 403.

### GET `/admin/pending`

Lists all pending exchange requests.
Success 200:

```
{
  "pending": [ { uid, amount, createdAt?, displayName, email } ],
  "count": n
}
```

Errors: 401, 403.

### DELETE `/admin/pending/{uid}`

Clears a pending exchange entry by user id.
Success 200: `{ "cleared": uid }`
Errors: 401, 403, 500.

---

## Bond Mechanics Overview

Interest Rate formula (mirrors frontend):

```
rate = 0.1 + 0.65 * exp(-0.000486 * totalGlobalCoins)
```

(Clamped to >= 0). `expectedReturn = round(amount * (1 + rate), 6)`.
On redemption (automatic when matured on certain reads):

- User balance += expectedReturn (principal + interest)
- Global supply += interest portion only
- `bondsOutstanding` (global) decremented by principal
- User `balances.totalEarned` increments by interest portion only

Field `stats/global.bondsOutstanding` tracks locked principal.

---

## Pending Exchange Flow

1. User calls `/purchase/exchange/{num}`.
2. User coins and global supply both decrease by `num`.
3. `stats/pending` document stores an accumulating amount: `{ uid: { amount, createdAt } }`.
4. Admins process externally, then call `DELETE /admin/pending/{uid}` to clear.

---

## Common Error Codes Summary

- 400: Validation / business rule failure
- 401: Missing or invalid auth token
- 403: Authenticated but not admin for admin-only routes
- 404: Not found (user/global doc missing)
- 409: Conflict (hour already set)
- 500: Unexpected server error / transaction failure

---

## Quick Start (Local)

1. Place Firebase Admin SDK service account JSON at `./secrets/moorecoin-service-key.json`.
2. Install dependencies:

```
pip install flask flask-cors firebase-admin
```

3. Run:

```
python app.py
```

---

## Future Enhancements (Suggestions)

- Provide `/openapi.json` route serving an OpenAPI 3.0 spec (can be generated from this document).
- Add pagination to `/admin/users`.
- Add explicit bond redemption endpoint if manual trigger desired.
- Rate limiting / abuse prevention.
- Structured error codes.

---

Generated by automated assistant on 2025-09-06.
