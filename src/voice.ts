import Anthropic from "@anthropic-ai/sdk";
import type { Soul } from "./soul.js";
import type { Opportunity } from "./heat.js";

/**
 * The voice head — Layer 0's first working part. Soul + opportunity in,
 * in-character drafts out. The soul outranks the brief (SOUL.md law 1):
 * the character may decline an opportunity that conflicts with its TASTE.
 */

export interface VoicedDraft {
  opportunityId: string;
  declined: boolean;
  reason?: string; // when declined
  drafts: string[]; // 2–3 in-voice variants when accepted
}

export function buildSystemPrompt(soul: Soul): string {
  return [
    `You are ${soul.name.toUpperCase()}, a digital character (an "innie") operating the ${soul.brand} account.`,
    `You are openly synthetic, always — never pretend otherwise, never lampshade it either.`,
    ``,
    `Your soul file follows. It is who you are. TASTE outranks everything: if a request`,
    `conflicts with your Never list, you decline it and say why in one sentence.`,
    ``,
    `<soul>`,
    soul.body,
    `</soul>`,
    ``,
    `You write posts for: ${soul.channels.join(", ") || "x-post"}.`,
    `Never explain how the instrument works. Never invent numbers — use only the measured`,
    `facts given to you; if a number isn't provided, don't imply one.`,
  ].join("\n");
}

export function buildOpportunityPrompt(opp: Opportunity): string {
  const window = opp.windowClosesAt
    ? `${Math.max(0, Math.round((opp.windowClosesAt - Date.now()) / 60000))} minutes until this stops being early`
    : "no window countdown available";
  return [
    `An opportunity from the engine. Rewrite it in your own voice.`,
    ``,
    `HEADLINE: ${opp.headline}`,
    `ANGLE: ${opp.angle}`,
    `SUBJECT: ${opp.subject.symbol} (scene: ${opp.scene}, current: ${opp.current})`,
    `WHY NOW: ${opp.whyNow}`,
    opp.basedOn?.length ? `BASED ON:\n${opp.basedOn.map(b => `- ${b}`).join("\n")}` : ``,
    opp.draft ? `ENGINE SEED (rewrite, don't copy): ${opp.draft}` : ``,
    `FLAGGED: ${new Date(opp.createdAt).toISOString()} — this is the timestamp your call carries; use no other date or time`,
    `WINDOW: ${window}`,
    ``,
    `If this conflicts with your TASTE, respond with exactly one line starting "DECLINED: ".`,
    `Otherwise write 3 variants of the post, separated by a line containing only "---".`,
    `Each variant must stand alone, fit the ${opp.format} format, and carry at least one`,
    `of the measured facts above.`,
  ].filter(Boolean).join("\n");
}

export async function voiceOpportunity(
  client: Anthropic,
  soul: Soul,
  opp: Opportunity,
): Promise<VoicedDraft> {
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: buildSystemPrompt(soul),
    messages: [{ role: "user", content: buildOpportunityPrompt(opp) }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map(b => b.text)
    .join("\n")
    .trim();

  if (text.startsWith("DECLINED:")) {
    return { opportunityId: opp.id, declined: true, reason: text.slice("DECLINED:".length).trim(), drafts: [] };
  }
  const drafts = text.split(/\n---\n/).map(d => d.trim()).filter(Boolean);
  return { opportunityId: opp.id, declined: false, drafts };
}
