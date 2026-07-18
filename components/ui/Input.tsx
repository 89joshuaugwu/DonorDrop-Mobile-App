import { TextInput, View, Text, TextInputProps } from "react-native";

export default function Input({
  label,
  ...props
}: TextInputProps & { label?: string }) {
  return (
    <View className="mb-4">
      {label && <Text className="text-sm font-medium text-brand-text mb-1.5">{label}</Text>}
      <TextInput
        placeholderTextColor="#94A3B8"
        className="border border-brand-border rounded-xl px-4 py-3 text-base text-brand-text bg-white"
        {...props}
      />
    </View>
  );
}
