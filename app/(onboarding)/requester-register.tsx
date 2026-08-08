import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, setDoc } from "firebase/firestore";
import { User, Phone, Building2 } from "lucide-react-native";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function RequesterRegisterScreen() {
  const router = useRouter();
  const { user, refreshProfiles } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!user || !name.trim() || !phone.trim()) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "requesters", user.uid), {
        uid: user.uid,
        name: name.trim(),
        phone: phone.trim(),
        organization: organization.trim() || null,
        createdAt: new Date().toISOString(),
      });
      await refreshProfiles();
      router.replace("/(requester-tabs)/home");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: "center" }}>
          <View className="w-14 h-14 rounded-2xl bg-blue-50 items-center justify-center mb-4 self-center">
            <User size={26} color="#2563EB" />
          </View>
          <Text className="text-2xl font-extrabold text-brand-text mb-1 text-center">Requester Details</Text>
          <Text className="text-brand-textsecondary mb-6 text-center">
            Used so donors and admins know who's asking for help.
          </Text>
          <Input label="Full Name" icon={User} value={name} onChangeText={setName} placeholder="Emeka Nwosu" />
          <Input
            label="Phone Number"
            icon={Phone}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="080..."
          />
          <Input
            label="Organization (optional)"
            icon={Building2}
            value={organization}
            onChangeText={setOrganization}
            placeholder="e.g. St. Luke's Hospital"
          />
          <Button title="Finish" onPress={handleSubmit} loading={loading} pill />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
