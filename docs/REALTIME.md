# Real-Time Architecture

Every list screen in this app (donor home, requester home, my-requests,
and the request detail screen) is backed by a live Firestore `onSnapshot`
listener, not a one-shot fetch. This doc explains the pattern, why it
replaced polling/`useFocusEffect`-triggered refetches, and a bug class
worth knowing about if a screen ever starts "flickering" or refetching
in a loop again.

## The bug this replaced

The donor Home screen originally used `useFocusEffect` to call
`refreshProfiles()` unconditionally every time the screen regained focus.
`refreshProfiles()` re-fetches the donor doc and calls `setDonorProfile()`
with a **brand-new object** every time (`fetchUserProfiles` always
returns a fresh object, even if the underlying data is identical). Any
`useCallback`/`useEffect` elsewhere that depended on `donorProfile`
therefore got a new dependency value on every focus — including a
callback passed to `useFocusEffect` itself. React Navigation's
`useFocusEffect` re-runs its effect immediately (while still focused)
whenever the callback's *identity* changes, not just on actual
focus/blur transitions — so a changing dependency feeding back into a
focus effect is a self-sustaining loop: refetch → new object → dependent
callback identity changes → focus effect fires again → refetch → ...

**The fix, in two parts:**
1. `AuthContext`'s `donorProfile`/`requesterProfile` are only ever
   updated by an explicit `refreshProfiles()` call (e.g. after logging a
   donation) or the initial `onAuthStateChanged` listener — never by a
   screen's focus effect. They're stable object references for the
   lifetime of a session unless something genuinely changed.
2. Screens that need live data use `onSnapshot` directly in a plain
   `useEffect`, not `useFocusEffect` + imperative refetch. A snapshot
   listener reacts to actual Firestore changes — there's no "refetch on
   focus" step to accidentally loop.

**The general rule going forward:** if you see `useFocusEffect` wrapping
a data fetch, be suspicious of what's in that callback's dependency
array. Anything derived from Firebase reads (profile objects, request
arrays) is a candidate for "new reference every render" unless it's
proven otherwise. Prefer a plain `useEffect` + `onSnapshot` subscription
for anything that needs to stay current while the screen is mounted —
it sidesteps the whole class of bug rather than requiring careful
dependency-array bookkeeping.

## Donor Home: geographic real-time queries

`lib/requests.ts#subscribeToNearbyCompatibleRequests`:
- Splits the donor's search radius into geohash bounding boxes
  (`geofire-common#geohashQueryBounds`) — geohash range queries return a
  rectangular superset of the true circular radius, so...
- ...each box gets its own `onSnapshot` listener, and results are
  filtered by **exact** distance (`distanceBetween`) after merging, plus
  blood-type compatibility (`compatibility.ts`).
- Results are kept in a `Map` keyed by request ID (dedupes requests that
  fall in more than one box's overlap) and only emitted to the caller
  once every box has fired at least once (`initialLoadsRemaining`), so
  the first render isn't a flickering partial list.
- Returns one combined unsubscribe function that tears down every box's
  listener.

## Requester Home / My Requests: nested live listeners

- `subscribeToMyRequests` — one listener on `/requests` filtered by
  `requesterUid`.
- `subscribeToRequestMatchCount` — a **separate** listener per request,
  pointed at that request's `/responses` subcollection, counting docs
  where `available === true`. The screens dynamically spin these up/down
  as the top-level request list changes (`useEffect` keyed off a joined,
  sorted string of request IDs, so it only re-subscribes when the *set*
  of IDs actually changes, not on every re-render).
- Net effect: a donor tapping "I'm Available" updates the requester's
  match count on screen with no manual refresh, typically within the
  same second.

## Request Detail screen

Originally this screen used the same one-shot-fetch-on-focus pattern the
Home screens started with (`getRequest`/`getRequestResponses`/
`getMyResponse` inside a `useFocusEffect`) — same bug class, and it's
what caused the map/page to visibly "keep refreshing": every refetch set
`loading = true`, which unmounted the entire screen (map included) behind
a full-screen spinner, then remounted everything once data came back.

It's now three independent `onSnapshot` subscriptions, set up in plain
`useEffect`s:
- `subscribeToRequest` — the request doc itself (status changes, etc.)
- `subscribeToMyResponse` — only when the viewer has a donor profile
- `subscribeToRequestResponses` — only when the viewer is confirmed (from
  the request doc) to be its owner — this ordering matters, since the
  Firestore rule for reading the full responses list is owner-only (see
  DATABASE.md)

Only the *very first* load shows the full-screen spinner
(`initialLoading`, set once and never again). Every update after that —
a new donor response arriving, the requester marking it fulfilled —
patches state in place without unmounting the map or anything else on
screen.

## Manual refresh button

Home and My Requests both have a `RefreshCw` button that increments a
local `refreshKey` state. The subscription-setup `useEffect`s include
`refreshKey` in their dependency array, so bumping it tears down and
rebuilds every active listener from scratch — a deliberate "hard reset"
for when a person wants to force a reconnect (e.g. after being offline),
not something that should fire on its own.
