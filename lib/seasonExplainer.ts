import { dateToJulianDay, getSeasonLabel } from "./orbitalMechanics";

export type Hemisphere = "north" | "south";
export type SeasonExplainerMode = "solstice" | "equinox";
export type SolarEventLabel = "March Equinox" | "June Solstice" | "September Equinox" | "December Solstice";
export type SeasonExplainerCameraKind = "solstice-fixed" | "equinox-side";

export interface SeasonExplainerViewPreset {
  rotationAngle: number;
  cameraKind: SeasonExplainerCameraKind;
  zoomDistance: number;
}

export interface SeasonExplainerEvent {
  label: SolarEventLabel;
  mode: SeasonExplainerMode;
  date: Date;
  jd: number;
  selectorLabel: string;
  title: string;
  seasonLabel: string;
  summary: string;
  orbitPrompt: string;
  tiltPrompt: string;
  daylightPrompt: string;
  axisPrompt: string;
  comparisonLabel: string;
  viewPreset: SeasonExplainerViewPreset;
  misconceptionPrompt?: string;
}

export interface SeasonExplainerScenePreset {
  isPlaying: boolean;
  orbitSpeed: number;
  zoomDistance: number;
  earthScale: number;
  focusTarget: "earth";
}

interface SolarEventDefinition {
  label: SolarEventLabel;
  mode: SeasonExplainerMode;
  month: number;
  day: number;
  selectorLabel: string;
}

export const SEASON_EXPLAINER_SCENE_PRESET: SeasonExplainerScenePreset = {
  isPlaying: false,
  orbitSpeed: 0,
  zoomDistance: 150,
  earthScale: 20,
  focusTarget: "earth",
};

const EVENT_DEFINITIONS: readonly SolarEventDefinition[] = [
  { label: "March Equinox", mode: "equinox", month: 2, day: 20, selectorLabel: "March" },
  { label: "June Solstice", mode: "solstice", month: 5, day: 21, selectorLabel: "June" },
  { label: "September Equinox", mode: "equinox", month: 8, day: 23, selectorLabel: "September" },
  { label: "December Solstice", mode: "solstice", month: 11, day: 21, selectorLabel: "December" },
] as const;

const EVENT_ROTATION_ANGLES: Record<SolarEventLabel, number> = {
  "March Equinox": Math.PI * 0.1,
  "June Solstice": Math.PI * 1.15,
  "September Equinox": Math.PI * 1.1,
  "December Solstice": Math.PI * 0.15,
};

const SOLSTICE_EXPLAINER_ZOOM_DISTANCE = 420;

export const SOLSTICE_EVENT_LABELS: readonly SolarEventLabel[] = ["June Solstice", "December Solstice"];
export const EQUINOX_EVENT_LABELS: readonly SolarEventLabel[] = ["March Equinox", "September Equinox"];

export function getExplainerEventLabels(mode: SeasonExplainerMode): readonly SolarEventLabel[] {
  return mode === "solstice" ? SOLSTICE_EVENT_LABELS : EQUINOX_EVENT_LABELS;
}

export function getSeasonExplainerEvents(
  mode: SeasonExplainerMode,
  hemisphere: Hemisphere,
  year = new Date().getUTCFullYear(),
): SeasonExplainerEvent[] {
  return getExplainerEventLabels(mode).map((label) => getSeasonExplainerEvent(label, hemisphere, year));
}

export function getSeasonExplainerEvent(
  label: SolarEventLabel,
  hemisphere: Hemisphere,
  year = new Date().getUTCFullYear(),
): SeasonExplainerEvent {
  const definition = getDefinition(label);
  const date = new Date(Date.UTC(year, definition.month, definition.day));
  const jd = dateToJulianDay(date);
  const seasonLabel = getSeasonLabel(jd, hemisphere);

  return {
    label,
    mode: definition.mode,
    date,
    jd,
    selectorLabel: definition.selectorLabel,
    title: getTitle(label, hemisphere),
    seasonLabel,
    summary: getSummary(label, hemisphere),
    orbitPrompt: getOrbitPrompt(label),
    tiltPrompt: getTiltPrompt(label, hemisphere),
    daylightPrompt: getDaylightPrompt(label, hemisphere),
    axisPrompt: "The highlighted line is Earth's tilted axis. It keeps pointing the same way as Earth orbits the Sun.",
    comparisonLabel: getComparisonLabel(label),
    viewPreset: getViewPreset(label),
    misconceptionPrompt:
      definition.mode === "solstice"
        ? "Summer and Winter are not an effect of distance to the Sun. The relative tilt of the Earth to the Sun changes the angle of light hitting the surface, and how many hours of daylight each place gets."
        : undefined,
  };
}

export function getTodayAwareExplainerEvent(
  mode: SeasonExplainerMode,
  hemisphere: Hemisphere,
  today = new Date(),
): SeasonExplainerEvent {
  const todayJD = dateToJulianDay(startOfUtcDay(today));
  const baseYear = today.getUTCFullYear();
  const candidates = [baseYear - 1, baseYear, baseYear + 1].flatMap((year) =>
    getSeasonExplainerEvents(mode, hemisphere, year),
  );

  return candidates
    .map((event) => ({
      event,
      distance: Math.abs(event.jd - todayJD),
      isFutureOrToday: event.jd >= todayJD,
    }))
    .sort((a, b) => {
      const distanceDelta = a.distance - b.distance;
      if (Math.abs(distanceDelta) > Number.EPSILON) return distanceDelta;
      if (a.isFutureOrToday !== b.isFutureOrToday) return a.isFutureOrToday ? -1 : 1;
      return a.event.jd - b.event.jd;
    })[0].event;
}

function getDefinition(label: SolarEventLabel): SolarEventDefinition {
  const definition = EVENT_DEFINITIONS.find((event) => event.label === label);
  if (!definition) throw new Error(`Unknown solar event: ${label}`);
  return definition;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getViewPreset(label: SolarEventLabel): SeasonExplainerViewPreset {
  const isEquinox = label.includes("Equinox");

  return {
    rotationAngle: EVENT_ROTATION_ANGLES[label],
    cameraKind: isEquinox ? "equinox-side" : "solstice-fixed",
    zoomDistance: isEquinox ? SEASON_EXPLAINER_SCENE_PRESET.zoomDistance : SOLSTICE_EXPLAINER_ZOOM_DISTANCE,
  };
}

function getTitle(label: SolarEventLabel, hemisphere: Hemisphere): string {
  const perspective = hemisphere === "south" ? "Southern Hemisphere" : "Northern Hemisphere";
  return `${label}: ${getSeasonName(label, hemisphere)} in the ${perspective}`;
}

function getSeasonName(label: SolarEventLabel, hemisphere: Hemisphere): string {
  const southSeasonByEvent: Record<SolarEventLabel, string> = {
    "March Equinox": "autumn",
    "June Solstice": "winter",
    "September Equinox": "spring",
    "December Solstice": "summer",
  };
  const northSeasonByEvent: Record<SolarEventLabel, string> = {
    "March Equinox": "spring",
    "June Solstice": "summer",
    "September Equinox": "autumn",
    "December Solstice": "winter",
  };
  return hemisphere === "south" ? southSeasonByEvent[label] : northSeasonByEvent[label];
}

function getSummary(label: SolarEventLabel, hemisphere: Hemisphere): string {
  if (label === "June Solstice") {
    return hemisphere === "south"
      ? "Countries like Australia and NZ are on the half of Earth tilted away from the Sun, so days are shorter. But in the Northern Hemisphere, it is summer and the days are longer."
      : "The Northern Hemisphere is tilted toward the Sun, so days are longer. But in the Southern Hemisphere, it is winter and the days are shorter.";
  }

  if (label === "December Solstice") {
    return hemisphere === "south"
      ? "Countries like Australia and NZ are on the half of Earth tilted toward the Sun, so days are longer."
      : "The Northern Hemisphere is tilted away from the Sun, so days are shorter.";
  }

  return "March and September equinoxes look almost the same: neither half of Earth is strongly tilted toward the Sun, so daylight and darkness are nearly balanced.";
}

function getOrbitPrompt(label: SolarEventLabel): string {
  if (label.includes("Solstice")) {
    return `Earth is at the ${label.toLowerCase()} point in its year-long orbit.`;
  }
  return `Earth is at the ${label.toLowerCase()} point in its year-long orbit.`;
}

function getTiltPrompt(label: SolarEventLabel, hemisphere: Hemisphere): string {
  if (label === "June Solstice") {
    return hemisphere === "south"
      ? "The South Pole leans away from the Sun while the North Pole leans toward it."
      : "The North Pole leans toward the Sun while the South Pole leans away.";
  }

  if (label === "December Solstice") {
    return hemisphere === "south"
      ? "The South Pole leans toward the Sun while the North Pole leans away."
      : "The North Pole leans away from the Sun while the South Pole leans toward it.";
  }

  return "Neither pole leans strongly toward the Sun. The tilt is sideways compared with the Sun.";
}

function getDaylightPrompt(label: SolarEventLabel, hemisphere: Hemisphere): string {
  if (label === "June Solstice") {
    return hemisphere === "south"
      ? "Near the South Pole there is very long night; near the North Pole there is very long daylight."
      : "Near the North Pole there is very long daylight; near the South Pole there is very long night.";
  }

  if (label === "December Solstice") {
    return hemisphere === "south"
      ? "Near the South Pole there is very long daylight; near the North Pole there is very long night."
      : "Near the North Pole there is very long night; near the South Pole there is very long daylight.";
  }

  return "Both poles sit close to the edge of day and night, so both hemispheres get roughly equal daylight.";
}

function getComparisonLabel(label: SolarEventLabel): string {
  const labels: Record<SolarEventLabel, string> = {
    "March Equinox": "Compare the September equinox",
    "June Solstice": "Show the December solstice",
    "September Equinox": "Compare the March equinox",
    "December Solstice": "Show the June solstice",
  };
  return labels[label];
}
