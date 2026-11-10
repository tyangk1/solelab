import { open, ensureDir } from './lib.mjs';
const out = 'frames/test';
await ensureDir(out);
const v = await open({ width: 540, height: 960, scale: 2 });
const t0 = Date.now();
// loader: let real network load images while the fake clock is paused, then run it
await v.page.waitForFunction(() => [...document.querySelectorAll('.loader img')].every((i) => i.complete), null, { timeout: 20000 });
for (let f = 0; f < 90; f++) {
  await v.step();
  if (f % 15 === 0) await v.shot(`${out}/l${String(f).padStart(3, '0')}.jpg`);
}
const loaderGone = await v.page.evaluate(() => !document.getElementById('loader'));
// hero scrub: move scroll 0 -> 30% of hero over 2 s
const st = await v.page.evaluate(() => { const s = window.__sole.hero.st; return { start: s.start, end: s.end }; });
for (let f = 0; f < 60; f++) {
  const y = st.start + (st.end - st.start) * 0.3 * (f / 59);
  await v.page.evaluate((y) => window.__sole.y(y), y);
  await v.step();
  if (f % 10 === 0) await v.shot(`${out}/h${String(f).padStart(3, '0')}.jpg`);
}
console.log(JSON.stringify({ loaderGone, ms: Date.now() - t0, errors: v.errors }));
await v.close();
