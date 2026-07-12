import { describe, expect, it } from "vitest";
import {
  EQUINOX_EVENT_LABELS,
  EXPLAINER_ZOOM_DISTANCE,
  SEASON_EXPLAINER_SCENE_PRESET,
  SOLSTICE_EVENT_LABELS,
  getSeasonExplainerEvent,
  getSeasonExplainerEvents,
  getTodayAwareExplainerEvent,
} from "@/lib/seasonExplainer";

describe("season explainer event groups", () => {
  it("exposes both solstices as selectable events", () => {
    expect(SOLSTICE_EVENT_LABELS).toEqual(["June Solstice", "December Solstice"]);
    expect(getSeasonExplainerEvents("solstice", "south", 2026).map((event) => event.label)).toEqual([
      "June Solstice",
      "December Solstice",
    ]);
  });

  it("exposes both equinoxes as selectable events", () => {
    expect(EQUINOX_EVENT_LABELS).toEqual(["March Equinox", "September Equinox"]);
    expect(getSeasonExplainerEvents("equinox", "south", 2026).map((event) => event.label)).toEqual([
      "March Equinox",
      "September Equinox",
    ]);
  });
});

describe("getTodayAwareExplainerEvent", () => {
  it("selects the June solstice on the day it happens", () => {
    const event = getTodayAwareExplainerEvent("solstice", "south", new Date("2026-06-21T10:00:00Z"));
    expect(event.label).toBe("June Solstice");
    expect(event.date.getUTCFullYear()).toBe(2026);
  });

  it("keeps the June solstice selected during the week after it happens", () => {
    const event = getTodayAwareExplainerEvent("solstice", "south", new Date("2026-06-27T10:00:00Z"));
    expect(event.label).toBe("June Solstice");
  });

  it("keeps the June solstice selected while it is still the closest solstice", () => {
    const event = getTodayAwareExplainerEvent("solstice", "south", new Date("2026-06-29T10:00:00Z"));
    expect(event.label).toBe("June Solstice");
  });

  it("selects the December solstice once it becomes closer than June", () => {
    const event = getTodayAwareExplainerEvent("solstice", "south", new Date("2026-09-25T10:00:00Z"));
    expect(event.label).toBe("December Solstice");
  });

  it("prefers the upcoming event when two solstices are equally close", () => {
    const event = getTodayAwareExplainerEvent("solstice", "south", new Date("2026-03-22T10:00:00Z"));
    expect(event.label).toBe("June Solstice");
    expect(event.date.getUTCFullYear()).toBe(2026);
  });

  it("selects the March equinox on the day it happens", () => {
    const event = getTodayAwareExplainerEvent("equinox", "south", new Date("2026-03-20T10:00:00Z"));
    expect(event.label).toBe("March Equinox");
  });

  it("keeps the March equinox selected while it is still the closest equinox", () => {
    const event = getTodayAwareExplainerEvent("equinox", "south", new Date("2026-03-28T10:00:00Z"));
    expect(event.label).toBe("March Equinox");
  });

  it("selects the September equinox once it becomes closer than March", () => {
    const event = getTodayAwareExplainerEvent("equinox", "south", new Date("2026-06-25T10:00:00Z"));
    expect(event.label).toBe("September Equinox");
  });
});

describe("getSeasonExplainerEvent", () => {
  it("starts from Southern Hemisphere language for Australia and New Zealand", () => {
    const event = getSeasonExplainerEvent("December Solstice", "south", 2026);
    expect(event.title).toContain("summer in the Southern Hemisphere");
    expect(event.summary).toContain("Australia and NZ");
    expect(event.tiltPrompt).toContain("South Pole leans toward");
    expect(event.daylightPrompt).toContain("South Pole there is very long daylight");
  });

  it("flips the explanation for Northern Hemisphere perspective", () => {
    const event = getSeasonExplainerEvent("December Solstice", "north", 2026);
    expect(event.title).toContain("winter in the Northern Hemisphere");
    expect(event.summary).toContain("Northern Hemisphere is tilted away");
    expect(event.tiltPrompt).toContain("North Pole leans away");
    expect(event.daylightPrompt).toContain("North Pole there is very long night");
  });

  it("explains equinoxes as roughly equal daylight in both hemispheres", () => {
    const event = getSeasonExplainerEvent("March Equinox", "south", 2026);
    expect(event.summary).toContain("March and September equinoxes look almost the same");
    expect(event.tiltPrompt).toContain("Neither pole leans strongly");
    expect(event.daylightPrompt).toContain("roughly equal daylight");
    expect(event.misconceptionPrompt).toBeUndefined();
  });

  it("guards against the distance-causes-seasons misconception for solstices", () => {
    const event = getSeasonExplainerEvent("June Solstice", "south", 2026);
    expect(event.misconceptionPrompt).toContain("not an effect of distance");
  });

  it("uses visual wording that matches the highlighted axis cue", () => {
    const event = getSeasonExplainerEvent("June Solstice", "south", 2026);
    expect(event.axisPrompt).toContain("highlighted line");
  });

  it("exposes deterministic view presets for equinox events", () => {
    const events = [
      getSeasonExplainerEvent("March Equinox", "south", 2026),
      getSeasonExplainerEvent("September Equinox", "south", 2026),
    ];

    expect(events.map((event) => event.viewPreset.cameraKind)).toEqual([
      "equinox-side",
      "equinox-side",
    ]);
    for (const event of events) {
      expect(Number.isFinite(event.viewPreset.rotationAngle)).toBe(true);
      expect(event.viewPreset.zoomDistance).toBe(EXPLAINER_ZOOM_DISTANCE);
    }
  });

  it("uses the same fixed solstice view preset across hemispheres and solstices", () => {
    const events = [
      getSeasonExplainerEvent("June Solstice", "south", 2026),
      getSeasonExplainerEvent("June Solstice", "north", 2026),
      getSeasonExplainerEvent("December Solstice", "south", 2026),
      getSeasonExplainerEvent("December Solstice", "north", 2026),
    ];

    for (const event of events) {
      expect(event.viewPreset.cameraKind).toBe("solstice-fixed");
      expect(event.viewPreset.zoomDistance).toBe(EXPLAINER_ZOOM_DISTANCE);
    }
  });
});

describe("SEASON_EXPLAINER_SCENE_PRESET", () => {
  it("freezes orbit and reframes the scene without overriding rotation speed", () => {
    expect(SEASON_EXPLAINER_SCENE_PRESET).toEqual({
      isPlaying: false,
      orbitSpeed: 0,
      earthScale: 20,
      focusTarget: "earth",
    });
    expect(SEASON_EXPLAINER_SCENE_PRESET).not.toHaveProperty("rotationSpeed");
  });
});
