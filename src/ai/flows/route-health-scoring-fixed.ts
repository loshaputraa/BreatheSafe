
"use server";

import { z } from "genkit";                    // Genkit re-exports Zod's `z`
import decode from "google-polyline";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ------------------------------- Schemas -------------------------------- */

const RouteHealthScoreInputSchema = z.object({
  // Prefer encoded polyline when available, but accept legacy callers
  encodedPolyline: z.string().optional(),
  routeMetadata: z.record(z.any()).optional(),
  // Legacy/alternate fields used by callers in `src/lib/actions.ts`
  avgAqi: z.number().optional(),              // average AQI along the route
  routeDistanceKm: z.number().optional(),     // distance in km
  routeDurationMinutes: z.number().optional(),
  trafficLevel: z.number().optional(),        // optional 0..100 index (if you add traffic)
  healthProfile: z.enum(["default", "sensitive", "children", "elderly"]).optional(),
  travelMode: z.enum(["DRIVE", "WALK", "BICYCLE"]).optional(),
});

const RouteHealthScoreOutputSchema = z.object({
  healthScore: z.number(),                    // 0..100 (higher = safer)
  explanation: z.string(),                    // short AI sentence
});

/* --------------------------- Distance helpers --------------------------- */

function estimateMetersFromPolyline(encoded: string) {
  try {
    const coords = decode(encoded) as Array<[number, number]>; // [lat, lng]
    let meters = 0;
    for (let i = 1; i < coords.length; i++) {
      const [lat1, lon1] = coords[i - 1];
      const [lat2, lon2] = coords[i];
      const R = 6371000; // Earth radius in meters

      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      meters += R * c;
    }
    return meters;
  } catch {
    return 0;
  }
}

function getDistanceKm({
  encodedPolyline,
  routeDistanceKm,
  routeMetadata,
}: {
  encodedPolyline?: string;
  routeDistanceKm?: number;
  routeMetadata?: Record<string, any>;
}) {
  if (encodedPolyline) return Math.round((estimateMetersFromPolyline(encodedPolyline) / 1000) * 100) / 100;
  if (typeof routeDistanceKm === "number") return routeDistanceKm;
  if (routeMetadata && typeof routeMetadata.distanceMeters === "number")
    return Math.round((routeMetadata.distanceMeters / 1000) * 100) / 100;
  return 0;
}

/* ----------------------------- Scoring logic ---------------------------- */

function scoreRoute({
  avgAqi,
  distanceKm,
  profile,
  trafficIndex,
}: {
  avgAqi: number;
  distanceKm: number;
  profile: "default" | "sensitive" | "children" | "elderly";
  trafficIndex?: number; // 0..100 (optional)
}) {
  const wAqi =
    profile === "sensitive" ? 0.6 :
    profile === "children"  ? 0.55 :
    profile === "elderly"   ? 0.55 : 0.5;

  const wDist = 0.3;
  const wTraffic = 0.2;

  const distPenalty     = Math.min(distanceKm / 20, 1) * 100;      // 0..100 for >=20km
  const aqiPenalty      = Math.min(avgAqi / 300, 1) * 100;         // 0..100 for AQI >=300
  const trafficPenalty  = Math.min((trafficIndex ?? 0) / 100, 1) * 100;

  const total = wAqi * aqiPenalty + wDist * distPenalty + wTraffic * trafficPenalty;
  const score = Math.max(0, Math.min(100, 100 - total));
  return Math.round(score);
}

/* ---------------------------- AI explanation ---------------------------- */

async function getAiExplanation({
  distanceKm,
  avgAqi,
  profile,
}: {
  distanceKm: number;
  avgAqi: number;
  profile: "default" | "sensitive" | "children" | "elderly";
}) {
  const fallback = `Balanced ${distanceKm} km and AQI ${avgAqi}; recommended for ${profile}.`;

  try {
    const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) return fallback;

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt =
      `In ≤20 words, explain why a route with distance ${distanceKm} km and AQI ${avgAqi} suits the "${profile}" profile.`;

    const resp = await model.generateContent(prompt);
    const text = resp.response.text()?.trim();
    return text || fallback;
  } catch (err) {
    console.error("[AI explanation error]", err);
    return fallback;
  }
}

/* ------------------------------ Main flow ------------------------------- */

export async function calculateRouteHealthScoreFlow(
  input: z.infer<typeof RouteHealthScoreInputSchema>
) {
  const parsed = RouteHealthScoreInputSchema.parse(input);

  // Gather inputs with sensible defaults
  const distanceKm     = getDistanceKm(parsed);
  const avgAqi         = parsed.avgAqi ?? 50; // neutral if not provided
  const profile        = parsed.healthProfile ?? "default";
  const trafficIndex   = typeof parsed.trafficLevel === "number" ? parsed.trafficLevel : undefined;

  // Compute score
  const healthScore = scoreRoute({ avgAqi, distanceKm, profile, trafficIndex });

  // Ask Gemini for a short explanation (server-side)
  const explanation = await getAiExplanation({ distanceKm, avgAqi, profile });

  // Validate output & return
  return RouteHealthScoreOutputSchema.parse({ healthScore, explanation });
}

export type RouteHealthScoreInput  = z.infer<typeof RouteHealthScoreInputSchema>;
export type RouteHealthScoreOutput = z.infer<typeof RouteHealthScoreOutputSchema>;

// Keep legacy name used elsewhere
export { calculateRouteHealthScoreFlow as calculateRouteHealthScore };
