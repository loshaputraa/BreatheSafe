"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { useState, useTransition } from "react";
import type { AQIData, LatLng, Point, RouteOption, HealthProfile, TravelMode } from "@/lib/types";
import { getRoutesAndAQI, geocodeAddress } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import RoutePlanner from "@/components/sidebar/route-planner";
import MapView from "@/components/map/map-view";

export default function Home() {
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [startPointName, setStartPointName] = useState("");
  const [endPointName, setEndPointName] = useState("");
  const [healthProfile, setHealthProfile] = useState<HealthProfile>("default");
  const [travelMode, setTravelMode] = useState<TravelMode>("DRIVE");

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [aqiData, setAqiData] = useState<AQIData[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [pointSelectionMode, setPointSelectionMode] = useState<"start" | "end" | null>(null);

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSearch = () => {
    startTransition(async () => {
      let start = startPoint;
      let end = endPoint;
      
      if (!start && startPointName) {
        const point = await geocodeAddress(startPointName);
        if (point) {
          setStartPoint(point);
          start = point;
        } else {
          toast({ title: "Start location not found", description: `Could not find coordinates for "${startPointName}".`, variant: "destructive" });
          return;
        }
      }

      if (!end && endPointName) {
        const point = await geocodeAddress(endPointName);
        if (point) {
          setEndPoint(point);
          end = point;
        } else {
          toast({ title: "End location not found", description: `Could not find coordinates for "${endPointName}".`, variant: "destructive" });
          return;
        }
      }

      if (!start || !end) {
        toast({
          title: "Missing locations",
          description: "Please set both a start and end point.",
          variant: "destructive",
        });
        return;
      }
      
      const result = await getRoutesAndAQI(start, end, healthProfile, travelMode);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        setRoutes([]);
        setAqiData([]);
      } else {
        setRoutes(result.routes ?? []);
        setAqiData(result.aqiData ?? []);
        if (result.routes && result.routes.length > 0) {
          setSelectedRouteId(result.routes[0].id);
        } else {
          setSelectedRouteId(null);
        }
      }
    });
  };

  const handleMapClick = (latLng: LatLng) => {
    const newPoint = { lat: latLng.lat, lng: latLng.lng };
    if (pointSelectionMode === 'start') {
      setStartPoint(newPoint);
      setStartPointName(`${newPoint.lat.toFixed(4)}, ${newPoint.lng.toFixed(4)}`);
      setPointSelectionMode('end');
    } else if (pointSelectionMode === 'end') {
      setEndPoint(newPoint);
      setEndPointName(`${newPoint.lat.toFixed(4)}, ${newPoint.lng.toFixed(4)}`);
      setPointSelectionMode(null);
    }
  };

  const handleClear = () => {
    setStartPoint(null);
    setEndPoint(null);
    setStartPointName("");
    setEndPointName("");
    setRoutes([]);
    setAqiData([]);
    setSelectedRouteId(null);
    setPointSelectionMode(null);
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-center">
        <div className="p-8 space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h1 className="text-2xl font-bold text-primary">Configuration Error</h1>
          <p className="text-muted-foreground">
            Google Maps API key is missing.
          </p>
          <p className="text-sm">
            Please add <code className="p-1 rounded bg-muted font-code">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="flex h-dvh flex-col bg-background text-foreground">
        <Header />
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          <RoutePlanner
            startPointName={startPointName}
            setStartPointName={setStartPointName}
            endPointName={endPointName}
            setEndPointName={setEndPointName}
            healthProfile={healthProfile}
            setHealthProfile={setHealthProfile}
            travelMode={travelMode}
            setTravelMode={setTravelMode}
            routes={routes}
            selectedRouteId={selectedRouteId}
            setSelectedRouteId={setSelectedRouteId}
            onSearch={handleSearch}
            onClear={handleClear}
            isLoading={isPending}
            pointSelectionMode={pointSelectionMode}
            setPointSelectionMode={setPointSelectionMode}
          />
          <div className="flex-1 h-full w-full">
            <MapView
              startPoint={startPoint}
              endPoint={endPoint}
              routes={routes}
              aqiData={aqiData}
              selectedRouteId={selectedRouteId}
              onMapClick={handleMapClick}
            />
          </div>
        </div>
      </div>
    </APIProvider>
  );
}
