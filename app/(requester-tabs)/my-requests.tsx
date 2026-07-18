import { useCallback, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import RequestCard from "@/components/molecules/RequestCard";
import { useAuth } from "@/lib/AuthContext";
import { getMyRequests } from "@/lib/requests";
import type { BloodRequest } from "@/types/request";

export default function MyRequestsScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setRequests(await getMyRequests(user.uid));
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
        <Text className="text-2xl font-extrabold text-brand-text">My Requests</Text>
      </View>
      <FlatList
        contentContainerStyle={{ padding: 20, paddingTop: 4 }}
        data={requests}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#DC2626" />}
        renderItem={({ item }) => <RequestCard request={item} />}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-brand-textsecondary">You haven't posted any requests yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
