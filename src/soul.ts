import { readFileSync } from "node:fs";

/**
 * A soul file is the single source of truth for who an innie is (SOUL.md).
 * The voice head reads it verbatim and never edits it — law 3 of the soul file.
 */

export interface Soul {
  name: string;
  brand: string;
  scene: string;
  channels: string[];
  disclosure: string;
  version: number;
  body: string; // the four organs, passed to the model whole
}

export function loadSoul(path: string): Soul {
  const raw = readFileSync(path, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${path}: missing frontmatter — not a soul file`);
  const [, front, body] = match;

  const fields: Record<string, string> = {};
  for (const line of front.split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*?)\s*(?:#.*)?$/);
    if (kv) fields[kv[1]] = kv[2].replace(/^"|"$/g, "");
  }

  for (const required of ["name", "brand", "disclosure"]) {
    if (!fields[required]) throw new Error(`${path}: soul frontmatter missing "${required}"`);
  }
  if (!/synthetic/.test(fields.disclosure)) {
    throw new Error(`${path}: disclosure must declare the innie synthetic (SOUL.md law 4)`);
  }
  for (const organ of ["## CANON", "## TASTE", "## MEMORY", "## RECEIPTS"]) {
    if (!body.includes(organ)) throw new Error(`${path}: soul is missing organ "${organ}"`);
  }

  return {
    name: fields.name,
    brand: fields.brand,
    scene: fields.scene ?? "",
    channels: (fields.channels ?? "").replace(/[[\]]/g, "").split(",").map(s => s.trim()).filter(Boolean),
    disclosure: fields.disclosure,
    version: Number(fields.version ?? 1),
    body: body.trim(),
  };
}
