// Playwright snippet (browser_run_code_unsafe filename): jump to scroll positions and screenshot.
// Output: lab/shots/<prefix>-<name>.png ; returns console errors + overflow info.
async (page) => {
  const W = page.viewportSize().width;
  const prefix = W <= 500 ? 'm390' : 'd1440';
  const dir = 'C:/Users/CANAWAN PC/Code_SID-Corp/landing-lab/builds/sneaker-store/lab/shots';
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://localhost:4512/?t=' + Date.now());
  await page.waitForFunction(() => !document.getElementById('loader'), null, { timeout: 40000 });
  await page.waitForTimeout(600);
  const spots = [
    ['hero-00', '.hero', 0], ['hero-07', '.hero', .07], ['hero-14', '.hero', .14], ['hero-30', '.hero', .30],
    ['hero-50', '.hero', .5], ['hero-97', '.hero', .97],
    ['lab-05', '.lab', .05], ['lab-95', '.lab', .95], ['runner-10', '.runner', .1], ['runner-45', '.runner', .45],
    ['paint', '#paint', null], ['mats-40', '.mats', .4], ['dark', '#dark', null], ['vs', '#vs', null],
    ['street', '.street', null], ['shop', '#shop', null], ['finale', '.finale', null],
  ];
  for (const [name, sel, frac] of spots) {
    await page.evaluate(([s, f]) => {
      if (f === null) { const el = document.querySelector(s); window.__sole.y(el.getBoundingClientRect().top + scrollY); }
      else window.__sole.el(s, f);
    }, [sel, frac]);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${dir}/${prefix}-${name}.png` });
  }
  const info = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, h: document.documentElement.scrollHeight }));
  return { errors, info };
}
