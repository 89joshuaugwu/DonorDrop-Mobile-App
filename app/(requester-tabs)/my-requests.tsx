import { useCallback, useMemo, useState, useEffect } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClipboardList, RefreshCw } from "lucide-react-native";
import { Pressable } from "react-native";
import StatCard from "@/components/ui/StatCard";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import RequestCard from "@/components/molecules/RequestCard";
import { useAuth } from "@/lib/AuthContext";
import { subscribeToMyRequests, subscribeToRequestMatchCount } from "@/lib/requests";
import type { BloodRequest } from "@/types/request";

export default function MyRequestsScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToMyRequests(user.uid, (results) => {
      setRequests(results);
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

  const active = useMemo(() => requests.filter((r) => r.status === "open"), [requests]);
  const closed = useMemo(() => requests.filter((r) => r.status !== "open"), [requests]);
  const totalMatches = useMemo(
    () => active.reduce((sum, r) => sum + (matchCounts[r.id] ?? 0), 0),
    [active, matchCounts]
  );

  const listData = showHistory ? requests : active;

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-extrabold text-brand-text">My Requests</Text>
          <Text className="text-brand-textsecondary text-sm">Manage your active blood appeals</Text>
        </View>
        <Pressable
          onPress={() => load()}
          className="w-9 h-9 rounded-full bg-white border border-brand-border items-center justify-center"
        >
          <RefreshCw size={15} color="#0F172A" />
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 20, paddingTop: 8, flexGrow: 1 }}
        data={listData}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#DC2626" />}
        ListHeaderComponent={
          <View className="mb-2">
            <View className="flex-row gap-3 mb-5">
              <StatCard label="Active" value={active.length} />
              <StatCard label="Donor Matches" value={totalMatches} />
            </View>
            <SectionHeader
              title={showHistory ? "All Appeals" : "Ongoing Appeals"}
              actionLabel={closed.length > 0 ? (showHistory ? "Hide History" : "See History") : undefined}
              onAction={() => setShowHistory((v) => !v)}
            />
          </View>
        }
        renderItem={({ item }) => <RequestCard request={item} matchCount={matchCounts[item.id]} />}
        ListEmptyComponent={
          <EmptyState
            icon={ClipboardList}
            title="No active requests"
            subtitle="Tap the Post Request tab to post a new blood appeal."
          />
        }
      />
    </SafeAreaView>
  );
}
