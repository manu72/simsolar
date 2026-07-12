import { AXIAL_TILT_DEG } from "./constants";
import type { Hemisphere, SolarEventLabel } from "./seasonExplainer";

export type SolsticeDiagramVariant = "north-summer" | "north-winter" | "south-summer" | "south-winter";
export type SeasonDiagramVariant = "equinox" | SolsticeDiagramVariant;

export interface SeasonDiagramConfig {
  variant: SeasonDiagramVariant;
  /** Pole leaning toward the Sun; null at equinox. */
  poleTowardSun: "north" | "south" | null;
  /**
   * Screen-space axis rotation in degrees, clockwise from vertical.
   * The Sun is drawn on the left, so a negative angle leans the North Pole
   * toward the Sun and a positive angle leans it away.
   */
  axisScreenAngleDeg: number;
  /** Hemisphere the surrounding explainer is talking about; null at equinox. */
  focusHemisphere: Hemisphere | null;
  /** Approximate daylight fraction at mid-latitudes, used by the day-length bars. */
  dayFraction: { north: number; south: number };
  title: string;
  caption: string;
  ariaDescription: string;
  northChip: string;
  southChip: string;
  northBarLabel: string;
  southBarLabel: string;
}

const SUMMER_DAY_FRACTION = 0.63;
const WINTER_DAY_FRACTION = 1 - SUMMER_DAY_FRACTION;

export function getSeasonDiagramVariant(label: SolarEventLabel, hemisphere: Hemisphere): SeasonDiagramVariant {
  if (label === "March Equinox" || label === "September Equinox") return "equinox";
  const northTowardSun = label === "June Solstice";
  if (hemisphere === "north") return northTowardSun ? "north-summer" : "north-winter";
  return northTowardSun ? "south-winter" : "south-summer";
}

export function getSeasonDiagramConfig(variant: SeasonDiagramVariant): SeasonDiagramConfig {
  if (variant === "equinox") {
    return {
      variant,
      poleTowardSun: null,
      axisScreenAngleDeg: 0,
      focusHemisphere: null,
      dayFraction: { north: 0.5, south: 0.5 },
      title: "Equinox: balanced sunlight",
      caption:
        "Earth is still tilted, but the tilt leans sideways — not toward the Sun. Both halves of Earth get the same sunshine, so day and night are almost equal everywhere.",
      ariaDescription:
        "The Sun shines from the left onto Earth. Earth's tilted axis lines up exactly with the day–night line, so neither pole leans toward the Sun. Both hemispheres are half lit and half dark, and the daylight bars for the northern and southern halves are equal.",
      northChip: "No lean toward the Sun",
      southChip: "Poles on the day–night edge",
      northBarLabel: "Day = night",
      southBarLabel: "Day = night",
    };
  }

  const poleTowardSun = variant === "north-summer" || variant === "south-winter" ? "north" : "south";
  const focusHemisphere: Hemisphere = variant.startsWith("north") ? "north" : "south";
  const isSummer = variant.endsWith("summer");
  const northIsSummer = poleTowardSun === "north";

  const hemisphereName = focusHemisphere === "north" ? "Northern Hemisphere" : "Southern Hemisphere";

  return {
    variant,
    poleTowardSun,
    axisScreenAngleDeg: poleTowardSun === "north" ? -AXIAL_TILT_DEG : AXIAL_TILT_DEG,
    focusHemisphere,
    dayFraction: {
      north: northIsSummer ? SUMMER_DAY_FRACTION : WINTER_DAY_FRACTION,
      south: northIsSummer ? WINTER_DAY_FRACTION : SUMMER_DAY_FRACTION,
    },
    title: isSummer ? `Summer in the ${hemisphereName}` : `Winter in the ${hemisphereName}`,
    caption: isSummer
      ? `The ${hemisphereName} leans toward the Sun, so sunlight hits it more directly and days last longer. The other half of Earth leans away and has winter.`
      : `The ${hemisphereName} leans away from the Sun, so sunlight arrives at a low angle and days are short. The other half of Earth leans toward the Sun and has summer.`,
    ariaDescription:
      `The Sun shines from the left onto Earth, whose tilted axis leans the ${
        poleTowardSun === "north" ? "North" : "South"
      } Pole toward the Sun. The half of Earth leaning toward the Sun is mostly in daylight with long days, while the half leaning away is mostly in darkness with short days. It is ${
        isSummer ? "summer" : "winter"
      } in the ${hemisphereName}.`,
    northChip: northIsSummer ? "Leans toward the Sun" : "Leans away from the Sun",
    southChip: northIsSummer ? "Leans away from the Sun" : "Leans toward the Sun",
    northBarLabel: northIsSummer ? "Long days" : "Short days",
    southBarLabel: northIsSummer ? "Short days" : "Long days",
  };
}

export function getSeasonDiagramConfigForEvent(label: SolarEventLabel, hemisphere: Hemisphere): SeasonDiagramConfig {
  return getSeasonDiagramConfig(getSeasonDiagramVariant(label, hemisphere));
}
