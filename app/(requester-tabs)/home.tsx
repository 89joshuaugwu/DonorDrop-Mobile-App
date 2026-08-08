import { useCallback, useMemo, useState, useEffect } from "react";
import { View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlusCircle, Droplet, RefreshCw } from "lucide-react-native";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import RoleTag from "@/components/ui/RoleTag";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import RequestCard from "@/components/molecules/RequestCard";
import { useAuth } from "@/lib/AuthContext";
import { subscribeToMyRequests, subscribeToRequestMatchCount } from "@/lib/requests";
import type { BloodRequest } from "@/types/request";

export default function RequesterHomeScreen() {
  const { user, requesterProfile } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToMyRequests(user.uid, (results) => {
      const active = results.filter((r) => r.status === "open");
      setRequests(active);
      setLoading(false);
    });
    return unsub;
  }, [user, refreshKey]);

  const requestIds = useMemo(() => requests.map((r) => r.id).sort().join(","), [requests]);

  useEffect(() => {
    const ids = requestIds ? requestIds.split(",") : [];
    const unsubs = ids.map((id) =>
      subscribeToRequestMatchCount(id, (count) => {
        setMatchCounts((prev) => ({ ...prev, [id]: count }));
      })
    );
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [requestIds]);

  const load = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const totalMatches = useMemo(
    () => Object.values(matchCounts).reduce((sum, n) => sum + n, 0),
    [matchCounts]
  );

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-extrabold text-brand-text">
            Hi, {requesterProfile?.name?.split(" ")[0] ?? "there"}
          </Text>
          <RoleTag label="Requester" />
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => load()} className="w-9 h-9 rounded-full bg-white border border-brand-border items-center justify-center">
            <RefreshCw size={15} color="#0F172A" />
          </Pressable>
          <Pressable onPress={() => router.push("/(requester-tabs)/profile")}>
            <Avatar name={requesterProfile?.name} size="md" />
          </Pressable>
        </View>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 20, paddingTop: 8, flexGrow: 1 }}
        data={requests}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#DC2626" />}
        ListHeaderComponent={
          requests.length > 0 ? (
            <View className="flex-row gap-3 mb-5">
              <StatCard label="Active Requests" value={requests.length} />
              <StatCard label="Donor Matches" value={totalMatches} />
            </View>
          ) : null
        }
        renderItem={({ item }) => <RequestCard request={item} matchCount={matchCounts[item.id]} />}
        ListEmptyComponent={
          <View className="flex-1 justify-center">
            <EmptyState
              icon={Droplet}
              title="No active requests"
              subtitle="Post one to reach nearby donors who match your blood type need."
              tone="brand"
            />
            <Button
              title="Post New Request"
              icon={PlusCircle}
              onPress={() => router.push("/(requester-tabs)/post-request")}
              pill
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
