import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Play a paused entrance tween when `trigger` scrolls in. Unlike `once: true`,
 * jumping straight past the trigger (anchor link, fast fling) finishes the
 * tween instead of leaving the content stuck in its hidden "from" state.
 */
export function reveal(tween, trigger, start = 'top 85%') {
  ScrollTrigger.create({
    trigger,
    start,
    end: 'bottom top',
    onEnter: () => tween.play(),
    onEnterBack: () => tween.play(),
    onLeave: () => tween.progress(1),
    onLeaveBack: () => {},
    onRefresh: (self) => { if (self.progress > 0 && tween.progress() === 0) tween.progress(1); },
  });
  return tween;
}
