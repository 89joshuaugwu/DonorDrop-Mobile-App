import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Info, TriangleAlert, Siren, MapPin, Building2, CircleCheck } from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { createRequest } from "@/lib/requests";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { RequestUrgency } from "@/types/request";
import type { BloodType } from "@/types/donor";

const BLOOD_TYPES: BloodType[] = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const URGENCIES: { value: RequestUrgency; Icon: typeof Info; color: string }[] = [
  { value: "Normal", Icon: Info, color: "#2563EB" },
  { value: "Urgent", Icon: TriangleAlert, color: "#EA580C" },
  { value: "Critical", Icon: Siren, color: "#DC2626" },
];

export default function PostRequestScreen() {
  const router = useRouter();
  const { user, requesterProfile } = useAuth();

  const [bloodType, setBloodType] = useState<BloodType | null>(null);
  const [units, setUnits] = useState("1");
  const [urgency, setUrgency] = useState<RequestUrgency>("Urgent");
  const [hospitalName, setHospitalName] = useState("");
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function detectLocation() {
    setDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location needed", "Enable location to auto-fill your position, or the request will use a default location.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
    } finally {
      setDetectingLocation(false);
    }
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
              className={`w-16 h-16 rounded-2xl items-center justify-center border-2 ${
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

        <Text className="text-sm font-medium text-brand-text mb-2">Urgency Level</Text>
        <View className="flex-row gap-2.5 mb-5">
          {URGENCIES.map(({ value, Icon, color }) => {
            const selected = urgency === value;
            return (
              <Pressable
                key={value}
                onPress={() => setUrgency(value)}
                className={`flex-1 items-center py-3.5 rounded-2xl border-2 ${
                  selected ? "border-brand-red bg-brand-redtint" : "border-brand-border bg-white"
                }`}
              >
                <Icon size={20} color={selected ? "#DC2626" : color} />
                <Text
                  className={`text-xs font-bold mt-1.5 ${selected ? "text-brand-red" : "text-brand-text"}`}
                >
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Input label="Hospital Name" icon={Building2} value={hospitalName} onChangeText={setHospitalName} placeholder="e.g. UNTH" />
        <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />

        <Card className={`mb-5 flex-row items-center ${coords ? "border-green-200 bg-brand-successtint" : ""}`}>
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${coords ? "bg-green-100" : "bg-brand-redtint"}`}>
            {coords ? <CircleCheck size={18} color="#16A34A" /> : <MapPin size={18} color="#DC2626" />}
          </View>
          <View className="flex-1 pr-3">
            <Text className="font-semibold text-brand-text">
              {coords ? "Location detected" : "Hospital Location"}
            </Text>
            <Text className="text-brand-textsecondary text-xs mt-0.5">
              {coords
                ? "Donors will see approximate distance to you"
                : "Helps nearby donors find and respond to this request"}
            </Text>
          </View>
          <Pressable onPress={detectLocation} disabled={detectingLocation}>
            <Text className="text-brand-red text-sm font-bold">
              {detectingLocation ? "..." : coords ? "Update" : "Detect"}
            </Text>
          </Pressable>
        </Card>

        <Button
          title="Submit Request"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!bloodType || !hospitalName.trim()}
          pill
        />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
