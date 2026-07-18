import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useAuth } from "@/lib/AuthContext";
import { createRequest } from "@/lib/requests";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import UrgencyBadge from "@/components/ui/UrgencyBadge";
import type { RequestUrgency } from "@/types/request";
import type { BloodType } from "@/types/donor";

const BLOOD_TYPES: BloodType[] = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const URGENCIES: RequestUrgency[] = ["Critical", "Urgent", "Normal"];

export default function PostRequestScreen() {
  const router = useRouter();
  const { user, requesterProfile } = useAuth();

  const [bloodType, setBloodType] = useState<BloodType | null>(null);
  const [units, setUnits] = useState("1");
  const [urgency, setUrgency] = useState<RequestUrgency>("Urgent");
  const [hospitalName, setHospitalName] = useState("");
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function detectLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location needed", "Enable location to auto-fill your position, or the request will use a default location.");
      return;
    }
    const position = await Location.getCurrentPositionAsync({});
    setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
  }

  async function handleSubmit() {
    if (!user || !requesterProfile || !bloodType || !hospitalName.trim()) return;
    setSubmitting(true);
    try {
      const id = await createRequest({
        requesterUid: user.uid,
        requesterName: requesterProfile.name,
        requesterPhone: requesterProfile.phone,
        bloodTypeNeeded: bloodType,
        units: parseInt(units, 10) || 1,
        urgency,
        hospitalName: hospitalName.trim(),
        lat: coords?.lat ?? 0,
        lng: coords?.lng ?? 0,
        notes: notes.trim(),
      });
      router.replace(`/request/${id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-extrabold text-brand-text mb-1">Post a Request</Text>
        <Text className="text-brand-textsecondary mb-6">
          This will notify compatible, eligible donors nearby.
        </Text>

        <Text className="text-sm font-medium text-brand-text mb-2">Blood Type Needed</Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {BLOOD_TYPES.map((bt) => (
            <Pressable
              key={bt}
              onPress={() => setBloodType(bt)}
              className={`w-16 h-16 rounded-xl items-center justify-center border-2 ${
                bloodType === bt ? "bg-brand-red border-brand-red" : "bg-white border-brand-border"
              }`}
            >
              <Text className={`font-extrabold ${bloodType === bt ? "text-white" : "text-brand-text"}`}>
                {bt}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input label="Units Needed" value={units} onChangeText={setUnits} keyboardType="number-pad" />

        <Text className="text-sm font-medium text-brand-text mb-2">Urgency</Text>
        <View className="flex-row gap-2 mb-5">
          {URGENCIES.map((u) => (
            <Pressable
              key={u}
              onPress={() => setUrgency(u)}
              className={`rounded-full border-2 ${urgency === u ? "border-brand-red" : "border-transparent"}`}
            >
              <UrgencyBadge urgency={u} />
            </Pressable>
          ))}
        </View>

        <Input label="Hospital Name" value={hospitalName} onChangeText={setHospitalName} placeholder="e.g. UNTH" />
        <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />

        <Button
          title={coords ? "Location Detected ✓" : "Detect My Location"}
          onPress={detectLocation}
          variant="outline"
        />

        <View className="mt-4">
          <Button
            title="Submit Request"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!bloodType || !hospitalName.trim()}
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
