# DonorDrop App (Expo / React Native)

Mobile app for donors and requesters. Full setup/testing walkthrough is in
`/doc` at the root of this handoff — this is a quick local-dev reference.

## Quick start

```bash
npm install
cp .env.example .env   # fill in real values — see /doc/03-firebase-setup.md
npx expo start
```

Scan the QR code with **Expo Go** (Android/iOS) to run on your phone, or
press `a` for an Android emulator.

**Important:** `donordrop-admin` must be deployed to Vercel BEFORE this app
can post requests successfully — `EXPO_PUBLIC_ADMIN_API_URL` must point at
the live Vercel URL, not `localhost` (your phone can't reach your PC's
localhost over the internet).

## Folder map

```
app/(onboarding)/       # welcome, auth, donor-register, requester-register
app/(donor-tabs)/       # home, notifications, profile
app/(requester-tabs)/   # home, post-request, my-requests, notifications
app/request/[id].tsx    # shared donor/requester request detail screen
lib/firebase.ts         # Firebase JS SDK init
lib/eligibility.ts      # getEligibility() — 90-day cooldown logic
lib/compatibility.ts    # blood type compatibility matrix
lib/push.ts             # registerForPushNotifications()
lib/requests.ts         # createRequest(), respondToRequest(), matching query
lib/donations.ts        # logDonation()
lib/AuthContext.tsx      # tracks Firebase user + donor/requester profiles
```
