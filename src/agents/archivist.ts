import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * THE ARCHIVIST — pure code, the ONLY writer (AGENTS.md §3). Appends every
 * draft, verdict, kill, and decline to the day's ledger file. Append-only;
 * nothing here can edit or delete.
 */

export interface LedgerEntry {
  t: number; // when ledgered
  soul: string;
  soulVersion: number;
  opportunityId: string;
  headline: string;
  outcome: "candidate" | "killed" | "declined";
  draft?: string; // the text (candidates and kills)
  rule?: string; // the TASTE rule violated (kills)
  reason?: string; // the voice's reason (declines)
  revised?: boolean; // survived (or died in) the one revision round
}

export function archive(entries: LedgerEntry[], dir = "ledger"): string {
  mkdirSync(dir, { recursive: true });
  const day = new Date().toISOString().slice(0, 10);
  const path = join(dir, `${day}.jsonl`);
  for (const entry of entries) {
    appendFileSync(path, JSON.stringify(entry) + "\n");
  }
  return path;
}
