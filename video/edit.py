"""Build the EffectCraft edit (a command list) for one version of the promo.

usage: python edit.py reels|youtube  -> edit-<v>.json, then:
  effectcraft-cli run --commands edit-<v>.json --empty --save-as <v>.ecproj
  effectcraft-cli render --project <v>.ecproj --comp <v> --out out/solelab-<v>.mp4 --format h264 --audio on

Scenes butt together on the music grid (150 BPM, 48 frames per bar). Every cut gets a whip:
outgoing plate smears sideways (Directional Blur + Transform), incoming plate lands from 118 %.
A top adjustment layer punches the zoom on half-bars in the drops; a white solid flashes on impacts;
a grade layer adds contrast, vibrance, vignette and fine grain.
"""
import glob
import json
import os
import sys

import subprocess

V = sys.argv[1]
ROOT = os.path.dirname(os.path.abspath(__file__)).replace('\\', '/')
FPS = 30
TL = json.load(open(f'{ROOT}/timeline-{V}.json'))
BAR = TL['frames_per_bar']
W, H = (1080, 1920) if V == 'reels' else (1920, 1080)
ORDER = [s[0] for s in TL['scenes']]
IMPACTS = [round(b * BAR) for b in TL['impacts']]
DROPS = TL['drops']  # bars where the zoom punches on every half bar

# music: cut the track so video frame 0 sits on the downbeat of track_start_bar, fade the tail
bar_s = BAR / FPS
start_s = TL['downbeat_s'] + TL['track_start_bar'] * bar_s
dur_s = round(TL['bars'] * BAR) / FPS
fade = TL['fade_out_bars'] * bar_s
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{start_s:.4f}', '-t', f'{dur_s:.4f}', '-i', f"{ROOT}/{TL['track']}",
                '-af', f'afade=t=in:d=0.02,afade=t=out:st={dur_s - fade:.3f}:d={fade:.3f}', '-ar', '48000', '-ac', '2',
                f'{ROOT}/audio/{V}-cut.wav'], check=True)

cmds = []
def c(command, **params):
    cmds.append({'command': command, 'params': params})

def key(layer, path, frame, value):
    c('prop.addKey', layer=layer, path=path, time=round(frame / FPS, 5), timeBase='comp', value=value)

# scenes and their start frames
scenes = []
t = 0
for s in ORDER:
    n = len(glob.glob(f'{ROOT}/frames/{V}/{s}/*.jpg'))
    scenes.append((s, t, n))
    t += n
TOTAL = t
c('comp.new', name=V, width=W, height=H, frameRate=FPS, duration=round(TOTAL / FPS, 4), background='#000000', open=True)

item = 2  # comp is item 1; imports count up from 2
for s, start, n in scenes:
    c('file.import', paths=[f'{ROOT}/frames/{V}/{s}/0000.jpg'], sequence=True, frameRate=FPS)
    c('project.rename', item=item, name=s)
    item += 1
c('file.import', paths=[f'{ROOT}/audio/{V}-cut.wav'])
c('project.rename', item=item, name='music')

for s, start, n in scenes:
    c('layer.addItem', item=s, time=round(start / FPS, 5))
    c('effect.apply', effect='Directional Blur', layers=[s])   # effects/#1
    c('effect.apply', effect='Transform', layers=[s])          # effects/#2
    c('prop.set', layer=s, path='effects/#1/direction', value=90)

cx, cy = W / 2, H / 2
SMEAR = 170 if V == 'reels' else 220
for i in range(1, len(scenes)):
    a, b = scenes[i - 1], scenes[i]
    C = b[1]
    hard = C in IMPACTS  # impacts get a flash, not a whip
    A, B = a[0], b[0]
    if not hard:
        key(A, 'effects/#1/length', C - 5, 0)
        key(A, 'effects/#1/length', C - 1, SMEAR)
        key(A, 'effects/#2/position', C - 5, [cx, cy])
        key(A, 'effects/#2/position', C - 1, [cx - W * .14, cy])
        key(B, 'effects/#1/length', C, SMEAR)
        key(B, 'effects/#1/length', C + 6, 0)
        key(B, 'effects/#2/position', C, [cx + W * .12, cy])
        key(B, 'effects/#2/position', C + 6, [cx, cy])
    key(B, 'effects/#2/scaleHeight', C, 118)
    key(B, 'effects/#2/scaleHeight', C + 8, 100)

# zoom punch on half bars inside the drops (skip frames next to cuts)
cuts = {b[1] for b in scenes}
c('layer.newAdjustment', name='punch')
c('effect.apply', effect='Transform', layers=['punch'])
for b0, b1 in DROPS:
    for hb in range(int(b0 * 2), int(b1 * 2)):
        f = round(hb * BAR / 2)
        if any(abs(f - x) < 10 for x in cuts):
            continue
        key('punch', 'effects/#1/scaleHeight', f, 104)
        key('punch', 'effects/#1/scaleHeight', f + 8, 100)

# white flash on impacts
c('layer.newSolid', name='flash', color='#ffffff', width=W, height=H)
key('flash', 'transform/opacity', 0, 0)
for f in IMPACTS:
    if f == 0:
        continue
    key('flash', 'transform/opacity', f - 1, 0)
    key('flash', 'transform/opacity', f, 75)
    key('flash', 'transform/opacity', f + 5, 0)

# grade
c('layer.newAdjustment', name='grade')
c('effect.apply', effect='Lumetri Color', layers=['grade'])
c('prop.set', layer='grade', path='effects/#1/basicCorrection/tone/contrast', value=14)
c('prop.set', layer='grade', path='effects/#1/creative/adjustments/vibrance', value=16)
c('effect.apply', effect='CC Vignette', layers=['grade'])
c('prop.set', layer='grade', path='effects/#2/amount', value=28)
c('effect.apply', effect='Add Grain', layers=['grade'])
c('prop.set', layer='grade', path='effects/#3/tweaking/intensity', value=0.12)

c('layer.addItem', item='music', time=0)

out = f'{ROOT}/edit-{V}.json'
json.dump(cmds, open(out, 'w'), indent=1)
print(out, len(cmds), 'commands', TOTAL, 'frames', f'{TOTAL / FPS:.2f}s', 'cuts at', [s[1] for s in scenes])
