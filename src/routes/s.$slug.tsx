import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPublicProducts, fetchStoreBySlug, getTheme, heroShapeStyle, money, themeVars, type Product,
} from "@/lib/storefront";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Home, Gift, ShoppingBag, Search, Plus, Minus, ImageIcon, Star, Truck,
  BadgePercent, Clock, Phone, X, ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/s/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `متجر ${params.slug} | رِجعة` },
      { name: "description", content: "تصفّح منتجات المتجر واطلب أونلاين واجمع نقاط الولاء مع كل طلب." },
      { property: "og:title", content: `متجر ${params.slug} | رِجعة` },
      { property: "og:description", content: "اطلب أونلاين واجمع نقاط الولاء." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Storefront,
  errorComponent: () => <Centered text="تعذّر تحميل المتجر." />,
  notFoundComponent: () => <Centered text="هذا المتجر غير متاح." />,
});

function Centered({ text }: { text: string }) {
  return <div className="flex min-h-screen items-center justify-center text-muted-foreground">{text}</div>;
}

type CartLine = { product: Product; qty: number };

function Storefront() {
  const { slug } = Route.useParams();
  const store = useQuery({ queryKey: ["store", slug], queryFn: () => fetchStoreBySlug(slug) });
  const businessId = store.data?.id;
  const products = useQuery({
    queryKey: ["store-products", businessId],
    queryFn: () => fetchPublicProducts(businessId!),
    enabled: !!businessId,
  });

  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [openCart, setOpenCart] = useState(false);
  const [tab, setTab] = useState<"home" | "rewards">("home");
  const [detail, setDetail] = useState<Product | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [doneCode, setDoneCode] = useState<string | null>(null);

  const list = products.data ?? [];
  const categories = useMemo(
    () => Array.from(new Set(list.map((p) => p.category).filter(Boolean))) as string[],
    [list],
  );
  const filtered = list.filter(
    (p) => (!cat || p.category === cat) && p.name.includes(q.trim()),
  );
  const featured = list.slice(0, 6);

  const lines = Object.values(cart);
  const total = lines.reduce((s, l) => s + Number(l.product.price) * l.qty, 0);
  const points = lines.reduce((s, l) => s + l.product.reward_points * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  const add = (p: Product) =>
    setCart((c) => ({ ...c, [p.id]: { product: p, qty: (c[p.id]?.qty ?? 0) + 1 } }));
  const sub = (p: Product) =>
    setCart((c) => {
      const qty = (c[p.id]?.qty ?? 0) - 1;
      const next = { ...c };
      if (qty <= 0) delete next[p.id];
      else next[p.id] = { product: p, qty };
      return next;
    });

  if (store.isLoading) return <Centered text="جارٍ التحميل…" />;
  if (!store.data) throw notFound();

  const t = getTheme((store.data as { theme?: string }).theme);
  const cover = (store.data as { cover_url?: string | null }).cover_url;
  const logo = (store.data as { logo_url?: string | null }).logo_url;
  const description = (store.data as { description?: string | null }).description;
  const wa = (store.data as { whatsapp_phone?: string | null }).whatsapp_phone;

  const submit = async () => {
    if (!name.trim() || !phone.trim()) { toast.error("أدخل الاسم ورقم الجوال"); return; }
    if (lines.length === 0) { toast.error("سلتك فارغة"); return; }
    setSending(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          business_id: businessId!,
          customer_name: name,
          customer_phone: phone,
          address: address || null,
          note: note || null,
          total,
          points_awarded: points,
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: itemsError } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          product_id: l.product.id,
          name: l.product.name,
          price: l.product.price,
          quantity: l.qty,
        })),
      );
      if (itemsError) throw itemsError;
      setDoneCode(order.id.slice(0, 6).toUpperCase());
      setCart({});
      setOpenCart(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const Card = ({ p }: { p: Product }) => (
    <article
      className="group relative overflow-hidden transition-transform duration-300 hover:-translate-y-1"
      style={{
        background: "var(--sf-surface)",
        borderRadius: "var(--sf-radius)",
        boxShadow: "0 12px 30px -18px rgba(0,0,0,.45)",
      }}
    >
      <button
        type="button"
        onClick={() => setDetail(p)}
        className="relative block h-36 w-full overflow-hidden sm:h-44"
        style={{ background: "var(--sf-bg)" }}
        aria-label={`عرض ${p.name}`}
      >
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <ImageIcon className="size-7" style={{ color: "var(--sf-muted)" }} />
          </span>
        )}
        {p.reward_points > 0 && (
          <span
            className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: "var(--sf-brand)", color: "var(--sf-on-brand)" }}
          >
            +{p.reward_points} نقطة
          </span>
        )}
      </button>
      <div className="space-y-1.5 p-3 sm:p-4">
        <p className="truncate text-sm font-bold sm:text-base">{p.name}</p>
        {p.description && (
          <p className="line-clamp-2 text-[11px] sm:text-xs" style={{ color: "var(--sf-muted)" }}>{p.description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-extrabold sm:text-base" style={{ color: "var(--sf-brand)" }}>{money(p.price)}</span>
          {cart[p.id] ? (
            <div className="flex items-center gap-2 rounded-full px-2 py-1" style={{ background: "var(--sf-bg)" }}>
              <button type="button" onClick={() => sub(p)} aria-label="إنقاص"><Minus className="size-3.5" /></button>
              <span className="text-xs font-bold">{cart[p.id]!.qty}</span>
              <button type="button" onClick={() => add(p)} aria-label="زيادة"><Plus className="size-3.5" /></button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => add(p)}
              className="flex size-8 items-center justify-center rounded-full transition-transform hover:scale-110"
              style={{ background: "var(--sf-brand)", color: "var(--sf-on-brand)" }}
              aria-label="إضافة للسلة"
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <div className="min-h-screen" style={{ ...themeVars(t), background: "var(--sf-bg)", color: "var(--sf-text)" }}>
      {/* Hero banner */}
      <div className="relative overflow-hidden" style={{ ...heroShapeStyle(t), background: "var(--sf-brand)" }}>
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 size-full object-cover opacity-55" />
        )}
        <div className="absolute inset-0" style={{ backgroundImage: t.pattern, backgroundSize: t.shape === "grid" ? "26px 26px" : "auto" }} />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-4 px-5 pb-16 pt-12 sm:px-8 md:pb-24 md:pt-20">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur"
            style={{ background: "rgba(255,255,255,.25)", color: "var(--sf-on-brand)" }}
          >
            متجر إلكتروني · اطلب أونلاين
          </span>
          <h1 className="text-2xl font-extrabold sm:text-4xl" style={{ color: "var(--sf-on-brand)" }}>
            {store.data.name}
          </h1>
          <p className="max-w-xl text-sm sm:text-base" style={{ color: "var(--sf-on-brand)", opacity: 0.85 }}>
            {description || "اطلب أونلاين واجمع نقاطك مع كل طلب"}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { icon: Truck, label: "توصيل سريع" },
              { icon: BadgePercent, label: "نقاط مع كل طلب" },
              { icon: ShieldCheck, label: "طلب آمن" },
            ].map((b) => (
              <span
                key={b.label}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold backdrop-blur"
                style={{ background: "rgba(255,255,255,.2)", color: "var(--sf-on-brand)" }}
              >
                <b.icon className="size-3.5" /> {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-32 sm:px-6 md:pb-16">
        {/* Store identity card */}
        <div
          className="-mt-10 flex flex-wrap items-center gap-4 p-4 sm:p-5"
          style={{ background: "var(--sf-surface)", borderRadius: "var(--sf-radius)", boxShadow: "0 20px 45px -30px rgba(0,0,0,.5)" }}
        >
          <div className="size-16 shrink-0 overflow-hidden rounded-2xl" style={{ background: "var(--sf-accent)" }}>
            {logo && <img src={logo} alt={store.data.name} className="size-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-extrabold sm:text-lg">{store.data.name}</p>
            <p className="flex items-center gap-2 text-xs" style={{ color: "var(--sf-muted)" }}>
              <Star className="size-3.5" style={{ color: "var(--sf-brand)" }} /> متجر موثّق
              <span className="opacity-50">·</span>
              <Clock className="size-3.5" /> يستقبل الطلبات الآن
            </p>
          </div>
          {wa && (
            <a
              href={`https://wa.me/${wa.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold"
              style={{ background: "var(--sf-brand)", color: "var(--sf-on-brand)" }}
            >
              <Phone className="size-3.5" /> تواصل معنا
            </a>
          )}
        </div>

        {tab === "home" ? (
          <main>
            {/* Search + categories */}
            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-2 px-4 py-3" style={{ background: "var(--sf-surface)", borderRadius: "999px" }}>
                <Search className="size-4" style={{ color: "var(--sf-muted)" }} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ابحث عن منتج"
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: "var(--sf-text)" }}
                />
              </div>
              {categories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <Chip active={!cat} onClick={() => setCat(null)} label="الكل" />
                  {categories.map((c) => (
                    <Chip key={c} active={cat === c} onClick={() => setCat(c)} label={c} />
                  ))}
                </div>
              )}
            </div>

            {/* Featured strip */}
            {featured.length > 1 && (
              <section className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-extrabold sm:text-lg">الأكثر طلباً</h2>
                  <span className="text-xs" style={{ color: "var(--sf-muted)" }}>مرّر لرؤية المزيد</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {featured.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDetail(p)}
                      className="relative h-36 w-56 shrink-0 overflow-hidden text-right sm:h-44 sm:w-72"
                      style={{ borderRadius: "var(--sf-radius)", background: "var(--sf-accent)" }}
                    >
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} loading="lazy" className="size-full object-cover" />
                      ) : (
                        <span className="absolute inset-0" style={{ backgroundImage: t.pattern }} />
                      )}
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <span className="block text-sm font-bold text-white">{p.name}</span>
                        <span className="block text-xs text-white/85">{money(p.price)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Promo banner */}
            <section
              className="mt-8 flex flex-wrap items-center justify-between gap-4 overflow-hidden p-6"
              style={{ background: "var(--sf-accent)", borderRadius: "var(--sf-radius)" }}
            >
              <div className="min-w-0">
                <p className="text-lg font-extrabold">اجمع نقاطك مع كل طلب</p>
                <p className="text-sm" style={{ color: "var(--sf-muted)" }}>
                  كل طلب يضيف لرصيدك نقاطاً تستبدلها بمكافآت من {store.data.name}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTab("rewards")}
                className="rounded-full px-5 py-2.5 text-sm font-bold"
                style={{ background: "var(--sf-brand)", color: "var(--sf-on-brand)" }}
              >
                اعرف المزيد
              </button>
            </section>

            {/* Products */}
            <section className="mt-8">
              <h2 className="mb-3 text-base font-extrabold sm:text-lg">{cat ?? "كل المنتجات"}</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((p) => <Card key={p.id} p={p} />)}
              </div>
              {filtered.length === 0 && (
                <p className="mt-10 text-center text-sm" style={{ color: "var(--sf-muted)" }}>لا توجد منتجات معروضة حالياً.</p>
              )}
            </section>
          </main>
        ) : (
          <main className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { icon: BadgePercent, title: "اجمع النقاط", text: "كل طلب يضيف نقاطاً لرصيدك تلقائياً." },
              { icon: Gift, title: "استبدل المكافآت", text: "استبدل نقاطك بهدايا وخصومات من المتجر." },
              { icon: Phone, title: "رقمك هو بطاقتك", text: "أدخل رقم جوالك عند الطلب ليُحتسب رصيدك." },
            ].map((c) => (
              <div key={c.title} className="p-5" style={{ background: "var(--sf-surface)", borderRadius: "var(--sf-radius)" }}>
                <span className="mb-3 flex size-10 items-center justify-center rounded-2xl" style={{ background: "var(--sf-accent)" }}>
                  <c.icon className="size-5" style={{ color: "var(--sf-brand)" }} />
                </span>
                <p className="font-extrabold">{c.title}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--sf-muted)" }}>{c.text}</p>
              </div>
            ))}
          </main>
        )}

        {doneCode && (
          <div className="mt-6 p-4 text-sm" style={{ background: "var(--sf-surface)", borderRadius: "var(--sf-radius)" }}>
            تم استلام طلبك ✅ رقم الطلب: <strong dir="ltr">{doneCode}</strong>
          </div>
        )}

        <footer className="mt-12 border-t pt-6 text-center text-xs" style={{ borderColor: "var(--sf-accent)", color: "var(--sf-muted)" }}>
          {store.data.name} · مدعوم بمنصة رِجعة
        </footer>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-4 left-1/2 flex w-[min(440px,90vw)] -translate-x-1/2 items-center justify-around py-3 shadow-lg md:hidden"
        style={{ background: "var(--sf-surface)", borderRadius: "999px" }}
      >
        <button type="button" onClick={() => setTab("home")} aria-label="الرئيسية">
          <Home className="size-5" style={{ color: tab === "home" ? "var(--sf-brand)" : "var(--sf-muted)" }} />
        </button>
        <button type="button" onClick={() => setOpenCart(true)} className="relative" aria-label="السلة">
          <ShoppingBag className="size-5" style={{ color: "var(--sf-muted)" }} />
          {count > 0 && (
            <span
              className="absolute -top-2 left-3 flex size-4 items-center justify-center rounded-full text-[10px]"
              style={{ background: "var(--sf-brand)", color: "var(--sf-on-brand)" }}
            >
              {count}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setTab("rewards")} aria-label="المكافآت">
          <Gift className="size-5" style={{ color: tab === "rewards" ? "var(--sf-brand)" : "var(--sf-muted)" }} />
        </button>
      </nav>

      {/* Desktop floating cart */}
      <button
        type="button"
        onClick={() => setOpenCart(true)}
        className="fixed bottom-6 left-6 z-40 hidden items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-xl md:flex"
        style={{ background: "var(--sf-brand)", color: "var(--sf-on-brand)" }}
      >
        <ShoppingBag className="size-4" /> السلة {count > 0 && `· ${money(total)}`}
      </button>

      {lines.length > 0 && !openCart && (
        <button
          type="button"
          onClick={() => setOpenCart(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full px-6 py-3 text-sm font-bold shadow-lg md:hidden"
          style={{ background: "var(--sf-brand)", color: "var(--sf-on-brand)" }}
        >
          إتمام الطلب · {money(total)}
        </button>
      )}

      {/* Product detail */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg overflow-hidden p-0" style={{ ...themeVars(t), background: "var(--sf-surface)", color: "var(--sf-text)", borderRadius: "var(--sf-radius)" }}>
          {detail && (
            <div>
              <button
                type="button"
                onClick={() => detail.image_url && setZoom(detail.image_url)}
                className="block h-56 w-full overflow-hidden sm:h-64"
                style={{ background: "var(--sf-bg)" }}
                aria-label="تكبير الصورة"
              >
                {detail.image_url ? (
                  <img src={detail.image_url} alt={detail.name} className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center"><ImageIcon className="size-8" style={{ color: "var(--sf-muted)" }} /></span>
                )}
              </button>
              <div className="space-y-3 p-5">
                <h3 className="text-lg font-extrabold">{detail.name}</h3>
                {detail.description && <p className="text-sm" style={{ color: "var(--sf-muted)" }}>{detail.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xl font-extrabold" style={{ color: "var(--sf-brand)" }}>{money(detail.price)}</span>
                  {detail.reward_points > 0 && (
                    <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--sf-accent)" }}>
                      +{detail.reward_points} نقطة
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { add(detail); setDetail(null); toast.success("تمت الإضافة للسلة"); }}
                  className="w-full rounded-full py-3 text-sm font-bold"
                  style={{ background: "var(--sf-brand)", color: "var(--sf-on-brand)" }}
                >
                  أضف إلى السلة
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image zoom */}
      {zoom && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setZoom(null)}
        >
          <button type="button" className="absolute right-4 top-4 text-white" aria-label="إغلاق"><X className="size-6" /></button>
          <img src={zoom} alt="" className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
        </div>
      )}

      <Sheet open={openCart} onOpenChange={setOpenCart}>
        <SheetContent side="bottom" className="mx-auto max-h-[88vh] max-w-[560px] overflow-y-auto rounded-t-3xl">
          <SheetHeader><SheetTitle className="text-right">سلة الطلب</SheetTitle></SheetHeader>
          <div className="space-y-3 py-4">
            {lines.map((l) => (
              <div key={l.product.id} className="flex items-center justify-between gap-3 border-b pb-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{l.product.name}</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => sub(l.product)} aria-label="إنقاص"><Minus className="size-3.5" /></button>
                  <span className="font-bold">{l.qty}</span>
                  <button type="button" onClick={() => add(l.product)} aria-label="زيادة"><Plus className="size-3.5" /></button>
                </div>
                <span className="font-semibold">{money(Number(l.product.price) * l.qty)}</span>
              </div>
            ))}
            {lines.length === 0 && <p className="text-sm text-muted-foreground">السلة فارغة.</p>}

            <div className="flex justify-between pt-2 font-bold">
              <span>الإجمالي</span><span>{money(total)}</span>
            </div>
            {points > 0 && <p className="text-xs text-muted-foreground">ستحصل على {points} نقطة عند تأكيد الطلب.</p>}

            <div className="space-y-3 pt-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className="rounded-2xl" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الجوال" dir="ltr" className="rounded-2xl" />
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان (اختياري)" className="rounded-2xl" />
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظات" className="rounded-2xl" />
              <Button className="w-full rounded-full" onClick={submit} disabled={sending}>تأكيد الطلب</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold"
      style={{
        background: active ? "var(--sf-brand)" : "var(--sf-surface)",
        color: active ? "var(--sf-on-brand)" : "var(--sf-muted)",
      }}
    >
      {label}
    </button>
  );
}
