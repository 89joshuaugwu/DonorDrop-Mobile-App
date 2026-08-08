import { View, Text } from "react-native";

/** Small rounded chip labeling the active role, e.g. "Donor" / "Requester". */
export default function RoleTag({ label }: { label: string }) {
  return (
    <View className="bg-brand-redtint self-start px-2.5 py-1 rounded-full mt-1">
      <Text className="text-brand-red text-xs font-bold">{label}</Text>
    </View>
  );
}
