'use server';
import { calculateRouteHealthScoreFlow } from "@/ai/flows/route-health-scoring-fixed";
import { calculateRouteHealthScore } from '@/ai/flows/route-health-scoring-fixed';
import type { AQIData, Point, RouteOption, HealthProfile, TravelMode } from './types';
import polyline from 'google-polyline';

// Helper function to check if a point is inside a polygon
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;

        const intersect = ((yi > point.lng) !== (yj > point.lng))
            && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
}

// Function to calculate the average AQI for a given route from heatmap data
function getAvgAqiForRoute(routePath: Point[], aqiHeatmap: AQIData[]): number {
    if (!aqiHeatmap.length) return 50; // Default if no heatmap
    
    const routePoints = routePath;
    let totalAqi = 0;
    let pointsCount = 0;

    // A simple way to sample points along the route
    for (let i = 0; i < routePoints.length; i += 5) { // Check every 5th point
        const point = routePoints[i];
        
        // Find the closest heatmap tile
        // This is a simplification; a more accurate way would be to find the tile the point is in.
        let closestTile = aqiHeatmap[0];
        let minDistance = Number.MAX_VALUE;

        for (const tile of aqiHeatmap) {
            const distance = Math.sqrt(Math.pow(point.lat - tile.lat, 2) + Math.pow(point.lng - tile.lng, 2));
            if (distance < minDistance) {
                minDistance = distance;
                closestTile = tile;
            }
        }
        
        totalAqi += closestTile.aqi;
        pointsCount++;
    }

    return pointsCount > 0 ? totalAqi / pointsCount : 50;
}


async function fetchAqiHeatmap(start: Point, end: Point): Promise<AQIData[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY;
  if (!apiKey) {
    console.error('Google Air Quality API key is missing.');
    return [];
  }
  
  const lat_min = Math.min(start.lat, end.lat);
  const lat_max = Math.max(start.lat, end.lat);
  const lng_min = Math.min(start.lng, end.lng);
  const lng_max = Math.max(start.lng, end.lng);

  const lat_mid = (lat_min + lat_max) / 2;
  const lng_mid = (lng_min + lng_max) / 2;

  const pointsToQuery = [
      { lat: lat_mid, lng: lng_mid },
      { lat: lat_min, lng: lng_min },
      { lat: lat_max, lng: lng_max },
      { lat: lat_min, lng: lng_max },
      { lat: lat_max, lng_min },
      start,
      end
  ];
  
  const aqiPromises = pointsToQuery.map((point, i) => {
      const currentConditionsUrl = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;
      return fetch(currentConditionsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', },
          body: JSON.stringify({
              location: { latitude: point.lat, longitude: point.lng },
              universalAqi: true,
          }),
      }).then(res => res.json());
  });

  try {
    const results = await Promise.all(aqiPromises);
    const aqiData: AQIData[] = results.map((data, i) => {
        const point = pointsToQuery[i];
        if (data && data.indexes && data.indexes.length > 0) {
            return {
                id: `aqi-${i}-${point.lat}-${point.lng}`,
                lat: point.lat,
                lng: point.lng,
                aqi: data.indexes[0].aqi,
            };
        }
        return null;
    }).filter((d): d is AQIData => d !== null);

    // Remove duplicates based on lat/lng
    const uniqueAqiData = Array.from(new Map(aqiData.map(item => [`${item.lat},${item.lng}`, item])).values());


    return uniqueAqiData;

  } catch (error) {
    console.error('Error fetching AQI data:', error);
    return [];
  }
}

async function fetchRoutes(start: Point, end: Point, travelMode: 'DRIVE' | 'WALK' | 'BICYCLE'): Promise<{routes: Partial<RouteOption>[], error?: string}> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_ROUTES_API_KEY;
    if (!apiKey) {
        const error = "Google Routes API key is missing.";
        console.error(error);
        return { routes: [], error };
    }

    const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
    
    const isTransit = travelMode === 'WALK';
    const apiTravelMode = isTransit ? 'TRANSIT' : travelMode;
    const body: any = {
        origin: { location: { latLng: { latitude: start.lat, longitude: start.lng } } },
        destination: { location: { latLng: { latitude: end.lat, longitude: end.lng } } },
        travelMode: apiTravelMode,
        computeAlternativeRoutes: true,
    };

    if (isTransit) {
        body.transitPreferences = {
            allowedTravelModes: ['RAIL'] // Prioritize LRT/MRT
        }
    } else if (travelMode === 'DRIVE') {
        body.routingPreference = 'TRAFFIC_AWARE';
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.travelAdvisory,routes.legs.steps.travelMode'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            const errorMessage = `Routes API Error: ${errorBody.error?.message || 'Unknown error'}`;
            console.error(errorMessage);
            return { routes: [], error: errorMessage };
        }

        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
            return { routes: [] };
        }

        const routes = data.routes.map((route: any) => {
            const trafficLevel = route.travelAdvisory?.speedReadingIntervals ?
                (route.travelAdvisory.speedReadingIntervals.some((d: any) => d.speed === "SLOW" || d.speed === "TRAFFIC_JAM") ? 'high' :
                (route.travelAdvisory.speedReadingIntervals.some((d: any) => d.speed === "NORMAL") ? 'medium' : 'low'))
                : undefined;
                
            let finalTravelMode = travelMode;
            if (isTransit) {
                // If the primary mode was TRANSIT, we confirm it's a combo route.
                // The actual steps could be WALK or TRANSIT. We'll label the whole route as WALK for our app's purpose.
                finalTravelMode = 'WALK';
            }

            return {
                path: polyline.decode(route.polyline.encodedPolyline).map(([lat, lng]) => ({ lat, lng })),
                distance: route.distanceMeters / 1000,
                duration: Math.round(parseInt(route.duration.slice(0, -1)) / 60),
                traffic: trafficLevel,
                travelMode: finalTravelMode,
            };
        });

        // Also fetch pure walking routes to compare against transit routes
        if (isTransit) {
            const walkingBody = {
                 ...body,
                 travelMode: 'WALK',
                 transitPreferences: undefined
            };
            const walkResponse = await fetch(url, {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                     'X-Goog-Api-Key': apiKey,
                     'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.travelAdvisory'
                 },
                 body: JSON.stringify(walkingBody)
            });
            if(walkResponse.ok) {
                const walkData = await walkResponse.json();
                if (walkData.routes) {
                    const walkingRoutes = walkData.routes.map((route: any) => ({
                        path: polyline.decode(route.polyline.encodedPolyline).map(([lat, lng]) => ({ lat, lng })),
                        distance: route.distanceMeters / 1000,
                        duration: Math.round(parseInt(route.duration.slice(0, -1)) / 60),
                        traffic: undefined,
                        travelMode: 'WALK',
                    }));
                    routes.push(...walkingRoutes);
                }
            }
        }


        return { routes };
    } catch(e) {
        console.error(e);
        return { routes: [], error: "Failed to connect to Routes API."}
    }
}

export async function geocodeAddress(address: string): Promise<Point | null> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is missing.');
      return null;
    }
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'OK' && data.results[0]) {
        return data.results[0].geometry.location;
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
}

// This is a server action that fetches data from Google APIs and runs AI flows.
export async function getRoutesAndAQI(start: Point, end: Point, healthProfile: HealthProfile, travelMode: TravelMode) {
  try {
    const aqiData = await fetchAqiHeatmap(start, end);

    let fetchedRoutes: Partial<RouteOption>[] = [];
    let routesError: string | undefined;

    if (travelMode === 'BICYCLE') {
        const [bikeResult, walkResult] = await Promise.all([
            fetchRoutes(start, end, 'BICYCLE'),
            fetchRoutes(start, end, 'WALK'),
        ]);

        if (bikeResult.error || walkResult.error) {
            return { error: bikeResult.error || walkResult.error };
        }
        
        // Tag walking routes as BICYCLE for consistent scoring within this mode
        const taggedWalkRoutes = (walkResult.routes || []).map(r => ({...r, travelMode: 'BICYCLE' as const}));

        fetchedRoutes = [...(bikeResult.routes || []), ...taggedWalkRoutes];

    } else {
        const result = await fetchRoutes(start, end, travelMode);
        fetchedRoutes = result.routes;
        routesError = result.error;
    }
    
    if (routesError) {
      return { error: routesError };
    }

    if (!fetchedRoutes || fetchedRoutes.length === 0) {
        return { error: 'Could not find any routes. Please try different locations or travel modes.' };
    }

    const processedRoutes = await Promise.all(
      fetchedRoutes.map(async (route, index) => {
        
        const avgAqi = getAvgAqiForRoute(route.path!, aqiData);
        
        // Calculate Health Score and get explanation
        const healthScoreResult = await calculateRouteHealthScore({
          avgAqi: avgAqi,
          routeDistanceKm: route.distance!,
          routeDurationMinutes: route.duration!,
          trafficLevel: route.traffic,
          healthProfile: healthProfile,
          travelMode: route.travelMode!,
        });
        
        return {
          ...route,
          id: `${route.travelMode}-${index + 1}`,
          avgAqi: Math.round(avgAqi),
          healthScore: Math.round(healthScoreResult.healthScore),
          explanation: healthScoreResult.explanation,
        } as RouteOption;
      })
    );

    // Sort routes by health score, descending
    const sortedRoutes = processedRoutes.sort(
      (a, b) => b.healthScore - a.healthScore
    );

    return { routes: sortedRoutes, aqiData };
  } catch (error) {
    console.error('Error processing routes:', error);
    let errorMessage = 'Failed to calculate routes. The AI service may be unavailable.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return {
      error: errorMessage,
    };
  }
}
