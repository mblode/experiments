"use client";
import { useEffect, useMemo, useState } from "react";
import { create } from "zustand";

import { getCachedLocationName } from "./actions";
import { type Inputs, solveMoon } from "./astro";
import { MoonScene } from "./moon-scene";

interface Store {
  lat: number;
  lon: number;
  datetimeLocal: string;
  speed: number;
  locationStatus:
    | "unknown"
    | "requesting"
    | "granted"
    | "denied"
    | "unavailable";
  locationName: string;
  set: (p: Partial<Store>) => void;
}

const nowLocalISO = () => {
  const d = new Date();
  // round to minute
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return iso;
};

const useStore = create<Store>((set) => ({
  lat: -37.8136, // Melbourne default
  lon: 144.9631,
  datetimeLocal: nowLocalISO(),
  speed: 0,
  locationStatus: "unknown",
  locationName: "Melbourne, Victoria",
  set,
}));

/**
 * Two-hour increments either side of now, formatted for display and, in words,
 * for the range input's `aria-valuetext` — the raw value is a count of
 * increments, which announces as a meaningless number on its own.
 */
const formatOffset = (totalHours: number) => {
  if (totalHours === 0) {
    return { text: "Now", spoken: "now" };
  }
  const days = Math.floor(Math.abs(totalHours) / 24);
  const hours = Math.abs(totalHours) % 24;
  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0 || days === 0) {
    parts.push(`${hours}h`);
  }
  const magnitude = parts.join(" ");
  const ahead = totalHours > 0;
  return {
    text: `${ahead ? "+" : "−"}${magnitude}`,
    spoken: `${magnitude.replace("d", " days").replace("h", " hours")} ${
      ahead ? "ahead" : "behind"
    }`,
  };
};

export const MoonBlock = () => {
  const { lat, lon, datetimeLocal, locationStatus, locationName, set } =
    useStore();
  const [scrubIncrement, setScrubIncrement] = useState(0); // In 2-hour increments

  // Request geolocation on component mount
  useEffect(() => {
    if (locationStatus !== "unknown") {
      return;
    }

    if (!navigator.geolocation) {
      set({ locationStatus: "unavailable" });
      return;
    }

    set({ locationStatus: "requesting" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLat = position.coords.latitude;
        const newLon = position.coords.longitude;

        // Get location name (cached server action)
        const name = await getCachedLocationName(newLat, newLon);

        set({
          lat: newLat,
          lon: newLon,
          locationStatus: "granted",
          locationName: name,
        });
      },
      () => {
        set({ locationStatus: "denied" });
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 300_000, // 5 minutes
      }
    );
  }, [locationStatus, set]);

  const baseDate = useMemo(() => new Date(datetimeLocal), [datetimeLocal]);
  const date = useMemo(() => {
    const d = new Date(baseDate);
    // Each increment is 2 hours, range covers ±30 days (720 hours = 360 increments)
    const totalHours = scrubIncrement * 2;
    d.setHours(d.getHours() + totalHours);
    return d;
  }, [baseDate, scrubIncrement]);

  const offset = formatOffset(scrubIncrement * 2);

  const inputs: Inputs = useMemo(() => ({ date, lat, lon }), [date, lat, lon]);
  const sol = useMemo(() => {
    try {
      return solveMoon(inputs);
    } catch {
      // Return fallback values
      return {
        sunDir: [1, 0, 0] as [number, number, number],
        illumFraction: 0.5,
        phaseAngleDeg: 90,
        distanceKm: 384_400,
        parallacticAngleRad: 0,
        ra: 0,
        dec: 0,
        phaseName: "Unknown",
        phaseEmoji: "🌕",
      };
    }
  }, [inputs]);

  return (
    <>
      {/*
       * The scene is a canvas, so every number behind it is invisible to a
       * screen reader. This is the whole demo in text.
       */}
      <p className="sr-only">
        {sol.phaseName}, {Math.round(sol.illumFraction * 100)}% illuminated,
        seen from {locationName}
        {scrubIncrement === 0 ? " now" : `, ${offset.spoken}`}.
      </p>

      <div className="controls">
        <div>
          <div className="controls-row">
            <label htmlFor="time-travel-input">Time travel</label>
            <span className="controls-value">{offset.text}</span>
            <button
              className="controls-reset"
              disabled={scrubIncrement === 0}
              onClick={() => setScrubIncrement(0)}
              type="button"
            >
              Reset
            </button>
          </div>

          <input
            aria-valuetext={offset.spoken}
            id="time-travel-input"
            // ±360 two-hour increments, so ±30 days either side of now.
            max={360}
            min={-360}
            onChange={(e) => setScrubIncrement(Number(e.target.value))}
            type="range"
            value={scrubIncrement}
          />

          <div aria-hidden="true" className="controls-ticks">
            <span>−30 days</span>
            <span>Now</span>
            <span>+30 days</span>
          </div>
        </div>

        <div className="readout">
          <div className="readout-line">
            <span className="readout-label">Location</span>
            <span className="readout-value">{locationName}</span>
          </div>
          <div className="readout-line">
            <span className="readout-label">Phase</span>
            <span className="readout-value">
              <span aria-hidden="true">{sol.phaseEmoji} </span>
              {sol.phaseName}
            </span>
          </div>
          <div className="readout-line">
            <span className="readout-label">Illuminated</span>
            <span className="readout-value">
              {Math.round(sol.illumFraction * 100)}%
            </span>
          </div>
          <div className="readout-line">
            <span className="readout-label">Distance</span>
            <span className="readout-value">
              {Math.round(sol.distanceKm).toLocaleString("en-AU")} km
            </span>
          </div>
        </div>
      </div>

      <MoonScene
        inputs={inputs}
        textures={{
          // NASA Lunar Reconnaissance Orbiter (LRO) textures
          color: "/textures/moon_anorthositic_crust_albedo.jpg", // Surface albedo/color
          normal: "/textures/moon_anorthositic_crust_normal.jpg", // Surface normal mapping
          roughness: "/textures/moon_anorthositic_crust_roughness.jpg", // Surface roughness
          displacement: "/textures/moon_lro_lola_dem_colorhillshade.jpg", // Elevation/displacement
          // Additional detail textures available:
          // - moon_lola_roughness.jpg (alternative roughness)
          // - moon_lola_surface_slope.jpg (slope data)
          // - moon_mantle_* textures (for cutaway views)
        }}
      />
    </>
  );
};
