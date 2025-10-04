import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import dayjs from "dayjs";

const today = dayjs().format("YYYY-MM-DD");
const previous = dayjs().subtract(7, "day").format("YYYY-MM-DD");

const root = "out";
const todayDir = path.join(root, today);
const prevDir = path.join(root, previous);
const diffsDir = path.join(todayDir, "diffs");

const report = { date: today, comparisons: [] };

if (!fs.existsSync(todayDir)) {
  fs.mkdirSync(todayDir, { recursive: true });
  fs.writeFileSync(path.join(todayDir, "report.json"), JSON.stringify(report, null, 2));
  console.warn(`No screenshots found at ${todayDir}; created empty report.`);
  process.exit(0);
}

fs.mkdirSync(diffsDir, { recursive: true });

const listPngs = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true })
    .flatMap(d => d.isDirectory()
      ? fs.readdirSync(path.join(dir,d.name)).filter(f=>f.endsWith(".png")).map(f => [d.name, f])
      : []);

const loadPng = (p) => PNG.sync.read(fs.readFileSync(p));
const writePng = (p, png) => fs.writeFileSync(p, PNG.sync.write(png));

for (const [category, file] of listPngs(todayDir)) {
  const name = file.replace(".png","");
  const todayP = path.join(todayDir, category, file);
  const prevP = path.join(prevDir, category, file);
  if (!fs.existsSync(prevP)) {
    report.comparisons.push({ category, name, status: "new", changedRatio: null, note: "No prior capture to compare." });
    continue;
  }
  try {
    const a = loadPng(prevP);
    const b = loadPng(todayP);
    const { width, height } = b;
    const diff = new PNG({ width, height });
    const changed = pixelmatch(a.data, b.data, diff.data, width, height, { threshold: 0.1 });
    const total = width * height;
    const ratio = +(changed / total).toFixed(4);
    writePng(path.join(diffsDir, `${category}-${name}.png`), diff);
    let note = "Minor/no visual change.";
    if (ratio >= 0.15) note = "Significant layout/skin change.";
    else if (ratio >= 0.03) note = "Noticeable banner/tile changes.";
    report.comparisons.push({ category, name, status: "compared", changedRatio: ratio, note });
  } catch (e) {
    report.comparisons.push({ category, name, status: "error", changedRatio: null, note: `Diff error: ${e.message}` });
  }
}

fs.writeFileSync(path.join(todayDir, "report.json"), JSON.stringify(report, null, 2));
console.log("Wrote report.json");
