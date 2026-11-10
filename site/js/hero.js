import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const SHADOW = 'drop-shadow(0px 34px 30px rgba(0,0,0,0.35))';
const SHARP = `blur(0px) ${SHADOW}`;
const SMEAR = `blur(16px) ${SHADOW}`;

/**
 * Hero: three drops pinned on scroll. Each drop "spins" through four views
 * (3/4, side, mirrored side, mirrored 3/4) with squash + motion blur, then
 * whips off-screen while the next drop whips in.
 */
export function initHero({ RM, MOBILE, getLenis }) {
  const pin = document.querySelector('.hero__pin');
  const rigs = [...document.querySelectorAll('.rig')];
  const bgs = [...document.querySelectorAll('.hero__bg')];
  const words = [...document.querySelectorAll('.hero__word')];
  const cards = [...document.querySelectorAll('.drop-card')];
  const num = document.getElementById('dropNum');
  const bar = document.getElementById('dropBar');
  const N = rigs.length;

  rigs.forEach((rig) => {
    rig.querySelectorAll('.view').forEach((v) => {
      gsap.set(v, { scaleX: v.classList.contains('view--flip') ? -1 : 1, filter: SHARP });
    });
  });

  const dust = initDust(getLenis, RM);

  if (RM) {
    num.textContent = '01';
    return { st: null };
  }

  // GSAP owns the stage transform from here: centring via percents, float via px
  gsap.set('.hero__stage', { xPercent: -50, yPercent: -50, x: 0, y: 0 });
  gsap.to('.hero__stage', { y: -18, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true });
  gsap.to('.hero__shadow', { scaleX: .86, opacity: .7, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true });

  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  const SPIN = 3.2; // units per drop spin (4 view changes)
  // mirrored views (B', A') would show printed text backwards, so they only
  // ever pass by inside the motion blur and never settle sharp on screen
  const PASS = `blur(9px) ${SHADOW}`;
  const AT = [.6, 1.4, 1.72, 2.04]; // start of each view change; short gaps around the mirrored pair
  const SWAP = 1.4; // units per drop change

  rigs.forEach((rig, d) => {
    const views = [...rig.querySelectorAll('.view')];
    const sheen = rig.querySelector('.sheen');
    const base = (i) => (views[i].classList.contains('view--flip') ? -1 : 1);
    const t0 = tl.duration();

    // light sweep over the 3/4 view at the start of each drop
    tl.fromTo(sheen, { backgroundPosition: '120% 0', opacity: 1 }, { backgroundPosition: '-20% 0', duration: .9 }, t0);
    tl.to(sheen, { opacity: 0, duration: .2 }, t0 + .9);

    // A -> B -> B' -> A' -> A
    for (let k = 0; k < 4; k++) {
      const i = k, j = (k + 1) % 4;
      const t = t0 + AT[k];
      const settle = !views[j].classList.contains('view--flip');
      tl.to(views[i], { scaleX: base(i) * .5, x: '-5%', opacity: 0, filter: SMEAR, duration: .2, ease: 'power2.in' }, t);
      tl.fromTo(views[j],
        { scaleX: base(j) * .5, x: '5%', opacity: 0, filter: SMEAR },
        { scaleX: base(j) * (settle ? 1 : .85), x: '0%', opacity: settle ? 1 : .9, filter: settle ? SHARP : PASS, duration: .24, ease: 'power2.out', immediateRender: false }, t + .14);
    }
    tl.fromTo(sheen, { opacity: 0, backgroundPosition: '120% 0' }, { opacity: 1, backgroundPosition: '-20% 0', duration: .6, immediateRender: false }, t0 + SPIN - .2);
    // keep the timeline length exact
    tl.set({}, {}, t0 + SPIN + .5);

    if (d < N - 1) {
      const ts = tl.duration();
      const next = rigs[d + 1];
      tl.to(rig, { xPercent: -95, rotate: -14, opacity: 0, filter: 'blur(18px)', duration: SWAP * .6, ease: 'power3.in' }, ts);
      tl.fromTo(next, { xPercent: 95, rotate: 14, opacity: 0, filter: 'blur(18px)' },
        { xPercent: 0, rotate: 0, opacity: 1, filter: 'blur(0px)', duration: SWAP * .6, ease: 'power3.out', immediateRender: false }, ts + SWAP * .4);
      tl.to(bgs[d + 1], { opacity: 1, scale: 1, duration: SWAP * .8 }, ts + SWAP * .2);
      tl.to(words[d], { yPercent: -30, opacity: 0, duration: SWAP * .45, ease: 'power2.in' }, ts);
      tl.fromTo(words[d + 1], { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: SWAP * .5, ease: 'power2.out', immediateRender: false }, ts + SWAP * .5);
      tl.to(cards[d], { autoAlpha: 0, y: -20, duration: SWAP * .3 }, ts);
      tl.fromTo(cards[d + 1], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: SWAP * .35, immediateRender: false }, ts + SWAP * .65);
    }
  });
  tl.set({}, {}, tl.duration() + .6); // hold on the last drop

  gsap.set(bgs[0], { scale: 1 });
  const perDrop = SPIN + .5 + SWAP;
  const st = ScrollTrigger.create({
    trigger: '.hero',
    pin: pin,
    start: 'top top',
    end: () => `+=${innerHeight * (MOBILE ? 1.1 : 1.35) * N}`,
    scrub: .6,
    animation: tl,
    onUpdate(self) {
      const at = self.progress * tl.duration();
      const d = Math.min(N - 1, Math.floor((at + SWAP * .5) / perDrop));
      num.textContent = String(d + 1).padStart(2, '0');
      bar.style.transform = `scaleX(${self.progress})`;
      dust.setActive(self.isActive || self.progress < 1);
    },
  });

  // pointer parallax on desktop: the shoe leans toward the cursor
  if (matchMedia('(hover: hover)').matches) {
    const qx = gsap.quickTo('.hero__stage', 'rotateY', { duration: .8, ease: 'power3' });
    const qy = gsap.quickTo('.hero__stage', 'rotateX', { duration: .8, ease: 'power3' });
    const qt = gsap.quickTo('.hero__type', 'x', { duration: 1.2, ease: 'power3' });
    gsap.set('.hero__stage', { transformPerspective: 1200 });
    pin.addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      qx(nx * 10); qy(-ny * 8); qt(-nx * 30);
    });
  }
  return { st, tl };
}

/** floating dust; streaks with scroll velocity */
function initDust(getLenis, RM) {
  const cv = document.getElementById('dust');
  const ctx = cv.getContext('2d');
  let w = 0, h = 0, dpr = 1, active = true;
  const P = [];
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);
  const count = Math.round(Math.min(90, (w * h) / 16000));
  for (let i = 0; i < count; i++) {
    P.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + .3, s: Math.random() * .35 + .08, a: Math.random() * .5 + .15, ph: Math.random() * 6.28 });
  }
  const draw = () => {
    if (!active) return;
    const v = getLenis()?.velocity || 0;
    ctx.clearRect(0, 0, w, h);
    for (const p of P) {
      p.y -= p.s + Math.abs(v) * .04;
      p.ph += .01;
      p.x += Math.sin(p.ph) * .2 - v * .06;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
      ctx.globalAlpha = p.a;
      ctx.fillStyle = '#fff';
      const streak = Math.min(40, Math.abs(v) * 1.2);
      if (streak > 2) {
        ctx.fillRect(p.x - streak / 2, p.y, streak, p.r);
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
    }
  };
  if (!RM) gsap.ticker.add(draw);
  else draw();
  return { setActive(on) { if (on !== active) { active = on; if (!on) ctx.clearRect(0, 0, w, h); } } };
}
