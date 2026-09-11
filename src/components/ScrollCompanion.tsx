import { useEffect, useRef } from "react";
import { Gift, Star } from "lucide-react";

/**
 * عنصر مرافق للتمرير: بطاقة ولاء «رِجعة» ثلاثية الأبعاد
 * تطفو على جانب الشاشة وتدور وتميل بنعومة مع التمرير.
 */
export function ScrollCompanion() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!wrap || !card || !glow) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const { gsap } = await import("gsap");
      if (cancelled) return;

      gsap.set(wrap, { autoAlpha: 0, x: -24 });
      gsap.to(wrap, { autoAlpha: 1, x: 0, duration: 0.9, ease: "power3.out", delay: 0.6 });

      const travel = () => window.innerHeight - wrap.offsetHeight - 64;

      const moveY = gsap.quickTo(wrap, "y", { duration: 1, ease: "power3.out" });
      const rotY = gsap.quickTo(card, "rotationY", { duration: 1.2, ease: "power3.out" });
      const rotX = gsap.quickTo(card, "rotationX", { duration: 0.8, ease: "power3.out" });
      const glowTo = gsap.quickTo(glow, "autoAlpha", { duration: 0.6, ease: "power2.out" });

      // دوران خفيف دائم حتى بدون تمرير
      const idle = gsap.to(card, {
        rotationZ: 3,
        y: -6,
        duration: 2.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      let lastY = window.scrollY;
      let raf = 0;

      const update = () => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        const delta = window.scrollY - lastY;
        lastY = window.scrollY;

        moveY(p * travel());
        rotY(p * 360);
        rotX(gsap.utils.clamp(-14, 14, delta * 0.3));
        glowTo(0.5 + p * 0.5);
      };

      const onScroll = () => {
        if (!raf) raf = requestAnimationFrame(update);
      };

      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);

      cleanup = () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        if (raf) cancelAnimationFrame(raf);
        idle.kill();
        gsap.killTweensOf([wrap, card, glow]);
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-y-0 left-5 z-40 hidden lg:block"
    >
      <div
        ref={wrapRef}
        className="absolute left-0 top-12"
        style={{ perspective: "800px" }}
      >
        {/* توهج خلف البطاقة */}
        <div
          ref={glowRef}
          className="absolute -inset-6 rounded-full bg-reward-coral/25 blur-2xl"
        />

        {/* بطاقة الولاء ثلاثية الأبعاد */}
        <div
          ref={cardRef}
          className="relative h-24 w-40 overflow-hidden rounded-2xl bg-gradient-to-br from-venmo-ink via-venmo-blue to-venmo-ink text-white shadow-2xl shadow-venmo-ink/30 ring-1 ring-white/25"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* لمعان علوي */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          {/* دوائر زخرفية */}
          <div className="absolute -left-6 -top-6 size-20 rounded-full bg-reward-coral/30 blur-md" />
          <div className="absolute -bottom-8 -right-4 size-24 rounded-full bg-brand-yellow/25 blur-md" />

          <div className="relative flex h-full flex-col justify-between p-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-black tracking-tight">رِجعة</span>
              <Star className="size-4 fill-brand-yellow text-brand-yellow" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] text-white/60">نقاط الولاء</p>
                <p className="text-lg font-black leading-none">2,450</p>
              </div>
              <div className="grid size-8 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Gift className="size-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
