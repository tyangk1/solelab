// Playwright snippet: real wheel events, colorway, quick view, cart, persistence, corrupt storage.
async (page) => {
  const dir = 'C:/Users/CANAWAN PC/Code_SID-Corp/landing-lab/builds/sneaker-store/lab/shots';
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:4512/?i=' + Date.now());
  await page.evaluate(() => localStorage.removeItem('solelab.cart.v1'));
  await page.reload();
  await page.waitForFunction(() => !document.getElementById('loader'), null, { timeout: 40000 });
  const out = {};
  // 1. real wheel scrolling (Lenis prevent bug shows up only on real wheel events)
  await page.mouse.move(700, 450);
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(60); }
  await page.waitForTimeout(800);
  out.afterWheelY = await page.evaluate(() => Math.round(scrollY));
  // 2. colorway swap
  await page.evaluate(() => window.__sole.y(document.getElementById('paint').getBoundingClientRect().top + scrollY));
  await page.waitForTimeout(900);
  await page.click('.swatch[data-cw="1"]');
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${dir}/i-paint-mid.png` });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${dir}/i-paint-blue.png` });
  out.paintName = await page.textContent('#paintName');
  // 3. quick view, add without size (should refuse), pick size, add
  await page.evaluate(() => window.__sole.y(document.getElementById('shop').getBoundingClientRect().top + scrollY));
  await page.waitForTimeout(1500);
  await page.click('.card[data-id="gazelle"] .card__media');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${dir}/i-qv.png` });
  await page.click('#qvAdd');
  out.countNoSize = await page.textContent('#cartCount');
  await page.click('.size[data-size="43"]');
  await page.click('#qvAdd');
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${dir}/i-fly.png` });
  await page.waitForTimeout(1200);
  out.countAfter = await page.textContent('#cartCount');
  // 4. quick add from a card
  await page.click('.card[data-id="dunklow"] .card__add');
  await page.waitForTimeout(1400);
  out.countAfter2 = await page.textContent('#cartCount');
  // 5. cart drawer
  await page.click('#cartBtn');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${dir}/i-cart.png` });
  out.total = await page.textContent('#cartTotal');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  out.cartHidden = await page.evaluate(() => document.getElementById('cart').hidden);
  // 6. persistence + corrupt storage
  await page.reload();
  await page.waitForFunction(() => !document.getElementById('loader'), null, { timeout: 40000 });
  out.countReload = await page.textContent('#cartCount');
  await page.evaluate(() => localStorage.setItem('solelab.cart.v1', '{oops'));
  await page.reload();
  await page.waitForFunction(() => !document.getElementById('loader'), null, { timeout: 40000 });
  out.countCorrupt = await page.textContent('#cartCount');
  await page.evaluate(() => localStorage.removeItem('solelab.cart.v1'));
  return { out, errors };
}
