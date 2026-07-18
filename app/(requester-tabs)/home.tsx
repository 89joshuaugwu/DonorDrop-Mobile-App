import { useCallback, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlusCircle } from "lucide-react-native";
import Button from "@/components/ui/Button";
import RequestCard from "@/components/molecules/RequestCard";
import { useAuth } from "@/lib/AuthContext";
import { getMyRequests } from "@/lib/requests";
import type { BloodRequest } from "@/types/request";

export default function RequesterHomeScreen() {
  const { user, requesterProfile } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const results = await getMyRequests(user.uid);
      setRequests(results.filter((r) => r.status === "open"));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <View className="px-5 pt-3 pb-2">
        <Text className="text-2xl font-extrabold text-brand-text">
          Hi, {requesterProfile?.name?.split(" ")[0] ?? "there"}
        </Text>
        <Text className="text-brand-textsecondary">Your active requests</Text>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 20, paddingTop: 4 }}
        data={requests}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#DC2626" />}
        renderItem={({ item }) => <RequestCard request={item} />}
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-brand-textsecondary text-center mb-4">
              No active requests. Post one to reach nearby donors.
            </Text>
            <Button
              title="+ Post New Request"
              onPress={() => router.push("/(requester-tabs)/post-request")}
            />
          </View>
        }
      />

    </SafeAreaView>
  );
}
