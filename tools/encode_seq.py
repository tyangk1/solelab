"""EffectCraft turntable PNG sequence (work/seq/tt_*.png) -> assets/seq/{d,m}/NN.webp
All frames are cropped to their union bounding box so the shoe stays put.
"""
import glob
import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frames = sorted(glob.glob(os.path.join(ROOT, "work", "seq", "tt_*.png")))
ims = [Image.open(f).convert("RGBA") for f in frames]
boxes = [im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox() for im in ims]
x0 = min(b[0] for b in boxes) - 12
y0 = min(b[1] for b in boxes) - 12
x1 = max(b[2] for b in boxes) + 12
y1 = max(b[3] for b in boxes) + 12
total = {}
for tag, width, q in (("d", 820, 80), ("m", 480, 76)):
    out = os.path.join(ROOT, "assets", "seq", tag)
    os.makedirs(out, exist_ok=True)
    total[tag] = 0
    for i, im in enumerate(ims):
        c = im.crop((x0, y0, x1, y1))
        if c.width > width:
            c = c.resize((width, round(c.height * width / c.width)), Image.LANCZOS)
        p = os.path.join(out, f"{i:02d}.webp")
        c.save(p, "WEBP", quality=q, alpha_quality=85, method=6)
        total[tag] += os.path.getsize(p)
meta = {"frames": len(ims), "aspect": (x1 - x0) / (y1 - y0)}
with open(os.path.join(ROOT, "assets", "seq", "meta.json"), "w") as f:
    json.dump(meta, f)
print(meta, {k: f"{v/1024/1024:.2f} MB" for k, v in total.items()})
