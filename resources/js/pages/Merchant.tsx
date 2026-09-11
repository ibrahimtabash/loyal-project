import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import ImageField from "../components/ImageField";
import ThemePicker from "../components/ThemePicker";
import MerchantSidebar, { merchantNavigation as nav } from "../components/MerchantSidebar";
import {
  ArrowUpLeft,
  Check,
  Eye,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Settings2,
  ShoppingBag,
  Sparkles,
  Store as StoreIcon,
  Users,
  Wallet,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { money, statuses, type Store, type Product, type Order } from "../types";

type Props = {
  section: string;
  store: Store;
  products: Product[];
  orders: { data: Order[]; links: { url: string | null; label: string; active: boolean }[] };
  stats: { orders: number; new_orders: number; revenue: number; customers: number };
};
const blankProduct = {
  name: "",
  description: "",
  category: "",
  price: 0,
  compare_price: null as number | null,
  image: "",
  reward_points: 0,
  is_available: true,
  is_featured: false,
};
export default function Merchant({ section, store, products, orders, stats }: Props) {
  const page = usePage<{ auth: { user: { name: string } }; flash: { success: string | null } }>();
  const [editor, setEditor] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [orderBusy, setOrderBusy] = useState<number | null>(null);
  const [orderError, setOrderError] = useState("");
  const productForm = useForm(blankProduct);
  const settings = useForm({
    name: store.name,
    slug: store.slug,
    tagline: store.tagline,
    description: store.description || "",
    city: store.city || "",
    currency: store.currency,
    whatsapp_phone: store.whatsapp_phone || "",
    delivery_fee: store.delivery_fee,
    accent: store.accent,
    theme: store.theme || 'roots',
    hero_image: store.hero_image || "",
    is_published: store.is_published || false,
  });
  const title = nav.find((n) => n[0] === section)?.[1] || "لوحة التحكم";
  const openProduct = (product?: Product) => {
    setEditingId(product?.id ?? null);
    productForm.clearErrors();
    productForm.setData(
      product
        ? {
            name: product.name,
            description: product.description || "",
            category: product.category,
            price: product.price,
            compare_price: product.compare_price,
            image: product.image || "",
            reward_points: product.reward_points,
            is_available: product.is_available ?? true,
            is_featured: product.is_featured,
          }
        : blankProduct,
    );
    setEditor(true);
  };
  const saveProduct = (event: React.FormEvent) => {
    event.preventDefault();
    const options = { preserveScroll: true, onSuccess: () => setEditor(false) };
    editingId
      ? productForm.put(`/products/${editingId}`, options)
      : productForm.post("/products", options);
  };
  const nextStatuses: Record<string, string[]> = {
    new: ["confirmed", "canceled"],
    confirmed: ["preparing", "canceled"],
    preparing: ["delivered", "canceled"],
    delivered: [],
    canceled: [],
  };
  const orderTable = (
    <>
      {orders.data.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>الطلب</th>
                <th>العميل</th>
                <th>الإجمالي</th>
                <th>الحالة</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {orders.data.map((order) => (
                <tr key={order.id}>
                  <td>
                    #{order.id}
                    <small>{new Date(order.created_at).toLocaleDateString("ar")}</small>
                    <details className="order-details">
                      <summary>التفاصيل</summary>
                      {order.items.map((item) => (
                        <div key={item.id}>
                          {item.name} × {item.quantity}
                        </div>
                      ))}
                      <div>
                        {order.fulfillment === "pickup" ? "استلام من المتجر" : order.address}
                      </div>
                      {order.note && <div>{order.note}</div>}
                      <div>
                        {order.reward_points} نقطة{" "}
                        {order.status === "delivered" ? "مكتسبة" : "متوقعة"}
                      </div>
                    </details>
                  </td>
                  <td>
                    {order.customer_id ? (
                      <Link className="text-link" href={`/customers/${order.customer_id}`}>
                        {order.customer_name}
                      </Link>
                    ) : (
                      order.customer_name
                    )}
                    <small dir="ltr">{order.customer_phone}</small>
                  </td>
                  <td>{money(order.total, order.currency)}</td>
                  <td>
                    <span className={`status-badge ${order.status}`}>{statuses[order.status]}</span>
                  </td>
                  <td>
                    {nextStatuses[order.status]?.length > 0 ? (
                      <select
                        className="order-status-select"
                        aria-label={`تحديث الطلب ${order.id}`}
                        value={order.status}
                        disabled={orderBusy === order.id}
                        onChange={(e) => {
                          setOrderBusy(order.id);
                          setOrderError("");
                          router.patch(
                            `/orders/${order.id}`,
                            { status: e.target.value },
                            {
                              preserveScroll: true,
                              onFinish: () => setOrderBusy(null),
                              onError: () =>
                                setOrderError("تعذّر تحديث الطلب. حدّث الصفحة وحاول مجدداً."),
                            },
                          );
                        }}
                      >
                        <option value={order.status}>{statuses[order.status]}</option>
                        {nextStatuses[order.status].map((s) => (
                          <option value={s} key={s}>
                            {statuses[s]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Check size={16} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <ShoppingBag size={34} />
          <h3>أول طلب يبدأ برابط متجرك</h3>
          <p>انشر المتجر وشارك الرابط مع عملائك لتظهر الطلبات هنا.</p>
          <Link className="text-link" href="/store">
            إعداد المتجر <ArrowUpLeft size={17} />
          </Link>
        </div>
      )}
      {orders.links.length > 3 && (
        <nav className="pagination" aria-label="صفحات الطلبات">
          {orders.links.map((link, i) => {
            const label =
              i === 0 ? "السابق" : i === orders.links.length - 1 ? "التالي" : link.label;
            return link.url ? (
              <Link key={i} href={link.url} className={link.active ? "active" : ""}>
                {label}
              </Link>
            ) : (
              <span key={i}>{label}</span>
            );
          })}
        </nav>
      )}
    </>
  );
  return (
    <div className="merchant-shell">
      <Head title={title} />
      <MerchantSidebar store={store} section={section} />
      <main className="merchant-main">
        <div className="merchant-top">
          <span>أهلاً، {page.props.auth.user.name} 👋</span>
          {store.is_published ? (
            <a href={`/s/${store.slug}`} target="_blank" rel="noreferrer" className="text-link">
              <Eye size={16} /> زيارة المتجر <ArrowUpLeft size={14} />
            </a>
          ) : (
            <span>مساحتك لإدارة مشروعك</span>
          )}
        </div>
        {page.props.flash.success && (
          <div className="merchant-success" role="status">
            {page.props.flash.success}
          </div>
        )}
        <div className="merchant-heading">
          <div>
            <h1>{title}</h1>
            <p>
              {section === "dashboard"
                ? "كل ما تحتاج معرفته عن متجرك، بنظرة واحدة."
                : section === "products"
                  ? "اختياراتك الجميلة تبدأ من هنا."
                  : section === "orders"
                    ? "تابع رحلة كل طلب، من التأكيد إلى التسليم."
                    : "أضف هويتك، واضبط التفاصيل قبل النشر."}
            </p>
          </div>
          {section === "products" && (
            <button className="button button-dark" onClick={() => openProduct()}>
              <Plus size={17} /> إضافة منتج
            </button>
          )}
        </div>
        {section === "dashboard" && (
          <>
            {(!store.is_published || !products.length) && (
              <div className="onboarding">
                <Sparkles size={29} />
                <div>
                  <strong>متجرك الجميل على بُعد خطوات</strong>
                  <p>أضف منتجاتك، حدّد رقم واتساب، ثم انشر المتجر.</p>
                </div>
                <Link href="/store" className="text-link">
                  أكمل الإعداد <ArrowUpLeft size={17} />
                </Link>
              </div>
            )}
            <div className="stats-grid">
              {[
                [ShoppingBag, "كل الطلبات", stats.orders],
                [Package, "بانتظار التأكيد", stats.new_orders],
                [Wallet, "مبيعات تم تسليمها", money(stats.revenue, store.currency)],
                [Users, "العملاء", stats.customers],
              ].map(([Icon, label, value], i) => {
                const I = Icon as typeof Package;
                return (
                  <article className="stat-card" key={i}>
                    <span>
                      {label as string}
                      <I size={17} />
                    </span>
                    <strong>{value as string | number}</strong>
                  </article>
                );
              })}
            </div>
            <section className="merchant-panel">
              <h2>آخر الطلبات</h2>
              {orderTable}
            </section>
          </>
        )}
        {section === "orders" && (
          <section className="merchant-panel">
            {orderError && (
              <p className="form-errors" role="alert">
                {orderError}
              </p>
            )}
            {orderTable}
          </section>
        )}
        {section === "products" && (
          <>
            {products.length ? (
              <div className="merchant-products">
                {products.map((p) => (
                  <article className="merchant-product" key={p.id}>
                    {p.image ? (
                      <img src={p.image} alt={p.name} loading="lazy" />
                    ) : (
                      <div className="empty-state" style={{ padding: 45 }}>
                        <Package size={48} />
                      </div>
                    )}
                    <div>
                      <small>
                        {p.category} · {p.is_available ? "متاح" : "مخفي"}
                      </small>
                      <h3>{p.name}</h3>
                      <p>
                        <strong>{money(p.price, store.currency)}</strong>
                        <button onClick={() => openProduct(p)}>تعديل المنتج</button>
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <section className="merchant-panel empty-state">
                <Package size={40} />
                <h3>لنضف أول قطعة إلى متجرك</h3>
                <p>صورة جميلة، وصف بسيط، وسعر واضح.</p>
                <button className="button button-dark" onClick={() => openProduct()}>
                  <Plus size={16} /> إضافة أول منتج
                </button>
              </section>
            )}
          </>
        )}
        {section === "store" && (
          <section className="merchant-panel">
            <form
              className="merchant-form"
              onSubmit={(e) => {
                e.preventDefault();
                settings.put("/store", { preserveScroll: true });
              }}
            >
              <h2>هوية المتجر</h2>
              <ThemePicker value={settings.data.theme} onChange={(theme, accent) => settings.setData((data) => ({ ...data, theme, accent }))} />
              <div className="form-grid">
                <label>
                  اسم المتجر
                  <input
                    required
                    maxLength={100}
                    value={settings.data.name}
                    onChange={(e) => settings.setData("name", e.target.value)}
                  />
                </label>
                <label>
                  رابط المتجر
                  <input
                    required
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    dir="ltr"
                    value={settings.data.slug}
                    onChange={(e) => settings.setData("slug", e.target.value)}
                  />
                  <small dir="ltr">/s/{settings.data.slug}</small>
                </label>
              </div>
              <label>
                عنوان الواجهة الرئيسية
                <input
                  required
                  maxLength={160}
                  value={settings.data.tagline}
                  onChange={(e) => settings.setData("tagline", e.target.value)}
                />
              </label>
              <label>
                قصة المتجر
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={settings.data.description}
                  onChange={(e) => settings.setData("description", e.target.value)}
                />
              </label>
              <ImageField
                label="صورة غلاف المتجر"
                value={settings.data.hero_image}
                onChange={(url) => settings.setData("hero_image", url)}
              />
              <div className="form-grid">
                <label>
                  لون الهوية
                  <input
                    type="color"
                    value={settings.data.accent}
                    onChange={(e) => settings.setData("accent", e.target.value)}
                  />
                </label>
                <label>
                  المدينة
                  <input
                    value={settings.data.city}
                    onChange={(e) => settings.setData("city", e.target.value)}
                  />
                </label>
              </div>
              <h2>الطلبات والتوصيل</h2>
              <label>
                رقم واتساب
                <input
                  dir="ltr"
                  inputMode="tel"
                  pattern="[1-9][0-9]{7,14}"
                  required={settings.data.is_published}
                  value={settings.data.whatsapp_phone}
                  onChange={(e) => settings.setData("whatsapp_phone", e.target.value)}
                  placeholder="970599123456"
                />
                <small>رمز الدولة ثم الرقم، دون علامة + أو مسافات.</small>
              </label>
              <div className="form-grid">
                <label>
                  عملة المتجر
                  <select
                    value={settings.data.currency}
                    onChange={(e) => settings.setData("currency", e.target.value)}
                  >
                    {[
                      ["ILS", "شيكل"],
                      ["JOD", "دينار أردني"],
                      ["USD", "دولار أمريكي"],
                      ["SAR", "ريال سعودي"],
                      ["AED", "درهم إماراتي"],
                    ].map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  رسوم التوصيل
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="0.01"
                    required
                    value={settings.data.delivery_fee / 100}
                    onChange={(e) =>
                      settings.setData("delivery_fee", Math.round(Number(e.target.value) * 100))
                    }
                  />
                </label>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.data.is_published}
                  onChange={(e) => settings.setData("is_published", e.target.checked)}
                />{" "}
                نشر المتجر واستقبال الطلبات
              </label>
              <small>بعد النشر، يستطيع أي شخص لديه الرابط زيارة المتجر.</small>
              {Object.keys(settings.errors).length > 0 && (
                <div className="form-errors" role="alert">
                  {Object.values(settings.errors).map((v, i) => (
                    <p key={i}>{v}</p>
                  ))}
                </div>
              )}
              <button className="button button-dark" disabled={settings.processing}>
                <Check size={17} /> {settings.processing ? "جارٍ الحفظ..." : "حفظ إعدادات المتجر"}
              </button>
            </form>
          </section>
        )}
      </main>
      <Dialog open={editor} onOpenChange={setEditor}>
        <DialogContent className="merchant-dialog" dir="rtl">
          <DialogTitle>{editingId ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
          <DialogDescription>تفاصيل واضحة تساعد عميلك على الاختيار.</DialogDescription>
          <form className="merchant-form" onSubmit={saveProduct}>
            <label>
              اسم المنتج
              <input
                required
                value={productForm.data.name}
                onChange={(e) => productForm.setData("name", e.target.value)}
              />
            </label>
            <div className="form-grid">
              <label>
                التصنيف
                <input
                  required
                  value={productForm.data.category}
                  onChange={(e) => productForm.setData("category", e.target.value)}
                  placeholder="مثال: أواني وفخّار"
                />
              </label>
              <label>
                السعر ({store.currency})
                <input
                  required
                  type="number"
                  min="0.01"
                  max="100000"
                  step="0.01"
                  value={productForm.data.price / 100}
                  onChange={(e) =>
                    productForm.setData("price", Math.round(Number(e.target.value) * 100))
                  }
                />
              </label>
            </div>
            <label>
              وصف المنتج
              <textarea
                rows={3}
                value={productForm.data.description}
                onChange={(e) => productForm.setData("description", e.target.value)}
              />
            </label>
            <ImageField
              label="صورة المنتج"
              value={productForm.data.image}
              onChange={(url) => productForm.setData("image", url)}
            />
            <div className="form-grid">
              <label>
                السعر قبل التخفيض (اختياري)
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={
                    productForm.data.compare_price === null
                      ? ""
                      : productForm.data.compare_price / 100
                  }
                  onChange={(e) =>
                    productForm.setData(
                      "compare_price",
                      e.target.value === "" ? null : Math.round(Number(e.target.value) * 100),
                    )
                  }
                />
              </label>
              <label>
                نقاط بعد التسليم
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="1"
                  value={productForm.data.reward_points}
                  onChange={(e) => productForm.setData("reward_points", Number(e.target.value))}
                />
              </label>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={productForm.data.is_available}
                onChange={(e) => productForm.setData("is_available", e.target.checked)}
              />{" "}
              متاح في المتجر
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={productForm.data.is_featured}
                onChange={(e) => productForm.setData("is_featured", e.target.checked)}
              />{" "}
              ضمن الاختيارات المميّزة
            </label>
            {Object.keys(productForm.errors).length > 0 && (
              <div className="form-errors" role="alert">
                {Object.values(productForm.errors).map((v, i) => (
                  <p key={i}>{v}</p>
                ))}
              </div>
            )}
            <button className="button button-dark" disabled={productForm.processing}>
              {productForm.processing ? "جارٍ الحفظ..." : "حفظ المنتج"} <Check size={17} />
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
