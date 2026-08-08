import { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, orderBy, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { Bell, CheckCheck } from "lucide-react-native";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import EmptyState from "@/components/ui/EmptyState";

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

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items]);

  async function handlePress(item: NotificationItem) {
    if (user && !item.read) {
      await updateDoc(doc(db, "notifications", user.uid, "items", item.id), { read: true });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
    }
    router.push(`/request/${item.requestId}`);
  }

  async function handleMarkAllRead() {
    if (!user || unreadCount === 0) return;
    const batch = writeBatch(db);
    items.filter((i) => !i.read).forEach((i) => {
      batch.update(doc(db, "notifications", user.uid, "items", i.id), { read: true });
    });
    await batch.commit();
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-extrabold text-brand-text">Notifications</Text>
          <Text className="text-brand-textsecondary text-sm">
            {unreadCount > 0 ? `${unreadCount} unread` : "Stay updated on blood requests"}
          </Text>
        </View>
        {unreadCount > 0 && (
          <Pressable
            onPress={handleMarkAllRead}
            className="w-9 h-9 rounded-full bg-white border border-brand-border items-center justify-center"
          >
            <CheckCheck size={16} color="#DC2626" />
          </Pressable>
        )}
      </View>
      <FlatList
        contentContainerStyle={{ padding: 20, paddingTop: 4, flexGrow: 1 }}
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#DC2626" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePress(item)}
            className={`flex-row p-4 rounded-2xl mb-3 border ${
              item.read ? "bg-white border-brand-border" : "bg-brand-redtint border-brand-redtint2"
            }`}
          >
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center mr-3">
              <Bell size={16} color="#DC2626" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-brand-text">{item.title}</Text>
              <Text className="text-brand-textsecondary text-sm mt-0.5">{item.body}</Text>
            </View>
            {!item.read && <View className="w-2 h-2 rounded-full bg-brand-red mt-1.5 ml-2" />}
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState icon={Bell} title="All caught up!" subtitle="Nothing here yet — items you add will appear here." />
        }
      />
    </SafeAreaView>
  );
}
