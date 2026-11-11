import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reveal } from './reveal.js';

export function initSections(env) {
  initLab(env);
  initRunner(env);
  initPaint(env);
  initMats(env);
  initDark(env);
  initVersus();
  initStreet(env);
}

/* ---------- THE LAB: exploded view ---------- */
// crop window inside the 2400x1792 source that holds the whole stack
const CROP = { x: .28, y: .17, w: .44, h: .69 };
// stacking order when assembled (upper over sockliner, midsole over outsole)
const Z = [5, 4, 1, 3, 2];

function initLab({ RM, MOBILE }) {
  const stage = document.getElementById('labStage');
  const svg = document.getElementById('labLines');
  const labels = [...document.querySelectorAll('#labLabels li')];
  // the pin must exist now, in page order, so later pins measure correctly
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
  let parts = [];
  if (!RM) {
    ScrollTrigger.create({
      trigger: '.lab',
      pin: '.lab__pin',
      start: 'top top',
      end: () => `+=${innerHeight * 1.6}`,
      scrub: .6,
      animation: tl,
      onRefresh: () => { drawLines(); syncLines(tl.progress()); },
      onUpdate: (self) => syncLines(self.progress),
    });
  }
  function syncLines(prog) {
    parts.forEach((p, i) => {
      if (!p.path) return;
      const start = .62 + i * .05;
      const k = gsap.utils.clamp(0, 1, (prog - start) / .18);
      p.path.style.strokeDashoffset = p.path.getTotalLength() * (1 - k);
      p.dot.style.opacity = k > 0 ? 1 : 0;
    });
  }
  function drawLines() {
    svg.innerHTML = '';
    if (MOBILE || !parts.length) return;
    const sr = stage.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${sr.width} ${sr.height}`);
    parts.forEach((p, i) => {
      const lab = labels[i];
      if (!lab) return;
      const lr = lab.getBoundingClientRect();
      const x1 = (p.left + p.width * .82) * sr.width, y1 = p.cy * sr.height;
      const x2 = lr.left - sr.left - 12, y2 = lr.top - sr.top + 12;
      const mx = x1 + (x2 - x1) * .55;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x1},${y1} L${mx},${y1} L${x2},${y2}`);
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', x1); dot.setAttribute('cy', y1); dot.setAttribute('r', 4);
      svg.append(path, dot);
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = RM ? 0 : len;
      p.path = path; p.dot = dot;
    });
  }
  fetch('assets/exploded.json').then((r) => r.json()).then((data) => buildLab(data)).catch(() => {});

  function buildLab(data) {

  parts = data.parts.map((p, i) => {
    const img = new Image();
    img.src = `assets/img/${p.name}.webp`;
    img.alt = '';
    img.decoding = 'async';
    const left = (p.x - CROP.x) / CROP.w, top = (p.y - CROP.y) / CROP.h;
    const width = p.w / CROP.w, height = p.h / CROP.h;
    Object.assign(img.style, { left: `${left * 100}%`, top: `${top * 100}%`, width: `${width * 100}%`, zIndex: Z[i] });
    stage.insertBefore(img, svg);
    return { img, left, top, width, height, cy: top + height / 2 };
  });

  // assembled: pull every part toward the stack centre
  const mid = (Math.min(...parts.map((p) => p.top)) + Math.max(...parts.map((p) => p.top + p.height))) / 2;
  const assembled = parts.map((p) => ({ yPercent: ((mid - p.cy) * .74 / p.height) * 100 }));

  if (RM) { labels.forEach((l) => (l.style.opacity = 1)); requestAnimationFrame(drawLines); return; }

  parts.forEach((p, i) => gsap.set(p.img, assembled[i]));
  tl.to({}, { duration: .3 }, 0);
  parts.forEach((p, i) => {
    tl.to(p.img, { yPercent: 0, rotate: (i - 2) * 2.5, duration: 1 }, .3 + i * .05);
  });
  labels.forEach((l, i) => tl.to(l, { opacity: 1, x: 0, duration: .35 }, 1 + i * .12));
  tl.to({}, { duration: .6 });
  tl.progress(tl.scrollTrigger ? tl.scrollTrigger.progress : 0);
  drawLines();
  syncLines(tl.progress());
  }
}

/* ---------- LAB RUNNER: 72-frame pre-rendered turntable ---------- */
function initRunner({ RM, MOBILE }) {
  const N = 72;
  const sec = document.getElementById('runner');
  const cv = document.getElementById('runnerCanvas');
  const ctx = cv.getContext('2d');
  const degEl = document.getElementById('runnerDeg');
  const dir = `assets/seq/${MOBILE ? 'm' : 'd'}/`;
  const frames = new Array(N);
  const state = { scroll: 0, drag: 0 };
  let loading = false, last = -1;

  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(cv.clientWidth * dpr);
    cv.height = Math.round(cv.clientHeight * dpr);
    last = -1; draw();
  };
  const angle = () => (((state.scroll + state.drag) % 360) + 360) % 360;
  function draw() {
    const a = angle();
    let i = Math.round(a / (360 / N)) % N;
    // until every frame is in, fall back to the nearest loaded one
    if (!frames[i]?.complete) {
      for (let k = 1; k < N && !frames[i]?.complete; k++) {
        if (frames[(i + k) % N]?.complete) i = (i + k) % N;
        else if (frames[(i - k + N) % N]?.complete) i = (i - k + N) % N;
      }
    }
    degEl.textContent = String(Math.round(a));
    const img = frames[i];
    if (!img?.complete || !img.naturalWidth || i === last) return;
    last = i;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
  }
  function load() {
    if (loading) return;
    loading = true;
    // frame 0 first, then every 6th (a coarse 360), then the rest
    const order = [...Array(N).keys()].sort((a, b) => (a % 6 === 0 ? 0 : 1) - (b % 6 === 0 ? 0 : 1) || a - b);
    order.forEach((i) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { last = -1; draw(); };
      img.src = `${dir}${String(i).padStart(2, '0')}.webp`;
      frames[i] = img;
    });
  }
  ScrollTrigger.create({ trigger: sec, start: 'top 250%', onEnter: load, onEnterBack: load });
  addEventListener('resize', size);
  requestAnimationFrame(size);

  if (!RM) {
    ScrollTrigger.create({
      trigger: sec, pin: '.runner__pin', start: 'top top',
      end: () => `+=${innerHeight * 1.3}`, scrub: .4,
      onUpdate: (self) => { state.scroll = self.progress * 360; draw(); },
    });
    gsap.fromTo('.runner__copy > *', { y: 30, opacity: 0 }, {
      y: 0, opacity: 1, stagger: .08, ease: 'power2.out',
      scrollTrigger: { trigger: sec, start: 'top 70%', end: 'top 20%', scrub: true },
    });
  }

  // drag to spin, with a little momentum
  const stage = cv.parentElement;
  let down = false, lx = 0, vx = 0, lt = 0;
  stage.addEventListener('pointerdown', (e) => {
    down = true; lx = e.clientX; vx = 0; lt = performance.now();
    gsap.killTweensOf(state, 'drag');
    stage.setPointerCapture(e.pointerId);
    load();
  });
  stage.addEventListener('pointermove', (e) => {
    if (!down) return;
    const now = performance.now();
    const dx = e.clientX - lx;
    lx = e.clientX;
    state.drag -= dx * .6;
    vx = dx / Math.max(1, now - lt);
    lt = now;
    draw();
  });
  const up = () => {
    if (!down) return;
    down = false;
    if (!RM && Math.abs(vx) > .05) {
      gsap.to(state, { drag: state.drag - vx * 260, duration: 1.2, ease: 'power3.out', onUpdate: draw });
    }
  };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);

  document.getElementById('runnerWait').addEventListener('click', () => {
    const t = document.getElementById('toast');
    t.textContent = 'Lab Runner 01 is coming soon.';
    t.classList.add('is-on');
    setTimeout(() => t.classList.remove('is-on'), 2400);
  });
}

/* ---------- COLORWAYS: paint wipe ---------- */
function initPaint({ RM }) {
  const sec = document.getElementById('paint');
  const layers = [...sec.querySelectorAll('.paint__layer')];
  const sw = [...sec.querySelectorAll('.swatch')];
  const stroke = document.getElementById('paintStroke');
  const name = document.getElementById('paintName');
  const NAMES = ['Infrared.', 'Royal.', 'Volt.'];
  const COLORS = ['#ff3b1f', '#2747c9', '#d7ff2f'];
  let cur = 0, busy = false;

  const go = (n) => {
    if (n === cur || busy) return;
    sw.forEach((b, i) => { b.classList.toggle('is-on', i === n); b.setAttribute('aria-checked', i === n); });
    sec.style.setProperty('--accent', COLORS[n]);
    name.textContent = NAMES[n];
    const from = layers[cur], to = layers[n];
    cur = n;
    if (RM) { from.classList.remove('is-on'); to.classList.add('is-on'); to.style.clipPath = 'inset(0 0% 0 0)'; return; }
    busy = true;
    to.style.zIndex = 2; from.style.zIndex = 1;
    const tl = gsap.timeline({ onComplete: () => { from.classList.remove('is-on'); from.style.clipPath = 'inset(0 100% 0 0)'; to.classList.add('is-on'); busy = false; } });
    tl.set(stroke, { opacity: 1, xPercent: -130, zIndex: 3 })
      .to(stroke, { xPercent: 520, duration: .9, ease: 'power2.inOut' })
      .fromTo(to, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .9, ease: 'power2.inOut' }, '<+0.08')
      .to(stroke, { opacity: 0, duration: .2 }, '-=0.2')
      .fromTo(to.querySelector('img'), { scale: .96, rotate: -2 }, { scale: 1, rotate: 0, duration: .9, ease: 'elastic.out(1, .6)' }, '-=0.5');
  };
  sw.forEach((b, i) => b.addEventListener('click', () => go(i)));

  if (!RM) {
    gsap.fromTo('.paint__stage', { yPercent: 8, rotate: -3 }, {
      yPercent: -8, rotate: 3, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
}

/* ---------- MATERIALS: horizontal run ---------- */
function initMats({ RM }) {
  if (RM) {
    const pinEl = document.querySelector('.mats__pin');
    pinEl.style.height = 'auto';
    pinEl.style.overflowX = 'auto';
    pinEl.style.padding = '80px 0';
    return;
  }
  const track = document.getElementById('matsTrack');
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  const move = gsap.to(track, { x: () => -dist(), ease: 'none' });
  const st = ScrollTrigger.create({
    trigger: '.mats', pin: '.mats__pin', start: 'top top',
    end: () => `+=${dist()}`, scrub: .6, animation: move, invalidateOnRefresh: true,
  });
  document.querySelectorAll('.mat').forEach((m) => {
    gsap.fromTo(m.querySelector('img'), { xPercent: -12 }, {
      xPercent: 0, ease: 'none',
      scrollTrigger: { trigger: m, containerAnimation: move, start: 'left right', end: 'right left', scrub: true },
    });
  });
  return st;
}

/* ---------- AFTER DARK: flashlight ---------- */
function initDark({ RM, FINE }) {
  const sec = document.getElementById('dark');
  const glow = document.getElementById('darkGlow');
  const flash = document.getElementById('darkFlash');
  const setXY = (x, y) => { sec.style.setProperty('--mx', `${x}px`); sec.style.setProperty('--my', `${y}px`); };
  const r0 = () => sec.getBoundingClientRect();
  if (FINE) {
    sec.addEventListener('pointermove', (e) => { const r = r0(); setXY(e.clientX - r.left, e.clientY - r.top); });
  }
  // no mouse: the light wanders over the shoe by itself
  if (!FINE && !RM) {
    const o = { t: 0 };
    gsap.to(o, {
      t: Math.PI * 2, duration: 7, repeat: -1, ease: 'none',
      onUpdate() { const r = r0(); setXY(r.width * (.5 + Math.cos(o.t) * .28), r.height * (.33 + Math.sin(o.t * 2) * .1)); },
    });
  } else if (!FINE) { glow.classList.add('is-flash'); }
  else {
    // start the beam on the shoe itself
    const aim = () => { const r = r0(), i = glow.querySelector('img').getBoundingClientRect(); setXY(i.left - r.left + i.width * .55, i.top - r.top + i.height * .45); };
    ScrollTrigger.create({ trigger: sec, start: 'top 60%', onEnter: aim, onEnterBack: aim, onRefresh: aim });
  }

  document.getElementById('flashBtn').addEventListener('click', () => {
    glow.classList.add('is-flash');
    if (!RM) gsap.fromTo(flash, { opacity: .95 }, { opacity: 0, duration: .7, ease: 'power2.out' });
    clearTimeout(initDark.t);
    initDark.t = setTimeout(() => glow.classList.remove('is-flash'), 2200);
  });
}

/* ---------- VERSUS: drag compare ---------- */
function initVersus() {
  const frame = document.getElementById('vsFrame');
  const handle = document.getElementById('vsHandle');
  let pos = 50, drag = false;
  const set = (p) => {
    pos = Math.max(4, Math.min(96, p));
    frame.style.setProperty('--pos', `${pos}%`);
    handle.setAttribute('aria-valuenow', Math.round(pos));
  };
  const fromEvent = (e) => { const r = frame.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };
  frame.addEventListener('pointerdown', (e) => { drag = true; frame.setPointerCapture(e.pointerId); fromEvent(e); });
  frame.addEventListener('pointermove', (e) => { if (drag) fromEvent(e); });
  frame.addEventListener('pointerup', () => { drag = false; });
  frame.addEventListener('pointercancel', () => { drag = false; });
  handle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { set(pos - 5); e.preventDefault(); }
    if (e.key === 'ArrowRight') { set(pos + 5); e.preventDefault(); }
  });
  // a little nudge when it scrolls into view, so people know it moves
  ScrollTrigger.create({
    trigger: frame, start: 'top 70%', once: true,
    onEnter: () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const o = { p: 50 };
      gsap.timeline().to(o, { p: 30, duration: .6, ease: 'power2.inOut', onUpdate: () => set(o.p) })
        .to(o, { p: 70, duration: .9, ease: 'power2.inOut', onUpdate: () => set(o.p) })
        .to(o, { p: 50, duration: .6, ease: 'power2.inOut', onUpdate: () => set(o.p) });
    },
  });
}

/* ---------- STREET: reveal + parallax ---------- */
function initStreet({ RM }) {
  if (RM) return;
  document.querySelectorAll('.shot').forEach((s, i) => {
    reveal(gsap.to(s, { clipPath: 'inset(0% 0 0 0)', duration: 1.1, ease: 'expo.out', delay: i * .1, paused: true }), s);
    gsap.fromTo(s.querySelector('img'), { yPercent: -12 }, { yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  reveal(gsap.from('.finale__title span', { yPercent: 100, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', paused: true }), '.finale__title');
}
