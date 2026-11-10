# SOLE/LAB — scroll-driven sneaker showcase

Live: **https://solelab.yan.io.vn**

An independent sneaker showcase built as a static page. It covers:
- 3 drops spinning on scroll
- an exploded view
- a true-360° "Lab Runner"
- a colorway paint wipe
- a flashlight reveal
- a Nike vs adidas compare slider
- a shop with quick view and a bag

Online checkout is not live yet.
SOLE/LAB is not affiliated with or endorsed by Nike, Inc. or adidas AG. Product names and marks belong to their owners.

## Stack
- Static HTML/CSS/JS in `site/`.
- GSAP 3.12.5 + ScrollTrigger (GreenSock Standard licence), Lenis 1.1.0 (MIT), vendored in `site/vendor/`.
- Served by nginx (`Dockerfile`, `nginx.conf`). Deployed on Coolify, which builds this repo's Dockerfile and routes the domain to port 80.

## Run locally
```
docker build -t solelab . && docker run --rm -p 8080:80 solelab   # http://localhost:8080
```
Or serve `site/` with any static server.

## Asset pipeline (`tools/`, `video/`)
- **Images:** Gemini (prompts in `docs-IMAGE-PROMPTS.md`) → PhotoCraft cutouts and watermark clean-up → `tools/encode.py` (WebP).
- **3D:** the Lab Runner 360° is a 72-frame EffectCraft render of the CC BY 4.0 "Materials Variants Shoe" (© 2021 Shopify, via the Khronos glTF Sample Assets).
- **Social images:** OG image and banner from DesignCraft (`tools/designcraft-assets.ps1`).
- **Promo video:** `video/` uses deterministic Playwright frame capture with a fake clock, edited in EffectCraft. Music files are not included; see `video/README.md`.

Credits: `site/assets/CREDITS.md`.
