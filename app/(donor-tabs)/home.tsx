import { useCallback, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import EligibilityCard from "@/components/ui/EligibilityCard";
import RequestCard from "@/components/molecules/RequestCard";
import { useAuth } from "@/lib/AuthContext";
import { getNearbyCompatibleRequests } from "@/lib/requests";
import type { BloodRequest } from "@/types/request";

export default function DonorHomeScreen() {
  const { donorProfile, refreshProfiles } = useAuth();
  const [requests, setRequests] = useState<(BloodRequest & { distanceKm: number })[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!donorProfile) return;
    setLoading(true);
    try {
      const results = await getNearbyCompatibleRequests(
        donorProfile.bloodType,
        donorProfile.lat,
        donorProfile.lng
      );
      setRequests(results);
    } finally {
      setLoading(false);
    }
  }, [donorProfile]);

  useFocusEffect(
    useCallback(() => {
      refreshProfiles();
      loadRequests();
    }, [loadRequests])
  );

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <View className="px-5 pt-3 pb-2">
        <Text className="text-2xl font-extrabold text-brand-text">Hi, {donorProfile?.name?.split(" ")[0] ?? "there"}</Text>
        <Text className="text-brand-textsecondary">Nearby requests you can help with</Text>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 20, paddingTop: 4 }}
        data={requests}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRequests} tintColor="#DC2626" />}
        ListHeaderComponent={
          <View className="mb-4">
            <EligibilityCard lastDonationDate={donorProfile?.lastDonationDate ?? null} />
          </View>
        }
        renderItem={({ item }) => <RequestCard request={item} distanceKm={item.distanceKm} />}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-brand-textsecondary text-center">
              No active requests near you right now
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
