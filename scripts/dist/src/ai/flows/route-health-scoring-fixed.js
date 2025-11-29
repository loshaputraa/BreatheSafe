"use server";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRouteHealthScoreFlow = calculateRouteHealthScoreFlow;
exports.calculateRouteHealthScore = calculateRouteHealthScoreFlow;
const genkit_1 = require("genkit");
const google_polyline_1 = __importDefault(require("google-polyline"));
const generative_ai_1 = require("@google/generative-ai");
const RouteHealthScoreInputSchema = genkit_1.z.object({
    encodedPolyline: genkit_1.z.string(),
    routeMetadata: genkit_1.z.record(genkit_1.z.any()).optional(),
});
const RouteHealthScoreOutputSchema = genkit_1.z.object({
    healthScore: genkit_1.z.number(),
    explanation: genkit_1.z.string(),
});
function estimateMetersFromPolyline(encoded) {
    try {
        const coords = google_polyline_1.default.decode(encoded);
        let meters = 0;
        for (let i = 1; i < coords.length; i++) {
            const [lon1, lat1] = coords[i - 1];
            const [lon2, lat2] = coords[i];
            const R = 6371000;
            const φ1 = (lat1 * Math.PI) / 180;
            const φ2 = (lat2 * Math.PI) / 180;
            const Δφ = ((lat2 - lat1) * Math.PI) / 180;
            const Δλ = ((lon2 - lon1) * Math.PI) / 180;
            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            meters += R * c;
        }
        return meters;
    }
    catch (e) {
        return 0;
    }
}
async function callGenerativeAIWithTimeout(apiKey, prompt, timeoutMs = 4000) {
    const client = new generative_ai_1.GoogleGenerativeAI({ apiKey });
    const call = client.responses.create({ model: "models/gpt-4o-mini", input: prompt });
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("AI timeout")), timeoutMs));
    return Promise.race([call, timeout]);
}
function safeExtractJson(text) {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first === -1 || last === -1 || last <= first)
        return null;
    const candidate = text.slice(first, last + 1);
    try {
        return JSON.parse(candidate);
    }
    catch (e) {
        const fixed = candidate.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
        try {
            return JSON.parse(fixed);
        }
        catch {
            return null;
        }
    }
}
async function calculateRouteHealthScoreFlow(input) {
    const { encodedPolyline, routeMetadata } = RouteHealthScoreInputSchema.parse(input);
    const meters = estimateMetersFromPolyline(encodedPolyline);
    const fallback = () => {
        const max = 2000;
        const raw = Math.max(0, Math.min(max, meters));
        const score = Math.round((1 - raw / max) * 100);
        return { healthScore: score, explanation: `Approx. ${Math.round(meters)} m; conservative assumptions.` };
    };
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey)
        return RouteHealthScoreOutputSchema.parse(fallback());
    const meta = routeMetadata ? `\nMetadata:\n${JSON.stringify(routeMetadata)}\n` : "";
    const prompt = `RouteLengthMeters:${Math.round(meters)}${meta}`;
    try {
        const resp = await callGenerativeAIWithTimeout(apiKey, prompt, 4000);
        let text = "";
        try {
            text = resp?.output?.[0]?.content ?? resp?.candidates?.[0]?.content ?? (typeof resp === 'string' ? resp : JSON.stringify(resp));
        }
        catch {
            text = JSON.stringify(resp);
        }
        const extracted = safeExtractJson(text);
        if (extracted && typeof extracted.healthScore === 'number' && typeof extracted.explanation === 'string') {
            const s = Math.max(0, Math.min(100, Math.round(extracted.healthScore)));
            return RouteHealthScoreOutputSchema.parse({ healthScore: s, explanation: extracted.explanation });
        }
        const match = text.match(/healthScore\D*(\d{1,3})/i);
        if (match)
            return RouteHealthScoreOutputSchema.parse({ healthScore: Math.max(0, Math.min(100, Number(match[1]))), explanation: text.slice(0, 300) });
        return RouteHealthScoreOutputSchema.parse(fallback());
    }
    catch (e) {
        return RouteHealthScoreOutputSchema.parse(fallback());
    }
}
