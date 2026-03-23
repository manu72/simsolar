"use client";

import { useAppStore } from "@/store/useAppStore";
import {
  MAX_ORBIT_SPEED,
  MAX_ROTATION_SPEED,
  MIN_ZOOM_DISTANCE,
  MAX_ZOOM_DISTANCE,
  MIN_EARTH_SCALE,
  MAX_EARTH_SCALE,
} from "@/lib/constants";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  inverted?: boolean;
  onChange: (v: number) => void;
}

function SpeedSlider({ label, value, min, max, suffix = "×", inverted, onChange }: SliderProps) {
  const sliderValue = inverted ? max + min - value : value;
  return (
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="text-xs uppercase tracking-wider text-gray-500">{label}</span>
        <span className="text-xs text-blue-300">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={sliderValue}
        onChange={(e) => {
          const raw = Number(e.target.value);
          onChange(inverted ? max + min - raw : raw);
        }}
        className="w-full h-1 bg-gray-800 rounded appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-blue-400"
      />
    </div>
  );
}

export function SpeedControls() {
  const orbitSpeed = useAppStore((s) => s.orbitSpeed);
  const rotationSpeed = useAppStore((s) => s.rotationSpeed);
  const zoomDistance = useAppStore((s) => s.zoomDistance);
  const earthScale = useAppStore((s) => s.earthScale);
  const setOrbitSpeed = useAppStore((s) => s.setOrbitSpeed);
  const setRotationSpeed = useAppStore((s) => s.setRotationSpeed);
  const setZoomDistance = useAppStore((s) => s.setZoomDistance);
  const setEarthScale = useAppStore((s) => s.setEarthScale);

  return (
    <>
      <SpeedSlider label="Orbit Speed" value={orbitSpeed} min={0} max={MAX_ORBIT_SPEED} onChange={setOrbitSpeed} />
      <SpeedSlider
        label="Rotation Speed"
        value={rotationSpeed}
        min={0}
        max={MAX_ROTATION_SPEED}
        onChange={setRotationSpeed}
      />
      <SpeedSlider
        label="Camera Zoom"
        value={zoomDistance}
        min={MIN_ZOOM_DISTANCE}
        max={MAX_ZOOM_DISTANCE}
        suffix=""
        inverted
        onChange={setZoomDistance}
      />
      <SpeedSlider
        label="Earth Scale"
        value={earthScale}
        min={MIN_EARTH_SCALE}
        max={MAX_EARTH_SCALE}
        suffix="×"
        onChange={setEarthScale}
      />
    </>
  );
}
