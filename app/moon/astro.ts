import {
  Body,
  EclipticLongitude,
  Equator,
  GeoVector,
  Illumination,
  Libration,
  MakeTime,
  Observer,
  RotationAxis,
  SiderealTime,
  type Vector,
} from "astronomy-engine";

export interface Inputs {
  date: Date;
  lat: number;
  lon: number;
  elev?: number;
}

export interface MoonSolution {
  // Direction to place the directional light in THREE coordinates (unit vector)
  sunDir: [number, number, number];

  // illumination fraction 0..1 (from astronomy-engine)
  illumFraction: number;

  // phase angle (Sun-Moon-Earth) in degrees
  phaseAngleDeg: number;

  // distance Moon -> observer in km
  distanceKm: number;

  // parallactic angle (radians) — useful for other calculations
  parallacticAngleRad: number;

  // right ascension (hours) and declination (degrees) of the Moon (equatorial)
  ra: number; // hours
  dec: number; // degrees

  // human readable phase
  phaseName: string;
  phaseEmoji: string;

  // bright limb position angle (radians) measured east of celestial north
  // rotate the sphere by -brightLimbAngleRad in three.js to align the illuminated limb
  brightLimbAngleRad: number;

  // position angle of Moon's north pole (radians)
  poleAngleRad: number;

  // selenographic libration for orientation
  mlat: number; // degrees
  mlon: number; // degrees
}

/* --- Helpers --- */
function _norm([x, y, z]: [number, number, number]): [number, number, number] {
  const m = Math.hypot(x, y, z) || 1;
  return [x / m, y / m, z / m];
}
function toTuple(v: Vector): [number, number, number] {
  return [v.x, v.y, v.z];
}
function dot(a: [number, number, number], b: [number, number, number]) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross(a: [number, number, number], b: [number, number, number]) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ] as [number, number, number];
}
function normalizeVec(a: [number, number, number]) {
  const m = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / m, a[1] / m, a[2] / m] as [number, number, number];
}

function equatorialToVector(
  ra_hours: number,
  dec_deg: number
): [number, number, number] {
  const ra_rad = (ra_hours * Math.PI) / 12;
  const dec_rad = (dec_deg * Math.PI) / 180;
  const cos_dec = Math.cos(dec_rad);
  return [
    cos_dec * Math.cos(ra_rad),
    cos_dec * Math.sin(ra_rad),
    Math.sin(dec_rad),
  ];
}

const AU_KM = 149_597_870.7;
const SYNODIC_MONTH_DAYS = 29.530_588_853;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00.000Z");

const getValidDate = (date: Date) => {
  if (!date || Number.isNaN(date.getTime())) {
    return new Date();
  }
  return date;
};

const getCyclePosition = (date: Date) => {
  const daysSinceRef = (date.getTime() - KNOWN_NEW_MOON.getTime()) / MS_PER_DAY;
  return (
    ((daysSinceRef % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) %
    SYNODIC_MONTH_DAYS
  );
};

const projectOntoPlane = (
  vector: [number, number, number],
  normal: [number, number, number]
) =>
  normalizeVec([
    vector[0] - dot(vector, normal) * normal[0],
    vector[1] - dot(vector, normal) * normal[1],
    vector[2] - dot(vector, normal) * normal[2],
  ]);

const getDiskAxes = (uM: [number, number, number]) => {
  const north: [number, number, number] = [0, 0, 1];
  const n = projectOntoPlane(north, uM);
  const east = normalizeVec(cross(uM, n));
  return { n, east };
};

const getMoonEquatorialData = (
  time: ReturnType<typeof MakeTime>,
  obs: Observer
) => {
  const moonEquatorial = Equator(Body.Moon, time, obs, true, true);
  const ra = moonEquatorial.ra;
  const dec = moonEquatorial.dec;
  const distanceKm = (moonEquatorial.dist ?? 0) * AU_KM;
  return { ra, dec, distanceKm };
};

const getLibrationAngles = (time: ReturnType<typeof MakeTime>) => {
  const lib = Libration(time);
  return { mlat: lib.mlat, mlon: lib.mlon };
};

const getParallacticAngle = (
  time: ReturnType<typeof MakeTime>,
  lat: number,
  lon: number,
  ra: number,
  dec: number
) => {
  const gst = SiderealTime(time);
  const lst = (((gst + lon / 15) % 24) + 24) % 24;
  const H = ((((lst - ra) % 24) + 24) % 24) * (Math.PI / 12.0);
  const phi = (lat * Math.PI) / 180.0;
  const decRad = (dec * Math.PI) / 180.0;
  const sinH = Math.sin(H);
  const cosH = Math.cos(H);
  const tanPhi = Math.tan(phi);
  const cosDec = Math.cos(decRad);
  const sinDec = Math.sin(decRad);
  const denom = tanPhi * cosDec - sinDec * cosH;
  return Math.atan2(sinH, denom);
};

const getBrightLimbAngle = (
  uM: [number, number, number],
  uS: [number, number, number],
  n: [number, number, number],
  east: [number, number, number]
) => {
  const v = projectOntoPlane(uS, uM);
  return Math.atan2(dot(east, v), dot(n, v));
};

const getPoleAngle = (
  time: ReturnType<typeof MakeTime>,
  uM: [number, number, number],
  n: [number, number, number],
  east: [number, number, number]
) => {
  const axis = RotationAxis(Body.Moon, time);
  const uP = equatorialToVector(axis.ra, axis.dec);
  const p = projectOntoPlane(uP, uM);
  return Math.atan2(dot(east, p), dot(n, p));
};

const getWaxingStatus = (time: ReturnType<typeof MakeTime>, date: Date) => {
  try {
    const moonEclLon = EclipticLongitude(Body.Moon, time);
    const sunEclLon = EclipticLongitude(Body.Sun, time);
    let elongationDeg = moonEclLon - sunEclLon;
    elongationDeg = ((elongationDeg % 360) + 360) % 360;
    const moonAgeDays = (elongationDeg / 360) * SYNODIC_MONTH_DAYS;
    return moonAgeDays <= SYNODIC_MONTH_DAYS / 2;
  } catch {
    const cyclePosition = getCyclePosition(date);
    return cyclePosition <= SYNODIC_MONTH_DAYS / 2;
  }
};

const getSunDirection = (date: Date): [number, number, number] => {
  const cyclePosition = getCyclePosition(date);
  let elongationDeg = (cyclePosition / SYNODIC_MONTH_DAYS) * 360;
  elongationDeg = ((elongationDeg % 360) + 360) % 360;
  const elongationRad = (elongationDeg * Math.PI) / 180;
  return [Math.cos(elongationRad), 0, Math.sin(elongationRad)];
};

type PhaseType = "new" | "full" | "quarter" | "crescent" | "gibbous";
type Hemisphere = "north" | "south";
type WaxingKey = "waxing" | "waning";

const getPhaseType = (illumFraction: number): PhaseType => {
  if (illumFraction < 0.01) {
    return "new";
  }
  if (illumFraction > 0.99) {
    return "full";
  }
  if (Math.abs(illumFraction - 0.5) < 0.05) {
    return "quarter";
  }
  if (illumFraction < 0.5) {
    return "crescent";
  }
  return "gibbous";
};

const PHASE_NAMES: Record<
  Exclude<PhaseType, "new" | "full">,
  Record<WaxingKey, string>
> = {
  quarter: { waxing: "First Quarter", waning: "Last Quarter" },
  crescent: { waxing: "Waxing Crescent", waning: "Waning Crescent" },
  gibbous: { waxing: "Waxing Gibbous", waning: "Waning Gibbous" },
};

const PHASE_EMOJI: Record<
  Exclude<PhaseType, "new" | "full">,
  Record<Hemisphere, Record<WaxingKey, string>>
> = {
  quarter: {
    north: { waxing: "🌓", waning: "🌗" },
    south: { waxing: "🌗", waning: "🌓" },
  },
  crescent: {
    north: { waxing: "🌒", waning: "🌘" },
    south: { waxing: "🌘", waning: "🌒" },
  },
  gibbous: {
    north: { waxing: "🌔", waning: "🌖" },
    south: { waxing: "🌖", waning: "🌔" },
  },
};

const getPhaseLabel = (
  illumFraction: number,
  isWaxing: boolean,
  latitude: number
) => {
  const phaseType = getPhaseType(illumFraction);
  if (phaseType === "new") {
    return { phaseName: "New Moon", phaseEmoji: "🌑" };
  }
  if (phaseType === "full") {
    return { phaseName: "Full Moon", phaseEmoji: "🌕" };
  }
  const hemisphere: Hemisphere = latitude < 0 ? "south" : "north";
  const waxingKey: WaxingKey = isWaxing ? "waxing" : "waning";
  return {
    phaseName: PHASE_NAMES[phaseType][waxingKey],
    phaseEmoji: PHASE_EMOJI[phaseType][hemisphere][waxingKey],
  };
};

/**
 * MOON PHASE PHYSICS AND CALCULATION EXPLANATION
 * =============================================
 *
 * FUNDAMENTAL PRINCIPLES:
 * 1. The Moon is TIDALLY LOCKED - it rotates exactly once per orbit (27.3 days)
 *    so the same side always faces Earth
 * 2. Moon phases result from changing Sun-Moon-Earth GEOMETRY, not moon rotation
 * 3. The Sun always illuminates half the Moon; phases show how much of that
 *    illuminated half is visible from Earth
 * 4. New Moon: Moon between Earth-Sun (dark side toward us)
 *    Full Moon: Earth between Moon-Sun (bright side toward us)
 *
 * ASTRONOMY ENGINE APPROACH:
 * - Calculate precise Sun and Moon positions in 3D space
 * - Determine lighting direction (Moon → Sun vector)
 * - Compute apparent orientation as seen from observer location
 * - Apply libration effects (small wobbles) for realism
 *
 * This function returns vectors and angles needed to render accurate moon phases
 * in Three.js, keeping moon tidally locked while varying sun direction.
 */
export function solveMoon(i: Inputs): MoonSolution {
  const validDate = getValidDate(i.date);
  const time = MakeTime(validDate);
  const obs = new Observer(i.lat, i.lon, i.elev ?? 0);

  const illum = Illumination(Body.Moon, time);
  const illumFraction = illum.phase_fraction;
  const phaseAngleDeg = illum.phase_angle;

  const { ra, dec, distanceKm } = getMoonEquatorialData(time, obs);
  const { mlat, mlon } = getLibrationAngles(time);
  const parallacticAngleRad = getParallacticAngle(time, i.lat, i.lon, ra, dec);

  const uM = equatorialToVector(ra, dec);
  const uS = normalizeVec(toTuple(GeoVector(Body.Sun, time, true)));
  const { n, east } = getDiskAxes(uM);
  const brightLimbAngleRad = getBrightLimbAngle(uM, uS, n, east);
  const poleAngleRad = getPoleAngle(time, uM, n, east);
  const isWaxing = getWaxingStatus(time, validDate);
  const sunDir = getSunDirection(validDate);
  const { phaseName, phaseEmoji } = getPhaseLabel(
    illumFraction,
    isWaxing,
    i.lat
  );

  return {
    sunDir,
    illumFraction,
    phaseAngleDeg,
    distanceKm,
    parallacticAngleRad,
    ra,
    dec,
    phaseName,
    phaseEmoji,
    brightLimbAngleRad,
    poleAngleRad,
    mlat,
    mlon,
  };
}

/**
 * Reverse geocode helper (legacy - not cached).
 * @deprecated Use getCachedLocationName from ./actions.ts instead for cached geocoding.
 * This function remains for backward compatibility but is not optimized with cache.
 */
export async function getLocationName(
  lat: number,
  lon: number
): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
    );
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
