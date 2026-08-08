# Web & Admin Integration

This mobile app is one of three separate repos sharing one Firebase
project. There's no shared code between them (no monorepo, no shared
npm package) — they're kept in sync by convention and by both pointing
at the same Firestore database.

## `DonorDrop-app` (web)

The original web version. Same Firestore collections, same schema (see
DATABASE.md) — a donor or requester created on web shows up in the
mobile app and vice versa, since it's the same `/donors`, `/requesters`,
`/requests` collections either way. If you change the shape of a
document in one app (add a field, rename something), the other app needs
the same change or it'll silently ignore/miss that field.

**Not verified from this repo**: whether the web app's Firestore
*security rules* differ from what the mobile app assumes. If a
permission error shows up on mobile that doesn't make sense given
DATABASE.md's description, check the actual deployed rules (Firebase
Console → Firestore → Rules) rather than assuming this doc is current —
rules can be edited directly in console without a corresponding code
change in either app repo.

## `donordrop-admin` (backend)

A separate backend, deployed on Vercel, that holds the
`firebase-admin` SDK and FCM V1 push credentials — deliberately kept out
of both client apps, since neither should ship server credentials in a
binary anyone can decompile.

**The one integration point from this app**: `lib/requests.ts#createRequest`
calls `POST {EXPO_PUBLIC_ADMIN_API_URL}/api/requests/notify-matches` with
`{ requestId }` right after creating a request. This is meant to trigger
the admin backend's donor-matching + push-notification fan-out.

- `EXPO_PUBLIC_ADMIN_API_URL` must point at the **deployed** Vercel URL,
  not `localhost` — obvious once you're testing on a physical device (it
  can't reach your laptop's localhost), easy to forget when it was set
  up during local development against a local admin server.
- The call is wrapped in try/catch and only logs a warning on failure —
  a broken or unreachable admin API does NOT block request creation.
  This is a deliberate tradeoff (a requester's post should never fail
  just because the notification side-channel is down) but it also means
  a broken integration here is silent from the mobile app's side. See
  NOTIFICATIONS.md's verification checklist.
- This app cannot see what `notify-matches` actually does once called —
  see NOTIFICATIONS.md for exactly what's unverified about that.

## Kept-in-sync-by-hand logic

`lib/compatibility.ts`'s blood type compatibility matrix is explicitly
commented as mirroring `donordrop-admin`'s copy of the same logic. If
blood type matching rules ever change (e.g. adding a new edge case),
that change needs to be made in **both** places — there's no shared
source of truth enforcing they match. Worth eventually extracting into a
shared package if this becomes a recurring source of drift, but not
worth the setup overhead for a matrix that rarely changes.
