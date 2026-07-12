import { describe, expect, it } from "vitest";
import {
  getSeasonDiagramConfig,
  getSeasonDiagramConfigForEvent,
  getSeasonDiagramVariant,
} from "@/lib/seasonDiagram";

describe("getSeasonDiagramVariant", () => {
  it("maps both equinoxes to the single shared equinox graphic", () => {
    expect(getSeasonDiagramVariant("March Equinox", "north")).toBe("equinox");
    expect(getSeasonDiagramVariant("March Equinox", "south")).toBe("equinox");
    expect(getSeasonDiagramVariant("September Equinox", "north")).toBe("equinox");
    expect(getSeasonDiagramVariant("September Equinox", "south")).toBe("equinox");
  });

  it("maps the June solstice to northern summer / southern winter", () => {
    expect(getSeasonDiagramVariant("June Solstice", "north")).toBe("north-summer");
    expect(getSeasonDiagramVariant("June Solstice", "south")).toBe("south-winter");
  });

  it("maps the December solstice to northern winter / southern summer", () => {
    expect(getSeasonDiagramVariant("December Solstice", "north")).toBe("north-winter");
    expect(getSeasonDiagramVariant("December Solstice", "south")).toBe("south-summer");
  });
});

describe("getSeasonDiagramConfig", () => {
  it("tilts the north pole toward the Sun at the June solstice, for both framings", () => {
    for (const variant of ["north-summer", "south-winter"] as const) {
      const config = getSeasonDiagramConfig(variant);
      expect(config.poleTowardSun).toBe("north");
      // Sun is drawn on the left; a negative screen angle leans the north pole toward it.
      expect(config.axisScreenAngleDeg).toBeLessThan(0);
    }
  });

  it("tilts the south pole toward the Sun at the December solstice, for both framings", () => {
    for (const variant of ["north-winter", "south-summer"] as const) {
      const config = getSeasonDiagramConfig(variant);
      expect(config.poleTowardSun).toBe("south");
      expect(config.axisScreenAngleDeg).toBeGreaterThan(0);
    }
  });

  it("gives the hemisphere tilted toward the Sun the longer days", () => {
    const northSummer = getSeasonDiagramConfig("north-summer");
    expect(northSummer.dayFraction.north).toBeGreaterThan(0.5);
    expect(northSummer.dayFraction.south).toBeLessThan(0.5);
    expect(northSummer.northBarLabel).toBe("Long days");
    expect(northSummer.southBarLabel).toBe("Short days");

    const southSummer = getSeasonDiagramConfig("south-summer");
    expect(southSummer.dayFraction.south).toBeGreaterThan(0.5);
    expect(southSummer.dayFraction.north).toBeLessThan(0.5);
    expect(southSummer.southBarLabel).toBe("Long days");
    expect(southSummer.northBarLabel).toBe("Short days");
  });

  it("shows an untilted-toward-the-Sun axis and equal daylight at the equinox", () => {
    const config = getSeasonDiagramConfig("equinox");
    expect(config.poleTowardSun).toBeNull();
    expect(config.axisScreenAngleDeg).toBe(0);
    expect(config.focusHemisphere).toBeNull();
    expect(config.dayFraction.north).toBe(0.5);
    expect(config.dayFraction.south).toBe(0.5);
  });

  it("highlights the hemisphere the explainer is about", () => {
    expect(getSeasonDiagramConfig("north-summer").focusHemisphere).toBe("north");
    expect(getSeasonDiagramConfig("north-winter").focusHemisphere).toBe("north");
    expect(getSeasonDiagramConfig("south-summer").focusHemisphere).toBe("south");
    expect(getSeasonDiagramConfig("south-winter").focusHemisphere).toBe("south");
  });

  it("keeps chip text and tilt direction consistent", () => {
    const southWinter = getSeasonDiagramConfig("south-winter");
    expect(southWinter.northChip).toBe("Leans toward the Sun");
    expect(southWinter.southChip).toBe("Leans away from the Sun");

    const northWinter = getSeasonDiagramConfig("north-winter");
    expect(northWinter.northChip).toBe("Leans away from the Sun");
    expect(northWinter.southChip).toBe("Leans toward the Sun");
  });
});

describe("getSeasonDiagramConfigForEvent", () => {
  it("matches the surrounding explainer content for a southern-hemisphere user", () => {
    const june = getSeasonDiagramConfigForEvent("June Solstice", "south");
    expect(june.variant).toBe("south-winter");
    expect(june.title).toBe("Winter in the Southern Hemisphere");

    const december = getSeasonDiagramConfigForEvent("December Solstice", "south");
    expect(december.variant).toBe("south-summer");
    expect(december.title).toBe("Summer in the Southern Hemisphere");
  });

  it("uses the shared equinox graphic regardless of hemisphere", () => {
    const north = getSeasonDiagramConfigForEvent("March Equinox", "north");
    const south = getSeasonDiagramConfigForEvent("September Equinox", "south");
    expect(north).toEqual(south);
  });
});
