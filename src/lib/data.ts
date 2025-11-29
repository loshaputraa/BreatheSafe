import type { RouteOption, AQIData } from "./types";

// This file is no longer used for routes, but is kept for mock AQI data as a fallback.

// Mock data for routes in Kuala Lumpur, Malaysia
export const mockRoutes: Omit<RouteOption, 'id' | 'healthScore' | 'reasoning' | 'explanation'>[] = [
  {
    path: [
      { lat: 3.15, lng: 101.71 },
      { lat: 3.155, lng: 101.715 },
      { lat: 3.152, lng: 101.72 },
      { lat: 3.14, lng: 101.725 },
    ],
    distance: 4.2,
    duration: 15,
    avgAqi: 35,
    traffic: "low",
  },
  {
    path: [
      { lat: 3.15, lng: 101.71 },
      { lat: 3.145, lng: 101.712 },
      { lat: 3.142, lng: 101.723 },
      { lat: 3.14, lng: 101.725 },
    ],
    distance: 3.5,
    duration: 12,
    avgAqi: 85,
    traffic: "high",
  },
  {
    path: [
      { lat: 3.15, lng: 101.71 },
      { lat: 3.148, lng: 101.718 },
      { lat: 3.145, lng: 101.722 },
      { lat: 3.14, lng: 101.725 },
    ],
    distance: 3.8,
    duration: 18,
    avgAqi: 55,
    traffic: "medium",
  },
];

// Mock AQI data points around Kuala Lumpur
export const mockAqiData: AQIData[] = [
  { id: "aqi1", lat: 3.156, lng: 101.712, aqi: 45 },
  { id: "aqi2", lat: 3.138, lng: 101.69, aqi: 110 },
  { id: "aqi3", lat: 3.16, lng: 101.68, aqi: 30 },
  { id: "aqi4", lat: 3.145, lng: 101.718, aqi: 92 },
  { id: "aqi5", lat: 3.13, lng: 101.725, aqi: 65 },
  { id: "aqi6", lat: 3.17, lng: 101.7, aqi: 25 },
];
