import gsap from 'gsap';
import { reveal } from './reveal.js';

export const PRODUCTS = [
  { id: 'airmax90', brand: 'Nike', name: 'Air Max 90 “Infrared”', price: 140, tag: 'Drop 01', copy: 'Visible Air, waffle outsole and that infrared flash. The 1990 original, rebuilt.' },
  { id: 'samba', brand: 'adidas', name: 'Samba OG “Cloud White”', price: 100, tag: 'Drop 02', copy: 'Soft leather upper, suede T-toe, gum sole. Terrace classic since the fifties.' },
  { id: 'ultraboost', brand: 'adidas', name: 'Ultraboost “Triple Black”', price: 190, tag: 'Drop 03', copy: 'Primeknit upper, full-length Boost. Runs long, looks sharp, all black.' },
  { id: 'airforce1', brand: 'Nike', name: 'Air Force 1 ’07 “Triple White”', price: 115, tag: 'Classic', copy: 'Court-born, street-raised. Crisp leather, pivot-circle outsole, hidden Air.' },
  { id: 'dunklow', brand: 'Nike', name: 'Dunk Low “Panda”', price: 115, tag: 'Restock', copy: 'Black and white overlays on a low-cut basketball icon. Goes with everything.' },
  { id: 'gazelle', brand: 'adidas', name: 'Gazelle “Collegiate Blue”', price: 100, tag: 'New', copy: 'Nubuck-soft suede, serrated stripes, a slim 1960s training silhouette.' },
];
const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
const SIZES = [39, 40, 41, 42, 43, 44, 45, 46];
const KEY = 'solelab.cart.v1';

export function initShop({ RM, imgUrl }) {
  const grid = document.getElementById('grid');
  const toastEl = document.getElementById('toast');
  const countEl = document.getElementById('cartCount');
  const cartBtn = document.getElementById('cartBtn');

  // ---------- cart state ----------
  let cart = load();
  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v.filter((i) => byId[i.id] && i.qty > 0) : [];
    } catch { return []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* private mode */ } }
  function add(id, size) {
    const hit = cart.find((i) => i.id === id && i.size === size);
    if (hit) hit.qty++; else cart.push({ id, size, qty: 1 });
    save(); renderCart();
  }
  const count = () => cart.reduce((n, i) => n + i.qty, 0);

  let tt;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(tt);
    tt = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
  }

  // ---------- catalog ----------
  grid.innerHTML = PRODUCTS.map((p) => `
    <article class="card" data-id="${p.id}" data-brand="${p.brand.toLowerCase()}">
      <button class="card__media" data-qv="${p.id}" aria-label="Quick view ${p.brand} ${p.name}">
        <img src="${imgUrl('cat-' + p.id)}" alt="${p.brand} ${p.name}" loading="lazy" decoding="async">
        <span class="card__glare"></span>
        <span class="card__tag">${p.tag}</span>
      </button>
      <div class="card__body">
        <div>
          <div class="card__brand">${p.brand}</div>
          <div class="card__name">${p.name}</div>
          <div class="card__price">$${p.price}</div>
        </div>
        <button class="card__add" data-add="${p.id}" aria-label="Add ${p.name} to cart, size EU 42">+</button>
      </div>
    </article>`).join('');

  if (!RM) {
    reveal(gsap.from('.card', { y: 60, opacity: 0, rotateX: -12, stagger: .08, duration: .9, ease: 'expo.out', paused: true, clearProps: 'transform' }), grid);
  }

  // tilt + glare
  if (!RM && matchMedia('(hover: hover)').matches) {
    grid.querySelectorAll('.card').forEach((c) => {
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
        c.style.transform = `rotateY(${(nx - .5) * 12}deg) rotateX(${(.5 - ny) * 10}deg) translateZ(0)`;
        c.style.setProperty('--gx', `${nx * 100}%`);
        c.style.setProperty('--gy', `${ny * 100}%`);
      });
      c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    });
  }

  // filters
  document.querySelectorAll('.filter').forEach((f) => f.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach((x) => { x.classList.toggle('is-on', x === f); x.setAttribute('aria-selected', x === f); });
    const v = f.dataset.f;
    const cards = [...grid.querySelectorAll('.card')];
    cards.forEach((c) => c.classList.toggle('is-hidden', v !== 'all' && c.dataset.brand !== v));
    if (!RM) gsap.fromTo(cards.filter((c) => !c.classList.contains('is-hidden')), { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, duration: .5, ease: 'power3.out' });
  }));

  // ---------- fly to cart ----------
  function fly(id, fromEl) {
    if (RM || !fromEl) { bump(); return; }
    const r = fromEl.getBoundingClientRect();
    const t = cartBtn.getBoundingClientRect();
    const img = new Image();
    img.src = imgUrl('cut-' + id, true);
    img.className = 'fly';
    img.alt = '';
    document.body.appendChild(img);
    const sx = r.left + r.width / 2 - 70, sy = r.top + r.height / 2 - 35;
    const tx = t.left + t.width / 2 - 70, ty = t.top + t.height / 2 - 35;
    gsap.set(img, { x: sx, y: sy, scale: .6, rotate: -10 });
    const tl = gsap.timeline({ onComplete: () => { img.remove(); bump(); } });
    tl.to(img, { x: tx, duration: .85, ease: 'power1.inOut' }, 0)
      .to(img, { y: Math.min(sy, ty) - 140, duration: .38, ease: 'power2.out' }, 0)
      .to(img, { y: ty, duration: .47, ease: 'power2.in' }, .38)
      .to(img, { scale: .18, rotate: 340, duration: .85, ease: 'power1.in' }, 0)
      .to(img, { opacity: 0, duration: .12 }, .75);
  }
  function bump() {
    renderCount();
    if (!RM) gsap.fromTo(cartBtn, { scale: 1 }, { scale: 1.35, duration: .16, yoyo: true, repeat: 1, ease: 'power2.out' });
  }
  function renderCount() { countEl.textContent = String(count()); }

  // ---------- add buttons (hero cards, catalog +) ----------
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    const id = b.dataset.add;
    add(id, 42);
    // fly from the product picture: catalog card, or the shoe on stage for hero buttons
    const card = b.closest('.card'), drop = b.closest('.drop-card');
    const src = card ? card.querySelector('.card__media')
      : drop ? document.querySelector(`.rig[data-drop="${drop.dataset.drop}"]`) : b;
    fly(id, src); // the count updates when the shoe lands
    toast(`${byId[id].name} — EU 42 added`);
  });

  // ---------- quick view ----------
  const qv = document.getElementById('qv');
  const panel = document.getElementById('qvPanel');
  const media = document.getElementById('qvMedia');
  const sizesEl = document.getElementById('qvSizes');
  let qvId = null, qvSize = null, lastFocus = null;

  grid.addEventListener('click', (e) => {
    const m = e.target.closest('[data-qv]');
    if (m) openQV(m.dataset.qv, m);
  });
  function openQV(id, fromEl) {
    const p = byId[id];
    qvId = id; qvSize = null; lastFocus = fromEl;
    document.getElementById('qvBrand').textContent = p.brand;
    document.getElementById('qvTitle').textContent = p.name;
    document.getElementById('qvPrice').textContent = `$${p.price}`;
    document.getElementById('qvCopy').textContent = p.copy;
    media.innerHTML = `<img src="${imgUrl('cat-' + id, true)}" alt="${p.brand} ${p.name}">`;
    sizesEl.innerHTML = SIZES.map((s) => `<button class="size" data-size="${s}" aria-pressed="false">${s}</button>`).join('');
    qv.hidden = false;
    document.documentElement.style.overflow = 'hidden'; document.dispatchEvent(new Event('sole:lock'));
    const img = media.querySelector('img');
    if (!RM && fromEl) {
      const a = fromEl.getBoundingClientRect();
      const b = media.getBoundingClientRect();
      gsap.fromTo('.qv__scrim', { opacity: 0 }, { opacity: 1, duration: .35 });
      gsap.fromTo(panel, { backgroundColor: 'rgba(239,235,228,0)' }, { backgroundColor: 'rgba(239,235,228,1)', duration: .35, delay: .25, clearProps: 'backgroundColor' });
      gsap.fromTo('.qv__body, .qv__close', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .4, delay: .3 });
      gsap.fromTo(img, {
        x: a.left - b.left, y: a.top - b.top, scaleX: a.width / b.width, scaleY: a.height / b.height, transformOrigin: '0 0',
      }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: .6, ease: 'expo.inOut' });
    } else {
      gsap.set('.qv__scrim', { opacity: 1 });
    }
    panel.querySelector('.qv__close').focus({ preventScroll: true });
  }
  function closeQV() {
    if (qv.hidden) return;
    const done = () => { qv.hidden = true; document.documentElement.style.overflow = ''; document.dispatchEvent(new Event('sole:unlock')); lastFocus?.focus({ preventScroll: true }); };
    if (RM) return done();
    gsap.to(qv, { opacity: 0, duration: .25, onComplete: () => { gsap.set(qv, { opacity: 1 }); done(); } });
  }
  qv.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeQV(); });
  sizesEl.addEventListener('click', (e) => {
    const s = e.target.closest('.size');
    if (!s) return;
    qvSize = Number(s.dataset.size);
    sizesEl.querySelectorAll('.size').forEach((x) => { x.classList.toggle('is-on', x === s); x.setAttribute('aria-pressed', x === s); });
  });
  document.getElementById('qvAdd').addEventListener('click', () => {
    if (!qvSize) {
      sizesEl.classList.remove('shake'); void sizesEl.offsetWidth; sizesEl.classList.add('shake');
      toast('Pick a size first');
      return;
    }
    add(qvId, qvSize);
    const from = media.querySelector('img');
    toast(`${byId[qvId].name} — EU ${qvSize} added`);
    const id = qvId;
    closeQV();
    fly(id, from);
  });

  // ---------- cart drawer ----------
  const cartEl = document.getElementById('cart');
  const list = document.getElementById('cartList');
  const cpanel = cartEl.querySelector('.cart__panel');
  function renderCart() {
    list.innerHTML = cart.map((i, n) => {
      const p = byId[i.id];
      return `<li class="cart__item">
        <img src="${imgUrl('cut-' + i.id, true)}" alt="">
        <div>
          <div class="cart__item-name">${p.name}</div>
          <div class="cart__item-meta">${p.brand} · EU ${i.size}</div>
          <div class="qty"><button data-q="${n}" data-d="-1" aria-label="Decrease">−</button><span>${i.qty}</span><button data-q="${n}" data-d="1" aria-label="Increase">+</button></div>
        </div>
        <div><div class="cart__item-price">$${p.price * i.qty}</div><button class="cart__remove" data-rm="${n}">Remove</button></div>
      </li>`;
    }).join('');
    document.getElementById('cartEmpty').hidden = cart.length > 0;
    document.getElementById('cartTotal').textContent = `$${cart.reduce((s, i) => s + byId[i.id].price * i.qty, 0)}`;
  }
  list.addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
    if (q) { const it = cart[+q.dataset.q]; it.qty += +q.dataset.d; if (it.qty < 1) cart.splice(+q.dataset.q, 1); }
    else if (rm) cart.splice(+rm.dataset.rm, 1);
    else return;
    save(); renderCart(); renderCount();
  });
  function openCart() {
    cartEl.hidden = false;
    document.documentElement.style.overflow = 'hidden'; document.dispatchEvent(new Event('sole:lock'));
    gsap.fromTo('.cart__scrim', { opacity: 0 }, { opacity: 1, duration: RM ? 0 : .3 });
    gsap.fromTo(cpanel, { xPercent: 100 }, { xPercent: 0, duration: RM ? 0 : .55, ease: 'expo.out' });
    if (!RM) gsap.from('.cart__item', { x: 40, opacity: 0, stagger: .05, duration: .4, delay: .15 });
    cpanel.querySelector('.qv__close').focus({ preventScroll: true });
  }
  function closeCart() {
    gsap.to('.cart__scrim', { opacity: 0, duration: RM ? 0 : .25 });
    gsap.to(cpanel, { xPercent: 100, duration: RM ? 0 : .35, ease: 'power3.in', onComplete: () => { cartEl.hidden = true; document.documentElement.style.overflow = ''; document.dispatchEvent(new Event('sole:unlock')); cartBtn.focus({ preventScroll: true }); } });
  }
  cartBtn.addEventListener('click', openCart);
  cartEl.addEventListener('click', (e) => { if (e.target.closest('[data-close-cart]')) closeCart(); });
  document.getElementById('checkout').addEventListener('click', () => {
    toast(cart.length ? 'Checkout opens soon — nothing was charged. Your bag is saved on this device.' : 'Your bag is empty');
  });
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!qv.hidden) closeQV();
    else if (!cartEl.hidden) closeCart();
  });

  // ---------- finale conveyor ----------
  const belt = document.getElementById('belt');
  const shoes = PRODUCTS.map((p) => `<img src="${imgUrl('cut-' + p.id, true)}" alt="" loading="lazy">`).join('');
  belt.innerHTML = shoes + shoes;

  renderCart();
  renderCount();
}
