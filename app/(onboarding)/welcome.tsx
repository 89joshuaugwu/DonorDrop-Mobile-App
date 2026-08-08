import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { HandHeart, Briefcase, Info, ChevronRight } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  function selectRole(role: "donor" | "requester") {
    router.push({ pathname: "/(onboarding)/auth", params: { role } });
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <View className="flex-1 px-6 justify-center">
        <View className="items-center mb-8">
          <View
            className="w-20 h-20 rounded-3xl bg-brand-red items-center justify-center mb-4"
            style={{
              shadowColor: "#DC2626",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Image
              source={require("@/assets/icon.png")}
              style={{ width: 44, height: 44 }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-3xl font-extrabold text-brand-text">DonorDrop</Text>
          <Text className="text-brand-textsecondary text-center mt-1.5">
            A friend when you need blood most.
          </Text>
        </View>

        <Text className="text-lg font-bold text-brand-text mb-1">Welcome to the community</Text>
        <Text className="text-brand-textsecondary mb-5 leading-5">
          Tell us how you plan to use DonorDrop so we can set things up for you.
        </Text>

        <Pressable
          onPress={() => selectRole("donor")}
          className="bg-white border border-brand-border active:border-brand-red rounded-2xl p-5 mb-3 flex-row items-center"
        >
          <View className="w-12 h-12 rounded-full bg-brand-redtint items-center justify-center mr-4">
            <HandHeart size={22} color="#DC2626" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-brand-text">I want to Donate</Text>
            <Text className="text-brand-textsecondary text-sm mt-0.5 leading-4">
              Save lives by offering your blood to those in need nearby
            </Text>
          </View>
          <ChevronRight size={18} color="#CBD5E1" />
        </Pressable>

        <Pressable
          onPress={() => selectRole("requester")}
          className="bg-white border border-brand-border active:border-brand-red rounded-2xl p-5 mb-5 flex-row items-center"
        >
          <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mr-4">
            <Briefcase size={20} color="#2563EB" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-brand-text">I need Blood</Text>
            <Text className="text-brand-textsecondary text-sm mt-0.5 leading-4">
              Find urgent matches and connect with nearby donors
            </Text>
          </View>
          <ChevronRight size={18} color="#CBD5E1" />
        </Pressable>

        <View className="flex-row bg-blue-50 border border-blue-100 rounded-2xl p-3.5">
          <Info size={16} color="#2563EB" style={{ marginRight: 8, marginTop: 1 }} />
          <Text className="text-blue-800 text-xs flex-1 leading-4">
            You can switch roles or act as both at any time from your profile settings.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
