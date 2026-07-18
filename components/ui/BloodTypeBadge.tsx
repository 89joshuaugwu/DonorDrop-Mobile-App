import { View, Text } from "react-native";
import type { BloodType } from "@/types/donor";

export default function BloodTypeBadge({
  bloodType,
  size = "md",
}: {
  bloodType: BloodType;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { box: "w-10 h-10", text: "text-sm" },
    md: { box: "w-14 h-14", text: "text-lg" },
    lg: { box: "w-20 h-20", text: "text-2xl" },
  }[size];

  return (
    <View className={`${sizes.box} rounded-xl bg-brand-red items-center justify-center`}>
      <Text className={`${sizes.text} font-extrabold text-white`}>{bloodType}</Text>
    </View>
  );
}
