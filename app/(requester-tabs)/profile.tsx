import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Info } from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { logout } from "@/lib/auth";
import Avatar from "@/components/ui/Avatar";
import RoleTag from "@/components/ui/RoleTag";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function RequesterProfileScreen() {
  const { requesterProfile } = useAuth();

  if (!requesterProfile) return null;

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        <View className="items-center mb-6">
          <Avatar name={requesterProfile.name} size="lg" />
          <Text className="text-xl font-extrabold text-brand-text mt-3">
            {requesterProfile.name}
          </Text>
          <Text className="text-brand-textsecondary">{requesterProfile.phone}</Text>
          <RoleTag label="Requester" />
        </View>

        <Card className="mb-4">
          <Text className="font-semibold text-brand-text mb-1">Account</Text>
          {!!requesterProfile.organization && (
            <Text className="text-brand-textsecondary text-sm mb-1">
              {requesterProfile.organization}
            </Text>
          )}
          <Text className="text-brand-textsecondary text-sm">
            Manage your requester account for DonorDrop.
          </Text>
        </Card>

        <View className="flex-row bg-blue-50 border border-blue-100 rounded-2xl p-3.5">
          <Info size={16} color="#2563EB" style={{ marginRight: 8, marginTop: 1 }} />
          <Text className="text-blue-800 text-xs flex-1 leading-4">
            You can switch roles or act as both at any time — just log in with the other role from
            the welcome screen.
          </Text>
        </View>

        <View className="mt-auto pt-8">
          <Button title="Log Out" onPress={() => logout()} variant="danger" pill />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
