import { useRef, useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useGsapPage } from "@/hooks/useGsapPage";
import { Button } from "@/components/ui/button";

import { PLANS } from "@/lib/loyalty";
import {
  ArrowLeft,
  ArrowUpLeft,
  BarChart3,
  Check,
  Coins,
  Coffee,
  Gift,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Scissors,
  Send,
  ShoppingBag,
  Sparkles,
  Star,
  Stethoscope,
  Store,
  Twitter,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import cafeReward from "@/assets/nabd-cafe-reward.jpg";
import friendsReward from "@/assets/nabd-friends-reward.jpg";
import carouselCafe from "@/assets/carousel-cafe.jpg";
import carouselRestaurant from "@/assets/carousel-restaurant.jpg";
import carouselSalon from "@/assets/carousel-salon.jpg";
import carouselRetail from "@/assets/carousel-retail.jpg";
import singlePerson from "@/assets/nabd-single-person.jpg.asset.json";
import avatarUser1 from "@/assets/avatar-user-1.jpg.asset.json";
import avatarUser2 from "@/assets/avatar-user-2.jpg.asset.json";
import avatarUser3 from "@/assets/avatar-user-3.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "رِجعة — منصة نقاط تعيد عملاءك" },
      {
        name: "description",
        content: "منصة SaaS عربية لإدارة نقاط العملاء والمكافآت والمتاجر والاشتراكات من مكان واحد.",
      },
      { property: "og:title", content: "رِجعة — منصة نقاط تعيد عملاءك" },
      { property: "og:description", content: "شغّل برنامج نقاط ومكافآت متكاملاً لكل متاجرك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Store,
    title: "متجر إلكتروني بثيمات جاهزة",
    text: "أنشئ متجرك الخاص بستة ثيمات عصرية ومعاينة بشكل تطبيق جوال، وانشره برابط عام لعملائك.",
    className: "bg-brand-blue-soft lg:col-span-2",
  },
  {
    icon: Coins,
    title: "نقاط وولاء تلقائية",
    text: "حوّل قيمة كل فاتورة وطلب إلى نقاط بالقواعد التي تناسب متجرك.",
    className: "bg-brand-mint-soft",
  },
  {
    icon: Users,
    title: "نظام CRM متكامل",
    text: "ملف كامل لكل عميل: رصيد نقاطه، طلباته، وملاحظاتك — كل شيء في مكان واحد.",
    className: "bg-brand-pink-soft",
  },
  {
    icon: ShoppingBag,
    title: "منتجات وطلبات",
    text: "أضف منتجاتك بصورها وأسعارها وتابع الطلبات الواردة مع منح النقاط تلقائياً.",
    className: "bg-brand-yellow-soft",
  },
  {
    icon: Gift,
    title: "مكافآت يحبّها عملاؤك",
    text: "أنشئ عروضاً وهدايا قابلة للاستبدال وحدّد تكلفتها بالنقاط.",
    className: "bg-reward-paper",
  },
  {
    icon: MessageCircle,
    title: "حملات واتساب مباشرة",
    text: "راسل عملاءك بعروضك الجديدة عبر واتساب من داخل المنصة مباشرة.",
    className: "bg-brand-mint-soft",
  },
  {
    icon: BarChart3,
    title: "أرقام واضحة لحظة بلحظة",
    text: "تابع العملاء النشطين والنقاط والطلبات والاستبدالات بلا جداول معقدة.",
    className: "bg-brand-blue-soft lg:col-span-2",
  },
];

const steps = [
  {
    number: "١",
    title: "أنشئ متجرك",
    text: "أضف اسم المتجر واختر قاعدة احتساب النقاط.",
    icon: Store,
    className: "bg-venmo-blue text-venmo-ink step-rise-1",
    chipClassName: "bg-card/90",
  },
  {
    number: "٢",
    title: "أضف عملاءك",
    text: "سجّل العميل برقم الجوال خلال ثوانٍ.",
    icon: Users,
    className: "bg-reward-coral text-reward-paper step-rise-2",
    chipClassName: "bg-reward-paper text-reward-coral",
  },
  {
    number: "٣",
    title: "ابدأ المكافآت",
    text: "امنح النقاط واستبدلها وتابع كل حركة فوراً.",
    icon: Gift,
    className: "bg-brand-mint-soft text-venmo-ink step-rise-3",
    chipClassName: "bg-card/90",
  },
];

const industries = [
  { label: "المقاهي", icon: Coffee, tone: "bg-white/90 text-reward-coral" },
  { label: "المطاعم", icon: UtensilsCrossed, tone: "bg-white/90 text-reward-coral" },
  { label: "الصالونات", icon: Scissors, tone: "bg-white/90 text-reward-coral" },
  { label: "متاجر التجزئة", icon: ShoppingBag, tone: "bg-white/90 text-reward-coral" },
  { label: "العيادات", icon: Stethoscope, tone: "bg-white/90 text-reward-coral" },
];

function HeroCards() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      image: carouselRestaurant,
      alt: "أصدقاء يحتفلون بمكافأة رِجعة في مطعم",
      badge: "تجربة مطعم",
      title: "كل زيارة تصير ذكرى حلوة",
      description: "نقاط تنجمع مع الصحبة، ومكافأة تعطيهم سبباً جديداً للرجعة.",
      icon: Star,
      chip: "مكافأة جماعية",
      chipDetail: "خصم ٢٠٪ على الطلب",
      chipClass: "bg-brand-yellow-soft text-brand-yellow-ink",
    },
    {
      image: carouselCafe,
      alt: "عميلة سعيدة تستلم قهوتها المجانية في مقهى",
      badge: "تجربة مقهى",
      title: "قهوة علينا ☕",
      description: "بعد زيارتها الخامسة، استلمت مكافأتها بابتسامة من الباريستا.",
      icon: Gift,
      chip: "هدية مجانية",
      chipDetail: "بعد ٥ زيارات",
      chipClass: "bg-brand-mint-soft text-venmo-ink",
    },
    {
      image: carouselSalon,
      alt: "عميلة تفرح بإضافة نقاط الولاء في صالون",
      badge: "تجربة صالون",
      title: "الفرحة أحلى مع بعض",
      description: "نقاط تضاف تلقائياً مع كل زيارة، والمكافأة على بعد لمسة.",
      icon: Check,
      chip: "جاهزة للمكافأة",
      chipDetail: "+٢٥٠ نقطة",
      chipClass: "bg-brand-pink-soft text-reward-ink",
    },
    {
      image: carouselRetail,
      alt: "عائلة سعيدة أثناء تسوقها وكسب نقاط",
      badge: "تجربة متجر",
      title: "ولاء يجمع العائلة",
      description: "كل مشتريات تُحسب، وكل نقطة تقربهم من مكافأة أكبر.",
      icon: ShoppingBag,
      chip: "نقاط مع كل عملية",
      chipDetail: "+١٥٠ نقطة",
      chipClass: "bg-brand-blue-soft text-venmo-ink",
    },
  ];

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  return (
    <div
      className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-reward-paper shadow-2xl shadow-venmo-ink/15 md:rounded-[3rem]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative aspect-[16/10] md:aspect-[16/9]">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          const SlideIcon = slide.icon;
          return (
            <div
              key={slide.alt}
              className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isActive ? "z-10 opacity-100" : "z-0 opacity-0"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                loading="lazy"
                width={1344}
                height={896}
                className={`absolute inset-0 size-full object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                  isActive ? "scale-100" : "scale-110"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-reward-ink/85 via-reward-ink/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-6 text-reward-paper md:p-10">
                <span className="mb-3 inline-flex rounded-full bg-reward-paper/90 px-3 py-1 text-xs font-bold text-reward-coral backdrop-blur">
                  {slide.badge}
                </span>
                <h2 className="max-w-xl font-display text-3xl font-black leading-tight md:text-5xl">
                  {slide.title}
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-7 text-reward-paper/85 md:text-base">
                  {slide.description}
                </p>
              </div>

              <div
                data-gsap="item"
                className={`absolute left-4 top-4 flex items-center gap-3 rounded-2xl bg-reward-paper/95 p-3 shadow-xl backdrop-blur md:left-6 md:top-6 ${
                  isActive ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                } transition-all duration-700`}
              >
                <span className={`grid size-10 place-items-center rounded-full ${slide.chipClass}`}>
                  <SlideIcon className="size-5 fill-current" />
                </span>
                <div>
                  <p className="text-xs font-bold text-reward-ink">{slide.chip}</p>
                  <p className="text-[11px] text-muted-foreground">{slide.chipDetail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 md:bottom-6 md:right-6">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? "w-8 bg-reward-paper"
                : "w-2 bg-reward-paper/50 hover:bg-reward-paper/80"
            }`}
            aria-label={`انتقل إلى الصورة ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function Landing() {
  const scope = useRef<HTMLDivElement>(null);
  useGsapPage(scope);

  return (
    <div ref={scope} className="relative min-h-screen overflow-hidden bg-background">
      <header className="relative z-50 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <div className="text-venmo-ink">
            <BrandMark />
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-semibold text-venmo-ink/75 hover:text-venmo-ink">المزايا</a>
            <a href="#how" className="text-sm font-semibold text-venmo-ink/75 hover:text-venmo-ink">كيف يعمل</a>
            <a href="#pricing" className="text-sm font-semibold text-venmo-ink/75 hover:text-venmo-ink">الباقات</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden rounded-full font-semibold text-venmo-ink hover:bg-venmo-ink/10 hover:text-venmo-ink sm:inline-flex"
            >
              <Link to="/auth">تسجيل الدخول</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full bg-venmo-ink px-5 font-bold text-white hover:bg-venmo-ink/90">
              <Link to="/auth">ابدأ مجاناً</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative mx-3 rounded-[2.5rem] bg-venmo-blue pb-0 pt-12 lg:mx-6 lg:rounded-[3.5rem] lg:pt-20">
          <div className="mx-auto max-w-5xl px-5 text-center lg:px-8">
            <h1 data-gsap="hero-title" className="font-display text-5xl font-black leading-[1.1] tracking-tight text-venmo-ink md:text-7xl lg:text-[5.5rem]">
              خلّيهم يرجعوا
            </h1>
            <div data-gsap="hero-copy">
              <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-venmo-ink/85 md:text-xl">
                مع رِجعة، كل زيارة تصير نقاطاً، وكل نقطة سبباً لزيارة جديدة.
              </p>
              <p className="mt-3 text-xs text-venmo-ink/60">مجاني للبدء، بدون بطاقة بنكية.</p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="h-12 rounded-full bg-venmo-ink px-8 text-base font-bold text-white hover:bg-venmo-ink/90">
                  <Link to="/auth">أنشئ متجرك مجاناً <ArrowLeft /></Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-venmo-ink/25 bg-white/90 px-8 text-base font-bold text-venmo-ink hover:bg-white"
                >
                  <a href="#features">اكتشف المنصة</a>
                </Button>
              </div>
            </div>
          </div>

          <div data-gsap="hero-visual" className="mx-auto mt-14 max-w-6xl px-5 lg:px-8">
            <HeroCards />
          </div>

          <div className="h-6" aria-hidden="true" />
        </section>

        <section className="relative z-10 mx-3 mt-6 mb-12 rounded-[2rem] bg-reward-coral p-5 shadow-2xl shadow-reward-coral/25 md:mb-16 lg:mx-6 lg:mt-8 lg:rounded-[2.5rem] lg:p-7">
          <div className="mx-auto grid max-w-7xl items-center gap-5 lg:grid-cols-[auto_1fr]">
            <div className="flex items-center gap-3 lg:pl-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/20 text-white">
                <Store className="size-5" strokeWidth={2.2} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold text-white/90">رِجعة تكبر معك</p>
                <h2 className="font-display text-lg font-black text-white md:text-xl">مناسب لكل نشاط</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {industries.map(({ label, icon: Icon, tone }) => (
                <div
                  key={label}
                  data-gsap="item"
                  className="group flex min-h-14 items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/15"
                >
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}>
                    <Icon className="size-4" strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span className="text-xs font-bold leading-5 text-white">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="section-label">الفرحة التي ترجع</span>
              <h2 className="mt-4 max-w-xl font-display text-3xl font-bold md:text-5xl">مكافأة صغيرة، علاقة تكبر كل يوم.</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">يكتشف عميلك نقاطه ومكافآته بسهولة على الجوال، ويعود إلى المكان الذي جعله يشعر بالتقدير.</p>
              <div className="mt-7 flex flex-col items-start gap-3">
                <div className="flex -space-x-3 space-x-reverse" aria-hidden="true">
                  <img src={avatarUser1.url} alt="صورة عميلة سعيدة" className="size-10 rounded-full border-2 border-background object-cover" loading="lazy" width={40} height={40} />
                  <img src={avatarUser2.url} alt="صورة عميل سعيد" className="size-10 rounded-full border-2 border-background object-cover" loading="lazy" width={40} height={40} />
                  <img src={avatarUser3.url} alt="صورة عميلة سعيدة" className="size-10 rounded-full border-2 border-background object-cover" loading="lazy" width={40} height={40} />
                </div>
                <p className="text-sm font-semibold">تجربة يحبّها العميل ويتذكرها</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img src={cafeReward} alt="عميلة سعيدة تعرض مكافأتها على الجوال في مقهى" loading="lazy" width={1200} height={900} className="mt-10 aspect-[3/4] w-full rounded-[2rem] object-cover" />
              <img src={friendsReward} alt="صديقان سعيدان يتابعان مكافأة على الجوال" loading="lazy" width={1200} height={900} className="aspect-[3/4] w-full rounded-[2rem] object-cover" />
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">كل ما تحتاجه للنمو</span>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">متجرك وولاء عملائك، من مكان واحد</h2>
            <p className="mt-4 text-muted-foreground">متجر إلكتروني بثيمات جاهزة، نظام نقاط ومكافآت، CRM متكامل، وحملات واتساب — كل ما تحتاجه لتنمية نشاطك.</p>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className={`feature-card group ${feature.className}`}>
                <div className="grid size-11 place-items-center rounded-2xl bg-card shadow-sm"><feature.icon className="size-5" /></div>
                <h3 className="mt-8 font-display text-xl font-bold md:text-2xl">{feature.title}</h3>
                <p className="mt-3 max-w-md leading-7 text-muted-foreground">{feature.text}</p>
                <ArrowUpLeft className="mt-8 size-5 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="relative overflow-hidden bg-background py-14 md:py-18">
          {/* Graphic background layers */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(89,174,239,0.10),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(255,115,92,0.08),transparent_45%),radial-gradient(circle_at_50%_50%,rgba(16,24,39,0.03),transparent_70%)]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #101827 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          

          {/* Floating graphic shapes */}
          <div className="absolute right-10 top-14 hidden h-24 w-24 rotate-12 rounded-[1.5rem] border-2 border-dashed border-venmo-ink/10 md:block float-soft" />
          <div className="absolute bottom-16 left-10 hidden h-16 w-16 rounded-full bg-reward-coral/15 md:block float-soft" />
          <div className="absolute left-1/4 top-1/3 hidden h-2.5 w-2.5 rounded-full bg-brand-mint md:block float-soft" />
          <div className="absolute right-1/3 bottom-1/4 hidden h-2 w-2 rounded-full bg-venmo-blue md:block float-soft" />

          <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid items-end gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="max-w-2xl">
                <span className="inline-flex rounded-full bg-venmo-blue/10 px-3 py-1.5 text-xs font-bold text-venmo-ink backdrop-blur">ابدأ بسرعة</span>
                <h2 className="mt-4 font-display text-2xl font-black text-foreground md:text-3xl">من أول تسجيل إلى أول مكافأة.</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground lg:justify-self-end">لا إعدادات طويلة ولا تدريب. كل خطوة صُممت لتكون واضحة لك ولفريقك.</p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
              <div className="relative min-h-[320px] overflow-hidden rounded-[2rem] bg-reward-paper p-3 shadow-xl shadow-foreground/5 ring-1 ring-foreground/5 md:p-4">
                <img src={singlePerson.url} alt="عميلة سعيدة تتابع نقاطها ومكافآتها على الجوال" loading="lazy" width={1200} height={900} className="h-full min-h-[280px] w-full rounded-[1.6rem] object-cover" />
                <div className="absolute inset-x-6 bottom-6 rounded-[1.3rem] bg-card/95 p-4 shadow-xl shadow-venmo-ink/15 backdrop-blur">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-reward-coral">أول مكافأة جاهزة</p>
                      <p className="mt-1 font-display text-xl font-black text-venmo-ink">٣ خطوات فقط</p>
                    </div>
                    <span className="grid size-11 place-items-center rounded-xl bg-brand-mint-soft text-venmo-ink"><Sparkles className="size-5" /></span>
                  </div>
                </div>
                <div className="absolute left-5 top-5 rounded-full bg-venmo-blue px-3 py-1.5 text-[10px] font-bold text-venmo-ink shadow-md shadow-venmo-ink/10">تجربة مرئية وبسيطة</div>
              </div>

              <div className="relative rounded-[2rem] border border-foreground/10 bg-card/50 p-3 backdrop-blur-sm md:p-4">
                <div className="absolute bottom-10 right-10 top-10 hidden w-px bg-gradient-to-b from-transparent via-foreground/15 to-transparent md:block" />
                <div className="space-y-3">
                  {steps.map((step) => (
                    <article key={step.number} className={`group relative overflow-hidden rounded-[1.5rem] p-4 shadow-lg shadow-venmo-ink/10 transition-transform duration-300 hover:-translate-y-1 md:p-5 ${step.className}`}>
                      <div className="absolute -left-5 -top-6 font-display text-7xl font-black opacity-10 transition-transform duration-500 group-hover:scale-110">{step.number}</div>
                      <div className="relative flex gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-venmo-ink font-display text-base font-black text-reward-paper shadow-md shadow-venmo-ink/15">{step.number}</span>
                          <span className="hidden h-full w-px bg-current opacity-20 md:block" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`mb-4 grid size-11 place-items-center rounded-xl shadow-sm ${step.chipClassName}`}>
                            <step.icon className="size-5" />
                          </span>
                          <h3 className="font-display text-lg font-black">{step.title}</h3>
                          <p className="mt-1 max-w-sm text-xs font-medium leading-6 opacity-75">{step.text}</p>
                        </div>
                        <ArrowLeft className="mt-auto size-4 shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="text-center">
            <span className="section-label">باقات مرنة</span>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">اختر ما يناسب حجم متجرك</h2>
            <p className="mt-4 text-muted-foreground">لكل متجر باقته المستقلة، ويمكنك الترقية في أي وقت.</p>
          </div>
          <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => {
              const featured = plan.id === 'pro';
              return (
                <article
                  key={plan.id}
                  className={`group relative flex flex-col overflow-hidden rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 ${
                    featured
                      ? 'bg-venmo-ink text-reward-paper shadow-[0_32px_64px_-24px_rgba(16,24,39,0.45)] lg:-mt-4 lg:mb-4'
                      : 'border border-venmo-ink/10 bg-card shadow-[0_20px_50px_-40px_rgba(16,24,39,0.6)]'
                  }`}
                >
                  <div
                    className={`pointer-events-none absolute -left-16 -top-20 size-56 rounded-full blur-[90px] transition-opacity duration-500 ${
                      featured ? 'bg-venmo-blue/40' : 'bg-brand-mint-soft/70 opacity-60 group-hover:opacity-100'
                    }`}
                  />
                  {featured && (
                    <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle,rgba(247,250,252,0.9)_1px,transparent_1px)] [background-size:20px_20px]" />
                  )}

                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <h3 className="font-display text-xl font-black">{plan.name}</h3>
                    {featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-reward-coral px-3 py-1 text-[10px] font-bold text-reward-paper">
                        <Sparkles className="size-3" /> الأكثر اختياراً
                      </span>
                    )}
                  </div>

                  <p className={`relative z-10 mt-6 flex items-end gap-2 ${featured ? '' : 'text-venmo-ink'}`}>
                    <span className="font-display text-5xl font-black leading-none">{plan.price}</span>
                    <span className={`pb-1 text-sm font-semibold ${featured ? 'text-reward-paper/65' : 'text-muted-foreground'}`}>
                      شيكل / شهرياً
                    </span>
                  </p>

                  <div className={`relative z-10 my-7 h-px w-full ${featured ? 'bg-reward-paper/15' : 'bg-venmo-ink/10'}`} />

                  <ul className="relative z-10 space-y-3.5">
                    {plan.features.map((item) => (
                      <li
                        key={item}
                        className={`flex items-center gap-3 text-sm font-medium ${featured ? 'text-reward-paper/85' : 'text-venmo-ink/75'}`}
                      >
                        <span
                          className={`grid size-6 shrink-0 place-items-center rounded-full ${
                            featured ? 'bg-venmo-blue text-venmo-ink' : 'bg-brand-mint-soft text-reward-ink'
                          }`}
                        >
                          <Check className="size-3.5" strokeWidth={3} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={`relative z-10 mt-9 h-12 w-full rounded-full text-base font-bold ${
                      featured
                        ? 'bg-reward-coral text-reward-paper hover:bg-reward-coral/90'
                        : 'bg-venmo-ink text-white hover:bg-venmo-ink/90'
                    }`}
                  >
                    <Link to="/auth">ابدأ الآن <ArrowLeft className="size-4" /></Link>
                  </Button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="px-5 pb-20 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[3rem] bg-reward-coral px-8 py-14 text-white shadow-[0_32px_64px_-12px_rgba(255,115,92,0.35)] lg:px-16 lg:py-16">
            {/* graphic layers */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle,rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:22px_22px]" />
            <div className="pointer-events-none absolute -top-28 -right-16 h-72 w-72 rounded-full bg-white/20 blur-[110px]" />
            <div className="pointer-events-none absolute -bottom-28 -left-10 h-72 w-72 rounded-full bg-venmo-blue/30 blur-[110px]" />
            <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent cta-shine" />

            <div className="relative z-10 flex flex-col items-center gap-9 text-center lg:flex-row lg:justify-between lg:text-right">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-xs font-bold text-white">
                  <Sparkles className="size-3.5" /> ابدأ خلال دقيقة
                </span>
                <p className="mt-5 font-display text-3xl font-black leading-tight md:text-5xl">
                  جاهز تجعل كل نقطة
                  <span className="relative mx-2 inline-block">
                    <span className="relative z-10">سبباً للعودة؟</span>
                    <span className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-full bg-white/50" />
                  </span>
                </p>
                <p className="mt-4 text-sm text-white/75 md:text-base">ابدأ مجاناً، وأطلق برنامج ولائك اليوم بدون بطاقة ائتمان.</p>
              </div>

              <div className="flex shrink-0 flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-venmo-blue text-venmo-ink"><Gift className="size-5" /></span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-white/20 text-white"><Star className="size-5" /></span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-brand-yellow text-reward-ink"><Coins className="size-5" /></span>
                </div>
                <Button asChild size="lg" className="h-14 rounded-2xl bg-white px-9 font-bold text-reward-coral transition hover:-translate-y-0.5 hover:bg-white/90">
                  <Link to="/auth">أنشئ حسابك <ArrowLeft /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="px-5 pb-8 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[3rem] bg-venmo-ink text-reward-paper shadow-[0_32px_64px_-12px_rgba(16,24,39,0.28)]">
          {/* Decorative soft glows */}
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-venmo-blue/40 blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-reward-coral/25 blur-[100px]" />

          <div className="relative z-10 p-10 md:p-14 lg:p-16">
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-4">
                <BrandMark />
                <p className="max-w-xs text-sm leading-6 text-reward-paper/60">
                  نظام نقاط ومكافآت يساعد متاجرك على بناء علاقة أقوى مع عملائها.
                </p>
              </div>
              <div>
                <h4 className="mb-5 text-sm font-bold text-venmo-blue">المنتج</h4>
                <ul className="space-y-3 text-sm text-reward-paper/70">
                  <li><a href="#features" className="transition-colors hover:text-reward-paper">المزايا</a></li>
                  <li><a href="#how" className="transition-colors hover:text-reward-paper">كيف يعمل</a></li>
                  <li><a href="#pricing" className="transition-colors hover:text-reward-paper">الباقات</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-5 text-sm font-bold text-venmo-blue">القانونية</h4>
                <ul className="space-y-3 text-sm text-reward-paper/70">
                  <li><a href="#" className="transition-colors hover:text-reward-paper">سياسة الخصوصية</a></li>
                  <li><a href="#" className="transition-colors hover:text-reward-paper">شروط الاستخدام</a></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-5 text-sm font-bold text-venmo-blue">تواصل معنا</h4>
                <ul className="space-y-3 text-sm text-reward-paper/70">
                  <li className="flex items-center gap-2">
                    <Mail className="size-4" />
                    <a href="mailto:support@rejaa.app" className="transition-colors hover:text-reward-paper">support@rejaa.app</a>
                  </li>
                </ul>
                <div className="mt-5">
                  <p className="mb-3 text-xs text-reward-paper/60">اشترك في نشرتنا البريدية</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="بريدك الإلكتروني"
                      className="min-w-0 flex-1 rounded-2xl border border-reward-paper/10 bg-reward-paper/5 px-4 py-2.5 text-sm text-reward-paper placeholder:text-reward-paper/30 focus:outline-none focus:ring-2 focus:ring-venmo-blue/50"
                      dir="ltr"
                    />
                    <Button
                      size="icon"
                      aria-label="إرسال"
                      className="size-10 shrink-0 rounded-2xl bg-venmo-blue text-venmo-ink hover:bg-venmo-blue/90"
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-14 flex flex-col items-center justify-between gap-5 border-t border-reward-paper/10 pt-8 text-xs text-reward-paper/40 sm:flex-row">
              <p>© ٢٠٢٦ رِجعة. جميع الحقوق محفوظة.</p>
              <div className="flex items-center gap-3">
                <a href="#" aria-label="إنستغرام" className="grid size-9 place-items-center rounded-full border border-reward-paper/5 bg-reward-paper/5 transition-colors hover:bg-reward-paper/10">
                  <Instagram className="size-4" />
                </a>
                <a href="#" aria-label="تويتر" className="grid size-9 place-items-center rounded-full border border-reward-paper/5 bg-reward-paper/5 transition-colors hover:bg-reward-paper/10">
                  <Twitter className="size-4" />
                </a>
                <a href="#" aria-label="لينكدإن" className="grid size-9 place-items-center rounded-full border border-reward-paper/5 bg-reward-paper/5 transition-colors hover:bg-reward-paper/10">
                  <Linkedin className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
