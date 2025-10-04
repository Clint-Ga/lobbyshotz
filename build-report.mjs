import fs from "node:fs";
import path from "node:path";
import dayjs from "dayjs";

const today = dayjs().format("YYYY-MM-DD");
const dir = path.join("out", today);
const reportPath = path.join(dir, "report.json");
if (!fs.existsSync(reportPath)) {
  const empty = { date: today, comparisons: [] };
  fs.writeFileSync(reportPath, JSON.stringify(empty, null, 2));
}
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

const card = (category, name) => {
  const img = `${category}/${name}.png`;
  const diff = `diffs/${category}-${name}.png`;
  return `
    <section class="card">
      <h3>${category} · ${name}</h3>
      <div class="row">
        <figure><img src="${img}" alt="${name} snapshot"/><figcaption>Today</figcaption></figure>
        <figure><img src="${diff}" alt="${name} diff"/><figcaption>Change map</figcaption></figure>
      </div>
    </section>`;
};

const body = report.comparisons.length
  ? report.comparisons.map(c => card(c.category, c.name)).join("\n")
  : `<p>No screenshots were generated for ${today}. Check the Actions logs.</p>`;

const notes = report.comparisons.length
  ? report.comparisons.map(c =>
      `<li><strong>${c.category} · ${c.name}</strong> — ${c.note}${c.changedRatio!=null?` (${(c.changedRatio*100).toFixed(1)}% pixels)`:""}</li>`
    ).join("")
  : "";

const html = `<!doctype html>
<meta charset="utf-8" />
<title>LobbyShotz ${today}</title>
<style>
  body{font:14px/1.5 system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:24px;max-width:1100px}
  h1{margin-bottom:6px}
  .meta{color:#555;margin-bottom:18px}
  .card{border:1px solid #eee;border-radius:12px;padding:12px;margin:12px 0;box-shadow:0 1px 2px rgba(0,0,0,.04)}
  .row{display:flex;gap:10px;flex-wrap:wrap}
  figure{margin:0}
  img{height:400px;border:1px solid #ddd;border-radius:8px}
</style>
<h1>LobbyShotz — ${today}</h1>
<p class="meta">Viewport 360×800 • Timezone: Europe/Malta</p>
${report.comparisons.length ? "<h2>Change summary</h2><ul>"+notes+"</ul>" : ""}
${body}
`;
fs.writeFileSync(path.join(dir, "index.html"), html);
console.log("Built index.html");
