# DonorDrop Real-Time Architecture

This document outlines the real-time implementation across the DonorDrop application using Firebase's `onSnapshot` listeners.

## 1. The Core Bug Fix: Infinite Refresh Loop
Initially, the Donor Home Screen was caught in an infinite dependency loop. It used `useFocusEffect` to unconditionally call `refreshProfiles()`, which re-fetched the user profile and created a new object reference in state. This new object caused the data-fetching dependencies to re-trigger, pulling the app into a continuous, endless refresh cycle.

**The Fix:** We removed the forceful profile fetch from `useFocusEffect`. User profiles now remain stable in context after login, breaking the dependency loop while keeping data safe.

## 2. Donor Home Screen: Real-Time Geographic Queries
To push live updates to Donors without them needing to pull-to-refresh:

- **Geohash Bounding Boxes:** The app calculates bounding boxes based on the donor's current location and a 15km radius.
- **Dynamic Listeners:** We map over these bounds and attach an active `onSnapshot` listener to each Firebase query block.
- **Auto-Merging & Filtering:** As new requests drop into the database, these listeners fire. The app instantly merges the results, verifies exact geographic distance, and checks blood type compatibility. 
- **Cleanup:** A custom hook returns a batched unsubscribe function, completely destroying all spatial listeners the second the user navigates away to prevent memory leaks.

*Code Reference:* `subscribeToNearbyCompatibleRequests` in `lib/requests.ts`.

## 3. Requester Home & My Requests: Nested Live Listeners
Requesters need both their active requests and the *live count* of matching donors for each request.

- **Primary Listener:** A top-level `onSnapshot` listener tracks all requests belonging to the current `requesterUid`.
- **Nested Micro-Listeners (Match Counts):** Whenever the top-level requests list changes, the app dynamically spins up (or tears down) micro-listeners pointed directly at the `responses` subcollection of each individual active request.
- **Result:** If a donor 5 miles away clicks "Available", the requester sees the "Responses" number tick up instantly on their screen without a manual refresh.

*Code Reference:* `subscribeToMyRequests` and `subscribeToRequestMatchCount` in `lib/requests.ts`.

## 4. Manual Refresh Support
To give users peace of mind, we added a manual `RefreshCw` button to the top-right corner of the donor and requester dashboards.
- Clicking this increments a local React `refreshKey` state.
- The `useEffect` dependencies catch this change, aggressively tear down all active Firebase listeners, and rebuild them from scratch, effectively acting as a manual hard-refresh for real-time subscriptions.
