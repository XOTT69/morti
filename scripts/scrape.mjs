import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const SOURCE = 'https://mortisgames.github.io/badklive/';
const OUT = new URL('../public/data/snapshot.json', import.meta.url);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });

try {
  await page.goto(SOURCE, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(4000);

  const data = await page.evaluate(() => {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const rowsFrom = (table) => [...table.querySelectorAll('tr')].map(tr =>
      [...tr.querySelectorAll('th,td')].map(td => clean(td.innerText))
    ).filter(r => r.some(Boolean));

    const sections = [];
    const headings = [...document.querySelectorAll('h1,h2,h3')];
    for (const h of headings) {
      const title = clean(h.innerText);
      if (!title) continue;
      const items = [];
      let el = h.nextElementSibling;
      while (el && !/^H[1-3]$/.test(el.tagName)) {
        const text = clean(el.innerText);
        if (text) items.push(text);
        el = el.nextElementSibling;
      }
      sections.push({ title, text: items.slice(0, 8).join('\n') });
    }

    const tables = [...document.querySelectorAll('table')].map((t, i) => ({
      index: i,
      rows: rowsFrom(t)
    })).filter(t => t.rows.length);

    const cityCards = [...document.querySelectorAll('button, article, [role="button"], .card')]
      .map(el => clean(el.innerText))
      .filter(t => t && t.length < 500)
      .slice(0, 100);

    return {
      title: document.title,
      capturedAt: new Date().toISOString(),
      bodyText: clean(document.body.innerText).slice(0, 25000),
      sections,
      tables,
      cityCards
    };
  });

  const out = {
    source: SOURCE,
    fetched_at: new Date().toISOString(),
    ...data
  };
  await fs.mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Saved ${OUT.pathname}`);
} finally {
  await browser.close();
}
