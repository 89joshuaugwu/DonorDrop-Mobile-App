import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { Bell } from "lucide-react-native";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

interface NotificationItem {
  id: string;
  requestId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export default function DonorNotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "notifications", user.uid, "items"), orderBy("createdAt", "desc"))
      );
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as NotificationItem));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handlePress(item: NotificationItem) {
    if (user && !item.read) {
      await updateDoc(doc(db, "notifications", user.uid, "items", item.id), { read: true });
    }
    router.push(`/request/${item.requestId}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <View className="px-5 pt-3 pb-2">
        <Text className="text-2xl font-extrabold text-brand-text">Notifications</Text>
      </View>
      <FlatList
        contentContainerStyle={{ padding: 20, paddingTop: 4 }}
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#DC2626" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePress(item)}
            className={`flex-row p-4 rounded-2xl mb-3 border ${
              item.read ? "bg-white border-brand-border" : "bg-red-50 border-red-100"
            }`}
          >
            <Bell size={20} color="#DC2626" style={{ marginRight: 10, marginTop: 2 }} />
            <View className="flex-1">
              <Text className="font-bold text-brand-text">{item.title}</Text>
              <Text className="text-brand-textsecondary text-sm mt-0.5">{item.body}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-brand-textsecondary">No notifications yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
