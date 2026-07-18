import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/lib/AuthContext";

export default function Index() {
  const { user, donorProfile, requesterProfile, activeRole, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-bg">
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // Logged in but hasn't finished registering for either role yet.
  if (!donorProfile && !requesterProfile) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // Route to whichever role was last active, falling back to whichever
  // profile actually exists.
  if (activeRole === "requester" && requesterProfile) {
    return <Redirect href="/(requester-tabs)/home" />;
  }
  if (donorProfile) {
    return <Redirect href="/(donor-tabs)/home" />;
  }
  if (requesterProfile) {
    return <Redirect href="/(requester-tabs)/home" />;
  }

  return <Redirect href="/(onboarding)/welcome" />;
}
