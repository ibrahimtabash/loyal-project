import { Head, Link, useForm } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpLeft,
  Check,
  Gift,
  Heart,
  Leaf,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { money, type Product, type Store } from "../types";
import { number } from "../loyalty-types";
import { getStoreTheme } from '../lib/store-themes';

export default function Storefront({
  store,
  products,
  rewards = [],
}: {
  store: Store;
  products: Product[];
  rewards: {
    id: number;
    name: string;
    description: string | null;
    image: string | null;
    points_cost: number;
  }[];
}) {
  const [cart, setCart] = useState<Record<number, number>>({});
  const theme = getStoreTheme(store.theme);
  const [saved, setSaved] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState("الكل");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [onlySaved, setOnlySaved] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [notice, setNotice] = useState("");
  const form = useForm({
    customer_name: "",
    customer_phone: "",
    address: "",
    note: "",
    fulfillment: "delivery",
    idempotency_key: "",
    items: [] as { product_id: number; quantity: number }[],
  });
  const storageKey = `rejaa:cart:${store.slug}`;
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const safe: Record<number, number> = {};
      products.forEach((p) => {
        if (Number.isInteger(raw[p.id]) && raw[p.id] > 0) safe[p.id] = Math.min(raw[p.id], 99);
      });
      setCart(safe);
      const favorites = JSON.parse(localStorage.getItem(`rejaa:saved:${store.slug}`) || "[]");
      setSaved(Array.isArray(favorites) ? favorites.filter((id) => Number.isInteger(id)) : []);
    } catch {
      /* Private browsing or invalid local data: start with an empty cart. */
    }
    form.setData("idempotency_key", crypto.randomUUID());
    setReady(true);
  }, [store.slug]);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(cart));
        localStorage.setItem(`rejaa:saved:${store.slug}`, JSON.stringify(saved));
      } catch {}
    }
  }, [cart, saved, ready, storageKey]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(timer);
  }, [notice]);
  const categories = ["الكل", ...new Set(products.map((p) => p.category))];
  const normalize = (v: string) => v.replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").toLocaleLowerCase();
  const filtered = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (category === "الكل" || p.category === category) &&
            (!onlySaved || saved.includes(p.id)) &&
            normalize(`${p.name} ${p.description || ""}`).includes(normalize(query.trim())),
        )
        .sort((a, b) =>
          sort === "low"
            ? a.price - b.price
            : sort === "high"
              ? b.price - a.price
              : Number(b.is_featured) - Number(a.is_featured),
        ),
    [products, category, query, sort, onlySaved, saved],
  );
  const lines = products
    .filter((p) => cart[p.id])
    .map((product) => ({ product, quantity: cart[product.id] }));
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.product.price, 0);
  const points = lines.reduce((sum, line) => sum + line.quantity * line.product.reward_points, 0);
  const delivery = form.data.fulfillment === "delivery" ? store.delivery_fee : 0;
  const add = (product: Product) => {
    setCart((c) => ({ ...c, [product.id]: Math.min((c[product.id] || 0) + 1, 99) }));
    setNotice(`أُضيف ${product.name} إلى السلة`);
  };
  const change = (id: number, delta: number) =>
    setCart((c) => {
      const next = { ...c, [id]: Math.min(99, Math.max(0, (c[id] || 0) + delta)) };
      if (!next[id]) delete next[id];
      return next;
    });
  const favorite = (id: number) =>
    setSaved((s) => (s.includes(id) ? s.filter((v) => v !== id) : [...s, id]));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    form.transform((data) => ({
      ...data,
      items: lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity })),
    }));
    form.post(`/s/${store.slug}/checkout`, {
      preserveScroll: true,
      onSuccess: () => {
        try {
          localStorage.removeItem(storageKey);
        } catch {}
      },
    });
  };
  return (
    <div className={`storefront theme-${theme.id}`} dir="rtl" style={{ "--store-accent": store.accent } as React.CSSProperties}>
      <Head title={store.name}>
        <meta name="description" content={store.description || store.tagline} />
      </Head>
      <a className="skip-link" href="#collection">
        انتقل إلى المنتجات
      </a>
      <div className="announcement">
        <span>
          <Sparkles size={13} /> {theme.eyebrow}
        </span>
        <span className="announcement-side">
          تسوّق بسهولة، وأكمل طلبك عبر واتساب <ArrowLeft size={13} />
        </span>
      </div>
      <header className="store-header container">
        <a href={`/s/${store.slug}`} className="store-brand">
          <span className="brand-symbol">{store.name.charAt(0)}</span>
          <span>
            {store.name}
            <small>أشياء نحبّها، لك.</small>
          </span>
        </a>
        <nav aria-label="أقسام المتجر">
          <a href="#collection" className="nav-active">
            تسوّق المجموعة
          </a>
          <a href="#story">عن المتجر</a>
          {rewards.length > 0 && <a href="#store-rewards">المكافآت</a>}
          <a href="#benefits">تجربة التسوّق</a>
        </nav>
        <div className="header-actions">
          <button
            className={`icon-button ${onlySaved ? "selected" : ""}`}
            aria-label="عرض المفضلة"
            aria-pressed={onlySaved}
            onClick={() => {
              setOnlySaved(!onlySaved);
              document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Heart size={21} />
            {saved.length > 0 && <i>{saved.length}</i>}
          </button>
          <button className="cart-trigger" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={20} />
            <span>سلة التسوّق</span>
            <b>{count}</b>
          </button>
        </div>
      </header>
      <main>
        <section className="store-hero container">
          <div className="hero-copy">
            <span className="eyebrow">
              <span /> {theme.eyebrow}
            </span>
            <h1>{store.tagline}</h1>
            <p>
              {store.description ||
                "اكتشف مجموعتنا واختر ما يشبهك. تسوّق على راحتك، ونحن نهتم بباقي التفاصيل."}
            </p>
            <a className="button button-dark" href="#collection">
              {theme.action} <ArrowLeft size={18} />
            </a>
            <div className="hero-footnote">
              <span className="small-orbit">
                <Leaf size={20} />
              </span>
              <span>
                ذوقك الخاص.
                <br />
                <strong>تفاصيلك الأجمل.</strong>
              </span>
              <span className="hero-index">01 / COLLECTION</span>
            </div>
          </div>
          <div className="hero-photo">
            {store.hero_image ? (
              <img src={store.hero_image} alt={`من مجموعة ${store.name}`} fetchPriority="high" />
            ) : (
              <div className="hero-no-image">
                <Package size={80} strokeWidth={1} />
                <span>{store.name}</span>
              </div>
            )}
            <span className="photo-caption">{store.name} / {theme.label}</span>
            <div className="hero-label">
              <span>
                مساحة للأشياء
                <br />
                <strong>التي تشبهك.</strong>
              </span>
              <ArrowUpLeft size={27} />
            </div>
          </div>
        </section>
        <section className="benefit-strip container" id="benefits">
          <div>
            <Package />
            <span>
              <strong>مختارة بعناية</strong>
              <small>منتجات بتفاصيل تستحق</small>
            </span>
          </div>
          <div>
            <MessageCircle />
            <span>
              <strong>تواصل مباشر</strong>
              <small>تأكيد طلبك عبر واتساب</small>
            </span>
          </div>
          <div>
            <Truck />
            <span>
              <strong>على راحتك</strong>
              <small>توصيل أو استلام من المتجر</small>
            </span>
          </div>
          <div>
            <Gift />
            <span>
              <strong>كل زيارة إلها قيمة</strong>
              <small>نقاط على المنتجات المشاركة</small>
            </span>
          </div>
        </section>
        <section className="collection container" id="collection">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE EDIT / مختارات المتجر</span>
              <h2>
                {theme.collection}<span>.</span>
              </h2>
            </div>
            <span className="result-count">{filtered.length} منتج في انتظارك</span>
          </div>
          <div className="collection-tools">
            <div className="category-tabs" aria-label="تصنيفات المنتجات">
              {categories.map((c) => (
                <button
                  key={c}
                  className={category === c ? "active" : ""}
                  onClick={() => setCategory(c)}
                >
                  {c}
                  {c === "الكل" && <small>{products.length}</small>}
                </button>
              ))}
            </div>
            <div className="search-sort">
              <label className="search-field">
                <Search size={17} />
                <input
                  placeholder="ابحث عن شيء تحبّه..."
                  aria-label="البحث في المنتجات"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button aria-label="مسح البحث" onClick={() => setQuery("")}>
                    <X size={14} />
                  </button>
                )}
              </label>
              <label className="sort-field">
                <SlidersHorizontal size={16} />
                <select
                  aria-label="ترتيب المنتجات"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="featured">المميّزة أولاً</option>
                  <option value="low">السعر: الأقل أولاً</option>
                  <option value="high">السعر: الأعلى أولاً</option>
                </select>
              </label>
            </div>
          </div>
          {onlySaved && (
            <div className="filter-note">
              تعرض المنتجات المفضلة{" "}
              <button onClick={() => setOnlySaved(false)}>
                عرض الكل <X size={14} />
              </button>
            </div>
          )}
          <div className="product-grid">
            {filtered.map((p, index) => (
              <article
                className="product-card"
                key={p.id}
                style={{ animationDelay: `${Math.min(index, 7) * 45}ms` }}
              >
                <div className="product-visual">
                  <button
                    className="product-image-button"
                    onClick={() => setDetail(p)}
                    aria-label={`تفاصيل ${p.name}`}
                  >
                    {p.image ? (
                      <img src={p.image} alt={p.name} loading="lazy" />
                    ) : (
                      <Package className="image-fallback" size={52} strokeWidth={1} />
                    )}
                  </button>
                  {p.compare_price && p.compare_price > p.price ? (
                    <span className="product-badge sale">
                      −{Math.round((1 - p.price / p.compare_price) * 100)}%
                    </span>
                  ) : (
                    p.is_featured && <span className="product-badge">اختيار مميّز</span>
                  )}
                  <button
                    className={`favorite-button ${saved.includes(p.id) ? "is-saved" : ""}`}
                    onClick={() => favorite(p.id)}
                    aria-label={`${saved.includes(p.id) ? "إزالة" : "إضافة"} ${p.name} ${saved.includes(p.id) ? "من" : "إلى"} المفضلة`}
                    aria-pressed={saved.includes(p.id)}
                  >
                    <Heart size={18} />
                  </button>
                  <button className="quick-add" onClick={() => add(p)}>
                    <Plus size={17} /> أضف إلى السلة
                  </button>
                </div>
                <div className="product-info">
                  <span className="product-category">{p.category}</span>
                  <button className="product-name" onClick={() => setDetail(p)}>
                    {p.name}
                  </button>
                  <div className="product-bottom">
                    <span className="product-price">
                      {money(p.price, store.currency)}
                      {p.compare_price && <del>{money(p.compare_price, store.currency)}</del>}
                    </span>
                    <button
                      className="add-round"
                      aria-label={`أضف ${p.name} إلى السلة`}
                      onClick={() => add(p)}
                    >
                      {cart[p.id] ? <Check size={17} /> : <Plus size={18} />}
                    </button>
                  </div>
                  {p.reward_points > 0 && (
                    <small className="product-points">
                      <Sparkles size={11} /> +{p.reward_points} نقطة مع هذا المنتج
                    </small>
                  )}
                </div>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <div className="empty-state">
              <Search size={34} />
              <h3>
                {products.length ? "لم نجد منتجات بهذه الخيارات" : "المجموعة الجديدة قادمة قريباً"}
              </h3>
              <p>
                {products.length
                  ? "جرّب كلمة أخرى أو استعرض المجموعة كاملة."
                  : "عد قريباً لاكتشاف ما يجهّزه المتجر لك."}
              </p>
              {products.length > 0 && (
                <button
                  className="button button-dark"
                  onClick={() => {
                    setCategory("الكل");
                    setQuery("");
                    setOnlySaved(false);
                  }}
                >
                  عرض كل المنتجات
                </button>
              )}
            </div>
          )}
        </section>
        {rewards.length > 0 && (
          <section className="public-rewards container" id="store-rewards">
            <div className="section-heading">
              <div>
                <span className="eyebrow">لكل زيارة، هدية</span>
                <h2>اختياراتك اليوم، مكافآتك بكرا.</h2>
              </div>
              <Gift size={30} strokeWidth={1.3} />
            </div>
            <p className="public-rewards-intro">
              اجمع نقاط المنتجات بعد تسليم طلبك، واستبدلها مع المتجر بمكافأة تحبّها.
            </p>
            <div className="public-rewards-grid">
              {rewards.map((reward) => (
                <article key={reward.id}>
                  {reward.image ? (
                    <img src={reward.image} alt={reward.name} loading="lazy" />
                  ) : (
                    <span className="public-reward-icon">
                      <Gift size={34} strokeWidth={1.2} />
                    </span>
                  )}
                  <div>
                    <span className="reward-cost">
                      <Sparkles size={13} /> {number(reward.points_cost)} نقطة
                    </span>
                    <h3>{reward.name}</h3>
                    <p>{reward.description || "مكافأة منّا لعملائنا."}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="public-rewards-note">
              للاستبدال، تواصل مع المتجر للتحقق من رصيدك وتأكيد استلام المكافأة.
            </p>
          </section>
        )}
        <section className="story-section container" id="story">
          <div className="story-emblem">
            <Leaf size={52} strokeWidth={1} />
            <span>MADE FOR YOUR EVERYDAY</span>
          </div>
          <div>
            <span className="eyebrow">أهلاً بك في {store.name}</span>
            <h2>
              نؤمن أن الجمال
              <br />
              في التفاصيل الصغيرة.
            </h2>
            <p>
              {store.description ||
                "نختار لك مجموعة من المنتجات التي تضيف ليومك شيئاً جميلاً. يسعدنا مساعدتك في اختيار ما يناسبك."}
            </p>
          </div>
          <div className="story-contact">
            {store.city && (
              <span>
                <MapPin size={17} /> {store.city}
              </span>
            )}
            {store.whatsapp_phone ? (
              <a
                className="text-link"
                href={`https://wa.me/${store.whatsapp_phone}`}
                target="_blank"
                rel="noreferrer"
              >
                احكِ معنا <ArrowUpLeft size={20} />
              </a>
            ) : (
              <a className="text-link" href="#collection">
                تصفّح المجموعة <ArrowLeft size={20} />
              </a>
            )}
          </div>
        </section>
      </main>
      <footer className="store-footer container">
        <a className="footer-brand" href={`/s/${store.slug}`}>
          {store.name}
          <span>أشياء تستحق أن تبقى.</span>
        </a>
        <p>
          © {new Date().getFullYear()} {store.name}. جميع الحقوق محفوظة.
        </p>
        <Link href="/" className="powered-by">
          صُنع بكل حب مع <strong>مَدار ↗</strong>
        </Link>
      </footer>
      {notice && (
        <div className="cart-toast" role="status">
          <Check size={17} />
          {notice}
          <button onClick={() => setCartOpen(true)}>عرض السلة</button>
        </div>
      )}
      {count > 0 && (
        <button className="mobile-cart-bar" onClick={() => setCartOpen(true)}>
          <span>
            <ShoppingBag size={19} /> سلتك <b>{count}</b>
          </span>
          <strong>
            {money(subtotal, store.currency)} <ArrowLeft size={18} />
          </strong>
        </button>
      )}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="left" className={`cart-sheet theme-${theme.id}`} dir="rtl" style={{ "--store-accent": store.accent } as React.CSSProperties}>
          <SheetTitle className="panel-title">
            سلة اختياراتك <span>({count})</span>
          </SheetTitle>
          <SheetDescription>راجع اختياراتك وأكمل طلبك مع المتجر عبر واتساب.</SheetDescription>
          {lines.length ? (
            <form onSubmit={submit} className="checkout-form">
              <div className="cart-lines">
                {lines.map(({ product: p, quantity }) => (
                  <div className="cart-line" key={p.id}>
                    {p.image ? <img src={p.image} alt={p.name} /> : <Package size={36} />}
                    <div>
                      <strong>{p.name}</strong>
                      <small>{money(p.price, store.currency)}</small>
                      <div className="quantity-control">
                        <button
                          type="button"
                          onClick={() => change(p.id, -1)}
                          aria-label={`تقليل كمية ${p.name}`}
                        >
                          <Minus size={13} />
                        </button>
                        <span>{quantity}</span>
                        <button
                          type="button"
                          onClick={() => change(p.id, 1)}
                          disabled={quantity >= 99}
                          aria-label={`زيادة كمية ${p.name}`}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="remove-line"
                      onClick={() =>
                        setCart((c) => {
                          const n = { ...c };
                          delete n[p.id];
                          return n;
                        })
                      }
                      aria-label={`حذف ${p.name}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <h3>كيف تحب تستلم طلبك؟</h3>
              <div className="fulfillment-options">
                {[
                  ["delivery", "توصيل لعنوانك", Truck],
                  ["pickup", "استلام من المتجر", Package],
                ].map(([value, label, Icon]) => {
                  const I = Icon as typeof Truck;
                  return (
                    <label
                      key={value as string}
                      className={form.data.fulfillment === value ? "active" : ""}
                    >
                      <input
                        type="radio"
                        name="fulfillment"
                        value={value as string}
                        checked={form.data.fulfillment === value}
                        onChange={() => form.setData("fulfillment", value as string)}
                      />
                      <I size={18} />
                      {label as string}
                    </label>
                  );
                })}
              </div>
              <div className="form-grid">
                <label>
                  الاسم الكامل
                  <input
                    required
                    autoComplete="name"
                    value={form.data.customer_name}
                    onChange={(e) => form.setData("customer_name", e.target.value)}
                    maxLength={100}
                    placeholder="كيف نناديك؟"
                  />
                </label>
                <label>
                  رقم الجوال
                  <input
                    required
                    type="tel"
                    autoComplete="tel"
                    dir="ltr"
                    value={form.data.customer_phone}
                    onChange={(e) => form.setData("customer_phone", e.target.value)}
                    placeholder="+970599123456"
                    pattern="\+?[0-9]{8,15}"
                  />
                </label>
              </div>
              {form.data.fulfillment === "delivery" && (
                <label>
                  عنوان التوصيل
                  <input
                    required
                    autoComplete="street-address"
                    value={form.data.address}
                    onChange={(e) => form.setData("address", e.target.value)}
                    placeholder="المدينة، الشارع، وأقرب معلم"
                    maxLength={500}
                  />
                </label>
              )}
              <label>
                ملاحظة للمتجر <span className="optional">(اختياري)</span>
                <textarea
                  rows={2}
                  value={form.data.note}
                  onChange={(e) => form.setData("note", e.target.value)}
                  placeholder="في تفاصيل بتحب نعرفها؟"
                  maxLength={1000}
                />
              </label>
              <div className="order-summary">
                <div>
                  <span>المنتجات</span>
                  <span>{money(subtotal, store.currency)}</span>
                </div>
                <div>
                  <span>
                    {form.data.fulfillment === "delivery" ? "رسوم التوصيل" : "الاستلام من المتجر"}
                  </span>
                  <span>{delivery ? money(delivery, store.currency) : "مجاناً"}</span>
                </div>
                <div className="summary-total">
                  <strong>الإجمالي</strong>
                  <strong>{money(subtotal + delivery, store.currency)}</strong>
                </div>
                {points > 0 && (
                  <p>
                    <Gift size={15} /> {points} نقطة متوقعة بعد تسليم الطلب
                  </p>
                )}
              </div>
              {Object.keys(form.errors).length > 0 && (
                <div className="form-errors" role="alert">
                  {Object.values(form.errors).map((e, i) => (
                    <p key={i}>{e}</p>
                  ))}
                </div>
              )}
              {!store.whatsapp_phone && (
                <p className="form-errors">
                  هذا المتجر للمعاينة حالياً؛ استقبال الطلبات غير مفعّل.
                </p>
              )}
              <button
                className="button button-dark checkout-submit"
                disabled={form.processing || !store.whatsapp_phone || !ready}
              >
                <MessageCircle size={20} />
                {form.processing ? "جارٍ حفظ طلبك..." : "متابعة الطلب عبر واتساب"}
                <ArrowLeft size={18} />
              </button>
              <p className="checkout-hint">
                سيُحفظ طلبك أولاً، ثم تفتح واتساب لإرساله. التأكيد النهائي من المتجر.
              </p>
            </form>
          ) : (
            <div className="empty-state">
              <ShoppingBag size={45} strokeWidth={1} />
              <h3>سلتك تنتظر اختياراتك</h3>
              <p>أضف شيئاً تحبّه من المجموعة.</p>
              <button className="button button-dark" onClick={() => setCartOpen(false)}>
                تابع التسوّق <ArrowLeft size={16} />
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className={`product-dialog theme-${theme.id}`} dir="rtl" style={{ "--store-accent": store.accent } as React.CSSProperties}>
          {detail && (
            <>
              <div className="detail-image">
                {detail.image ? (
                  <img src={detail.image} alt={detail.name} />
                ) : (
                  <Package size={64} />
                )}
              </div>
              <div className="detail-copy">
                <span className="eyebrow">{detail.category}</span>
                <DialogTitle>{detail.name}</DialogTitle>
                <DialogDescription>
                  {detail.description || "قطعة من مجموعتنا المختارة بعناية."}
                </DialogDescription>
                <strong className="detail-price">{money(detail.price, store.currency)}</strong>
                {detail.reward_points > 0 && (
                  <p className="product-points">
                    <Gift size={15} /> تكسب {detail.reward_points} نقطة بعد التسليم
                  </p>
                )}
                <button
                  className="button button-dark"
                  onClick={() => {
                    add(detail);
                    setDetail(null);
                  }}
                >
                  <ShoppingBag size={18} /> أضف إلى السلة <Plus size={18} />
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
