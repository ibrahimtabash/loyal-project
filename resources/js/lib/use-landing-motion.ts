import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function useLandingMotion(root: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !root.current) return;
    const media = gsap.matchMedia();
    media.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 801px)' }, (context) => {
      if (!context.conditions?.motion) return;
      const select = gsap.utils.selector(root);
      const desktop = context.conditions.desktop;
      gsap.from(select('.wisal-hero > .wisal-kicker, .wisal-hero > h1, .wisal-hero > p, .wisal-hero-actions'), { opacity: 0, y: 20, stagger: .1, duration: .75, ease: 'power3.out' });
      const targets = select('.wisal-proof, .wisal-section-heading, .wisal-feature-grid article, .wisal-commerce > div, .ravo-reward-story > *, .ravo-section-intro, .ravo-step-layout, .ravo-faq details, .wisal-final-cta, .wisal-footer, .depth-copy');
      targets.forEach((element: Element) => {
        gsap.from(element, { opacity: 0, y: 25, duration: .7, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 94%', once: true } });
      });
      const coinSection = select('.ravo-depth-points')[0];
      gsap.timeline({ scrollTrigger: { trigger: coinSection, start: 'top bottom', end: 'bottom top', scrub: 1 } })
        .fromTo(select('.depth-coin'), { rotationY: -35, rotationX: 15 }, { rotationY: desktop ? 215 : 145, rotationX: -12, ease: 'none' }, 0)
        .fromTo(select('.depth-orbit'), { rotationZ: -25 }, { rotationZ: 100, stagger: .05, ease: 'none' }, 0)
        .fromTo(select('.depth-satellite'), { z: -30, rotationY: -20 }, { z: 60, rotationY: 25, ease: 'none' }, 0);
      gsap.timeline({ scrollTrigger: { trigger: select('.ravo-depth-store')[0], start: 'top 90%', end: 'bottom 25%', scrub: 1 } })
        .fromTo(select('.store-scene .depth-browser'), { rotationY: -18, rotationX: 8, z: 0 }, { rotationY: 5, rotationX: 0, z: 0, duration: 1, ease: 'none' }, 0)
        .fromTo(select('.store-scene .browser-middle'), { x: 0, y: 0, xPercent: -18, yPercent: -10 }, { xPercent: -32, yPercent: -16, duration: 1, ease: 'none' }, 0)
        .fromTo(select('.store-scene .browser-back'), { x: 0, y: 0, xPercent: 18, yPercent: 10 }, { xPercent: 32, yPercent: 16, duration: 1, ease: 'none' }, 0);
      const refresh = () => ScrollTrigger.refresh();
      const images = Array.from(root.current!.querySelectorAll('img'));
      images.forEach(image => image.addEventListener('load', refresh));
      let disposed = false;
      document.fonts.ready.then(() => { if (!disposed) refresh(); });
      return () => { disposed = true; images.forEach(image => image.removeEventListener('load', refresh)); };
    }, root);
    return () => media.revert();
  }, [enabled, root]);
}
