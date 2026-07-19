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
  createdAt: number; // when the engine flagged it — the timestamp the call carries
  status: "open" | "produced" | "expired";
}

export const HEAT_API = process.env.HEAT_API ?? "http://localhost:8972";

export async function fetchOpportunities(base = HEAT_API): Promise<Opportunity[]> {
  const res = await fetch(`${base}/api/briefs`);
  if (!res.ok) throw new Error(`heat engine responded ${res.status} — is it running on ${base}?`);
  const data = (await res.json()) as Opportunity[] | { briefs?: Opportunity[] };
  const list = Array.isArray(data) ? data : (data.briefs ?? []);
  return list.filter(o => o.status === "open");
}
