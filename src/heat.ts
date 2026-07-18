/**
 * Layer 1 client — reads opportunities from the HEAT engine (:8972/api/briefs).
 * innie consumes the engine's output; it never reaches into the machine.
 */

export interface Opportunity {
  id: string;
  headline: string;
  angle: string;
  whyNow: string;
  draft?: string; // the engine's paste-ready seed — the soul rewrites it
  basedOn?: string[]; // 2–4 measured reasons
  format: string;
  scene: string;
  current: string;
  subject: { assetId: string | null; symbol: string };
  heat: number | null;
  windowClosesAt: number | null;
  references: { title: string; url: string }[];
  status: "open" | "produced" | "expired";
}

export async function fetchOpportunities(base = "http://localhost:8972"): Promise<Opportunity[]> {
  const res = await fetch(`${base}/api/briefs`);
  if (!res.ok) throw new Error(`heat engine responded ${res.status} — is it running on ${base}?`);
  const data = (await res.json()) as Opportunity[] | { briefs?: Opportunity[] };
  const list = Array.isArray(data) ? data : (data.briefs ?? []);
  return list.filter(o => o.status === "open");
}
