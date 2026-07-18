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
    <View className="bg-white border border-brand-border rounded-2xl p-5 items-center">
      {icon}
      <Text className="text-lg font-bold text-brand-text mt-3 text-center">{title}</Text>
      <Text className="text-brand-textsecondary text-sm text-center mt-2 mb-5 leading-5">
        {message}
      </Text>
      <View className="w-full gap-2">
        <Button title={allowLabel} onPress={onAllow} variant="primary" />
        {onSkip && <Button title={skipLabel} onPress={onSkip} variant="outline" />}
      </View>
    </View>
  );
}
