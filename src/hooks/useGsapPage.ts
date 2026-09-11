import { useEffect, type RefObject } from "react";

/**
 * Strong GSAP entrance + scroll choreography for marketing pages.
 * Runs client-side only; respects prefers-reduced-motion.
 */
export function useGsapPage(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        // Header
        gsap.from("header > div > *", {
          y: -24,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
        });

        // Hero
        const heroTl = gsap.timeline({ defaults: { ease: "power4.out" } });
        heroTl
          .from("[data-gsap='hero-title']", {
            y: 70,
            opacity: 0,
            scale: 0.94,
            duration: 1.1,
          })
          .from(
            "[data-gsap='hero-copy'] > *",
            { y: 30, opacity: 0, duration: 0.8, stagger: 0.12 },
            "-=0.65",
          )
          .from(
            "[data-gsap='hero-visual']",
            { y: 90, opacity: 0, scale: 0.96, duration: 1.1 },
            "-=0.6",
          );

        // Generic section reveals
        const inView = (el: HTMLElement) =>
          el.getBoundingClientRect().top < window.innerHeight * 0.95;

        const sections = gsap.utils.toArray<HTMLElement>("main section");
        sections.forEach((section, i) => {
          if (i === 0) return; // hero handled above
          const visible = inView(section);
          gsap.from(section, {
            y: 60,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            clearProps: "opacity,transform",
            ...(visible
              ? {}
              : {
                  scrollTrigger: {
                    trigger: section,
                    start: "top 88%",
                    once: true,
                  },
                }),
          });

          const items = gsap.utils.toArray<HTMLElement>(
            section.querySelectorAll("article, [data-gsap='item']"),
          );
          if (items.length) {
            gsap.from(items, {
              y: 48,
              opacity: 0,
              scale: 0.97,
              duration: 0.7,
              ease: "back.out(1.4)",
              stagger: 0.1,
              clearProps: "opacity,transform",
              ...(visible
                ? { delay: 0.15 }
                : {
                    scrollTrigger: {
                      trigger: section,
                      start: "top 80%",
                      once: true,
                    },
                  }),
            });
          }
        });


        // Parallax on media
        gsap.utils
          .toArray<HTMLElement>("main img, main video")
          .forEach((media) => {
            gsap.to(media, {
              yPercent: -8,
              ease: "none",
              scrollTrigger: {
                trigger: media,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            });
          });

        // Footer
        gsap.from("footer > div", {
          y: 70,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: "footer", start: "top 92%" },
        });

        ScrollTrigger.refresh();
      }, root);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [scope]);
}
