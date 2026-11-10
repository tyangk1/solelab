"""Encode processed images (work/) into display-size WebP (assets/img/).

Inputs:  work/cut/*.png   PhotoCraft cutouts (transparent)
         work/clean/*.png PhotoCraft watermark-removed full-bleed photos
Outputs: assets/img/<name>.webp (desktop) and <name>-m.webp (mobile)
         assets/img/exploded-<n>.webp + assets/exploded.json (part boxes)
Prints a byte report.
"""
import json
import os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img")
os.makedirs(OUT, exist_ok=True)
report = []


def save(im: Image.Image, name: str, width: int, q: int) -> None:
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    p = os.path.join(OUT, name + ".webp")
    if im.mode == "RGBA":
        a = np.asarray(im)
        a = a.copy()
        a[a[..., 3] < 6] = 0  # drop near-invisible fringe
        im = Image.fromarray(a, "RGBA")
        im.save(p, "WEBP", quality=q, alpha_quality=90, method=6)
    else:
        im.convert("RGB").save(p, "WEBP", quality=q, method=6)
    report.append((name, os.path.getsize(p), im.size))


def both(src: str, name: str, dw: int, mw: int, q: int = 80, crop=None) -> None:
    im = Image.open(src)
    im = im.convert("RGBA" if "cut" in src else "RGB")
    if crop:
        im = im.crop(crop(im))
    save(im, name, dw, q)
    save(im, name + "-m", mw, q)


cut = lambda n: os.path.join(ROOT, "work", "cut", n + ".png")
clean = lambda n: os.path.join(ROOT, "work", "clean", n + ".png")

# hero drops: crop each view to its bbox (+2% pad); the page centres them in a stage box.
def bbox_union(names):
    boxes = [Image.open(cut(n)).getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox() for n in names]
    return (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))


def padded(box, im, pad=0.02):
    p = int((box[2] - box[0]) * pad)
    return (max(0, box[0] - p), max(0, box[1] - p), min(im.width, box[2] + p), min(im.height, box[3] + p))


airmax_set = ["hero-airmax90", "color-airmax90-blue", "color-airmax90-black"]
ub = bbox_union(airmax_set)  # shared box keeps the colorways pixel-aligned
for n in airmax_set:
    both(cut(n), n, 1400, 760, 84, crop=lambda im: padded(ub, im))
for n in ["hero-samba", "hero-ultraboost"]:
    b = bbox_union([n])
    both(cut(n), n, 1400, 760, 84, crop=lambda im, b=b: padded(b, im))
# side views for the spin (from the catalog cutouts)
for n in ["airmax90", "samba", "ultraboost"]:
    b = bbox_union(["cat-" + n])
    both(cut("cat-" + n), "side-" + n, 1400, 760, 84, crop=lambda im, b=b: padded(b, im))

# catalog: photos on studio grey (cards) + cutouts (cart fly, conveyor)
for n in ["airforce1", "dunklow", "gazelle", "airmax90", "samba", "ultraboost"]:
    both(clean("cat-" + n), "cat-" + n, 900, 600, 80)
    src = cut("af1-fixed") if n == "airforce1" else cut("cat-" + n)
    im = Image.open(src).convert("RGBA")
    im = im.crop(im.getbbox())
    save(im, "cut-" + n, 640, 82)

# boxes
both(cut("box-closed-obj"), "box-closed", 1000, 620, 80)
both(cut("box-open-obj"), "box-open", 1000, 620, 80)

# full-bleed backgrounds / macro / lifestyle / night
for n in ["bg-infrared", "bg-green", "bg-black-neon", "bg-night-street"]:
    both(clean(n), n, 1920, 1080, 70)
for n in ["macro-mesh", "macro-airunit", "macro-suede", "macro-gumsole"]:
    both(clean(n), n, 1600, 900, 74)
both(clean("life-street"), "life-street", 1600, 900, 74)
both(clean("life-court"), "life-court", 1100, 760, 74, crop=lambda im: (0, 0, im.width - 48, im.height))
both(clean("life-stairs"), "life-stairs", 1100, 760, 74)
both(clean("night-reflective"), "night-reflective", 1600, 900, 76)

# exploded view: split into parts by connected component, small bits join nearest part
ex = Image.open(cut("exploded-obj")).convert("RGBA")
A = np.asarray(ex)
mask = A[..., 3] > 40
lab, n = ndimage.label(ndimage.binary_closing(mask, iterations=3))
sizes = ndimage.sum(mask, lab, range(1, n + 1))
big = [i + 1 for i, s in enumerate(sizes) if s > 3000]
bigmask = np.isin(lab, big)
_, (iy, ix) = ndimage.distance_transform_edt(~bigmask, return_indices=True)
owner = lab[iy, ix]
alpha_any = A[..., 3] > 0
parts = []
big.sort(key=lambda L: ndimage.find_objects((lab == L).astype(int))[0][0].start)
for k, L in enumerate(big):
    sel = (owner == L) & alpha_any
    P = A.copy()
    P[~sel] = 0
    im = Image.fromarray(P, "RGBA")
    bb = im.getbbox()
    im = im.crop(bb)
    name = f"exploded-{k}"
    scale = 1700 / ex.width
    save(im, name, max(1, round(im.width * scale)), 82)
    parts.append({"name": name, "x": bb[0] / ex.width, "y": bb[1] / ex.height,
                  "w": (bb[2] - bb[0]) / ex.width, "h": (bb[3] - bb[1]) / ex.height})
with open(os.path.join(ROOT, "assets", "exploded.json"), "w") as f:
    json.dump({"aspect": ex.width / ex.height, "parts": parts}, f, indent=1)

tot = 0
for name, b, size in report:
    tot += b
    print(f"{name:28s} {b/1024:8.0f} KB  {size[0]}x{size[1]}")
print(f"TOTAL {tot/1024/1024:.1f} MB in {len(report)} files")
