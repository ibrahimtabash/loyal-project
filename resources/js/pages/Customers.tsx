import { Link, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import { ArrowUpLeft, Coins, Gift, Plus, Search, Users } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import MerchantLayout from "../components/MerchantLayout";
import Pagination from "../components/Pagination";
import FormErrors from "../components/FormErrors";
import {
  date,
  number,
  type CustomerRecord,
  type MerchantStore,
  type Paginated,
} from "../loyalty-types";

export default function Customers({
  store,
  customers,
  stats,
  filters,
}: {
  store: MerchantStore;
  customers: Paginated<CustomerRecord>;
  stats: { customers: number; points: number; redemptions: number };
  filters: { q: string; filter: string };
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(filters.q);
  const [filter, setFilter] = useState(filters.filter);
  const [searching, setSearching] = useState(false);
  const form = useForm({ name: "", phone: "", email: "" });
  const search = (value = filter) =>
    router.get(
      "/customers",
      { q, filter: value },
      {
        preserveState: true,
        replace: true,
        onStart: () => setSearching(true),
        onFinish: () => setSearching(false),
      },
    );
  return (
    <MerchantLayout
      store={store}
      section="customers"
      title="عملاؤك، أقرب إليك."
      description="كل عميل له حكاية. تابع طلباته ونقاطه واهتم بالتفاصيل."
      action={
        <button
          className="button button-dark"
          onClick={() => {
            form.reset();
            form.clearErrors();
            setOpen(true);
          }}
        >
          <Plus size={17} /> إضافة عميل
        </button>
      }
    >
      <div className="loyalty-stats">
        {[
          [Users, "عملاء متجرك", stats.customers],
          [Coins, "نقاط في محافظ العملاء", stats.points],
          [Gift, "مكافآت تم استبدالها", stats.redemptions],
        ].map(([Icon, label, value], i) => {
          const I = Icon as typeof Users;
          return (
            <article className="stat-card" key={i}>
              <span>
                {label as string}
                <I size={19} />
              </span>
              <strong>{number(value as number)}</strong>
            </article>
          );
        })}
      </div>
      <section className="merchant-panel">
        <div className="customers-toolbar">
          <form
            className="customer-search"
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
          >
            <Search size={18} />
            <input
              aria-label="البحث بالاسم أو رقم الجوال"
              placeholder="ابحث بالاسم أو رقم الجوال..."
              value={q}
              maxLength={100}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="submit" disabled={searching}>
              {searching ? "جارٍ البحث..." : "بحث"}
            </button>
          </form>
          <div className="loyalty-tabs" aria-label="تصفية العملاء">
            {[
              ["all", "كل العملاء"],
              ["with_points", "لديهم نقاط"],
              ["repeat", "عملاء متكررون"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? "active" : ""}
                aria-pressed={filter === value}
                onClick={() => {
                  setFilter(value);
                  search(value);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {customers.data.length ? (
          <div className="table-scroll">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>رقم الجوال</th>
                  <th>رصيد النقاط</th>
                  <th>الطلبات</th>
                  <th>آخر طلب</th>
                  <th>
                    <span className="sr-only">فتح الملف</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.data.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link className="customer-name-cell" href={`/customers/${c.id}`}>
                        <span className="customer-avatar">{c.name.charAt(0)}</span>
                        <span>
                          {c.name}
                          <small>عميل منذ {date(c.created_at)}</small>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <span dir="ltr">{c.phone}</span>
                    </td>
                    <td>
                      <span className="points-pill">
                        <Coins size={13} /> {number(c.points_balance)}
                      </span>
                    </td>
                    <td>{number(c.orders_count || 0)}</td>
                    <td>{date(c.orders_max_created_at)}</td>
                    <td>
                      <Link
                        className="open-customer"
                        href={`/customers/${c.id}`}
                        aria-label={`فتح ملف ${c.name}`}
                      >
                        <ArrowUpLeft size={19} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users size={42} strokeWidth={1.2} />
            <h3>
              {filters.q || filters.filter !== "all"
                ? "لا يوجد عملاء بهذه الخيارات"
                : "أول عميل، بداية علاقة جميلة"}
            </h3>
            <p>يُضاف العميل تلقائياً عند تأكيد طلبه، أو يمكنك إضافته بنفسك.</p>
            <button className="text-link" onClick={() => setOpen(true)}>
              <Plus size={16} /> أضف عميلاً
            </button>
          </div>
        )}
        <Pagination page={customers} label="صفحات العملاء" />
      </section>
      <p className="loyalty-footnote">
        ملفات العملاء وأرصدتهم خاصة بمتجرك، ولا تظهر في واجهة المتجر العامة.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="merchant-dialog" dir="rtl">
          <DialogTitle>بداية معرفة جديدة</DialogTitle>
          <DialogDescription>أضف بيانات العميل لتتابع علاقته بمتجرك.</DialogDescription>
          <form
            className="merchant-form"
            onSubmit={(e) => {
              e.preventDefault();
              form.post("/customers", { onSuccess: () => setOpen(false) });
            }}
          >
            <label>
              اسم العميل
              <input
                required
                maxLength={100}
                autoComplete="name"
                value={form.data.name}
                onChange={(e) => form.setData("name", e.target.value)}
              />
            </label>
            <label>
              رقم الجوال
              <input
                required
                type="tel"
                dir="ltr"
                pattern="\+?[0-9]{8,15}"
                placeholder="+970599123456"
                value={form.data.phone}
                onChange={(e) => form.setData("phone", e.target.value)}
              />
              <small>
                استخدم نفس الصيغة التي يستخدمها العميل في طلباته. لا ندمج الأرقام المحلية والدولية
                تلقائياً.
              </small>
            </label>
            <label>
              البريد الإلكتروني (اختياري)
              <input
                type="email"
                dir="ltr"
                value={form.data.email}
                onChange={(e) => form.setData("email", e.target.value)}
              />
            </label>
            <FormErrors errors={form.errors} />
            <button className="button button-dark" disabled={form.processing}>
              {form.processing ? "جارٍ الحفظ..." : "إنشاء ملف العميل"}
              <ArrowUpLeft size={17} />
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </MerchantLayout>
  );
}
