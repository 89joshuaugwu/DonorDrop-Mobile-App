import { View, Text } from "react-native";
import { Droplet } from "lucide-react-native";
import type { BloodType } from "@/types/donor";

export default function BloodTypeBadge({
  bloodType,
  size = "md",
}: {
  bloodType: BloodType;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { box: "w-10 h-10", text: "text-sm", icon: 12 },
    md: { box: "w-14 h-14", text: "text-lg", icon: 16 },
    lg: { box: "w-20 h-20", text: "text-2xl", icon: 20 },
  }[size];

  return (
    <View
      className={`${sizes.box} rounded-2xl bg-brand-red items-center justify-center`}
      style={{
        shadowColor: "#DC2626",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Droplet size={sizes.icon} color="#FFFFFF" fill="#FFFFFF" style={{ marginBottom: -2 }} />
      <Text className={`${sizes.text} font-extrabold text-white`}>{bloodType}</Text>
    </View>
  );
}
