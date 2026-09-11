import { Head, Link } from "@inertiajs/react";
import {
  ArrowLeft,
  ArrowUpLeft,
  Check,
  Gift,
  MessageCircle,
  ShoppingBag,
  Store,
} from "lucide-react";
export default function Landing({ demoAvailable }: { demoAvailable: boolean }) {
  return (
    <div className="platform-landing">
      <Head title="متجر يشبهك، وعملاء يرجعوا لك" />
      <header className="platform-header container">
        <Link className="platform-logo" href="/">
          رِجعة<span>REJAA</span>
        </Link>
        <nav>
          <a href="#platform-features">لماذا رِجعة؟</a>
          {demoAvailable && <Link href="/s/dar">استكشف متجرًا</Link>}
        </nav>
        <Link className="text-link" href="/login">
          تسجيل الدخول <ArrowUpLeft size={17} />
        </Link>
      </header>
      <main>
        <section className="platform-hero container">
          <div>
            <span className="eyebrow">
              <span /> لأصحاب المشاريع، وأحلامهم الكبيرة
            </span>
            <h1>
              متجر يشبهك.
              <br />
              وعملاء <em>يرجعوا لك.</em>
            </h1>
            <p>
              حوّل منتجاتك إلى متجر جميل، استقبل طلباتك عبر واتساب، وخلّي كل تجربة شراء بداية لعلاقة
              أطول.
            </p>
            <div className="hero-ctas">
              <Link className="button button-dark" href="/register">
                ابدأ حكاية متجرك <ArrowLeft size={18} />
              </Link>
              {demoAvailable && (
                <Link className="text-link" href="/s/dar">
                  جرّب المتجر <ArrowUpLeft size={18} />
                </Link>
              )}
            </div>
            <small>
              <Check size={15} /> متجاوب مع الجوال <Check size={15} /> هويتك الخاصة{" "}
              <Check size={15} /> إدارة بسيطة
            </small>
          </div>
          <div className="platform-preview">
            <div className="preview-top">
              <span>دار / DAR</span>
              <ShoppingBag size={18} />
            </div>
            <img src="/images/store-hero.jpg" alt="مساحة منزلية من متجر دار التجريبي" />
            <div className="preview-caption">
              <span>
                تفاصيل صغيرة،
                <br />
                <strong>تُشبه البيت.</strong>
              </span>
              <Link href={demoAvailable ? "/s/dar" : "/register"} aria-label="استكشف المتجر">
                <ArrowUpLeft size={25} />
              </Link>
            </div>
            <span className="preview-sticker">
              <MessageCircle size={20} /> من السلة
              <br />
              <strong>إلى واتساب.</strong>
            </span>
          </div>
        </section>
        <section className="platform-features container" id="platform-features">
          <div className="section-heading">
            <div>
              <span className="eyebrow">مساحة واحدة لمشروعك</span>
              <h2>
                أنت تهتم بالشغف.
                <br />
                ونحن نرتّب التفاصيل.
              </h2>
            </div>
            <Link className="text-link" href="/register">
              خلّينا نبدأ <ArrowLeft size={19} />
            </Link>
          </div>
          <div className="feature-grid">
            {[
              [
                Store,
                "متجرك، بطريقتك.",
                "اسمك وألوانك ومنتجاتك في واجهة مرتّبة، وجاهزة لاستقبال العملاء.",
              ],
              [
                MessageCircle,
                "الطلب أقرب مما تتخيّل.",
                "سلة واضحة وتفاصيل محفوظة، ثم تواصل مباشر مع العميل عبر واتساب.",
              ],
              [
                Gift,
                "كل طلب بداية لرِجعة.",
                "حدّد نقاط منتجاتك وتابع الطلبات من التأكيد حتى التسليم.",
              ],
            ].map(([Icon, title, text], i) => {
              const I = Icon as typeof Store;
              return (
                <article key={i}>
                  <span className="feature-number">0{i + 1}</span>
                  <I size={28} strokeWidth={1.3} />
                  <h3>{title as string}</h3>
                  <p>{text as string}</p>
                </article>
              );
            })}
          </div>
        </section>
        <section className="platform-cta container">
          <span>خطوتك الجاية تبدأ من هون.</span>
          <h2>
            مشروعك يستحق
            <br />
            واجهة تليق فيه.
          </h2>
          <Link href="/register" className="button button-light">
            أنشئ متجرك <ArrowLeft size={18} />
          </Link>
        </section>
      </main>
      <footer className="store-footer container">
        <span className="platform-logo">رِجعة</span>
        <p>للمشاريع التي تستحق أن تكبر.</p>
        <span>© {new Date().getFullYear()} رِجعة</span>
      </footer>
    </div>
  );
}
