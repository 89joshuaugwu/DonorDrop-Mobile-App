# DonorDrop Mobile — Documentation

This folder documents the DonorDrop mobile app (Expo / React Native) as it
stands today. It's meant for future-you (or anyone else who touches this
code) to get oriented without re-deriving decisions that were already made.

## Contents

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — tech stack, folder structure,
  navigation, the donor/requester role model.
- **[DATABASE.md](./DATABASE.md)** — every Firestore collection, its shape,
  who reads/writes it, and known constraints (e.g. subcollection read rules).
- **[AUTHENTICATION.md](./AUTHENTICATION.md)** — email/password + native
  Google Sign-In, and the specific gotchas that broke each of them once.
- **[REALTIME.md](./REALTIME.md)** — the `onSnapshot`-based live-update
  architecture, why it replaced polling, and a bug class it's prone to.
- **[NOTIFICATIONS.md](./NOTIFICATIONS.md)** — push token flow, in-app
  notification list, and what's confirmed working vs. what needs
  verification in the separate admin backend.
- **[BUILD_AND_DEPLOY.md](./BUILD_AND_DEPLOY.md)** — EAS build profiles,
  required config files, Play Store submission steps.
- **[WEB_AND_ADMIN_INTEGRATION.md](./WEB_AND_ADMIN_INTEGRATION.md)** — how
  this app relates to the other two DonorDrop repos.

## The three DonorDrop repos, at a glance

This mobile app is **one of three separate codebases** that share one
Firebase project:

| Repo | What it is | Where it runs |
|---|---|---|
| `DonorDrop-app` (web) | The original web version | Browser |
| `DonorDrop-Mobile-App` (this repo) | Expo/React Native app | iOS/Android |
| `donordrop-admin` | Backend API (push notification fan-out, matching) | Vercel |

They're not in a monorepo — each is its own git repo, own deploy pipeline.
The thing that ties them together is the shared Firestore database (same
`projectId` in every `firebaseConfig`) and, for this app specifically, one
HTTP call to the admin backend (`EXPO_PUBLIC_ADMIN_API_URL`) when a
request is created. See WEB_AND_ADMIN_INTEGRATION.md for the full picture.

## Project identity (don't let these drift apart)

- **Package name / bundle ID:** `com.joshuazaza.donordrop` — must match
  exactly across `app.json`, your Firebase Android/iOS app registrations,
  and Play Console. A mismatch here breaks Google Sign-In and push
  notifications with confusing, indirect errors rather than a clear one.
- **Firebase project:** `donordrop-project`
- **EAS project:** `joshuazazas-team` / `donordrop-app` (slug),
  projectId `0ad4470e-fa2c-40b9-b0bb-36070676a215`
