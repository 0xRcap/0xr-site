#!/usr/bin/env node
/* Pulls the clips behind site/media/posts.json down from X, and writes the
   manifest the reel reads. Skips anything already on disk — safe to re-run.
   Posts marked quoteOf are partner reposts: their views count, they get no tile. */
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "media";
const BITRATE = 832000;                       // small enough for a grid tile
const token = (id) => ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, "");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const CLIENTS = { Sail: "sail", Fungi: "fungi", "Alle Studios": "alle" };
const folder = (client) => CLIENTS[client] ?? slug(client);

const data = JSON.parse(readFileSync(join(DIR, "posts.json"), "utf8"));
const tiles = data.posts.filter((p) => !p.quoteOf);
// a partner quoting one of our clips is reach we earned — credit it on the tile
const quotes = {};
for (const p of data.posts.filter((q) => q.quoteOf)) {
  (quotes[p.quoteOf] ??= []).push({ account: p.account, views: p.views });
}
for (const list of Object.values(quotes)) list.sort((a, b) => b.views - a.views);

const grab = async (url, dest) => {
  if (existsSync(dest) && statSync(dest).size > 0) return "cached";
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  return "fetched";
};

const manifest = [];
let pulled = 0, cached = 0, failed = 0;

for (const p of tiles) {
  const dir = folder(p.client);
  mkdirSync(join(DIR, dir), { recursive: true });
  const name = `${slug(p.campaign)}-${p.id.slice(-6)}`;
  const mp4 = `${dir}/${name}.mp4`, jpg = `${dir}/${name}.jpg`;
  try {
    const url = `https://cdn.syndication.twimg.com/tweet-result?id=${p.id}&token=${token(p.id)}&lang=en`;
    const j = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).json();
    const md = (j.mediaDetails || []).find((m) => m.video_info);
    if (!md) throw new Error("no video on this post");

    const mp4s = md.video_info.variants
      .filter((v) => v.content_type === "video/mp4")
      .sort((a, b) => a.bitrate - b.bitrate);
    const pick = mp4s.find((v) => v.bitrate === BITRATE) ?? mp4s[Math.floor(mp4s.length / 2)];

    const a = await grab(pick.url, join(DIR, mp4));
    await grab(md.media_url_https, join(DIR, jpg));
    a === "cached" ? cached++ : pulled++;

    manifest.push({
      src: mp4,
      poster: jpg,
      href: `https://x.com/${j.user.screen_name}/status/${p.id}`,
      caption: `${p.client} / ${p.campaign}`,
      client: p.client,
      campaign: p.campaign,
      views: p.views,
      date: j.created_at?.slice(0, 10),
      seconds: Math.round(md.video_info.duration_millis / 1000),
      amplifiedBy: (quotes[p.id] || []).map((q) => q.account),
      viewsWithQuotes: p.views + (quotes[p.id] || []).reduce((s, q) => s + q.views, 0),
    });
    console.log(`  ${a === "cached" ? "·" : "↓"} ${mp4.padEnd(28)} ${String(p.views).padStart(6)} views`);
  } catch (e) {
    failed++;
    console.log(`  ! ${p.id} — ${e.message}`);
  }
}

for (const o of data.offX ?? []) {
  const dir = folder(o.client);
  if (o.asset && existsSync(join(DIR, dir, o.asset))) {
    const stem = o.asset.replace(/\.[^.]+$/, "");
    const poster = [".jpg", ".png"].map((e) => stem + e).find((c) => existsSync(join(DIR, dir, c)));
    manifest.push({
      src: `${dir}/${o.asset}`, poster: poster ? `${dir}/${poster}` : undefined,
      href: o.url, caption: `${o.client} / ${o.campaign}`,
      client: o.client, campaign: o.campaign, views: o.views,
      amplifiedBy: [], viewsWithQuotes: o.views,
    });
    console.log(`  · ${dir}/${o.asset}`.padEnd(32) + `${String(o.views).padStart(6)} views`);
  } else {
    console.log(`  ? ${o.client} — ${o.views.toLocaleString()} views counted, no asset yet (drop one in ${DIR}/${dir}/ and name it in posts.json)`);
  }
}

manifest.sort((a, b) => b.viewsWithQuotes - a.viewsWithQuotes);
writeFileSync(join(DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

const off = (data.offX ?? []).reduce((s, o) => s + (o.views || 0), 0);
const all = data.posts.reduce((s, p) => s + (p.views || 0), 0) + off;
const ours = data.posts.filter((p) => !p.quoteOf).reduce((s, p) => s + (p.views || 0), 0) + off;
// ── case studies: the work on one position, grouped by kind ──
const cases = data.cases ?? {};
const caseOut = {};
for (const [position, groups] of Object.entries(cases)) {
  if (position === "note") continue;
  caseOut[position] = groups.filter((g) => {
    const kept = g.items.filter((i) => existsSync(join(DIR, i.poster)));
    if (!kept.length) console.log(`  ! ${position}: category "${g.cat}" has no assets, dropped`);
    return kept.length;
  }).map((g) => ({
    cat: g.cat, note: g.note,
    items: g.items.filter((i) => {
      const ok = existsSync(join(DIR, i.poster));
      if (!ok) console.log(`  ! ${position}: missing ${i.poster}`);
      return ok;
    }),
    // links out of the case: the account and the site, where the full set lives
    links: (g.links ?? []).filter((l) => l.href && l.label),
  }));
}
writeFileSync(join(DIR, "cases.json"), JSON.stringify(caseOut, null, 2) + "\n");
for (const [p, g] of Object.entries(caseOut)) {
  console.log(`cases ${p}: ${g.map((x) => x.cat + " (" + x.items.length + ")").join(", ")}`);
}

// ── product surfaces, grouped by the position they belong to ──
const productSrc = data.product ?? { items: [] };
const productDir = (p) => (p === "fungi" ? "fungi" : "sail");
writeFileSync(join(DIR, "product.json"), JSON.stringify({
  views: productSrc.items.reduce((s, i) => s + (i.views || 0), 0),
  items: productSrc.items.map((i) => {
    const stem = `${productDir(i.position)}/product-${i.id.slice(-6)}`;
    return {
      position: i.position, label: i.label, href: i.url, views: i.views,
      poster: `${stem}.jpg`,
      src: existsSync(join(DIR, `${stem}.mp4`)) ? `${stem}.mp4` : undefined,
    };
  }),
}, null, 2) + "\n");
console.log(`product: ${productSrc.items.length} surfaces`);

// ── press and live — appearances and streams, outside the films total ──
const press = data.press ?? { items: [], quotes: [], tiles: [] };
const group = {};
for (const it of press.items) group[it.group] = (group[it.group] || 0) + it.views;
for (const q of press.quotes) {
  const parent = press.items.find((i) => i.id === q.quoteOf);
  if (!parent) { console.log(`  ! press quote ${q.id} has no parent item — not counted`); continue; }
  group[parent.group] = (group[parent.group] || 0) + q.views;
}
const pressViews = Object.values(group).reduce((a, b) => a + b, 0);
// a quote from the same account that published the post is that channel's own reach
let pressOwn = press.items.reduce((s, i) => s + i.views, 0);
for (const q of press.quotes) {
  const parent = press.items.find((i) => i.id === q.quoteOf);
  if (parent && q.account === parent.account) pressOwn += q.views;
}
// writings — long-form, carried alongside press but never counted as reach
const writings = (data.writings?.items ?? []).filter((w) => {
  if (!w.href) { console.log(`  ! writing "${w.title}" has no href — dropped`); return false; }
  // a cover that is not on disk would paint a broken tile: drop it, keep the piece
  if (w.cover && !existsSync(join(DIR, w.cover))) {
    console.log(`  ! writing "${w.title}" cover ${w.cover} missing — text only`);
    delete w.cover;
  }
  return true;
});

writeFileSync(join(DIR, "press.json"), JSON.stringify({
  views: pressViews,
  own: pressOwn,
  amplified: pressViews - pressOwn,
  tiles: press.tiles
    .map((t) => ({ ...t, views: group[t.group] || 0 }))
    .sort((a, b) => b.views - a.views),
  writings: writings
    .slice()
    .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? ""))),
}, null, 2) + "\n");
console.log(`press and live: ${pressViews.toLocaleString()} views (${pressOwn.toLocaleString()} own channels + ${(pressViews - pressOwn).toLocaleString()} amplified) across ${press.tiles.length} tiles`);
console.log(`writings: ${writings.length}`);

writeFileSync(join(DIR, "totals.json"), JSON.stringify({
  asOf: data.asOf, since: data.since ?? null, posts: data.posts.length + (data.offX ?? []).length, films: manifest.length,
  views: all, viewsOwn: ours, viewsPartner: all - ours, press: pressViews, topline: data.topline ?? null, brands: data.brands ?? [],
}, null, 2) + "\n");

console.log(`\n${pulled} fetched, ${cached} cached, ${failed} failed → ${manifest.length} films`);
console.log(`${all.toLocaleString()} views (${ours.toLocaleString()} ours + ${(all - ours).toLocaleString()} partner) as of ${data.asOf}`);
