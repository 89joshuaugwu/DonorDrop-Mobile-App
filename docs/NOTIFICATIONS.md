# Notifications

There are two independent notification surfaces in this app, and it's
worth keeping them mentally separate because they fail independently:

1. **OS-level push notifications** (the banner that shows when the app
   isn't open) — requires FCM V1 credentials, a physical device, and the
   external `donordrop-admin` backend.
2. **In-app notification list** (`(donor-tabs)/notifications.tsx` and the
   requester equivalent) — reads `/notifications/{uid}/items` in
   Firestore directly. This can work even if push notifications are
   completely broken, and vice versa — they're not the same pipeline.

## Manual permission controls (profile screens)

Both profile screens now have a small permissions card
(`components/molecules/PermissionRow.tsx`) instead of handling
notifications/location entirely silently in the background. This closes
a real gap: the automatic re-check on mount can retry an
`undetermined` permission, but once someone has explicitly **denied**
a permission, iOS/Android both refuse to show the system dialog again —
calling `request*PermissionsAsync()` a second time just immediately
resolves back to `"denied"` with no UI at all. The only real fix at
that point is deep-linking to the OS Settings app
(`Linking.openSettings()`), which is what the button does once status
is `"denied"`.

- **Donor profile**: Notifications + Location. Location is the more
  important of the two to have here — `donor-register.tsx`'s onboarding
  flow lets someone skip location entirely (`PermissionPrompt`'s "Not
  now"), and there was previously no way to add it later short of
  clearing app data and re-registering. A donor stuck at `lat: 0, lng:
  0` silently never matches any request, with no error pointing at why
  — see `lib/location.ts#refreshDonorLocation`. The location button
  also stays visible even once granted (`grantedActionLabel="Refresh"`)
  since a granted permission doesn't mean the *stored* coordinates are
  still accurate — donors who've relocated need a way to update them.
- **Requester profile**: Notifications only. Requesters don't have a
  persistent location on their profile — location is per-request,
  captured in `post-request.tsx` at the time they post, not something
  that lives on `RequesterProfile`.

## Push token registration (this app's half)

`lib/push.ts#registerForPushNotifications`:
- Sets up the Android notification channel, requests permission, and
  calls `Notifications.getExpoPushTokenAsync({ projectId })` — the
  `projectId` **must** be passed explicitly outside Expo Go, or this
  throws.
- Requires a physical device (`Device.isDevice` check) — simulators/
  emulators don't have push capability and this returns `null` for them,
  by design, not as an error.
- Does **not** write the token to Firestore itself — see the comment in
  that file for why (the donor doc doesn't exist yet at the point this
  is first called during onboarding). The token gets included directly
  in the initial `setDoc` in `donor-register.tsx` / `requester-register.tsx`,
  and re-checked/re-persisted from the respective profile screen on
  every subsequent app open (see below — this used to be broken).

### A real bug this surfaced: stale tokens after an EAS project migration

Expo push tokens are tied to the `projectId` they were issued under.
Moving to a new EAS project (a real thing that happened during this
project's development) silently invalidates every previously-issued
token — anyone registered before the migration keeps a `pushToken` field
that *looks* present but no longer routes anywhere.

The donor and requester profile screens' original re-registration logic
made this worse than it needed to be: it called
`registerForPushNotifications()` to fetch a fresh token, then **never
did anything with the return value** — the token was fetched and
discarded on every mount. Combined with a guard of
`if (!donorProfile.pushToken)`, this meant:
- A donor/requester who already had *any* token (even a stale one)
  would never get it refreshed, since the field wasn't empty.
- A donor/requester with no token at all was in a worse spot: the
  effect's dependency array included the profile object itself, and
  the discarded fetch still called `refreshProfiles()` — which produces
  a new profile object reference every time — so the effect kept
  re-triggering itself. An actual infinite loop, just one that hadn't
  been hit yet because most test accounts already had *some* token
  sitting in Firestore from before.

Both profile screens now: depend only on `user` (not the profile
object) so calling `refreshProfiles()` inside the effect can't
re-trigger it, read the current token through a `ref` instead of a
dependency, and **actually persist** the fetched token via
`setDoc(..., { merge: true })` whenever it differs from what's stored.
This makes token refresh self-healing — opening the profile screen
after any future migration (or after a token simply rotates, which
happens on its own sometimes) fixes itself without needing a manual
Firestore edit.

## The "Default FirebaseApp is not initialized" error

If you see this in the console on a dev/preview/production build (not
Expo Go), it means `google-services.json` isn't present/applied — native
Android Firebase Messaging can't init without it. Fixed by adding that
file + `android.googleServicesFile` in `app.json` (see
BUILD_AND_DEPLOY.md) and rebuilding. This is unrelated to the Google
Sign-In fix even though both are solved by the same file — one is native
Firebase Messaging init, the other is OAuth.

## Who writes to `/notifications/{uid}/items`

**Donor notifications** (a new compatible request appeared nearby): this
app calls `donordrop-admin`'s `/api/requests/notify-matches` endpoint
whenever `createRequest` runs (`lib/requests.ts`). That backend has
`firebase-admin` + the FCM V1 service account credentials needed to send
real push notifications — this mobile app deliberately does **not** hold
those credentials (they shouldn't ship in a client app).

**Confirmed from the `donordrop-admin` source** (`lib/push.ts`'s
`notifyMatchingDonors`): it does both — writes an in-app notification
doc for every matched donor via a Firestore batch write, THEN fans out
Expo push messages to whichever of those donors have a `pushToken`. The
notification doc write happens first and unconditionally (not gated on
the push succeeding), so even a donor who's denied notification
permission, or whose push token is stale, still gets the in-app list
entry. If donor notifications still aren't appearing after all this,
the code path itself isn't the problem — check, in order:
1. **Is `donordrop-admin` actually deployed**, and does
   `EXPO_PUBLIC_ADMIN_API_URL` in the mobile app's `.env` point at that
   live URL (not `localhost`)? `createRequest`'s call to this endpoint
   is wrapped in try/catch and only logs a warning on failure — a
   misconfigured or undeployed backend fails completely silently from
   the mobile app's side.
2. **Are the three `FIREBASE_ADMIN_*` env vars set on Vercel**
   (`FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`,
   `FIREBASE_ADMIN_PRIVATE_KEY`)? These come from a Firebase Admin SDK
   service account JSON (Firebase Console → Project Settings → Service
   accounts → Generate new private key) — likely the same file already
   used for the FCM V1 credentials uploaded to EAS, since both just need
   a Firebase Admin-scoped service account. `firebase-admin.ts` throws
   immediately if any of the three are missing, which surfaces as a 500
   from the endpoint.
3. **Does the test donor actually match?** `findNearbyDonors` requires
   `isVisible == true`, a compatible blood type, and within the request's
   15km radius — zero matches is correct (not a bug) if the test account
   doesn't satisfy all three.

**Fastest way to isolate which of these it is**: call the deployed
endpoint directly (bypassing the mobile app entirely) with a real
request ID:
```
curl -X POST https://<your-vercel-url>/api/requests/notify-matches \
  -H "Content-Type: application/json" \
  -d '{"requestId":"<a real request id from Firestore>"}'
```
The response includes `matchedDonors` and `pushNotificationsSent` counts
directly — `matchedDonors: 0` points at #3 above, a non-2xx response or
connection failure points at #1/#2.

**Requester notifications** (a donor responded "available" to their
request): this was a real gap, and the first fix for it was wrong —
worth documenting why, since the same mistake is easy to repeat.
`respondToRequest` originally tried to `addDoc` directly into
`/notifications/{requesterUid}/items` from the donor's own client SDK
session. `firestore.rules` has `allow write: if false` on that path —
**server-side only, via firebase-admin** — for exactly the reason you'd
guess: a donor's client has no business writing directly into a
different user's data. That write was always silently rejected (caught
by a try/catch, which is why it failed quietly instead of throwing
somewhere visible).

**Current fix**: `respondToRequest` now calls a new
`donordrop-admin` endpoint, `/api/requests/notify-requester`
(`app/api/requests/notify-requester/route.ts` in that repo), mirroring
`notify-matches`'s existing shape almost exactly — looks up the request
server-side to get `requesterUid` (never trusts the client to declare
whose notifications collection to write to), and writes the notification
via `firebase-admin`, which bypasses the client rule entirely because
it's not going through client Firestore access at all. It **also** now
sends an actual push, the same way `notifyMatchingDonors` does for
donors — `RequesterProfile` grew a `pushToken` field, and
`requester-register.tsx`/the requester profile screen register for push
the same way the donor side does (see the stale-token section above).
Existing requester accounts created before this change won't have a
token until they next open their profile screen — the in-app
notification write still happens for them regardless, just without the
phone banner until then.

## Quick verification checklist

- [ ] Donor in-app Notifications tab populates after a compatible
      request is posted nearby
- [ ] Donor gets an actual phone push banner for the same event
- [ ] Requester in-app Notifications tab populates after a donor
      responds "available" (goes through notify-requester now, not a
      direct client write)
- [ ] Mark-all-read (the checkmark icon) clears the unread dot on both
      screens

## The rule to remember before adding a third notification path

If a future feature needs to notify yet another user (an admin, a
different role, whatever) — **the write always has to happen server-side
via `firebase-admin`, never as a direct client Firestore write**, no
matter how tempting the direct write looks in the moment. `allow write:
if false` on `/notifications/{uid}/items` is deliberate and total; there
isn't a client-side rule variant of this collection to reach for. Add a
new `donordrop-admin` API route (same shape as `notify-matches` and
`notify-requester`) rather than trying to write through the client SDK
— the first attempt at requester notifications hit exactly this wall.
