import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowUpDown, RefreshCw } from "lucide-react-native";
import EligibilityCard from "@/components/ui/EligibilityCard";
import StatCard from "@/components/ui/StatCard";
import Avatar from "@/components/ui/Avatar";
import RoleTag from "@/components/ui/RoleTag";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import RequestCard from "@/components/molecules/RequestCard";
import { useAuth } from "@/lib/AuthContext";
import { getNearbyCompatibleRequests } from "@/lib/requests";
import type { BloodRequest } from "@/types/request";
import { Droplet } from "lucide-react-native";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const URGENCY_RANK: Record<string, number> = { Critical: 0, Urgent: 1, Normal: 2 };

// A single donation is commonly said to help up to three patients (red
// cells, plasma, and platelets can each go to a different person) — used
// here purely as an illustrative "lives saved" stat derived from the
// donor's own logged donation count, not a separately tracked field.
const LIVES_PER_DONATION = 3;

export default function DonorHomeScreen() {
  const { donorProfile, refreshProfiles } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<(BloodRequest & { distanceKm: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"distance" | "urgency">("distance");

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
      loadRequests();

      // Auto-refresh requests every 5 minutes
      const interval = setInterval(() => {
        loadRequests();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }, [loadRequests])
  );

  // Listen to the global requests pulse to auto-refresh when ANY new request is made
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "metadata", "requests"), () => {
      loadRequests();
    });
    return unsub;
  }, [loadRequests]);

  const sortedRequests = useMemo(() => {
    const copy = [...requests];
    if (sortBy === "urgency") {
      copy.sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || a.distanceKm - b.distanceKm);
    } else {
      copy.sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return copy;
  }, [requests, sortBy]);

  const totalDonations = donorProfile?.totalDonations ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-extrabold text-brand-text">
            Hi, {donorProfile?.name?.split(" ")[0] ?? "there"}
          </Text>
          <RoleTag label="Donor" />
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => loadRequests()} className="w-9 h-9 rounded-full bg-white border border-brand-border items-center justify-center">
            <RefreshCw size={15} color="#0F172A" />
          </Pressable>
          <Pressable onPress={() => router.push("/(donor-tabs)/profile")}>
            <Avatar name={donorProfile?.name} size="md" />
          </Pressable>
        </View>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        data={sortedRequests}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRequests} tintColor="#DC2626" />}
        ListHeaderComponent={
          <View className="mb-5">
            <EligibilityCard lastDonationDate={donorProfile?.lastDonationDate ?? null} />

            <View className="flex-row gap-3 mt-4 mb-6">
              <StatCard label="Total Gifts" value={totalDonations} />
              <StatCard label="Lives Saved" value={totalDonations * LIVES_PER_DONATION} />
            </View>

            <View className="flex-row items-center justify-between">
              <SectionHeader
                title="Nearby Requests"
                subtitle={`Compatible with ${donorProfile?.bloodType ?? "your"} blood type`}
              />
              <Pressable
                onPress={() => setSortBy(sortBy === "distance" ? "urgency" : "distance")}
                className="w-9 h-9 rounded-full bg-white border border-brand-border items-center justify-center ml-2 -mt-3"
              >
                <ArrowUpDown size={15} color="#0F172A" />
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => <RequestCard request={item} distanceKm={item.distanceKm} />}
        ListEmptyComponent={
          <EmptyState
            icon={Droplet}
            title="No active requests near you"
            subtitle="We'll notify you the moment someone nearby needs your blood type."
            tone="brand"
          />
        }
      />
    </SafeAreaView>
  );
}
