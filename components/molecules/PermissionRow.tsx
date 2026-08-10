import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { CircleCheck } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

export type PermissionStatus = "checking" | "granted" | "denied" | "undetermined";

/**
 * One row in a permissions list: icon, label, description, and an
 * action on the right that adapts to actual OS permission status —
 * not just a dumb "Enable" button that silently no-ops.
 *
 * `status === "denied"` is a distinct case from "undetermined" on
 * purpose: iOS and Android both refuse to show the system permission
 * dialog again once a person has explicitly denied it — calling
 * request*PermissionsAsync() again just immediately resolves "denied"
 * with no UI at all. The only way to actually fix that is deep-linking
 * to the OS Settings app, which is a different action than the initial
 * request. Callers are expected to branch on this themselves (see
 * profile screens) rather than this component silently doing the wrong
 * thing for a denied permission.
 *
 * `grantedActionLabel` is optional — pass it when the action stays
 * useful even after permission is granted (e.g. "Refresh" for
 * location, since a granted permission doesn't mean the stored
 * coordinates are still current). Omit it for permissions where
 * "granted" is simply a done state, like notifications — those just
 * show a checkmark once granted.
 */
export default function PermissionRow({
  icon: Icon,
  label,
  description,
  status,
  onPress,
  actionLabel,
  grantedActionLabel,
  loading = false,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  status: PermissionStatus;
  onPress: () => void;
  actionLabel: string;
  grantedActionLabel?: string;
  loading?: boolean;
}) {
  const showButton = status !== "granted" || !!grantedActionLabel;
  const buttonLabel = status === "denied" ? "Open Settings" : status === "granted" ? grantedActionLabel! : actionLabel;

  return (
    <View className="flex-row items-center py-3.5 border-b border-brand-border last:border-b-0">
      <View className="w-10 h-10 rounded-full bg-brand-redtint items-center justify-center mr-3">
        <Icon size={18} color="#DC2626" />
      </View>
      <View className="flex-1 pr-3">
        <Text className="font-semibold text-brand-text">{label}</Text>
        <Text className="text-brand-textsecondary text-xs mt-0.5">{description}</Text>
      </View>
      {status === "checking" ? (
        <ActivityIndicator size="small" color="#94A3B8" />
      ) : showButton ? (
        <Pressable
          onPress={onPress}
          disabled={loading}
          className="bg-slate-100 px-3.5 py-2 rounded-full flex-row items-center"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0F172A" />
          ) : (
            <Text className="text-xs font-bold text-brand-text">{buttonLabel}</Text>
          )}
        </Pressable>
      ) : (
        <CircleCheck size={20} color="#16A34A" />
      )}
    </View>
  );
}
