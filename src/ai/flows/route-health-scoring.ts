"use server";

"use server";

// Re-export the fixed implementation. The previous file had been corrupted
// with leftover diff markers and has been replaced by `route-health-scoring-fixed.ts`.
export { calculateRouteHealthScoreFlow as calculateRouteHealthScore } from './route-health-scoring-fixed';
