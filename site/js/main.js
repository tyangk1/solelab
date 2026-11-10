import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initHero } from './hero.js';
import { initSections } from './sections.js';
import { initShop } from './shop.js';

gsap.registerPlugin(ScrollTrigger);

export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const MOBILE = matchMedia('(max-width: 760px)').matches;
export const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;

/** assets/img/<name>.webp, or the -m variant on phones */
export const imgUrl = (name, forceDesktop = false) =>
  `assets/img/${name}${MOBILE && !forceDesktop ? '-m' : ''}.webp`;

// ---------- resolve data-src images ----------
function resolveImages(root = document) {
  root.querySelectorAll('img[data-src]').forEach((img) => {
    img.src = imgUrl(img.dataset.src);
    img.decoding = 'async';
    img.removeAttribute('data-src');
  });
  root.querySelectorAll('[data-mask]').forEach((el) => {
    const u = `url(${imgUrl(el.dataset.mask)})`;
    el.style.webkitMaskImage = u;
    el.style.maskImage = u;
  });
}

function waitFor(imgs, onProgress) {
  let done = 0;
  return Promise.all(imgs.map((img) => new Promise((res) => {
    const fin = () => { done++; onProgress(done / imgs.length); res(); };
    if (img.complete && img.naturalWidth) fin();
    else { img.addEventListener('load', fin, { once: true }); img.addEventListener('error', fin, { once: true }); }
  })));
}

// ---------- smooth scroll ----------
let lenis = null;
function initScroll() {
  if (RM) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, prevent: () => false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
export function scrollToEl(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4 });
  else el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  e.preventDefault();
  scrollToEl(a.getAttribute('href'));
});

// ---------- loader: the box opens, the shoe rises ----------
function runLoader(ready) {
  const loader = document.getElementById('loader');
  const pct = document.getElementById('loadPct');
  const finish = () => {
    loader.remove();
    document.body.classList.remove('is-loading');
    lenis?.start();
    ScrollTrigger.refresh();
  };
  if (RM) { ready.then(() => { pct.textContent = '100'; finish(); }); return; }

  const tl = gsap.timeline({ paused: true, onComplete: finish });
  tl.to('.loader__box--closed', { y: -6, duration: .25, ease: 'power2.out' })
    .to('.loader__box--closed', { y: 0, duration: .2, ease: 'power2.in' })
    .to('.loader__box--open', { opacity: 1, duration: .25 }, '>-0.02')
    .to('.loader__box--closed', { opacity: 0, duration: .25 }, '<')
    .to('.loader__shoe', { opacity: 1, y: '-28%', scale: .9, duration: .9, ease: 'expo.out' }, '+=0.05')
    .to('.loader__box', { y: '30%', opacity: 0, duration: .6, ease: 'power3.in' }, '-=0.35')
    .to('.loader__shoe', { scale: 3.2, opacity: 0, duration: .7, ease: 'power3.in' }, '-=0.15')
    .to('.loader__meta', { opacity: 0, duration: .3 }, '<')
    .to(loader, { opacity: 0, duration: .4 }, '-=0.3');

  ready.then(() => gsap.delayedCall(.25, () => tl.play()));
  // never trap the visitor behind a slow network
  gsap.delayedCall(8, () => tl.progress() === 0 && tl.play());
}

// ---------- sneaker prints that follow the cursor ----------
function initPrints() {
  if (!FINE || RM) return;
  const layer = document.getElementById('prints');
  const svg = '<svg viewBox="0 0 18 30"><path d="M9 1c4 0 7 3 7 8 0 4-1.5 6-2 9l-.5 5c0 3.5-2 6-4.5 6S4 27 4 23.5l-.4-5C3 15.5 2 13 2 9c0-5 3-8 7-8z"/></svg>';
  let lx = 0, ly = 0, side = 1;
  addEventListener('pointermove', (e) => {
    const dx = e.clientX - lx, dy = e.clientY - ly;
    if (dx * dx + dy * dy < 90 * 90) return;
    const ang = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    lx = e.clientX; ly = e.clientY; side *= -1;
    const p = document.createElement('div');
    p.className = 'print';
    p.innerHTML = svg;
    const off = side * 9;
    const r = (ang - 90) * Math.PI / 180;
    p.style.left = `${e.clientX + Math.cos(r) * off}px`;
    p.style.top = `${e.clientY + Math.sin(r) * off}px`;
    p.style.transform = `rotate(${ang}deg) scaleX(${side})`;
    p.style.color = '#fff';
    p.style.mixBlendMode = 'difference';
    layer.appendChild(p);
    gsap.to(p, { opacity: 0, duration: 1.4, delay: .3, ease: 'power1.in', onComplete: () => p.remove() });
    if (layer.childElementCount > 24) layer.firstElementChild.remove();
  }, { passive: true });
}

// ---------- boot ----------
resolveImages();
initScroll();
const critical = [...document.querySelectorAll('.loader img, .rig[data-drop="0"] .view, .hero__bg')];
const ready = waitFor(critical, (p) => {
  document.getElementById('loadPct').textContent = String(Math.round(p * 100));
});
runLoader(ready);

const hero = initHero({ RM, MOBILE, getLenis: () => lenis });
initSections({ RM, MOBILE, FINE });
initShop({ RM, imgUrl });
initPrints();

// modals and the cart freeze the smooth scroller
document.addEventListener('sole:lock', () => lenis?.stop());
document.addEventListener('sole:unlock', () => lenis?.start());

// header gets a backing gradient once the hero is behind us
ScrollTrigger.create({
  trigger: '.marquee', start: 'top 60px',
  onToggle: (self) => document.body.classList.toggle('hdr-solid', self.isActive), end: 'max',
});
// header turns dark over the light (paper) sections
document.querySelectorAll('.lab, .mats, .street').forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec, start: 'top 40px', end: 'bottom 40px',
    onToggle: (self) => document.body.classList.toggle('hdr-dark', self.isActive),
  });
});

// test hook for screenshots: jump instantly (automation Chrome is slow)
window.__sole = {
  y(y) { if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); ScrollTrigger.update(); },
  el(sel, frac = 0) {
    const all = ScrollTrigger.getAll().filter((s) => s.trigger && s.trigger.matches(sel));
    const st = all.find((s) => s.pin) || all[0];
    const y = st ? st.start + (st.end - st.start) * frac : document.querySelector(sel).getBoundingClientRect().top + scrollY;
    this.y(y);
  },
  hero,
};
