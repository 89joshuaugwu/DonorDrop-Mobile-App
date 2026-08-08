import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { MapPin } from "lucide-react-native";

/**
 * Small embedded map for the request detail screen. Shows the hospital
 * as a marker, and — when we know the viewer's own coordinates (i.e. a
 * signed-in donor) — a second marker for them, so the two pins visually
 * confirm the distance instead of asking the person to trust a number.
 *
 * This is a visual aid ONLY. The "X km away" text distance elsewhere on
 * this screen is computed separately (geofire-common's distanceBetween,
 * same as everywhere else in the app) and is NOT derived from this map —
 * per the ask, if the map tile fails to load or coordinates are missing,
 * the text distance still works on its own.
 */
export default function RequestMap({
  hospitalName,
  requestLat,
  requestLng,
  viewerLat,
  viewerLng,
}: {
  hospitalName: string;
  requestLat: number;
  requestLng: number;
  viewerLat?: number;
  viewerLng?: number;
}) {
  // A request created before location was ever detected (or one where
  // the requester skipped it) has lat/lng stuck at 0,0 — that's the
  // middle of the ocean, not a useful map. Show a plain fallback card
  // instead of a misleading pin there.
  const hasLocation = requestLat !== 0 || requestLng !== 0;
  const hasViewer = typeof viewerLat === "number" && typeof viewerLng === "number" && (viewerLat !== 0 || viewerLng !== 0);

  if (!hasLocation) {
    return (
      <View className="bg-white border border-brand-border rounded-2xl p-5 mb-4 items-center">
        <MapPin size={20} color="#94A3B8" style={{ marginBottom: 6 }} />
        <Text className="text-brand-textsecondary text-sm text-center">
          No location was attached to this request — the hospital name above is the best reference.
        </Text>
      </View>
    );
  }

  const latitudes = hasViewer ? [requestLat, viewerLat as number] : [requestLat];
  const longitudes = hasViewer ? [requestLng, viewerLng as number] : [requestLng];
  const midLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
  const midLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
  const latSpread = Math.max(...latitudes) - Math.min(...latitudes);
  const lngSpread = Math.max(...longitudes) - Math.min(...longitudes);

  return (
    <View className="rounded-2xl overflow-hidden border border-brand-border mb-4" style={{ height: 180 }}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: Math.max(latSpread * 1.8, 0.02),
          longitudeDelta: Math.max(lngSpread * 1.8, 0.02),
        }}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
      >
        <Marker coordinate={{ latitude: requestLat, longitude: requestLng }} title={hospitalName} pinColor="#DC2626" />
        {hasViewer && (
          <Marker
            coordinate={{ latitude: viewerLat as number, longitude: viewerLng as number }}
            title="You"
            pinColor="#2563EB"
          />
        )}
      </MapView>
    </View>
  );
}
