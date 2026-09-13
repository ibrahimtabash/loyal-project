import { Head, Link } from "@inertiajs/react";
import { useRef, useState } from "react";
import HeroExperience from "../components/HeroExperience";
import MotionSections from "../components/MotionSections";
import { useLandingMotion } from "../lib/use-landing-motion";
import "../../css/landing-motion.css";
import { ArrowLeft, ArrowUpLeft, Check, Gift, Heart, ShoppingBag, Sparkles, Users } from "lucide-react";

export default function Landing({ demoAvailable }: { demoAvailable: boolean }) {
  const [step, setStep] = useState(0);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);
  useLandingMotion(pageRef, motionEnabled);
  const steps = [
    { title: 'جهّز هويتك', copy: 'اختر ثيم المتجر، أضف اسمك وصورة الغلاف وحدّد رقم واتساب لاستقبال الطلبات.', badge: 'متجرك صار يشبهك', icon: ShoppingBag },
    { title: 'اعرض منتجاتك', copy: 'أضف الصور والأسعار والتصنيفات ونقاط كل منتج، ثم انشر المتجر وشارك رابطه.', badge: 'منتجاتك جاهزة للاكتشاف', icon: Sparkles },
    { title: 'استقبل أول طلب', copy: 'يحفظ العميل تفاصيل طلبه، ثم ينتقل إلى واتساب لتأكيده معك. تابع الطلب حتى التسليم.', badge: 'من السلة إلى محادثة', icon: Check },
    { title: 'كافئ العودة', copy: 'تُضاف نقاط الطلب بعد التسليم. تابع رصيد العميل واستبدل مكافأته من ملفه في لوحة التحكم.', badge: 'كل زيارة تفتح فرصة جديدة', icon: Gift },
  ];
  const StepIcon = steps[step].icon;
  return <div className="wisal-landing" dir="rtl" ref={pageRef} data-motion={motionEnabled ? 'on' : 'off'}>
    <Head title="مَدار — مساحة لنمو مشروعك"><meta name="description" content="أنشئ متجرك مع مَدار، استقبل الطلبات عبر واتساب وأدر العملاء والنقاط والمكافآت في مكان واحد." /></Head>
    <header className="wisal-header">
      <Link className="wisal-logo" href="/">مَدار<span>MADAR</span></Link>
      <nav aria-label="التنقل الرئيسي"><a href="#loyalty">برنامج الولاء</a><a href="#commerce">المتاجر</a><a href="#how-it-works">كيف تبدأ؟</a><a href="#faq">أسئلة شائعة</a></nav>
      <div className="wisal-auth"><Link href="/login">دخول</Link><Link href="/register" className="wisal-pill wisal-pill-dark">ابدأ الآن</Link></div>
    </header>
    <main>
      <section className="wisal-hero" id="loyalty">
        <span className="wisal-kicker"><Sparkles size={16} /> ولاء حقيقي، مش مجرد نقاط</span>
        <h1>مشروعك. أبعد مع مَدار.</h1>
        <p>متجر جميل، طلبات أسهل، وعملاء يرجعوا لك. كل خطوة في مشروعك تبدأ من هنا.</p>
        <div className="wisal-hero-actions">
          <Link href="/register" className="wisal-pill wisal-pill-dark">أنشئ متجرك <ArrowLeft size={18} /></Link>
          {demoAvailable && <Link href="/s/dar" className="wisal-pill wisal-pill-light">شاهد تجربة حقيقية</Link>}
        </div>
        <HeroExperience enabled={motionEnabled} onToggle={() => setMotionEnabled(value => !value)} />
      </section>
      <section className="wisal-proof" aria-label="مزايا سريعة">
        <span><Check size={17} /> يعمل على كل شاشة</span><span><Check size={17} /> طلب مباشر عبر واتساب</span><span><Check size={17} /> خمس هويات للمتجر</span><span><Check size={17} /> نقاط ومكافآت آمنة</span>
      </section>
      <section className="wisal-story" id="features">
        <div className="wisal-section-heading"><span>كل شيء في مكان واحد</span><h2>من أول زيارة، إلى<br />عميل ما بنساك.</h2><p>مَدار ترتّب رحلة العميل كاملة: يكتشف منتجاتك، يطلبها، يجمع نقاطه ويرجع ليستبدل مكافأته.</p></div>
        <div className="wisal-feature-grid">
          {[
            [ShoppingBag, "متجر على ذوقك", "اختر من خمس هويات احترافية وغيّر اللون والصور والمحتوى.", "01"],
            [Users, "اعرف عملاءك", "ملف واضح لكل عميل يجمع طلباته ورصيده وملاحظات فريقك.", "02"],
            [Gift, "مكافآت يحبّوها", "صمّم مكافآت مفهومة وراقب الرصيد والاستبدال من لوحة واحدة.", "03"],
          ].map(([Icon, title, copy, index]) => { const FeatureIcon = Icon as typeof Gift; return <article key={index as string}><span className="wisal-feature-number">{index as string}</span><FeatureIcon size={31} strokeWidth={1.6} /><h3>{title as string}</h3><p>{copy as string}</p><ArrowUpLeft size={20} /></article>; })}
        </div>
      </section>
      <section className="wisal-commerce" id="commerce">
        <div><span className="wisal-kicker"><Heart size={16} /> متجرك له شخصيته</span><h2>خمس واجهات.<br />روح واحدة.</h2><p>من الفخامة الهادئة إلى المتجر الحيوي والكتالوج العملي. اختَر التصميم الأقرب لعلامتك وابدأ البيع.</p><Link href="/register" className="wisal-pill wisal-pill-light">ابدأ مع مَدار <ArrowLeft size={18} /></Link></div>
        <div className="wisal-theme-stack" aria-label="نماذج تصاميم المتجر"><span className="wisal-theme-card card-one"><small>جذور</small><b>تفاصيل تشبهك.</b></span><span className="wisal-theme-card card-two"><small>أُبهة</small><b>حضور لا يُنسى.</b></span><span className="wisal-theme-card card-three"><small>نبض</small><b>على ذوقك.</b></span></div>
      </section>
      <section className="ravo-reward-story">
        <img src="/images/ravo-reward-ai.png" width="1536" height="1024" loading="lazy" alt="مشهد مولّد بالذكاء الاصطناعي لعميلة سعيدة تستلم هدية من صاحبة متجر" />
        <div><span className="wisal-kicker"><Gift size={18} /> من نقاط، إلى فرحة</span><h2>تفاصيل صغيرة.<br />فرحة ترجعهم.</h2><p>زيارة للمتجر، طلب تحبّه، ونقاط تقرّبك من هديتك الجاية. اصنع لعملائك لحظات تستحق العودة.</p><a href="#how-it-works" className="wisal-pill wisal-pill-dark">اكتشف رحلة المكافآت <ArrowLeft size={18} /></a></div>
      </section>
      <MotionSections />
      <section className="ravo-steps" id="how-it-works">
        <div className="ravo-section-intro"><span>من الفكرة إلى أول عميل</span><h2>خطوات بسيطة.<br />بداية كبيرة.</h2><p>اختر أي خطوة لتكتشف كيف تتحول فكرتك إلى تجربة متكاملة.</p></div>
        <div className="ravo-step-layout">
          <div className="ravo-step-buttons" aria-label="خطوات إطلاق المتجر">{steps.map((item, index) => <button key={item.title} type="button" aria-pressed={step === index} aria-controls="step-preview" className={step === index ? 'active' : ''} onClick={() => setStep(index)}><span>0{index + 1}</span><b>{item.title}</b><ArrowUpLeft size={20} /></button>)}</div>
          <div id="step-preview" className="ravo-step-preview" aria-live="polite"><div key={step} className="ravo-step-content"><span className="ravo-step-symbol"><StepIcon size={45} strokeWidth={1.4} /></span><small>الخطوة 0{step + 1} / 04</small><h3>{steps[step].badge}</h3><p>{steps[step].copy}</p><div className="ravo-step-progress" aria-hidden="true">{steps.map((_, index) => <i key={index} className={index <= step ? 'filled' : ''} />)}</div><button className="wisal-pill wisal-pill-dark" onClick={() => setStep((step + 1) % steps.length)}>{step === 3 ? 'من البداية' : 'الخطوة التالية'}<ArrowLeft size={17} /></button></div></div>
        </div>
      </section>
      <section className="ravo-faq" id="faq"><div className="ravo-section-intro"><span>قبل ما تبدأ</span><h2>خلّينا نوضحها.</h2></div><div>{[
        ['كيف يتم الدفع حالياً؟', 'يسجّل العميل الطلب ثم يؤكده مع المتجر عبر واتساب. طريقة الدفع والتوصيل تُنسّق مباشرة مع المتجر؛ لا توجد بوابة دفع إلكتروني حالياً.'],
        ['متى يحصل العميل على نقاطه؟', 'تُضاف نقاط المنتجات المشاركة بعد تحويل الطلب إلى حالة تم التسليم. يمكنك متابعة الحركات والرصيد من ملف العميل.'],
        ['هل أقدر أغيّر تصميم المتجر؟', 'نعم. اختر من خمسة ثيمات في إعدادات المتجر، وعدّل اللون وصورة الغلاف. يبقى الكتالوج والطلبات مرتبطين بنفس المتجر.'],
        ['كيف يستبدل العميل المكافأة؟', 'يختار العميل من المكافآت المتاحة ويتواصل معك. تتحقق من هويته، وتفتح ملفه في لوحة التحكم لإتمام الاستبدال حسب رصيده والمخزون.'],
        ['هل يحتاج العميل إلى تنزيل تطبيق؟', 'لا. المتجر يعمل من رابط يفتح في المتصفح على الجوال أو الكمبيوتر، ويمكن مشاركة الرابط مباشرة مع العملاء.'],
      ].map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className="wisal-final-cta"><span>مساحة لطموحك، اليوم وبكرا</span><h2>الخطوة الجاية؟ مَدار.</h2><Link href="/register" className="wisal-pill wisal-pill-dark">أنشئ حسابك <ArrowLeft size={18} /></Link></section>
    </main>
    <footer className="wisal-footer"><span className="wisal-logo">مَدار<span>MADAR</span></span><p>مساحة لنمو مشروعك.</p><a href="#how-it-works">كيف تبدأ؟</a><a href="#faq">الأسئلة الشائعة</a><span>© {new Date().getFullYear()} مَدار</span></footer>
  </div>;
}
