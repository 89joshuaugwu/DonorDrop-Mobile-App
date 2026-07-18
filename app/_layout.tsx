import "../global.css";
import { useEffect, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { User } from "firebase/auth";
import { AuthProvider, useAuth } from "@/lib/AuthContext";

/**
 * Watches auth state and bounces the app back to the welcome screen the
 * moment a user actually logs out — from WHICHEVER screen they tapped
 * Log Out on (donor profile, requester profile, anywhere). Without this,
 * firebaseSignOut() only clears Firebase's auth state; nothing tells
 * Expo Router to navigate anywhere, so the person stays parked on their
 * current tab (still seeing the donor/requester tab bar) until they
 * manually force a navigation some other way.
 *
 * Uses a ref to distinguish "user really just logged out" (prevUser was
 * set, now it's null) from "app just launched signed-out" (both were
 * null from the start) — the latter is already handled correctly by
 * index.tsx's own redirect logic and shouldn't be double-navigated here.
 */
function AuthRedirector() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const prevUserRef = useRef<User | null>(null);

  useEffect(() => {
    if (loading) return;

    const wasSignedIn = !!prevUserRef.current;
    const isSignedOutNow = !user;

    if (wasSignedIn && isSignedOutNow) {
      router.replace("/(onboarding)/welcome");
    }

    prevUserRef.current = user;
  }, [user, loading, router]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AuthRedirector />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(donor-tabs)" />
        <Stack.Screen name="(requester-tabs)" />
        <Stack.Screen name="request/[id]" options={{ headerShown: true, title: "Request" }} />
      </Stack>
    </AuthProvider>
  );
}
