export type LatLng = {
  lat: number;
  lng: number;
};

export type Point = LatLng;

export type HealthProfile = 'default' | 'sensitive' | 'children' | 'elderly';

export type TravelMode = 'DRIVE' | 'WALK' | 'BICYCLE';

export type RouteOption = {
  id: string;
  path: LatLng[];
  distance: number; // in km
  duration: number; // in minutes
  avgAqi: number;
  traffic?: "low" | "medium" | "high";
  healthScore: number; // 0-100
  explanation: string;
  travelMode: 'DRIVE' | 'WALK' | 'BICYCLE';
};

export type AQIData = {
  id: string;
  lat: number;
  lng: number;
  aqi: number;
};
