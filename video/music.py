"""Original trap beat for the SOLE/LAB promo, synthesised from scratch (no samples, no licence).

150 BPM: 1 beat = 0.4 s = 12 video frames @30 fps, 1 bar = 1.6 s = 48 frames.
usage: python music.py reels|youtube out.wav
The arrangement is a list of sections; cues (impacts, whooshes, risers) sit on bar/beat positions
that the video edit uses as its cut points (see cues.json written next to the wav).
"""
import json
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
BPM = 150
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)


# ---------- helpers ----------
def t_arr(dur):
    return np.arange(int(dur * SR)) / SR


def env_exp(n, decay):
    return np.exp(-np.arange(n) / SR / decay)


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100), 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def note_hz(n):  # midi
    return 440 * 2 ** ((n - 69) / 12)


def place(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[1]:
        return
    sig = sig[: buf.shape[1] - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(sig)] += sig * gain * l * 1.414
    buf[1, i:i + len(sig)] += sig * gain * r * 1.414


# ---------- instruments ----------
def kick():
    n = int(.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t / .035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env_exp(n, .16)
    click = hp(rng.standard_normal(n), 3000) * env_exp(n, .004) * .35
    return np.tanh((body + click) * 1.6) * .9


def eight08(midi, dur, glide_from=None):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = np.full(n, note_hz(midi))
    if glide_from is not None:
        g = np.exp(-t / .06)
        f = note_hz(midi) + (note_hz(glide_from) - note_hz(midi)) * g
    ph = 2 * np.pi * np.cumsum(f) / SR
    a = np.minimum(1, t / .004) * np.exp(-t / max(.25, dur * .7))
    x = np.sin(ph) + .25 * np.sin(2 * ph)
    return np.tanh(x * a * 2.2) * .55


def clap():
    n = int(.35 * SR)
    noise = bp(rng.standard_normal(n), 900, 5000)
    e = np.zeros(n)
    for d in (0, .011, .022):
        i = int(d * SR)
        e[i:] += env_exp(n - i, .012 if d < .02 else .09)
    body = np.sin(2 * np.pi * 190 * np.arange(n) / SR) * env_exp(n, .03) * .4
    x = noise * e * .5 + body
    ir = rng.standard_normal(int(.5 * SR)) * env_exp(int(.5 * SR), .12) * .08
    return x + fftconvolve(x, ir)[:n] * .6


def hat(open_=False):
    n = int((.32 if open_ else .06) * SR)
    x = hp(rng.standard_normal(n), 7000)
    return x * env_exp(n, .09 if open_ else .014) * (.22 if open_ else .18)


def pad(chord, dur, cutoff=1400):
    t = t_arr(dur)
    x = np.zeros_like(t)
    for m in chord:
        for det in (-.11, 0, .09):
            f = note_hz(m) * 2 ** (det / 12)
            x += ((t * f) % 1 * 2 - 1)
    x = lp(x / (len(chord) * 3), cutoff, 2)
    a = np.minimum(1, t / .25) * np.minimum(1, (dur - t) / .2).clip(0)
    return x * a * .28


def bell(midi, dur=1.2):
    t = t_arr(dur)
    f = note_hz(midi)
    mod = np.sin(2 * np.pi * f * 3.5 * t) * 2.2 * np.exp(-t / .25)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / .55)
    return x * .22


def riser(dur):
    t = t_arr(dur)
    noise = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    seg = 2048
    for i in range(0, len(t), seg):
        k = i / len(t)
        fc = 300 + 9000 * k ** 2
        out[i:i + seg] = bp(noise[i:i + seg], fc * .7, min(fc * 1.3, SR / 2 - 200), 1)
    saw = ((t * (110 * 2 ** (t / dur * 2))) % 1 * 2 - 1) * .08
    return (out * .35 + lp(saw, 3000)) * (t / dur) ** 1.6


def whoosh(dur=.45):
    t = t_arr(dur)
    noise = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    seg = 1024
    for i in range(0, len(t), seg):
        k = i / len(t)
        fc = 800 + 6000 * np.sin(np.pi * k)
        out[i:i + seg] = bp(noise[i:i + seg], fc * .6, min(fc * 1.4, SR / 2 - 200), 1)
    return out * np.sin(np.pi * t / dur) ** 2 * .5


def impact():
    n = int(2.2 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(35 + 60 * np.exp(-t / .08)) / SR) * env_exp(n, .5)
    crash = hp(rng.standard_normal(n), 2500) * env_exp(n, .6) * .25
    return np.tanh((boom * 1.4 + crash)) * .8


# ---------- patterns ----------
SCALE_ROOT = 57  # A3
PROG = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]]  # Am F G Em
BASS = [33, 29, 31, 28]  # A1 F1 G1 E1
MOTIF = [76, 72, 69, 72, 74, 72, 67, 69]  # bell line, eighths-ish


def bar_drums(buf, t0, level, bar_idx, roll=False):
    if level <= 0:
        return
    # kick: trap half-time pattern
    for b in ([0, 1.75, 2.5] if level >= 2 else [0]):
        place(buf, kick(), t0 + b * BEAT, .95)
    # clap on 3 (half-time backbeat)
    if level >= 1:
        place(buf, clap(), t0 + 2 * BEAT, .8)
    # hats: 8ths, with a 1/32 roll on the last beat every other bar
    if level >= 1:
        for s in range(8):
            place(buf, hat(), t0 + s * BEAT / 2, .9 if s % 2 == 0 else .6, pan=.25)
        if roll or bar_idx % 2 == 1:
            for s in range(8):
                place(buf, hat(), t0 + 3 * BEAT + s * BEAT / 8, .35 + s * .06, pan=-.2)
        place(buf, hat(True), t0 + 1.5 * BEAT, .7, pan=-.3)


def bar_808(buf, t0, bar_idx):
    root = BASS[bar_idx % 4]
    place(buf, eight08(root, BEAT * 1.7), t0, 1)
    place(buf, eight08(root, BEAT * .9, glide_from=root + 12), t0 + 1.75 * BEAT, .9)
    place(buf, eight08(root + 7 if bar_idx % 2 else root, BEAT * 1.4), t0 + 2.5 * BEAT, .9)


def bar_music(buf, t0, bar_idx, pad_cut, bells=True):
    place(buf, pad(PROG[bar_idx % 4], BAR, pad_cut), t0, 1)
    if bells:
        for i, m in enumerate(MOTIF):
            if i % 2 == 0 or bar_idx % 2 == 0:
                place(buf, bell(m), t0 + i * BEAT / 2, .9, pan=(-.35 if i % 2 else .35))


# ---------- arrangements ----------
# each section: (bars, drums level 0-2, 808 on/off, pad cutoff, bells)
ARR = {
    'reels': [
        (2, 0, False, 900, True),    # 0-1 hook: bells + riser
        (8, 2, True, 2600, True),    # 2-9 drop
        (2, 1, False, 1800, True),   # 10-11 lift
        (3, 2, True, 3000, True),    # 12-14 drop 2
        (1, 0, False, 1200, False),  # 15 end card
    ],
    'youtube': [
        (4, 0, False, 800, True),    # 0-3 intro
        (12, 2, True, 2600, True),   # 4-15 drop
        (4, 1, False, 1500, True),   # 16-19 break
        (2, 1, False, 2200, True),   # 20-21 build
        (8, 2, True, 3000, True),    # 22-29 drop 2
        (2, 0, False, 1200, False),  # 30-31 outro
    ],
}
# cue points (in bars) for impacts / risers / whooshes; the edit cuts on these
CUES = {
    'reels': {'impact': [0, 2, 15], 'riser': [(0.5, 1.5)], 'whoosh': [4, 6, 8, 10, 12, 13.5], 'riser2': [(11, 1)]},
    'youtube': {'impact': [0, 4, 22, 30], 'riser': [(1, 3), (20, 2)], 'whoosh': [6, 8, 10, 12, 14, 16, 18, 24, 26, 28]},
}


def render(name):
    sections = ARR[name]
    total_bars = sum(s[0] for s in sections)
    dur = total_bars * BAR + 2.0
    buf = np.zeros((2, int(dur * SR)))
    bar = 0
    for bars, drums, b808, cut, bells in sections:
        for k in range(bars):
            t0 = bar * BAR
            bar_music(buf, t0, bar, cut, bells)
            bar_drums(buf, t0, drums, bar, roll=(k == bars - 1))
            if b808:
                bar_808(buf, t0, bar)
            bar += 1
    c = CUES[name]
    for b in c['impact']:
        place(buf, impact(), b * BAR - (0 if b == 0 else .0), .9)
    for start, length in c.get('riser', []) + c.get('riser2', []):
        r = riser(length * BAR)
        place(buf, r, start * BAR, .8)
    for b in c['whoosh']:
        place(buf, whoosh(), b * BAR - .22, .7, pan=.0)
    # final bell ring on the end card
    place(buf, bell(81, 2.5), (total_bars - 1) * BAR + .02, 1.1)
    # sidechain-ish duck of pads under kicks: simple envelope on low-mid band skipped; master
    buf = hp(buf, 28)
    peak = np.max(np.abs(buf))
    buf = np.tanh(buf / peak * 1.3) * .89
    return buf, total_bars, c


if __name__ == '__main__':
    name, out = sys.argv[1], sys.argv[2]
    buf, bars, cues = render(name)
    import wave
    pcm = (np.clip(buf.T, -1, 1) * 32767).astype('<i2')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    meta = {'bpm': BPM, 'bar_s': BAR, 'bars': bars, 'video_s': bars * BAR, 'cues': cues}
    with open(out.replace('.wav', '.json'), 'w') as f:
        json.dump(meta, f, indent=1)
    print(meta)
