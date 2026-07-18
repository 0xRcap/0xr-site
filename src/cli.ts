import Anthropic from "@anthropic-ai/sdk";
import { loadSoul } from "./soul.js";
import { fetchOpportunities, type Opportunity } from "./heat.js";
import { buildSystemPrompt, buildOpportunityPrompt, voiceOpportunity } from "./voice.js";

/**
 * innie voice head v0.
 *
 *   npm run voice -- souls/house.soul.md              # voice open HEAT opportunities
 *   npm run voice -- souls/house.soul.md --limit 2
 *   npm run voice -- souls/house.soul.md --dry-run    # print prompts, no API call
 *   npm run voice -- souls/house.soul.md --idea "..." # voice a manual idea, engine not needed
 */

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const soulPath = process.argv[2];
if (!soulPath || soulPath.startsWith("--")) {
  console.error("usage: npm run voice -- <soul-file> [--limit N] [--dry-run] [--idea \"...\"]");
  process.exit(1);
}

const soul = loadSoul(soulPath);
const dryRun = process.argv.includes("--dry-run");
const limit = Number(arg("--limit") ?? 3);
const idea = arg("--idea");

console.log(`◆ ${soul.name.toUpperCase()} — soul v${soul.version}, brand: ${soul.brand}, channels: ${soul.channels.join(", ")}`);

let opportunities: Opportunity[];
if (idea) {
  opportunities = [{
    id: "manual",
    headline: idea,
    angle: idea,
    whyNow: "manual idea — no engine measurement attached",
    format: "x-post",
    scene: soul.scene,
    current: "manual",
    subject: { assetId: null, symbol: "—" },
    heat: null,
    windowClosesAt: null,
    references: [],
    status: "open",
  }];
} else {
  opportunities = (await fetchOpportunities()).slice(0, limit);
  if (opportunities.length === 0) {
    console.log("No open opportunities on the desk. The rail is quiet.");
    process.exit(0);
  }
}

if (dryRun) {
  console.log("\n─── SYSTEM PROMPT ───\n");
  console.log(buildSystemPrompt(soul));
  for (const opp of opportunities) {
    console.log(`\n─── OPPORTUNITY ${opp.id} ───\n`);
    console.log(buildOpportunityPrompt(opp));
  }
  process.exit(0);
}

const client = new Anthropic();
for (const opp of opportunities) {
  console.log(`\n━━ ${opp.headline} ━━`);
  const voiced = await voiceOpportunity(client, soul, opp);
  if (voiced.declined) {
    console.log(`✕ declined: ${voiced.reason}`);
    continue;
  }
  voiced.drafts.forEach((d, i) => console.log(`\n[${i + 1}]\n${d}`));
}
