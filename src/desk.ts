import Anthropic from "@anthropic-ai/sdk";
import { loadSoul } from "./soul.js";
import { runDesk } from "./pipeline.js";

/**
 * The desk — full pipeline run for one innie.
 *
 *   npm run desk -- souls/house.soul.md [--limit N]
 *   HEAT_API=http://localhost:8975 npm run desk -- souls/house.soul.md
 */

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const soulPath = process.argv[2];
if (!soulPath || soulPath.startsWith("--")) {
  console.error('usage: npm run desk -- <soul-file> [--limit N]');
  process.exit(1);
}

const soul = loadSoul(soulPath);
console.log(`◆ desk run — ${soul.name.toUpperCase()} v${soul.version}`);

const client = new Anthropic();
const result = await runDesk(client, soul, { limit: Number(arg("--limit") ?? 3) });

console.log(`\n${result.candidates} candidate(s) · ${result.killed} killed · ${result.declined} declined`);
console.log(`ledger: ${result.ledgerPath}`);
