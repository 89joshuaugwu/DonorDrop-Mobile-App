# Architecture

## Stack

- **Expo SDK 54** (managed workflow, EAS Build for native binaries)
- **expo-router** — file-based navigation; every file under `app/` is a route
- **NativeWind** (Tailwind classes via `className`) for styling — see
  `tailwind.config.js` for the `brand.*` color tokens used everywhere
- **Firebase JS SDK** — Auth + Firestore, shared with the web app's Firebase
  project (not a separate mobile-only project)
- **TypeScript** throughout

## Folder structure

```
app/                      expo-router routes (file path = URL path)
  (onboarding)/            welcome → auth → {donor,requester}-register
  (donor-tabs)/            donor's 3-tab layout: home, notifications, profile
  (requester-tabs)/        requester's 5-tab layout: home, post-request,
                            my-requests, notifications, profile
  request/[id].tsx          shared detail screen — same route for both
                            roles, content branches on who's viewing
  _layout.tsx               root layout — wraps everything in AuthProvider
  index.tsx                  entry redirect (see "Routing" below)

components/
  ui/                       generic primitives: Button, Card, Input,
                            Avatar, BloodTypeBadge, UrgencyBadge, etc.
  molecules/                composed, domain-specific: RequestCard,
                            RequestMap, DonorResponseRow, PermissionPrompt

lib/                       all Firebase/business logic — screens should
                            stay thin and call into here, not talk to
                            Firestore directly
  firebase.ts               SDK init (see AUTHENTICATION.md for the
                            platform-specific auth persistence setup)
  AuthContext.tsx            global auth + profile state (React Context)
  auth.ts                    email/password sign up/login/logout
  googleAuth.ts               native Google Sign-In (see AUTHENTICATION.md)
  requests.ts                 everything about /requests — CRUD +
                            real-time subscriptions (see REALTIME.md)
  donations.ts                logDonation() — the only writer of
                            /donations and the donor's totalDonations
  eligibility.ts               pure function: lastDonationDate → 90-day
                            cooldown math, no Firebase dependency
  compatibility.ts             blood type compatibility matrix — MIRRORS
                            donordrop-admin's copy, kept in sync manually
  push.ts                     Expo push token registration

types/                      shared TypeScript interfaces (Donor,
                            BloodRequest, RequestResponse, Donation)
```

## The donor/requester role model

One Firebase Auth account (one `uid`) can hold **both** a donor profile
(`/donors/{uid}`) and a requester profile (`/requesters/{uid}`) at once —
they're independent documents, not mutually exclusive. Which one the UI
shows is just a locally-stored preference:

- `AuthContext`'s `activeRole` is persisted in `AsyncStorage`
  (`donordrop_active_role`), not in Firestore — it's purely a "which set
  of tabs am I looking at right now" flag, not part of the account model.
- `app/(onboarding)/auth.tsx`'s `routeAfterAuth()` checks whether a
  profile already exists for the chosen role and routes to either the
  home tab (profile exists) or the registration form (it doesn't) —
  this is what stops a returning donor's stats from being wiped by
  donor-register's `setDoc` running again.
- There's currently no in-app UI to switch roles or register as the
  *second* role from an already-logged-in session — the welcome screen's
  "I want to Donate" / "I need Blood" choice only really applies to a signed-out
  session. If you want "act as both" to be a real feature (the welcome
  screen's copy already promises this), that's a small addition: a
  role-switch entry point in each profile screen that runs the same
  `routeAfterAuth`-style check for the *other* role.

## Routing / entry flow

```
app/index.tsx
  → not signed in           → (onboarding)/welcome
  → signed in, no profile   → (onboarding)/{role}-register
  → signed in, has profile  → (donor-tabs)/home or (requester-tabs)/home
```

`request/[id].tsx` is reachable from either tab group (donor tapping a
nearby request, or requester tapping one of their own) — it's outside
both `(donor-tabs)` and `(requester-tabs)` route groups on purpose, so it
pushes on top of whichever tab navigator is currently active rather than
needing to exist twice.

## Design system

`components/ui/` holds the primitives; `tailwind.config.js`'s `brand.*`
tokens (brand.red, brand.redtint, brand.success, etc.) are the single
source of truth for color — screens should reference `brand.*` classes,
not hardcode hex values, so the whole app re-themes from one file.
