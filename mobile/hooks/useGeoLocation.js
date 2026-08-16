import { useCallback, useState } from "react";
import * as Location from "expo-location";

/**
 * Best-effort device location for the "city"/"state" fields the backend
 * requires on every lost/found item (`location.city`, `location.state` —
 * see validations/{lost,found}-item.validation.js), which the Found/Lost
 * forms have no dedicated input for — only a single free-text "address"
 * field, matching the Figma design.
 *
 * Never throws and never blocks form submission: permission denial, a
 * disabled location service, or a failed reverse-geocode all just resolve
 * to `null` fields, which the backend accepts (city/state are required
 * strings but not non-empty).
 *
 * @returns {{
 *   locate: () => Promise<{city: string, state: string, latitude?: number, longitude?: number}>,
 * }}
 */
export function useGeoLocation() {
  const [cache, setCache] = useState(null);

  const locate = useCallback(async () => {
    if (cache) return cache;

    const empty = { city: "", state: "" };
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return empty;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const result = {
        city: place?.city || "",
        state: place?.region || "",
        latitude,
        longitude,
      };
      setCache(result);
      return result;
    } catch {
      return empty;
    }
  }, [cache]);

  return { locate };
}
