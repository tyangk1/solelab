// Capture the SOLE/LAB promo plates, one JPEG sequence per scene, frame-exact to the music grid.
// usage: node capture.mjs reels|youtube [sceneName]
// 150 BPM -> 1 bar = 48 frames @30 fps. Scene lengths are in bars and include no handles:
// the EffectCraft edit butts them together and builds transitions over the cut frames.
import { open, ensureDir, ease } from './lib.mjs';
import { writeFile } from 'node:fs/promises';

const VERSION = process.argv[2] || 'reels';
const ONLY = process.argv[3];
import { readFileSync } from 'node:fs';
const TL = JSON.parse(readFileSync(new URL(`./timeline-${process.argv[2] || 'reels'}.json`, import.meta.url)));
const BAR = TL.frames_per_bar; // frames per bar at 30 fps (music grid)
const S = BAR / 48;              // internal frame offsets were authored for 48 frames/bar
const sc = (x) => Math.round(x * S);
// scene length in frames: cumulative rounding keeps every cut on the bar line
const len = (name) => { const s = TL.scenes.find((x) => x[0] === name); return Math.round(s[2] * BAR) - Math.round(s[1] * BAR); };
const CFG = {
  reels: { width: 540, height: 960, scale: 2 },
  youtube: { width: 1920, height: 1080, scale: 1 },
}[VERSION];

// ---------- overlay (kinetic type, drawn in the page with the site's own fonts) ----------
const OVERLAY_CSS = `
#cap{position:fixed;inset:0;z-index:999;pointer-events:none;font-family:Anton,Impact,sans-serif;color:#efebe4}
#cap .t{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);white-space:nowrap;text-transform:uppercase;line-height:.86;text-align:center}
#cap .pill{position:absolute;left:50%;transform:translateX(-50%);background:#d7ff2f;color:#0d0d10;padding:.28em .7em .2em;border-radius:999px;font-size:var(--pill);letter-spacing:.02em;text-transform:uppercase;white-space:nowrap}
#cap .sub{font-family:'JetBrains Mono',monospace;letter-spacing:.18em;font-size:var(--sub);text-transform:uppercase;color:#efebe4;opacity:.85}
#cap .black{position:absolute;inset:0;background:#0d0d10}
`;
async function overlay(v, html) {
  await v.page.evaluate(([html, css]) => {
    let el = document.getElementById('cap');
    if (!el) {
      const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      el = document.createElement('div'); el.id = 'cap'; document.body.appendChild(el);
    }
    el.innerHTML = html;
  }, [html, OVERLAY_CSS]);
}
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const k = (f, a, b) => clamp((f - a) / (b - a)); // 0..1 between frames a and b
const SZ = VERSION === 'reels' ? { big: 150, mid: 64, pill: 30, sub: 16 } : { big: 220, mid: 80, pill: 30, sub: 16 };
const pill = (text, f, a, b, top) => {
  const op = Math.min(k(f, a, a + 5), 1 - k(f, b - 5, b));
  if (op <= 0) return '';
  const s = 0.85 + 0.15 * ease.out(k(f, a, a + 7));
  return `<div class="pill" style="--pill:${SZ.pill}px;top:${top}%;opacity:${op};transform:translateX(-50%) scale(${s})">${text}</div>`;
};

// ---------- page helpers ----------
const st = (v, sel) => v.page.evaluate((s) => { const all = window.__soleST(s); return all; }, sel);
async function exposeST(v) {
  await v.page.evaluate(async () => {
    const { ScrollTrigger } = await import('/vendor/gsap/ScrollTrigger.js');
    window.__soleST = (sel) => {
      const all = ScrollTrigger.getAll().filter((s) => s.trigger && s.trigger.matches(sel));
      const s = all.find((x) => x.pin) || all[0];
      return { start: s.start, end: s.end };
    };
  });
}
const scrollTo = (v, y) => v.page.evaluate((y) => window.__sole.y(y), y);
const heroTime = (v, t) => v.page.evaluate((t) => {
  const h = window.__sole.hero; h.tl.time(t);
  const N = 3, per = 3.2 + .5 + 1.4;
  const d = Math.min(N - 1, Math.floor((t + .7) / per));
  document.getElementById('dropNum').textContent = String(d + 1).padStart(2, '0');
  document.getElementById('dropBar').style.transform = `scaleX(${t / h.tl.duration()})`;
}, t);

async function scene(v, name, frames, fn) {
  if (ONLY && ONLY !== name) { return; }
  const dir = `frames/${VERSION}/${name}`;
  await ensureDir(dir);
  for (let f = 0; f < frames; f++) {
    const r = await fn(f, frames);
    if (r !== 'hold') await v.step(); // 'hold': page time stands still (overlay-only frames)
    await v.shot(`${dir}/${String(f).padStart(4, '0')}.jpg`);
  }
  console.log(name, frames, 'frames', `${(v.time / 1000).toFixed(1)}s page time`);
}

// piecewise-linear mapping helper: [[frame, value], ...] with easing between keys
function keys(list, f, e = ease.inOut) {
  if (f <= list[0][0]) return list[0][1];
  for (let i = 0; i < list.length - 1; i++) {
    const [f0, v0] = list[i], [f1, v1] = list[i + 1];
    if (f <= f1) return v0 + (v1 - v0) * e((f - f0) / (f1 - f0));
  }
  return list[list.length - 1][1];
}

// ---------- shot list ----------
const v = await open(CFG);
await v.page.waitForFunction(() => [...document.querySelectorAll('.loader img')].every((i) => i.complete), null, { timeout: 30000, polling: 100 });
await exposeST(v);
const R = VERSION === 'reels';
// frame each section as a full screen for the video (no neighbour sections peeking in)
await v.page.addStyleTag({ content: `
  #paint, .finale { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
  .paint__inner { width: 100%; }
  .finale { align-items: center; } .finale > .belt { align-self: stretch; }
` });
await v.page.evaluate(async () => { const { ScrollTrigger } = await import('/vendor/gsap/ScrollTrigger.js'); ScrollTrigger.refresh(); });

// S1 — hook: black + "NEW DROP" slam, then the shoebox opens and the shoe flies into the hero.
// The loader plays on its own clock; we hold it on black for the slam first.
{
  const n = len('s1');
  // keep the loader paused until the slam is done: the loader starts .25 s after images are ready,
  // which already happened on the real clock; fake time has not advanced yet.
  const slamEnd = sc(R ? 30 : 80);
  await scene(v, 's1', n, async (f) => {
    let html = '';
    if (f < slamEnd + 8) {
      const a = ease.out(k(f, 0, 7));
      const op = 1 - k(f, slamEnd, slamEnd + 8);
      const title = R ? 'NEW<br>DROP' : 'SOLE/LAB<br><span style="font-size:.42em;letter-spacing:.06em">presents</span>';
      html = `<div class="black" style="opacity:${op}"></div>
        <div class="t" style="font-size:${SZ.big}px;opacity:${op};transform:translate(-50%,-50%) scale(${1.5 - .5 * a})">${title}</div>`;
      if (!R && f > 30) html += `<div class="t" style="top:72%;opacity:${op * k(f, 30, 40)}"><span class="sub" style="--sub:22px">Three drops · one lab</span></div>`;
    }
    await overlay(v, html);
    // page time stands still under the slam, so the loader only starts once it lifts
    if (f < slamEnd - 6) return 'hold';
  });
}
await overlay(v, '');
await v.page.waitForFunction(() => !document.getElementById('loader'), null, { timeout: 500, polling: 100 }).catch(() => {});
// make sure the loader is gone before the hero scene
for (let i = 0; i < 120 && await v.page.evaluate(() => !!document.getElementById('loader')); i++) await v.step();

// S2 — hero: three drops, swaps land on the whoosh cues.
{
  const n = len('s2');
  // tl units: drop d spin ends at d*5.1+3.7, swap lasts 1.4
  const map = [[0, 0], [sc(84), 3.7], [sc(108), 5.1], [sc(180), 8.8], [sc(204), 10.2], [n - 1, 14.1]];
  await scene(v, 's2', n, async (f) => {
    await heroTime(v, keys(map, f, ease.linear));
  });
}

// S3 — the lab: exploded view, assembled -> apart.
{
  const s = await st(v, '.lab');
  const n = len('s3');
  await scene(v, 's3', n, async (f) => {
    await scrollTo(v, s.start + (s.end - s.start) * keys([[0, .02], [n - 14, .92], [n, .95]], f));
  });
}

// S4 — Lab Runner 360°: one full turn + overlay label.
{
  const s = await st(v, '.runner');
  const n = len('s4');
  await scene(v, 's4', n, async (f) => {
    await scrollTo(v, s.start + (s.end - s.start) * keys([[0, 0], [n, 1]], f, ease.inOut));
    await overlay(v, pill('360° · real 3D', f, 4, n - 2, R ? 16 : 10));
  });
}

// S5 — colorways: two paint wipes on the beat.
{
  const n = len('s5');
  let clicked = 0;
  await scene(v, 's5', n, async (f) => {
    if (f === 0) {
      await v.page.evaluate(() => window.__sole.y(document.getElementById('paint').getBoundingClientRect().top + scrollY));
    }
    const hits = R ? [4, Math.round(BAR)] : [sc(8), sc(60)]; // reels: 2nd wipe on the drop (bar 13)
    if (f === hits[0] && clicked === 0) { clicked++; await v.page.click('.swatch[data-cw="1"]'); }
    if (f === hits[1] && clicked === 1) { clicked++; await v.page.click('.swatch[data-cw="2"]'); }
    await overlay(v, pill('3 colorways', f, 2, n - 2, R ? 16 : 10));
  });
}

if (!R) {
  // YouTube only: materials run, after-dark flashlight, versus drag, street.
  {
    const s = await st(v, '.mats');
    const n = len('s6m');
    await scene(v, 's6m', n, async (f) => { await scrollTo(v, s.start + (s.end - s.start) * keys([[0, .05], [n, .85]], f, ease.linear)); });
  }
  {
    const n = len('s7d');
    await scene(v, 's7d', n, async (f) => {
      if (f === 0) await v.page.evaluate(() => window.__sole.y(document.getElementById('dark').getBoundingClientRect().top + scrollY));
      const box = await v.page.evaluate(() => { const r = document.getElementById('dark').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
      const x = box.x + box.w * keys([[0, .72], [sc(40), .8], [sc(70), .64], [n, .7]], f);
      const y = box.y + box.h * keys([[0, .45], [sc(40), .52], [sc(70), .42], [n, .5]], f);
      await v.page.mouse.move(x, y);
      if (f === Math.round(BAR)) await v.page.evaluate(() => document.getElementById('flashBtn').click()); // flash on the drop
    });
  }
  {
    const n = len('s8v');
    await scene(v, 's8v', n, async (f) => {
      if (f === 0) await v.page.evaluate(() => window.__sole.y(document.getElementById('vs').getBoundingClientRect().top + scrollY + 120));
      // the page's own nudge (30% -> 70% -> 50%) plays when the frame scrolls in
    });
  }
  {
    const n = len('s9s');
    await scene(v, 's9s', n, async (f) => {
      if (f === 0) await v.page.evaluate(() => window.__sole.y(document.querySelector('.street').getBoundingClientRect().top + scrollY - 200));
      const y0 = await v.page.evaluate(() => document.querySelector('.street').getBoundingClientRect().top + scrollY - 200);
      await scrollTo(v, y0 + keys([[0, 0], [n, 520]], f, ease.linear));
    });
  }
}

// S6 — shop: tilt a card, add to cart, the shoe flies, the bag bumps.
{
  const n = len('s10');
  await scene(v, 's10', n, async (f) => {
    if (f === 0) await v.page.evaluate(() => window.__sole.y(document.getElementById('shop').getBoundingClientRect().top + scrollY + (innerWidth < 761 ? 70 : 0)));
    const card = await v.page.evaluate((R) => { const c = document.querySelector(R ? '.card[data-id="airmax90"]' : '.card[data-id="samba"]'); const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, R);
    if (!R && f < sc(70)) {
      await v.page.mouse.move(card.x + card.w * keys([[0, .2], [sc(70), .85]], f), card.y + card.h * keys([[0, .3], [sc(70), .6]], f));
    }
    const addAt = sc(R ? 20 : 80);
    if (f === addAt) await v.page.evaluate((R) => document.querySelector(R ? '.card[data-id="airmax90"] .card__add' : '.card[data-id="samba"] .card__add').click(), R); // element.click(): no auto-scroll
    if (!R && f === sc(150)) await v.page.evaluate(() => document.getElementById('cartBtn').click());
    await overlay(v, pill(R ? 'add to cart' : 'tap · add · done', f, 2, n - 2, R ? 16 : 10));
  });
}

// S7 — finale + end card.
{
  const n = len('s11');
  await scene(v, 's11', n, async (f) => {
    if (f === 0) {
      await v.page.evaluate(() => { document.getElementById('cart').hidden = true; document.documentElement.style.overflow = ''; document.getElementById('toast').classList.remove('is-on'); });
      await v.page.evaluate(() => window.__sole.y(document.querySelector('.finale').getBoundingClientRect().top + scrollY - (innerWidth < 761 ? 0 : 40)));
    }
    const endAt = R ? sc(26) : Math.round(2 * BAR);
    let html = '';
    if (f >= endAt) {
      const a = ease.out(k(f, endAt, endAt + 8));
      html = `<div class="black" style="opacity:${a * .92}"></div>
        <div class="t" style="font-size:${SZ.mid * 1.5}px;top:${R ? 36 : 44}%;opacity:${a};transform:translate(-50%,-50%) scale(${1.2 - .2 * a})">SOLE<span style="color:#ff3b1f">/</span>LAB</div>
        <div class="pill" style="--pill:${SZ.pill}px;top:${R ? 44 : 56}%;opacity:${a}">solelab-demo.vercel.app</div>
        <div class="t" style="top:${R ? 55 : 88}%;opacity:${a * .7}"><span class="sub" style="--sub:${R ? 13 : 15}px">Concept demo · not affiliated with Nike or adidas</span></div>`;
    }
    await overlay(v, html);
  });
}

await writeFile(`frames/${VERSION}/errors.json`, JSON.stringify(v.errors, null, 1));
console.log('errors', v.errors.length);
await v.close();
