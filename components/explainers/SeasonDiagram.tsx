"use client";

import { useMemo } from "react";
import { AXIAL_TILT_DEG } from "@/lib/constants";
import { getSeasonDiagramConfig, type SeasonDiagramVariant } from "@/lib/seasonDiagram";

// Portrait composition: Sun bulging from the left edge, large Earth on the
// right, day-length bars along the bottom. All coordinates live in this
// 360x528 viewBox so the SVG scales crisply on any phone.
const VIEW_W = 360;
const VIEW_TOP = 74;
const VIEW_H = 516;
const EARTH = { cx: 234, cy: 250, r: 94 };
const SUN = { cx: 40, cy: 250, r: 46 };
const AXIS_OVERHANG = 22;

interface SeasonDiagramProps {
  variant: SeasonDiagramVariant;
}

export function SeasonDiagram({ variant }: SeasonDiagramProps) {
  const config = useMemo(() => getSeasonDiagramConfig(variant), [variant]);

  const axisDeg = config.axisScreenAngleDeg;
  const axisRad = (axisDeg * Math.PI) / 180;
  // Unit vector from Earth's centre toward the North Pole on screen.
  const northDir = { x: Math.sin(axisRad), y: -Math.cos(axisRad) };
  const poleTip = EARTH.r + AXIS_OVERHANG;
  const north = { x: EARTH.cx + northDir.x * poleTip, y: EARTH.cy + northDir.y * poleTip };
  const south = { x: EARTH.cx - northDir.x * poleTip, y: EARTH.cy - northDir.y * poleTip };
  const northLetter = { x: EARTH.cx + northDir.x * (poleTip + 14), y: EARTH.cy + northDir.y * (poleTip + 14) };
  const southLetter = { x: EARTH.cx - northDir.x * (poleTip + 14), y: EARTH.cy - northDir.y * (poleTip + 14) };

  const isSolstice = config.poleTowardSun !== null;
  const northChevron = config.poleTowardSun === "north" ? "toward" : isSolstice ? "away" : undefined;
  const southChevron = config.poleTowardSun === "south" ? "toward" : isSolstice ? "away" : undefined;

  return (
    <svg
      viewBox={`0 ${VIEW_TOP} ${VIEW_W} ${VIEW_H - VIEW_TOP}`}
      role="img"
      aria-labelledby="sd-title sd-desc"
      className="h-auto w-full select-none"
    >
      <title id="sd-title">{config.title}</title>
      <desc id="sd-desc">{config.ariaDescription}</desc>

      <defs>
        <radialGradient id="sd-sun-glow">
          <stop offset="0%" stopColor="#fff7d6" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#fbbf24" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sd-sun-core" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="55%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id="sd-ocean" cx="34%" cy="38%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="55%" stopColor="#2f6fdb" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </radialGradient>
        <linearGradient
          id="sd-night"
          gradientUnits="userSpaceOnUse"
          x1={EARTH.cx - 16}
          x2={EARTH.cx + 18}
          y1={EARTH.cy}
          y2={EARTH.cy}
        >
          <stop offset="0%" stopColor="#040a1c" stopOpacity="0" />
          <stop offset="100%" stopColor="#040a1c" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="sd-beam" gradientUnits="userSpaceOnUse" x1="84" x2="146" y1="0" y2="0">
          <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#fcd34d" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="sd-daybar" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <clipPath id="sd-globe">
          <circle cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r} />
        </clipPath>
        <marker id="sd-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 Z" fill="#fcd34d" />
        </marker>
      </defs>

      {/* ── Sun ─────────────────────────────────────────────── */}
      <g className="sd-sun-pulse">
        <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r * 2.4} fill="url(#sd-sun-glow)" />
        <g className="sd-rays" stroke="#fcd34d" strokeWidth={3} strokeLinecap="round" opacity={0.8}>
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * Math.PI) / 6;
            const inner = SUN.r + 10;
            const outer = SUN.r + 22;
            return (
              <line
                key={i}
                x1={SUN.cx + Math.cos(angle) * inner}
                y1={SUN.cy + Math.sin(angle) * inner}
                x2={SUN.cx + Math.cos(angle) * outer}
                y2={SUN.cy + Math.sin(angle) * outer}
              />
            );
          })}
        </g>
        <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r} fill="url(#sd-sun-core)" />
      </g>

      {/* ── Sunlight beam + arrows ──────────────────────────── */}
      <polygon points="86,214 146,178 146,322 86,286" fill="url(#sd-beam)" />
      <g stroke="#fcd34d" strokeWidth={2.5} strokeLinecap="round">
        {[215, 250, 285].map((y) => (
          <line key={y} className="sd-beam-line" x1={92} y1={y} x2={128} y2={y} markerEnd="url(#sd-arrow)" />
        ))}
      </g>
      <text x={110} y={200} textAnchor="middle" fontSize={10} fill="rgb(253 230 138 / 0.85)" fontWeight={600}>
        sunlight
      </text>

      {/* ── Earth ───────────────────────────────────────────── */}
      {/* Day-side ocean */}
      <circle cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r} fill="url(#sd-ocean)" />

      {/* Continents + polar ice caps live in the axis frame so the poles stay on the axis */}
      <g clipPath="url(#sd-globe)">
        <g transform={`rotate(${axisDeg} ${EARTH.cx} ${EARTH.cy}) translate(${EARTH.cx} ${EARTH.cy})`}>
          <g fill="#3fa065" stroke="rgb(10 40 24 / 0.25)" strokeWidth={1}>
            {/* Africa */}
            <path d="M -16 -18 C -6 -32 14 -30 21 -14 C 27 -2 20 12 12 26 C 6 38 -4 42 -10 30 C -18 16 -22 -4 -16 -18 Z" />
            {/* Europe */}
            <path d="M -14 -30 C -8 -42 8 -46 16 -38 C 19 -32 10 -27 2 -26 C -6 -25 -16 -24 -14 -30 Z" />
            {/* Asia */}
            <path d="M 18 -32 C 28 -50 56 -54 68 -38 C 76 -26 70 -10 56 -6 C 44 -3 30 -10 24 -20 C 20 -27 15 -26 18 -32 Z" />
            {/* Australia */}
            <path d="M 42 28 C 50 21 64 23 69 31 C 72 40 63 46 52 46 C 43 46 38 34 42 28 Z" />
            {/* South America */}
            <path d="M -64 16 C -55 8 -46 13 -46 24 C -46 37 -53 50 -62 47 C -69 43 -70 24 -64 16 Z" />
            {/* North America (western rim) */}
            <path d="M -80 -32 C -72 -46 -55 -48 -50 -36 C -47 -27 -56 -20 -66 -19 C -75 -18 -84 -24 -80 -32 Z" />
          </g>
          {/* Polar ice caps mark where the axis meets the globe */}
          <ellipse cx={0} cy={-EARTH.r + 8} rx={26} ry={13} fill="#eaf4ff" opacity={0.95} />
          <ellipse cx={0} cy={EARTH.r - 8} rx={26} ry={13} fill="#eaf4ff" opacity={0.95} />
        </g>

        {/* Night side: fixed to the sunlight, not to the globe */}
        <circle cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r} fill="url(#sd-night)" />

        {/* Terminator (day–night line) */}
        <line
          x1={EARTH.cx}
          y1={EARTH.cy - EARTH.r}
          x2={EARTH.cx}
          y2={EARTH.cy + EARTH.r}
          stroke="rgb(255 255 255 / 0.4)"
          strokeWidth={1.5}
          strokeDasharray="4 6"
        />

        {/* Night-side stars + moon */}
        <g fill="#e2e8f0">
          <circle className="sd-twinkle" cx={296} cy={196} r={1.8} />
          <circle className="sd-twinkle sd-twinkle-late" cx={312} cy={262} r={1.4} />
          <circle className="sd-twinkle" cx={290} cy={306} r={1.5} />
          <path d="M 302 224 a 7 7 0 1 0 6 10.5 a 5.4 5.4 0 0 1 -6 -10.5 Z" opacity={0.85} />
        </g>
      </g>

      {/* Atmosphere rim */}
      <circle cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r + 3} fill="none" stroke="#93c5fd" strokeOpacity={0.3} strokeWidth={2.5} />

      {/* ── Axis ────────────────────────────────────────────── */}
      <g transform={`rotate(${axisDeg} ${EARTH.cx} ${EARTH.cy})`}>
        <line
          x1={EARTH.cx}
          y1={EARTH.cy - poleTip}
          x2={EARTH.cx}
          y2={EARTH.cy + poleTip}
          stroke="#f8fafc"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.25}
          className="sd-axis-glow"
        />
        <line
          x1={EARTH.cx}
          y1={EARTH.cy - poleTip}
          x2={EARTH.cx}
          y2={EARTH.cy + poleTip}
          stroke="#f8fafc"
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={0.9}
        />
      </g>
      <circle cx={north.x} cy={north.y} r={3.5} fill="#f8fafc" />
      <circle cx={south.x} cy={south.y} r={3.5} fill="#f8fafc" />
      <text x={northLetter.x} y={northLetter.y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="#f8fafc">
        N
      </text>
      <text x={southLetter.x} y={southLetter.y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="#f8fafc">
        S
      </text>

      {/* Tilt reference (solstice): dashed "straight up" line + angle */}
      {isSolstice && <TiltIndicator axisDeg={axisDeg} />}

      {/* Sideways-lean hint (equinox): the tilt points at the viewer, not the Sun */}
      {!isSolstice && (
        <g stroke="#93c5fd" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.9}>
          <path d="M 212 148 Q 234 137 256 148" />
          <path d="M 212 148 l 5 -6 M 212 148 l 7 3" />
          <path d="M 256 148 l -5 -6 M 256 148 l -7 3" />
        </g>
      )}

      {/* ── Hemisphere chips ────────────────────────────────── */}
      <Chip
        cx={clampChipX(isSolstice ? north.x : EARTH.cx, config.northChip)}
        cy={96}
        text={config.northChip}
        accent={config.focusHemisphere === "north"}
        chevron={northChevron}
      />
      <Chip
        cx={clampChipX(isSolstice ? south.x : EARTH.cx, config.southChip)}
        cy={402}
        text={config.southChip}
        accent={config.focusHemisphere === "south"}
        chevron={southChevron}
      />

      {/* ── Day-length bars ─────────────────────────────────── */}
      <text x={VIEW_W / 2} y={438} textAnchor="middle" fontSize={11} fill="rgb(203 213 225 / 0.7)" fontWeight={600}>
        Hours of daylight
      </text>
      <DayBar
        y={448}
        label="North"
        fraction={config.dayFraction.north}
        dayText={config.northBarLabel}
        focused={config.focusHemisphere === "north"}
      />
      <DayBar
        y={486}
        label="South"
        fraction={config.dayFraction.south}
        dayText={config.southBarLabel}
        focused={config.focusHemisphere === "south"}
      />
    </svg>
  );
}

function TiltIndicator({ axisDeg }: { axisDeg: number }) {
  const rad = (axisDeg * Math.PI) / 180;
  const arcR = EARTH.r + 18;
  const arcStart = { x: EARTH.cx, y: EARTH.cy - arcR };
  const arcEnd = { x: EARTH.cx + Math.sin(rad) * arcR, y: EARTH.cy - Math.cos(rad) * arcR };
  const sweep = axisDeg > 0 ? 1 : 0;
  const halfRad = rad / 2;
  const labelR = arcR + 13;
  const label = { x: EARTH.cx + Math.sin(halfRad) * labelR, y: EARTH.cy - Math.cos(halfRad) * labelR };

  return (
    <g>
      <line
        x1={EARTH.cx}
        y1={EARTH.cy - EARTH.r + 2}
        x2={EARTH.cx}
        y2={EARTH.cy - arcR - 6}
        stroke="rgb(226 232 240 / 0.55)"
        strokeWidth={1.5}
        strokeDasharray="3 5"
      />
      <path
        d={`M ${arcStart.x} ${arcStart.y} A ${arcR} ${arcR} 0 0 ${sweep} ${arcEnd.x} ${arcEnd.y}`}
        fill="none"
        stroke="rgb(226 232 240 / 0.55)"
        strokeWidth={1.5}
      />
      <text x={label.x} y={label.y + 3} textAnchor="middle" fontSize={10} fill="rgb(226 232 240 / 0.8)">
        {AXIAL_TILT_DEG.toFixed(1)}°
      </text>
    </g>
  );
}

function estimateChipWidth(text: string): number {
  return text.length * 6.2 + 22;
}

function clampChipX(x: number, text: string): number {
  const half = estimateChipWidth(text) / 2 + 20;
  return Math.min(Math.max(x, half), VIEW_W - half);
}

function Chip({
  cx,
  cy,
  text,
  accent,
  chevron,
}: {
  cx: number;
  cy: number;
  text: string;
  accent: boolean;
  chevron?: "toward" | "away";
}) {
  const width = estimateChipWidth(text);
  return (
    <g opacity={accent || !chevron ? 1 : 0.82}>
      <rect
        x={cx - width / 2}
        y={cy - 13}
        width={width}
        height={26}
        rx={13}
        fill="rgb(2 6 23 / 0.78)"
        stroke={accent ? "#93c5fd" : "rgb(255 255 255 / 0.28)"}
        strokeWidth={accent ? 1.5 : 1}
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill={accent ? "#ffffff" : "rgb(226 232 240 / 0.9)"}
      >
        {text}
      </text>
      {chevron === "toward" && <Chevrons x={cx - width / 2 - 10} y={cy} dir="left" />}
      {chevron === "away" && <Chevrons x={cx + width / 2 + 10} y={cy} dir="right" />}
    </g>
  );
}

function Chevrons({ x, y, dir }: { x: number; y: number; dir: "left" | "right" }) {
  const s = dir === "left" ? -1 : 1;
  return (
    <g
      className={dir === "left" ? "sd-nudge-left" : "sd-nudge-right"}
      stroke="#fcd34d"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d={`M ${x - 3 * s} ${y - 5} L ${x + 3 * s} ${y} L ${x - 3 * s} ${y + 5}`} />
      <path d={`M ${x + 5 * s} ${y - 5} L ${x + 11 * s} ${y} L ${x + 5 * s} ${y + 5}`} />
    </g>
  );
}

function DayBar({
  y,
  label,
  fraction,
  dayText,
  focused,
}: {
  y: number;
  label: string;
  fraction: number;
  dayText: string;
  focused: boolean;
}) {
  const barX = 84;
  const barW = 246;
  const barH = 22;
  const dayW = barW * fraction;
  const clipId = `sd-bar-${label.toLowerCase()}`;

  return (
    <g>
      <text
        x={barX - 10}
        y={y + barH / 2 + 4}
        textAnchor="end"
        fontSize={11}
        fontWeight={focused ? 700 : 500}
        fill={focused ? "#ffffff" : "rgb(203 213 225 / 0.7)"}
      >
        {label}
      </text>
      <clipPath id={clipId}>
        <rect x={barX} y={y} width={barW} height={barH} rx={7} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect x={barX} y={y} width={barW} height={barH} fill="#0b1d3a" />
        <rect x={barX} y={y} width={dayW} height={barH} fill="url(#sd-daybar)" />
        <text x={barX + 8} y={y + barH / 2 + 4} fontSize={10} fontWeight={700} fill="#1f2937">
          {dayText}
        </text>
        {/* Crescent moon on the night side */}
        <path
          d={`M ${barX + barW - 16} ${y + 5} a 6 6 0 1 0 5.2 9 a 4.6 4.6 0 0 1 -5.2 -9 Z`}
          fill="#cbd5e1"
          opacity={0.9}
        />
      </g>
      <rect
        x={barX}
        y={y}
        width={barW}
        height={barH}
        rx={7}
        fill="none"
        stroke={focused ? "#93c5fd" : "rgb(255 255 255 / 0.18)"}
        strokeWidth={focused ? 1.5 : 1}
      />
    </g>
  );
}
