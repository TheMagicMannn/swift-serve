import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Watches the device geolocation while `enabled` is true and upserts the
 * authenticated provider's most recent location to `provider_locations`.
 * Throttles writes to one every ~10s or when the position changes >25m.
 */
export function useProviderLocation(providerId: string | undefined, enabled: boolean) {
  const lastWrite = useRef<{ at: number; lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!providerId || !enabled) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let cancelled = false;

    const push = async (pos: GeolocationPosition) => {
      if (cancelled) return;
      const { latitude, longitude, heading, speed, accuracy } = pos.coords;
      const now = Date.now();
      const last = lastWrite.current;
      const movedM = last ? haversine(last.lat, last.lng, latitude, longitude) : Infinity;
      if (last && now - last.at < 10_000 && movedM < 25) return;
      lastWrite.current = { at: now, lat: latitude, lng: longitude };
      const { error } = await supabase.from("provider_locations").upsert({
        provider_id: providerId,
        lat: latitude,
        lng: longitude,
        heading: heading ?? null,
        speed: speed ?? null,
        accuracy: accuracy ?? null,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn("[location] upsert failed", error.message);
    };

    const watchId = navigator.geolocation.watchPosition(
      push,
      (err) => console.warn("[location] watch error", err.message),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 }
    );

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [providerId, enabled]);
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
