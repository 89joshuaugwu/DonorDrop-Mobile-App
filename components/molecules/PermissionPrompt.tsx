import { View, Text } from "react-native";
import Button from "@/components/ui/Button";

export default function PermissionPrompt({
  icon,
  title,
  message,
  onAllow,
  onSkip,
  allowLabel = "Allow",
  skipLabel = "Not now",
}: {
  icon?: React.ReactNode;
  title: string;
  message: string;
  onAllow: () => void;
  onSkip?: () => void;
  allowLabel?: string;
  skipLabel?: string;
}) {
  return (
    <View className="bg-white border border-brand-border rounded-3xl p-6 items-center">
      <View className="w-20 h-20 rounded-full bg-brand-redtint items-center justify-center mb-1">
        {icon}
      </View>
      <Text className="text-lg font-bold text-brand-text mt-3 text-center">{title}</Text>
      <Text className="text-brand-textsecondary text-sm text-center mt-2 mb-6 leading-5">
        {message}
      </Text>
      <View className="w-full gap-2.5">
        <Button title={allowLabel} onPress={onAllow} variant="primary" pill />
        {onSkip && <Button title={skipLabel} onPress={onSkip} variant="ghost" pill />}
      </View>
    </View>
  );
}
