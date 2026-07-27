"use server";

import { cacheLife } from "next/cache";

/**
 * Server action for reverse geocoding with caching.
 * Cached for days since location names rarely change.
 */
export async function getCachedLocationName(
  lat: number,
  lon: number
): Promise<string> {
  "use cache";
  cacheLife("days");

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Moon Demo App",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.address) {
      const { city, town, village, county, state, country } = data.address;
      const place = city || town || village || county;
      const region = state || country;
      if (place && region) {
        return `${place}, ${region}`;
      }
      if (place) {
        return place;
      }
      if (region) {
        return region;
      }
    }
    return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
  } catch {
    return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
  }
}
