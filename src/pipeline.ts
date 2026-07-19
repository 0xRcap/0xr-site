import Anthropic from "@anthropic-ai/sdk";
import type { Soul } from "./soul.js";
import { fetchOpportunities } from "./heat.js";
import { scout } from "./agents/scout.js";
import { voiceOpportunity } from "./voice.js";
import { edit } from "./agents/editor.js";
import { archive, type LedgerEntry } from "./agents/archivist.js";

/**
 * The desk pipeline — deterministic orchestration, model only inside roles
 * (AGENTS.md §1: pipeline, not committee).
 *
 *   scout → voice → editor → archivist
 *
 * A role that errors drops its item; the pipeline continues (AGENTS.md §5).
 */

/** The measured facts a draft may carry — everything else is invented data. */
export function permittedFacts(opp: {
  whyNow: string; basedOn?: string[]; heat: number | null; createdAt: number;
  subject: { symbol: string }; scene: string; current: string;
}): string[] {
  return [
    `subject: ${opp.subject.symbol} (scene: ${opp.scene}, current: ${opp.current})`,
    opp.whyNow,
    ...(opp.basedOn ?? []),
    ...(opp.heat !== null ? [`heat ${opp.heat}/100`] : []),
    `flagged ${new Date(opp.createdAt).toISOString()}`,
  ];
}

export interface DeskResult {
  ledgerPath: string;
  candidates: number;
  killed: number;
  declined: number;
}

export async function runDesk(
  client: Anthropic,
  soul: Soul,
  opts: { limit?: number; heatBase?: string } = {},
): Promise<DeskResult> {
  const desk = await fetchOpportunities(opts.heatBase);
  const picked = scout(desk, soul, opts.limit ?? 3);

  const entries: LedgerEntry[] = [];
  for (const opp of picked) {
    try {
      const voiced = await voiceOpportunity(client, soul, opp);
      if (voiced.declined) {
        entries.push({
          t: Date.now(), soul: soul.name, soulVersion: soul.version,
          opportunityId: opp.id, headline: opp.headline,
          outcome: "declined", reason: voiced.reason,
        });
        continue;
      }
      const verdicts = await edit(client, soul, voiced.drafts, permittedFacts(opp));
      for (const v of verdicts) {
        entries.push({
          t: Date.now(), soul: soul.name, soulVersion: soul.version,
          opportunityId: opp.id, headline: opp.headline,
          outcome: v.verdict === "pass" ? "candidate" : "killed",
          draft: voiced.drafts[v.index],
          ...(v.verdict === "kill" ? { rule: v.rule } : {}),
        });
      }
    } catch (err) {
      console.error(`✕ ${opp.id} dropped: ${err instanceof Error ? err.message : err}`);
    }
  }

  const ledgerPath = archive(entries);
  return {
    ledgerPath,
    candidates: entries.filter(e => e.outcome === "candidate").length,
    killed: entries.filter(e => e.outcome === "killed").length,
    declined: entries.filter(e => e.outcome === "declined").length,
  };
}
