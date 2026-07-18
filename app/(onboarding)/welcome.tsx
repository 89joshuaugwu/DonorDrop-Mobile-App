import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { Heart, HandHeart } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  function selectRole(role: "donor" | "requester") {
    router.push({ pathname: "/(onboarding)/auth", params: { role } });
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bg px-6 justify-center">
      <View className="items-center mb-10">
        <Image
          source={require("@/assets/icon.png")}
          style={{ width: 88, height: 88 }}
          resizeMode="contain"
        />
        <Text className="text-3xl font-extrabold text-brand-text mt-4">DonorDrop</Text>
        <Text className="text-brand-textsecondary text-center mt-2">
          A friend when you need blood most.
        </Text>
      </View>

      <Text className="text-center text-brand-textsecondary mb-4">
        How will you use DonorDrop today?
      </Text>

      <Pressable
        onPress={() => selectRole("donor")}
        className="bg-white border-2 border-brand-border active:border-brand-red rounded-2xl p-6 mb-4 flex-row items-center"
      >
        <View className="w-14 h-14 rounded-full bg-red-50 items-center justify-center mr-4">
          <HandHeart size={28} color="#DC2626" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-brand-text">I'm a Donor</Text>
          <Text className="text-brand-textsecondary text-sm mt-0.5">
            Get matched to nearby requests
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={() => selectRole("requester")}
        className="bg-white border-2 border-brand-border active:border-brand-red rounded-2xl p-6 flex-row items-center"
      >
        <View className="w-14 h-14 rounded-full bg-blue-50 items-center justify-center mr-4">
          <Heart size={28} color="#2563EB" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-brand-text">I Need Blood</Text>
          <Text className="text-brand-textsecondary text-sm mt-0.5">
            Post a request and reach nearby donors
          </Text>
        </View>
      </Pressable>

      <Text className="text-center text-brand-textsecondary text-xs mt-8">
        You can register as both later from your profile.
      </Text>
    </SafeAreaView>
  );
}
