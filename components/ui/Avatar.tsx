import { View, Text, Image } from "react-native";

const SIZES = {
  sm: { box: 36, ring: 2, text: "text-xs" },
  md: { box: 56, ring: 3, text: "text-base" },
  lg: { box: 88, ring: 3, text: "text-3xl" },
} as const;

function initialsFrom(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Circular avatar used across profile/home headers. Falls back to a
 * red-ringed initials badge (no photo storage in this app yet) rather
 * than a stock silhouette icon, matching the "JD" style ring avatar in
 * the design reference.
 */
export default function Avatar({
  name,
  imageUri,
  size = "md",
  ringed = true,
}: {
  name?: string | null;
  imageUri?: string | null;
  size?: "sm" | "md" | "lg";
  ringed?: boolean;
}) {
  const s = SIZES[size];

  return (
    <View
      style={{
        width: s.box,
        height: s.box,
        borderRadius: s.box / 2,
        borderWidth: ringed ? s.ring : 0,
        borderColor: "#DC2626",
        alignItems: "center",
        justifyContent: "center",
        padding: ringed ? 2 : 0,
      }}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: "100%", height: "100%", borderRadius: s.box / 2 }}
        />
      ) : (
        <View
          className="bg-brand-redtint items-center justify-center"
          style={{ width: "100%", height: "100%", borderRadius: s.box / 2 }}
        >
          <Text className={`${s.text} font-extrabold text-brand-red`}>{initialsFrom(name)}</Text>
        </View>
      )}
    </View>
  );
}
