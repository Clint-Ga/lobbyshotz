import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import dayjs from "dayjs";

const config = JSON.parse(fs.readFileSync("sites.json", "utf8"));
const today = dayjs().format("YYYY-MM-DD");
const outRoot = path.join("out", today);

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36";

const clickAny = async (page, selectorsOrTexts = []) => {
  for (const sel of selectorsOrTexts) {
    try {
      if (sel.startsWith("text=")) {
        const el = page.getByText(sel.replace("text=",""), { exact: false });
        if (await el.first().isVisible()) { await el.first().click(); return true; }
      } else if (await page.locator(sel).first().isVisible()) {
        await page.locator(sel).first().click();
        return true;
      }
    } catch {}
  }
  return false;
};

const cookieDismissors = [
  "text=Accept", "text=I agree", "text=Allow all", "text=Got it", "text=OK",
  "text=Accept All", "text=Continue", "text=Yes, I’m over 18",
  "#onetrust-accept-btn-handler", ".css-47sehv", ".cookie-accept", "[data-qa='accept-all']",
  "[aria-label*='accept']", "[id*='accept']"
];

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: config.viewport,
    userAgent: MOBILE_UA,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: "en-GB",
    timezoneId: "Europe/Malta"
  });

  for (const [category, entries] of Object.entries(config.categories)) {
    for (const site of entries) {
      const page = await context.newPage();
      const safeName = site.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const dir = path.join(outRoot, category);
      ensureDir(dir);
      const file = path.join(dir, `${safeName}.png`);
      try {
        page.setDefaultTimeout(config.timeoutMs || 45000);
        await page.goto(site.url, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(()=>{});
        await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}" }).catch(()=>{});
        await clickAny(page, cookieDismissors).catch(()=>{});
        await page.waitForTimeout(config.settleMs || 2500);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: file, fullPage: false });
        console.log(`✅ ${site.name} -> ${file}`);
      } catch (e) {
        console.error(`❌ ${site.name} failed:`, e.message);
        try { fs.writeFileSync(file.replace(".png",".error.txt"), `Failed ${new Date().toISOString()}\n${e.stack ?? e.message}`); } catch {}
      } finally {
        await page.close();
      }
    }
  }
  await browser.close();
};

run();