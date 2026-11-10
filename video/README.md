# SOLE/LAB promo video pipeline

Two cuts from the live page, one music grid:
- `out/solelab-reels.mp4`: 1080×1920, 26 s, Reels/TikTok/Shorts
- `out/solelab-youtube.mp4`: 1920×1080, 51.2 s
- `out/thumbnail-youtube.png`: 1280×720, made in DesignCraft

## Steps
1. **Music.** The track is `audio/trackA.mp3`, chosen and downloaded by the owner from Pixabay; it carries no title or artist tag.
   - **Analyse:** `python analyze.py audio/trackA.mp3` reports 140 BPM, the first downbeat at 0.175 s, 51.455 frames per bar, and an energy map per bar. That map shows the build up to bar 7, then drops at bars 8–14, 19–27, 32–41 and 46–57.
   - **Grid:** `timeline-<v>.json` sets where the video starts in the track (`track_start_bar`), the scenes in bars, the impacts, the drops and the fade-out. `capture.mjs` and `edit.py` both read it, so every cut lands on a bar line, using cumulative rounding.
   - **Swap the track:** analyse the new file, then edit the two timeline files.
   - **Rejected options:**
     - The Pixabay API has no music endpoint (404).
     - The Pixabay site blocks automated browsers.
     - The synthesised beat in `music.py` sounded poor, so it is kept for reference only.
2. **Capture** (`capture.mjs` + `lib.mjs`, playwright-core driving system Chrome):
   - The page is served from disk through `route()`, so no server process is needed.
   - **The fake clock is frozen** with `clock.install()` + `clock.pauseAt()` and only advances with `runFor(1000/30)` per frame. GSAP, Lenis, ScrollTrigger scrub and timers are therefore frame-exact. CSS animations are set through `getAnimations().currentTime`.
     - `install()` alone lets time keep flowing.
     - `waitForFunction` needs `polling: 100`, because rAF is frozen.
   - Hero: `tl.time()` is driven directly so the shoe swaps land on whooshes. Other scenes scroll along eased key lists.
   - Clicks use `element.click()`. `page.click` auto-scrolls the page.
   - Kinetic type (pills, slams, end card) is an HTML overlay in the page, set per frame from Node, using the site's fonts.
   - Output: `frames/<v>/<scene>/NNNN.jpg`. Contact sheet: `python sheet.py <v> out.jpg`.
3. **Edit** (`edit.py` → `edit-<v>.json` → EffectCraft):
   - Image sequences go on the timeline back to back.
   - Every cut gets a whip: Directional Blur at 90°, a Transform slide, and the next scene landing from 118 %.
   - A `punch` adjustment layer scales to 104 % on half-bars in the drops.
   - A white `flash` solid fires on the impacts.
   - A `grade` layer applies Lumetri (contrast, vibrance), CC Vignette and Add Grain.
   - The music layer goes on last.
   ```
   effectcraft-cli run --commands edit-<v>.json --empty --save-as <v>.ecproj
   effectcraft-cli render --project <v>.ecproj --comp <v> --out out/solelab-<v>-raw.mp4 --format h264 --audio on --bitrate 16000 --progress
   ffmpeg -i out/solelab-<v>-raw.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.0:LRA=11 -ar 48000 -c:a aac -b:a 192k -movflags +faststart out/solelab-<v>.mp4
   ```
   - Reels render: 780 frames in about 5 min.
4. **Thumbnail**: `pwsh thumbnail.ps1` (DesignCraft).

Re-run everything: `node capture.mjs reels`, then `python edit.py reels` (it also cuts and fades the track into `audio/reels-cut.wav`), then the three commands above. Do the same for `youtube`.
Reels safe zone: keep 14 % clear at the top, 35 % at the bottom and 6 % at each side. Pills sit at 16 %, and the end card fits between 36 % and 56 %.
