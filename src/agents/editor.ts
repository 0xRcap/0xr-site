import Anthropic from "@anthropic-ai/sdk";
import type { Soul } from "../soul.js";
import { extractTaste } from "../soul.js";

/**
 * THE EDITOR — model, out of character (AGENTS.md §2). Sees ONLY the soul's
 * TASTE organ and the bare drafts — never the opportunity, never the
 * excitement. Adversarial by charter: it looks for reasons to kill.
 */

export interface Verdict {
  index: number;
  verdict: "pass" | "kill";
  rule: string; // the TASTE rule violated; "" on pass
}

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    verdicts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "integer" },
          verdict: { type: "string", enum: ["pass", "kill"] },
          rule: { type: "string" },
        },
        required: ["index", "verdict", "rule"],
        additionalProperties: false,
      },
    },
  },
  required: ["verdicts"],
  additionalProperties: false,
} as const;

export function buildEditorSystemPrompt(soul: Soul): string {
  return [
    `You are the taste editor for a character called "${soul.name}". You are NOT the`,
    `character. You never see why a draft was written or how exciting the story is —`,
    `you judge only the words against the character's TASTE rules below.`,
    ``,
    `<taste>`,
    extractTaste(soul),
    `</taste>`,
    ``,
    `Your charter is adversarial: look for reasons to kill. A draft passes only if it`,
    `violates no Never rule and honors the Always register. When you kill, name the`,
    `specific rule violated, quoting the offending words. When in doubt, kill — a`,
    `killed good draft costs one post; a passed bad draft costs the character.`,
  ].join("\n");
}

export function buildEditorPrompt(drafts: string[]): string {
  return [
    `Judge each draft independently. Return one verdict per draft, by index.`,
    ``,
    ...drafts.map((d, i) => `<draft index="${i}">\n${d}\n</draft>`),
  ].join("\n");
}

export async function edit(client: Anthropic, soul: Soul, drafts: string[]): Promise<Verdict[]> {
  if (drafts.length === 0) return [];
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    system: buildEditorSystemPrompt(soul),
    output_config: { format: { type: "json_schema", schema: VERDICT_SCHEMA } },
    messages: [{ role: "user", content: buildEditorPrompt(drafts) }],
  });
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map(b => b.text)
    .join("");
  return (JSON.parse(text) as { verdicts: Verdict[] }).verdicts;
}
