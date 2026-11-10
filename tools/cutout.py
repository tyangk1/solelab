"""Cut out shoes shot on a plain grey studio backdrop.

Step 1 is PhotoCraft (`layer.removeBackground`, refine on), run by the caller.
Step 2 (here): PhotoCraft's subject model drops low-contrast white parts on
light grey (e.g. the AF1 heel tab). We estimate the backdrop as a smooth
gradient from the image border, and add back pixels that are clearly
BRIGHTER than the backdrop and lie near the PhotoCraft mask. Darker pixels
(the baked contact shadow) are never added, so the shadow stays removed.

usage: python -I cutout.py <original.png> <photocraft_cut.png> <out.png>
"""
import sys
import numpy as np
from PIL import Image, ImageFilter


def backdrop(lum: np.ndarray) -> np.ndarray:
    """Fit a 2nd-order polynomial surface to a 6% border band."""
    h, w = lum.shape
    b = int(min(h, w) * 0.06)
    mask = np.zeros_like(lum, dtype=bool)
    mask[:b, :] = mask[-b:, :] = mask[:, :b] = mask[:, -b:] = True
    mask[-int(h * 0.25):, int(w * 0.75):] = False  # skip the corner watermark
    ys, xs = np.nonzero(mask)
    yn, xn = ys / h, xs / w
    A = np.stack([np.ones_like(xn), xn, yn, xn * xn, yn * yn, xn * yn], 1)
    coef, *_ = np.linalg.lstsq(A, lum[ys, xs], rcond=None)
    Y, X = np.mgrid[0:h, 0:w]
    Yn, Xn = Y / h, X / w
    return coef[0] + coef[1] * Xn + coef[2] * Yn + coef[3] * Xn * Xn + coef[4] * Yn * Yn + coef[5] * Xn * Yn


def main(orig_p: str, cut_p: str, out_p: str) -> None:
    orig = Image.open(orig_p).convert("RGB")
    cut = Image.open(cut_p).convert("RGBA")
    rgb = np.asarray(orig).astype(np.float32)
    lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    bg = backdrop(lum)
    alpha = np.asarray(cut.getchannel("A")).astype(np.float32) / 255

    # near the existing mask: dilate it by ~4% of width
    r = max(3, int(orig.width * 0.04)) | 1
    near = np.asarray(cut.getchannel("A").point(lambda v: 255 if v > 128 else 0)
                      .filter(ImageFilter.MaxFilter(min(r, 61)))
                      .filter(ImageFilter.MaxFilter(min(r, 61)))) > 0

    lift = lum - bg  # positive = brighter than the backdrop
    extra = np.clip((lift - 10) / 18, 0, 1) * near
    extra_img = Image.fromarray((extra * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
    extra = np.asarray(extra_img).astype(np.float32) / 255
    out_a = np.maximum(alpha, extra)

    out = np.dstack([rgb, out_a * 255]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(out_p)
    added = int(((extra > 0.5) & (alpha < 0.5)).sum())
    print(f"{out_p}: added {added} px")


if __name__ == "__main__":
    main(*sys.argv[1:4])
