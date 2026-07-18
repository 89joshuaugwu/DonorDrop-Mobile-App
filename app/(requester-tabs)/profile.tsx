import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User } from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { logout } from "@/lib/auth";
import Button from "@/components/ui/Button";

export default function RequesterProfileScreen() {
  const { requesterProfile } = useAuth();

  if (!requesterProfile) return null;

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center">
            <User size={36} color="#2563EB" />
          </View>
          <Text className="text-xl font-extrabold text-brand-text mt-3">
            {requesterProfile.name}
          </Text>
          <Text className="text-brand-textsecondary">{requesterProfile.phone}</Text>
          {!!requesterProfile.organization && (
            <Text className="text-brand-textsecondary mt-1">{requesterProfile.organization}</Text>
          )}
        </View>

        <View className="bg-white border border-brand-border rounded-2xl p-4 mb-4">
          <Text className="font-semibold text-brand-text mb-1">Account</Text>
          <Text className="text-brand-textsecondary text-sm">
            Manage your requester account for DonorDrop.
          </Text>
        </View>

        <View className="mt-auto pt-8">
          <Button title="Log Out" onPress={() => logout()} variant="danger" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
