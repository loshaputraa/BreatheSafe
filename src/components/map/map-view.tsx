
"use client";

import {
  Map,
  AdvancedMarker,
  MapControl,
  ControlPosition,
  useMap,
} from "@vis.gl/react-google-maps";
import type { AQIData, LatLng, Point, RouteOption } from "@/lib/types";
import AqiMarker from "./aqi-marker";
import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

type MapViewProps = {
  startPoint: Point | null;
  endPoint: Point | null;
  routes: RouteOption[];
  aqiData: AQIData[];
  selectedRouteId: string | null;
  onMapClick: (latLng: LatLng) => void;
};

const MAP_ID = "BREATHEEASY_MAP";

// Function to get color based on health score
const getRouteColor = (healthScore: number, isSelected: boolean) => {
  const hue = (healthScore / 100) * 120; // 0 is red, 120 is green
  const saturation = isSelected ? 100 : 90;
  const lightness = isSelected ? 50 : 55;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

function Polylines({ routes, selectedRouteId }: { routes: RouteOption[], selectedRouteId: string | null }) {
  const map = useMap();
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clear existing polylines
    polylines.forEach(p => p.setMap(null));
    const newPolylines: google.maps.Polyline[] = [];

    // Sort routes to draw selected route on top
    const sortedRoutes = [...routes].sort((a) => a.id === selectedRouteId ? 1 : -1);

    sortedRoutes.forEach(route => {
      const isSelected = route.id === selectedRouteId;
      const color = getRouteColor(route.healthScore, isSelected);

      const polyline = new google.maps.Polyline({
        path: route.path,
        strokeColor: color,
        strokeOpacity: isSelected ? 1.0 : 0.7,
        strokeWeight: isSelected ? 8 : 6,
        zIndex: isSelected ? 2 : 1,
        map: map,
      });
      newPolylines.push(polyline);
    });
    
    setPolylines(newPolylines);

    return () => {
      newPolylines.forEach(p => p.setMap(null));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, routes, selectedRouteId]);

  return null;
}

export default function MapView({
  startPoint,
  endPoint,
  routes,
  aqiData,
  selectedRouteId,
  onMapClick,
}: MapViewProps) {
  const map = useMap();
  const routesRef = useRef<RouteOption[]>([]);

  useEffect(() => {
    const hasNewRoutes = routes.length > 0 && routesRef.current.some((r, i) => routes[i]?.id !== r.id);
    
    if (map && hasNewRoutes) {
        const bounds = new google.maps.LatLngBounds();
        routes.forEach(route => {
            route.path.forEach(p => bounds.extend(p));
        });
        map.fitBounds(bounds, 100); // 100px padding
        routesRef.current = routes;
    } else if (map && startPoint && !endPoint && !routes.length) {
        map.setCenter(startPoint);
        map.setZoom(12);
        routesRef.current = [];
    }
  }, [routes, startPoint, endPoint, map]);

  return (
    <Map
      mapId={MAP_ID}
      defaultZoom={12}
      defaultCenter={{ lat: 3.139, lng: 101.6869 }} // Default to Kuala Lumpur
      gestureHandling={"auto"}
      disableDefaultUI={true}
      onClick={(e) => e.detail.latLng && onMapClick(e.detail.latLng)}
      className="w-full h-full border-l"
      mapTypeControl={true}
      streetViewControl={false}
      fullscreenControl={false}
    >
      <MapControl position={ControlPosition.TOP_RIGHT}>
        <div className="m-2 p-2 bg-background rounded-md shadow-md border text-xs text-muted-foreground">
          Click on the map to set start/end points
        </div>
      </MapControl>

      {startPoint && (
        <AdvancedMarker position={startPoint}>
          <MapPin className="text-red-600 w-8 h-8" fill="currentColor" />
        </AdvancedMarker>
      )}
      {endPoint && (
        <AdvancedMarker position={endPoint}>
          <MapPin className="text-blue-600 w-8 h-8" fill="currentColor" />
        </AdvancedMarker>
      )}

      {aqiData.map((item) => (
        <AqiMarker key={item.id} item={item} />
      ))}

      <Polylines routes={routes} selectedRouteId={selectedRouteId} />
    </Map>
  );
}
