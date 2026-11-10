// Deterministic frame capture of the SOLE/LAB page.
// Time only moves when we call step(): Playwright's fake clock drives Date,
// performance.now, timers and requestAnimationFrame (so GSAP, Lenis and
// ScrollTrigger scrub), and we set CSS animation time by hand.
import { chromium } from 'playwright-core';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'http://solelab.local';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };

export async function open({ width, height, scale = 1 }) {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--hide-scrollbars', '--force-color-profile=srgb'] });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: 'no-preference', hasTouch: false });
  await ctx.route(`${ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());
    let p = decodeURIComponent(url.pathname);
    if (p.endsWith('/')) p += 'index.html';
    try {
      const body = await readFile(path.join(SITE, p));
      await route.fulfill({ status: 200, body, contentType: TYPES[path.extname(p)] || 'application/octet-stream' });
    } catch { await route.fulfill({ status: 404, body: 'nf' }); }
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  // install() alone lets fake time keep flowing with the wall clock; pauseAt() freezes it,
  // so from here on page time moves ONLY through runFor() in step().
  const T0 = Date.parse('2026-11-10T09:00:00Z');
  await page.clock.install({ time: T0 });
  await page.clock.pauseAt(T0 + 1000);
  await page.goto(`${ORIGIN}/?capture=1`, { waitUntil: 'load' });
  // hide the cursor-print layer and the scrollbar for clean frames
  await page.addStyleTag({ content: '.prints{display:none!important} html{scrollbar-width:none}' });
  let t = 0;
  const FPS = 30, DT = 1000 / FPS;
  const api = {
    page, errors,
    get time() { return t; },
    async step(ms = DT) {
      t += ms;
      await page.clock.runFor(ms);
      await page.evaluate((now) => document.getAnimations().forEach((a) => { if (a instanceof CSSAnimation) a.currentTime = now; }), t);
    },
    async wait(ms) { const n = Math.round(ms / DT); for (let i = 0; i < n; i++) await api.step(); },
    async shot(file) { await page.screenshot({ path: file, type: 'jpeg', quality: 92, animations: 'allow', caret: 'hide' }); },
    async close() { await browser.close(); },
  };
  return api;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function ensureDir(d) { await mkdir(d, { recursive: true }); }
export const ease = {
  linear: (x) => x,
  inOut: (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
};
