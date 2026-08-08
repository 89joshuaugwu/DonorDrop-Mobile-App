import { useState } from "react";
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { MapPin, Bell, Droplet, User, Phone } from "lucide-react-native";
import { doc, setDoc } from "firebase/firestore";
import { geohashForLocation } from "geofire-common";
import { db } from "@/lib/firebase";
import { registerForPushNotifications } from "@/lib/push";
import { useAuth } from "@/lib/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PermissionPrompt from "@/components/molecules/PermissionPrompt";
import type { BloodType, Donor } from "@/types/donor";

const BLOOD_TYPES: BloodType[] = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

type Step = "details" | "location" | "notifications" | "saving";
const STEP_ORDER: Step[] = ["details", "location", "notifications"];

function StepDots({ step }: { step: Step }) {
  const index = STEP_ORDER.indexOf(step);
  return (
    <View className="flex-row justify-center mb-6 gap-1.5">
      {STEP_ORDER.map((s, i) => (
        <View
          key={s}
          className={`h-1.5 rounded-full ${i === index ? "w-6 bg-brand-red" : "w-1.5 bg-brand-border"}`}
        />
      ))}
    </View>
  );
}

export default function DonorRegisterScreen() {
  const router = useRouter();
  const { user, refreshProfiles } = useAuth();
  const [step, setStep] = useState<Step>("details");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodType, setBloodType] = useState<BloodType | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  function handleDetailsNext() {
    if (!name.trim() || !phone.trim() || !bloodType) return;
    setStep("location");
  }

  async function handleAllowLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const position = await Location.getCurrentPositionAsync({});
      setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
    }
    setStep("notifications");
  }

  async function finishRegistration(pushToken?: string | null) {
    if (!user || !bloodType) return;
    setStep("saving");

    const lat = coords?.lat ?? 0;
    const lng = coords?.lng ?? 0;

    const donor: Donor = {
      uid: user.uid,
      name: name.trim(),
      phone: phone.trim(),
      bloodType,
      lat,
      lng,
      geohash: geohashForLocation([lat, lng]),
      isVisible: true,
      verified: false,
      lastDonationDate: null,
      totalDonations: 0,
      createdAt: new Date().toISOString(),
    };

    // Firestore rejects any field explicitly set to `undefined` — only
    // attach pushToken when we actually have one (Expo Go / simulator /
    // permission-denied all resolve to null, not a token).
    if (pushToken) {
      donor.pushToken = pushToken;
    }

    await setDoc(doc(db, "donors", user.uid), donor);
    await refreshProfiles();
    router.replace("/(donor-tabs)/home");
  }

  async function handleAllowNotifications() {
    if (!user) return;
    const token = await registerForPushNotifications(user.uid);
    await finishRegistration(token);
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        {step !== "saving" && <StepDots step={step} />}

        {step === "details" && (
          <>
            <Text className="text-2xl font-extrabold text-brand-text mb-1 text-center">Donor Details</Text>
            <Text className="text-brand-textsecondary mb-6 text-center">
              Tell us a bit about you so we can match you to requests.
            </Text>
            <Input label="Full Name" icon={User} value={name} onChangeText={setName} placeholder="Chidinma Okafor" />
            <Input
              label="Phone Number"
              icon={Phone}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="080..."
            />
            <Text className="text-sm font-medium text-brand-text mb-2">Blood Type</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
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
            <Button title="Continue" onPress={handleDetailsNext} pill />
          </>
        )}

        {step === "location" && (
          <View className="flex-1 justify-center">
            <PermissionPrompt
              icon={<MapPin size={34} color="#DC2626" />}
              title="Enable Location"
              message="DonorDrop needs your location to match you with blood requests near you. Your exact location is never shown to requesters — only approximate distance."
              onAllow={handleAllowLocation}
              onSkip={() => setStep("notifications")}
              allowLabel="Allow Location"
            />
          </View>
        )}

        {step === "notifications" && (
          <View className="flex-1 justify-center">
            <PermissionPrompt
              icon={<Bell size={34} color="#DC2626" />}
              title="Enable Notifications"
              message="Get notified instantly when someone nearby needs your blood type. This is how DonorDrop reaches you for urgent requests."
              onAllow={handleAllowNotifications}
              onSkip={() => finishRegistration(null)}
              allowLabel="Allow Notifications"
            />
          </View>
        )}

        {step === "saving" && (
          <View className="flex-1 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-brand-redtint items-center justify-center mb-3">
              <Droplet size={28} color="#DC2626" fill="#DC2626" />
            </View>
            <Text className="text-brand-textsecondary">Setting up your profile...</Text>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
