"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { AQIData } from "@/lib/types";
import { cn } from "@/lib/utils";

type AqiMarkerProps = {
  item: AQIData;
};

const getAqiColor = (aqi: number) => {
  if (aqi <= 50) return "bg-green-500 border-green-700"; // Good
  if (aqi <= 100) return "bg-yellow-400 border-yellow-600"; // Moderate
  if (aqi <= 150) return "bg-orange-500 border-orange-700"; // Unhealthy for Sensitive Groups
  if (aqi <= 200) return "bg-red-500 border-red-700"; // Unhealthy
  if (aqi <= 300) return "bg-purple-500 border-purple-700"; // Very Unhealthy
  return "bg-maroon-500 border-maroon-700"; // Hazardous
};

export default function AqiMarker({ item }: AqiMarkerProps) {
  return (
    <AdvancedMarker position={{ lat: item.lat, lng: item.lng }}>
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold border-2 shadow-md",
          getAqiColor(item.aqi)
        )}
        title={`AQI: ${item.aqi}`}
      >
        {item.aqi}
      </div>
    </AdvancedMarker>
  );
}
