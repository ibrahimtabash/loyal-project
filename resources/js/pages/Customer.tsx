import { Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpLeft,
  Check,
  Coins,
  Gift,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
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
  type PointEntry,
  type Reward,
} from "../loyalty-types";
import { money, statuses } from "../types";

type Props = {
  store: MerchantStore;
  customer: CustomerRecord;
  entries: Paginated<PointEntry>;
  notes: Paginated<{ id: number; body: string; created_at: string }>;
  orders: { id: number; total: number; currency: string; status: string; created_at: string }[];
  rewards: Pick<Reward, "id" | "name" | "points_cost" | "image" | "stock" | "revision">[];
  stats: { orders: number; spent: number; earned: number };
};
export default function Customer({
  store,
  customer,
  entries,
  notes,
  orders,
  rewards,
  stats,
}: Props) {
  const [modal, setModal] = useState<"edit" | "adjust" | "redeem" | null>(null);
  const [direction, setDirection] = useState<"add" | "deduct">("add");
  const edit = useForm({ name: customer.name, email: customer.email || "" });
  const note = useForm({ body: "" });
  const adjust = useForm({ amount: 1, reason: "", idempotency_key: "" });
  const redeem = useForm({
    reward_id: "",
    confirmed: false,
    idempotency_key: "",
    reward_version: 0,
  });
  const selected = rewards.find((r) => r.id === Number(redeem.data.reward_id));
  const adjustmentBalance =
    customer.points_balance + (direction === "add" ? adjust.data.amount : -adjust.data.amount);
  const openAdjust = () => {
    setDirection("add");
    adjust.reset();
    adjust.clearErrors();
    adjust.setData("idempotency_key", crypto.randomUUID());
    setModal("adjust");
  };
  const openRedeem = () => {
    redeem.reset();
    redeem.clearErrors();
    redeem.setData("idempotency_key", crypto.randomUUID());
    setModal("redeem");
  };
  return (
    <MerchantLayout
      store={store}
      section="customers"
      title="ملف العميل"
      description="التفاصيل التي تجعل كل رِجعة أجمل."
      action={
        <Link className="text-link" href="/customers">
          <ArrowRight size={16} /> كل العملاء
        </Link>
      }
    >
      <section className="customer-profile">
        <div className="customer-profile-identity">
          <span className="customer-avatar large">{customer.name.charAt(0)}</span>
          <div>
            <span className="eyebrow">عميل منذ {date(customer.created_at)}</span>
            <h2>{customer.name}</h2>
            <div className="customer-contact">
              <span>
                <Phone size={14} />
                <b dir="ltr">{customer.phone}</b>
              </span>
              {customer.email && (
                <span>
                  <Mail size={14} />
                  <b dir="ltr">{customer.email}</b>
                </span>
              )}
            </div>
          </div>
          <button
            className="profile-edit"
            aria-label="تعديل بيانات العميل"
            onClick={() => {
              edit.setData({ name: customer.name, email: customer.email || "" });
              edit.clearErrors();
              setModal("edit");
            }}
          >
            <Pencil size={17} />
          </button>
        </div>
        <div className="customer-wallet">
          <span>
            <Coins size={17} /> الرصيد المتاح
          </span>
          <strong>
            {number(customer.points_balance)}
            <small>نقطة</small>
          </strong>
          <div>
            <button className="button button-light" onClick={openRedeem}>
              <Gift size={16} /> استبدال مكافأة
            </button>
            <button className="wallet-adjust" onClick={openAdjust}>
              تعديل النقاط
            </button>
          </div>
        </div>
      </section>
      <div className="loyalty-stats compact">
        {[
          [ShoppingBag, "طلبات العميل", number(stats.orders)],
          [ArrowUpLeft, "مشتريات تم تسليمها", money(stats.spent, store.currency)],
          [Sparkles, "نقاط من الطلبات", number(stats.earned)],
        ].map(([Icon, label, value], i) => {
          const I = Icon as typeof Coins;
          return (
            <article className="stat-card" key={i}>
              <span>
                {label as string}
                <I size={17} />
              </span>
              <strong>{value as string}</strong>
            </article>
          );
        })}
      </div>
      <div className="customer-columns">
        <div>
          <section className="merchant-panel">
            <div className="panel-heading">
              <h2>حكاية النقاط</h2>
              <span>{number(entries.total)} حركة</span>
            </div>
            {entries.data.length ? (
              <div className="points-timeline">
                {entries.data.map((entry) => (
                  <article key={entry.id}>
                    <span className={`entry-icon ${entry.kind}`}>
                      {entry.kind === "redemption" ? (
                        <Gift size={18} />
                      ) : entry.kind === "earn" ? (
                        <ShoppingBag size={18} />
                      ) : (
                        <Pencil size={17} />
                      )}
                    </span>
                    <div>
                      <strong>{entry.description}</strong>
                      <small>
                        {date(entry.created_at)} · الرصيد بعد الحركة {number(entry.balance_after)}
                      </small>
                    </div>
                    <b className={entry.delta < 0 ? "negative" : "positive"} dir="ltr">
                      {entry.delta > 0 ? "+" : ""}
                      {number(entry.delta)}
                    </b>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state compact-empty">
                <Coins size={32} />
                <h3>هنا تبدأ حكاية النقاط</h3>
                <p>عند تسليم طلب، تظهر نقاطه تلقائياً في هذا السجل.</p>
              </div>
            )}
            <Pagination page={entries} label="صفحات حركات النقاط" />
          </section>
          <section className="merchant-panel">
            <div className="panel-heading">
              <h2>آخر الطلبات</h2>
              <span>آخر 10 طلبات</span>
            </div>
            {orders.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>الطلب</th>
                      <th>التاريخ</th>
                      <th>القيمة</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td>{date(o.created_at)}</td>
                        <td>{money(o.total, o.currency)}</td>
                        <td>
                          <span className={`status-badge ${o.status}`}>{statuses[o.status]}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="loyalty-footnote">لا توجد طلبات مرتبطة بهذا العميل بعد.</p>
            )}
          </section>
        </div>
        <aside>
          <section className="merchant-panel notes-panel">
            <div className="panel-heading">
              <h2>لمسات شخصية</h2>
              <MessageSquare size={18} />
            </div>
            <p>تفضيلات العميل والتفاصيل التي تستحق أن تتذكّرها.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                note.post(`/customers/${customer.id}/notes`, {
                  preserveScroll: true,
                  onSuccess: () => note.reset(),
                });
              }}
            >
              <label className="sr-only" htmlFor="customer-note">
                ملاحظة خاصة عن العميل
              </label>
              <textarea
                id="customer-note"
                required
                maxLength={2000}
                rows={3}
                value={note.data.body}
                onChange={(e) => note.setData("body", e.target.value)}
                placeholder="مثلاً: يفضّل التواصل بعد العصر..."
              />
              <FormErrors errors={note.errors} />
              <button className="text-link" disabled={note.processing || !note.data.body.trim()}>
                <Plus size={15} />
                {note.processing ? "جارٍ الحفظ..." : "أضف ملاحظة"}
              </button>
            </form>
            <div className="customer-notes">
              {notes.data.map((n) => (
                <article key={n.id}>
                  <small>{date(n.created_at)}</small>
                  <p>{n.body}</p>
                </article>
              ))}
            </div>
            <Pagination page={notes} label="صفحات الملاحظات" />
            <small className="private-note">هذه الملاحظات خاصة بالتاجر.</small>
          </section>
        </aside>
      </div>
      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        <DialogContent className="merchant-dialog" dir="rtl">
          {modal === "edit" && (
            <>
              <DialogTitle>بيانات {customer.name}</DialogTitle>
              <DialogDescription>حدّث الاسم أو البريد مع الحفاظ على سجل العميل.</DialogDescription>
              <form
                className="merchant-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  edit.put(`/customers/${customer.id}`, {
                    preserveScroll: true,
                    onSuccess: () => setModal(null),
                  });
                }}
              >
                <label>
                  الاسم
                  <input
                    required
                    maxLength={100}
                    value={edit.data.name}
                    onChange={(e) => edit.setData("name", e.target.value)}
                  />
                </label>
                <label>
                  البريد الإلكتروني (اختياري)
                  <input
                    type="email"
                    dir="ltr"
                    value={edit.data.email}
                    onChange={(e) => edit.setData("email", e.target.value)}
                  />
                </label>
                <FormErrors errors={edit.errors} />
                <button className="button button-dark" disabled={edit.processing}>
                  حفظ البيانات <Check size={16} />
                </button>
              </form>
            </>
          )}
          {modal === "adjust" && (
            <>
              <DialogTitle>تعديل نقاط العميل</DialogTitle>
              <DialogDescription>كل تعديل يُحفظ مع سببه، ويظهر في سجل النقاط.</DialogDescription>
              <form
                className="merchant-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  adjust.transform((data) => ({
                    delta: direction === "add" ? data.amount : -data.amount,
                    reason: data.reason,
                    idempotency_key: data.idempotency_key,
                  }));
                  adjust.post(`/customers/${customer.id}/points`, {
                    preserveScroll: true,
                    onSuccess: () => setModal(null),
                  });
                }}
              >
                <div className="loyalty-tabs">
                  <button
                    type="button"
                    className={direction === "add" ? "active" : ""}
                    aria-pressed={direction === "add"}
                    onClick={() => setDirection("add")}
                  >
                    إضافة نقاط
                  </button>
                  <button
                    type="button"
                    className={direction === "deduct" ? "active" : ""}
                    aria-pressed={direction === "deduct"}
                    onClick={() => setDirection("deduct")}
                  >
                    خصم نقاط
                  </button>
                </div>
                <label>
                  عدد النقاط
                  <input
                    required
                    type="number"
                    min="1"
                    max="1000000"
                    step="1"
                    value={adjust.data.amount}
                    onChange={(e) => adjust.setData("amount", Number(e.target.value))}
                  />
                </label>
                <label>
                  سبب التعديل
                  <textarea
                    required
                    minLength={5}
                    maxLength={500}
                    rows={3}
                    value={adjust.data.reason}
                    onChange={(e) => adjust.setData("reason", e.target.value)}
                    placeholder="مثلاً: تصحيح نقاط فاتورة سابقة..."
                  />
                </label>
                <div className="loyalty-operation-summary">
                  <span>
                    الرصيد الحالي <b>{number(customer.points_balance)}</b>
                  </span>
                  <span>
                    الرصيد بعد التعديل <b>{number(adjustmentBalance)}</b>
                  </span>
                </div>
                <FormErrors errors={adjust.errors} />
                <button
                  className="button button-dark"
                  disabled={adjust.processing || adjustmentBalance < 0 || adjust.data.amount < 1}
                >
                  {adjust.processing ? "جارٍ التسجيل..." : "تأكيد تعديل النقاط"}
                  <Check size={16} />
                </button>
              </form>
            </>
          )}
          {modal === "redeem" && (
            <>
              <DialogTitle>رِجعة تستحق مكافأة</DialogTitle>
              <DialogDescription>
                اختر المكافأة للعميل. تُخصم النقاط عند تأكيد الاستبدال.
              </DialogDescription>
              <form
                className="merchant-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  redeem.transform((data) => ({
                    ...data,
                    reward_version: selected?.revision ?? 0,
                  }));
                  redeem.post(`/customers/${customer.id}/redeem`, {
                    preserveScroll: true,
                    onSuccess: () => setModal(null),
                    onError: () => redeem.setData("confirmed", false),
                  });
                }}
              >
                <div className="redeem-balance">
                  <Coins size={18} /> رصيد {customer.name}:{" "}
                  <strong>{number(customer.points_balance)} نقطة</strong>
                </div>
                {rewards.length ? (
                  <label>
                    المكافأة
                    <select
                      required
                      value={redeem.data.reward_id}
                      onChange={(e) =>
                        redeem.setData({
                          ...redeem.data,
                          reward_id: e.target.value,
                          confirmed: false,
                        })
                      }
                    >
                      <option value="">اختر مكافأة...</option>
                      {rewards.map((r) => (
                        <option
                          key={r.id}
                          value={r.id}
                          disabled={r.points_cost > customer.points_balance}
                        >
                          {r.name} — {number(r.points_cost)} نقطة
                          {r.points_cost > customer.points_balance ? " (الرصيد غير كافٍ)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p className="loyalty-footnote">
                    لا توجد مكافآت متاحة. <Link href="/rewards">أضف مكافأة من هنا.</Link>
                  </p>
                )}
                {selected && (
                  <div className="redemption-preview">
                    {selected.image ? (
                      <img src={selected.image} alt={selected.name} />
                    ) : (
                      <Gift size={35} />
                    )}
                    <div>
                      <strong>{selected.name}</strong>
                      <small>
                        {selected.stock === null ? "متاحة" : `متبقي ${number(selected.stock)}`}
                      </small>
                    </div>
                    <b>{number(selected.points_cost)} نقطة</b>
                  </div>
                )}
                {selected && (
                  <div className="loyalty-operation-summary">
                    <span>
                      سيُخصم <b>{number(selected.points_cost)} نقطة</b>
                    </span>
                    <span>
                      الرصيد المتبقي{" "}
                      <b>{number(customer.points_balance - selected.points_cost)} نقطة</b>
                    </span>
                  </div>
                )}
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    required
                    checked={redeem.data.confirmed}
                    onChange={(e) => redeem.setData("confirmed", e.target.checked)}
                  />{" "}
                  تحققت من العميل وسلّمته المكافأة.
                </label>
                <FormErrors errors={redeem.errors} />
                <button
                  className="button button-dark"
                  disabled={
                    redeem.processing ||
                    !selected ||
                    !redeem.data.confirmed ||
                    selected.points_cost > customer.points_balance
                  }
                >
                  {redeem.processing ? "جارٍ الاستبدال..." : "تأكيد الاستبدال وخصم النقاط"}
                  <Gift size={17} />
                </button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MerchantLayout>
  );
}
