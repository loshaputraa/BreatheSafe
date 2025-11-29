
"use client";

import React, { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { HealthProfile, RouteOption, TravelMode } from "@/lib/types";
import RouteCard from "./route-card";
import { Loader, Map, Search, X, Car, Bike, Footprints } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

type RoutePlannerProps = {
  startPointName: string;
  setStartPointName: Dispatch<SetStateAction<string>>;
  endPointName: string;
  setEndPointName: Dispatch<SetStateAction<string>>;
  healthProfile: HealthProfile;
  setHealthProfile: Dispatch<SetStateAction<HealthProfile>>;
  travelMode: TravelMode;
  setTravelMode: Dispatch<SetStateAction<TravelMode>>;
  routes: RouteOption[];
  selectedRouteId: string | null;
  setSelectedRouteId: Dispatch<SetStateAction<string | null>>;
  onSearch: () => void;
  onClear: () => void;
  isLoading: boolean;
  pointSelectionMode: "start" | "end" | null;
  setPointSelectionMode: Dispatch<SetStateAction<"start" | "end" | null>>;
};

export default function RoutePlanner({
  startPointName,
  setStartPointName,
  endPointName,
  setEndPointName,
  healthProfile,
  setHealthProfile,
  travelMode,
  setTravelMode,
  routes,
  selectedRouteId,
  setSelectedRouteId,
  onSearch,
  onClear,
  isLoading,
  pointSelectionMode,
  setPointSelectionMode
}: RoutePlannerProps) {

  return (
    <aside className="w-full md:w-[400px] bg-card flex flex-col h-full">
      <div className="p-4 space-y-4">
        <div className="space-y-2">
            <Label>Locations</Label>
            <div className="relative">
                <Input
                placeholder="Start location name or coordinates"
                value={startPointName}
                onChange={(e) => setStartPointName(e.target.value)}
                className="pl-4 pr-10"
                />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground", pointSelectionMode === 'start' && 'bg-primary/20 text-primary')}
                    onClick={() => setPointSelectionMode(pointSelectionMode === 'start' ? null : 'start')}
                    title="Select start on map"
                >
                <Map className="h-4 w-4" />
                </Button>
            </div>
            <div className="relative">
                <Input
                placeholder="End location name or coordinates"
                value={endPointName}
                onChange={(e) => setEndPointName(e.target.value)}
                className="pl-4 pr-10"
                />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground", pointSelectionMode === 'end' && 'bg-primary/20 text-primary')}
                    onClick={() => setPointSelectionMode(pointSelectionMode === 'end' ? null : 'end')}
                    title="Select end on map"
                >
                <Map className="h-4 w-4" />
                </Button>
            </div>
        </div>
        <div className="space-y-2">
            <Label>Travel Mode</Label>
            <ToggleGroup type="single" value={travelMode} onValueChange={(value: TravelMode) => value && setTravelMode(value)} className="w-full grid grid-cols-3">
                <ToggleGroupItem value="DRIVE" className="w-full" aria-label="Driving">
                    <Car className="mr-2 h-4 w-4" /> Drive
                </ToggleGroupItem>
                <ToggleGroupItem value="WALK" className="w-full" aria-label="Walking">
                    <Footprints className="mr-2 h-4 w-4" /> Walk
                </ToggleGroupItem>
                <ToggleGroupItem value="BICYCLE" className="w-full" aria-label="Bicycling">
                    <Bike className="mr-2 h-4 w-4" /> Bike
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="health-profile">Health Profile</Label>
          <Select value={healthProfile} onValueChange={(value) => setHealthProfile(value as HealthProfile)}>
            <SelectTrigger id="health-profile">
              <SelectValue placeholder="Select your health sensitivity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="sensitive">Sensitive (Asthma, Allergies)</SelectItem>
              <SelectItem value="children">Children</SelectItem>
              <SelectItem value="elderly">Elderly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
            <Button onClick={onSearch} disabled={isLoading} className="w-full">
                {isLoading ? (
                    <Loader className="animate-spin" />
                ) : (
                    <Search />
                )}
                Find Routes
            </Button>
            <Button onClick={onClear} variant="outline" disabled={isLoading} title="Clear">
                <X />
            </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 pt-0 space-y-4">
          {isLoading ? (
            <>
              <RouteCardSkeleton isRecommended />
              <RouteCardSkeleton />
              <RouteCardSkeleton />
            </>
          ) : routes.length > 0 ? (
            routes.map((route, index) => (
              <RouteCard
                key={route.id}
                route={route}
                isSelected={route.id === selectedRouteId}
                isRecommended={index === 0}
                onSelect={() => setSelectedRouteId(route.id)}
              />
            ))
          ) : (
            <Card className="text-center p-8 border-dashed">
                <p className="text-muted-foreground">Your route options will appear here.</p>
                <p className="text-sm text-muted-foreground mt-2">Enter a start and end point to begin.</p>
            </Card>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

const RouteCardSkeleton = ({ isRecommended }: { isRecommended?: boolean }) => (
    <Card className={cn(isRecommended && "border-accent-foreground/50 border-2")}>
        <CardHeader className="p-4">
            <div className="flex justify-between items-start">
                <div>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </div>
                {isRecommended && <Skeleton className="h-6 w-16" />}
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-6 w-8" />
                </div>
                <Skeleton className="h-3 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-8 w-32" />
        </CardContent>
    </Card>
)

    
