import type { Opportunity } from "../heat.js";
import type { Soul } from "../soul.js";

/**
 * THE SCOUT — pure code, no model (AGENTS.md §2: never spend a model where
 * code suffices). Filters the desk to this innie's scenes and ranks by
 * heat × remaining window. Reads everything, writes nothing.
 */

export function scout(opportunities: Opportunity[], soul: Soul, k: number): Opportunity[] {
  const scenes = soul.scene.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const now = Date.now();

  const scored = opportunities
    .filter(o => scenes.length === 0 || scenes.includes(o.scene.toLowerCase()))
    .map(o => {
      // Window factor: 1 at 12h+ remaining, →0 as it closes; 0.5 when unknown.
      const windowFactor = o.windowClosesAt === null
        ? 0.5
        : Math.max(0, Math.min(1, (o.windowClosesAt - now) / (12 * 3600_000)));
      const heat = o.heat ?? 0.1; // unmeasured heat ranks low, doesn't rank out
      return { o, score: heat * (0.25 + 0.75 * windowFactor) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, k).map(({ o }) => o);
}
