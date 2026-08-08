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
  in the initial `setDoc` in `donor-register.tsx`, and re-registered via
  `setDoc(..., { merge: true })` from the profile screen on subsequent
  app opens if it's missing.

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

**This is the part I can't fully verify from this repo.** I can see this
app *calls* that endpoint, but I don't have the `donordrop-admin` source
to confirm what that endpoint actually does once called. Two things are
both plausible and look identical from this app's side:
- It sends an OS push notification **and** writes a matching doc to
  `/notifications/{donorUid}/items`, in which case both the phone banner
  and the in-app Notifications tab work.
- It **only** sends the OS push notification via Expo's push API, with
  no Firestore write, in which case donors would see banners but their
  in-app Notifications tab would stay permanently empty — "All caught
  up!" even when they've actually been pushed to before.

**To check:** either look at the `notify-matches` handler in the
`donordrop-admin` repo directly, or empirically — post a test request as
a requester, then as a compatible nearby donor, check both (a) whether a
push banner arrived and (b) whether anything shows in that donor's
in-app Notifications tab. If (a) works and (b) doesn't, that confirms
the handler needs a Firestore write added alongside its existing push
call. Happy to add that server-side write if you share that handler's
code.

**Requester notifications** (a donor responded "available" to their
request): this was a real gap, now fixed client-side. Previously nothing
ever wrote to a requester's notification list at all — the
`respondToRequest` function only wrote the response doc itself, so the
requester's Notifications tab was guaranteed to always be empty
regardless of the admin backend. `lib/requests.ts#respondToRequest` now
also writes a notification doc for the requester when a donor marks
themselves available (not for "can't help" responses — only genuine
matches). **This write is Firestore-only — it does not send an OS push
notification to the requester's phone**, since sending a real push needs
the same FCM V1 admin-SDK credentials mentioned above, which only exist
server-side. If you want requesters to get an actual phone banner (not
just an in-app list entry) when a donor responds, that needs a small
addition to `donordrop-admin` — a new endpoint this app calls from
`respondToRequest`, mirroring how `notify-matches` already works for the
donor side.

## Quick verification checklist

- [ ] Donor in-app Notifications tab populates after a compatible
      request is posted nearby (confirms the admin backend writes
      Firestore, not just push)
- [ ] Donor gets an actual phone push banner for the same event
- [ ] Requester in-app Notifications tab populates after a donor
      responds "available" (should work now — this app's own write)
- [ ] Mark-all-read (the checkmark icon) clears the unread dot on both
      screens
