import { useEffect, useRef } from "react";
import { Pause, Play } from "lucide-react";
import { gsap } from "gsap";
import "../../css/hero-experience.css";

export default function HeroExperience({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled || !root.current) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const select = gsap.utils.selector(root);
      const film = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1 });
      film.set(select('.film-shot-b, .film-word-b, .film-word-c'), { opacity: 0 })
        .set(select('.film-line'), { strokeDasharray: 1000, strokeDashoffset: 1000 })
        .set(select('.film-spark'), { scale: 0, transformOrigin: 'center' })
        .fromTo(select('.film-shot-a'), { scale: 1 }, { scale: 1.09, duration: 6, ease: 'none' }, 0)
        .fromTo(select('.film-word-a'), { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'power3.out' }, .4)
        .to(select('.film-line'), { strokeDashoffset: 0, duration: 2.8, stagger: .18, ease: 'power2.inOut' }, 1)
        .to(select('.film-word-a'), { opacity: 0, duration: .5 }, 3)
        .fromTo(select('.film-word-b'), { opacity: 0, scale: .93 }, { opacity: 1, scale: 1, duration: .8, ease: 'power3.out' }, 3.4)
        .to(select('.film-spark'), { scale: 1, duration: .6, stagger: .1, ease: 'back.out(2)' }, 3.5)
        .to(select('.film-shot-b'), { opacity: 1, duration: 1.4 }, 5.5)
        .fromTo(select('.film-shot-b'), { scale: 1.08 }, { scale: 1, duration: 5.5, ease: 'none' }, 5.5)
        .to(select('.film-word-b, .film-line, .film-spark'), { opacity: 0, duration: .6 }, 6.1)
        .fromTo(select('.film-word-c'), { opacity: 0, clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 1, ease: 'power3.out' }, 6.5)
        .to(select('.film-word-c'), { opacity: 0, duration: .7 }, 9.5)
        .to(select('.film-shot-b'), { opacity: 0, duration: 1 }, 10)
        .set(select('.film-line, .film-spark'), { opacity: 1 }, 11);
      let inView = false;
      const sync = () => { if (inView && !document.hidden) film.play(); else film.pause(); };
      const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { threshold: .15 });
      observer.observe(root.current!);
      document.addEventListener('visibilitychange', sync);
      return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
    }, root);
    return () => media.revert();
  }, [enabled]);

  return <div className="ravo-film-wrap" ref={root}>
    <div className="ravo-film" role="img" aria-label="مشهد موشن جرافيك توضيحي: تسوّق، اجمع النقاط، وافرح بالمكافأة">
      <img className="film-shot film-shot-a" src="/images/ravo-shopping-ai.png" width="2172" height="724" alt="" fetchPriority="high" />
      <img className="film-shot film-shot-b" src="/images/ravo-reward-ai.png" width="1536" height="1024" alt="" loading="lazy" />
      <div className="film-shade" />
      <svg className="film-art" viewBox="0 0 600 600" fill="none" aria-hidden="true">
        <path className="film-line" pathLength="1000" d="M-30 440C100 220 420 590 630 260" stroke="#c8ff81" strokeWidth="3" />
        <path className="film-line" pathLength="1000" d="M-30 460C100 240 420 610 630 280" stroke="white" strokeOpacity=".6" strokeWidth="1" />
        {[ [90,370], [470,390], [500,140] ].map(([x,y], i) => <g className="film-spark" key={i}><path d={`M${x} ${y-15}Q${x} ${y} ${x+15} ${y}Q${x} ${y} ${x} ${y+15}Q${x} ${y} ${x-15} ${y}Q${x} ${y} ${x} ${y-15}Z`} fill="#c8ff81" /></g>)}
      </svg>
      <div className="film-type" aria-hidden="true"><span className="film-word-a">اختياراتك.<br /><em>بداية الحكاية.</em></span><span className="film-word-b">كل نقطة،<br /><em>تقرّبك للفرحة.</em></span><span className="film-word-c">لحظة حلوة.<br /><em>ورجعة أحلى.</em></span></div>
    </div>
    <div className="film-caption"><button type="button" onClick={onToggle} aria-pressed={!enabled} aria-label={enabled ? 'إيقاف حركة الصفحة' : 'تشغيل حركة الصفحة'}>{enabled ? <Pause size={15} /> : <Play size={15} />}<span>{enabled ? 'إيقاف الحركة' : 'تشغيل الحركة'}</span></button></div>
  </div>;
}
