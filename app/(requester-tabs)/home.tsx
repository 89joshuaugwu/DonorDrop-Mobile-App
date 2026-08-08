import { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlusCircle, Droplet } from "lucide-react-native";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import RoleTag from "@/components/ui/RoleTag";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import RequestCard from "@/components/molecules/RequestCard";
import { useAuth } from "@/lib/AuthContext";
import { getMyRequests, getAvailableMatchCounts } from "@/lib/requests";
import type { BloodRequest } from "@/types/request";

export default function RequesterHomeScreen() {
  const { user, requesterProfile } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const results = await getMyRequests(user.uid);
      const active = results.filter((r) => r.status === "open");
      setRequests(active);
      setMatchCounts(await getAvailableMatchCounts(active.map((r) => r.id)));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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
        <Pressable onPress={() => router.push("/(requester-tabs)/profile")}>
          <Avatar name={requesterProfile?.name} size="md" />
        </Pressable>
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
