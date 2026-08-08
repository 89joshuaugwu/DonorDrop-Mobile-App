# Database (Firestore)

One Firebase project, shared with the web app. No `firestore.rules` file
lives in this repo — the rules are defined and deployed from whichever
repo owns Firebase Hosting/deploy for this project (check the web repo).
This doc describes the **shape** of the data; treat the rules themselves
as the source of truth for who can read/write what, and keep this in sync
if the rules change.

## Collections

### `/donors/{uid}`
One doc per donor profile, keyed by their Firebase Auth `uid`.

```ts
{
  uid: string;
  name: string;
  phone: string;
  bloodType: "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";
  lat: number;
  lng: number;
  geohash: string;           // geofire-common, for proximity queries
  isVisible: boolean;        // donor-controlled "show me in searches" toggle
  verified: boolean;         // admin-set, not self-service
  lastDonationDate: string | null;  // ISO — drives the 90-day cooldown
  totalDonations: number;
  pushToken?: string;        // Expo push token, omitted (not null) if absent
  createdAt: string;         // ISO
}
```
Written by: `donor-register.tsx` (creation), `donations.ts#logDonation`
(bumps `totalDonations` + resets `lastDonationDate`), profile screen's
visibility `Switch` (`isVisible`), `push.ts` callers (`pushToken`).

### `/requesters/{uid}`
```ts
{ uid: string; name: string; phone: string; organization?: string; }
```
Written once at `requester-register.tsx`, never updated after.

### `/requests/{id}`
```ts
{
  requesterUid: string;
  requesterName: string;
  requesterPhone: string;
  bloodTypeNeeded: BloodType;
  units: number;
  urgency: "Normal" | "Urgent" | "Critical";
  hospitalName: string;
  lat: number;
  lng: number;
  geohash: string;
  notes?: string;
  status: "open" | "fulfilled" | "spam" | "cancelled";
  createdAt: string;
  fulfilledAt?: string;
}
```
Auto-generated doc ID. Written by `requests.ts#createRequest` (creation),
`#markRequestFulfilled` (status → "fulfilled"). Queried two ways:
- Requester's own list: `where("requesterUid", "==", uid)`
- Donor's nearby feed: geohash bounding-box query (see REALTIME.md) +
  client-side compatibility filter (`compatibility.ts`) + exact-distance
  filter, since geohash bounds are a superset (rectangle), not an exact
  radius.

### `/requests/{id}/responses/{donorUid}`
Subcollection, one doc per donor who has responded to that specific
request. **Doc ID is the donor's own uid** — this is load-bearing, not
incidental: it's what lets `getMyResponse`/`subscribeToMyResponse` do a
single-doc read (`doc(..., donorUid)`) instead of a collection query, and
that distinction matters because of the Firestore rule shape (see below).

```ts
{
  donorUid: string;
  donorName: string;
  donorPhone: string;
  bloodType: BloodType;
  available: boolean;
  respondedAt: string;
}
```
Written by `requests.ts#respondToRequest`.

**Rule constraint that shapes the code:** a donor can read their own
response doc (`isOwner(donorUid)` on that specific doc), but the
*collection* — `getRequestResponses` / `subscribeToRequestResponses` — is
only readable by the request's owner (`requesterUid`). A `getDocs()`/
`onSnapshot()` collection query is denied unless the rule holds for
*every* doc it would return, so a donor calling the collection-level
function fails with "Missing or insufficient permissions" even though
their own doc write succeeded. This is why the code has two separate
read paths (`getMyResponse` vs `getRequestResponses`) instead of one.

### `/notifications/{uid}/items/{itemId}`
```ts
{
  requestId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
```
Two write paths, both currently only cover *half* the notification
surface — see [NOTIFICATIONS.md](./NOTIFICATIONS.md) for the full picture
and what's still unverified:
1. **Donor notifications** — written by the external `donordrop-admin`
   backend's `notify-matches` endpoint, triggered from this app when a
   request is created (`requests.ts#createRequest`). Not visible in this
   repo — can't confirm from here whether it writes here or only sends a
   device push.
2. **Requester notifications** — written directly by this app
   (`requests.ts#respondToRequest`) when a donor marks themselves
   available. Client-side write only, no push notification attached
   (see NOTIFICATIONS.md for why).

### `/donations/{id}`
```ts
{ donorUid: string; location: string; loggedAt: string; }
```
Auto-generated doc ID. Append-only log, written by
`donations.ts#logDonation`, read by the profile screen's donation
history list (`where("donorUid", "==", uid)`).

### `/metadata/requests`
```ts
{ lastUpdatedAt: string; }
```
A single doc, best-effort "pulse" write on every request creation
(`createRequest`). Not read anywhere in this app currently — likely
exists for the web app or admin backend to detect activity without
scanning the full `/requests` collection. Wrapped in try/catch since a
failure here shouldn't block the actual request from being created.

## Indexes

Compound queries used here (`where` + `orderBy` on different fields, or
the geohash range queries) typically need a Firestore composite index.
If a query throws a `FAILED_PRECONDITION` error mentioning an index, the
error message includes a direct link to create it in the Firebase
console — that's the fastest way to add one; there's no `firestore.indexes.json`
committed in this repo to keep in sync by hand.
