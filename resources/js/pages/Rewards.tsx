import { Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import { ArrowUpLeft, Check, Coins, Gift, Plus, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import MerchantLayout from "../components/MerchantLayout";
import ImageField from "../components/ImageField";
import FormErrors from "../components/FormErrors";
import Pagination from "../components/Pagination";
import { number, type MerchantStore, type Paginated, type Reward } from "../loyalty-types";
const blank = {
  name: "",
  description: "",
  image: "",
  points_cost: 100,
  stock: null as number | null,
  is_active: true,
  revision: 0,
};
export default function Rewards({
  store,
  rewards,
  stats,
}: {
  store: MerchantStore;
  rewards: Paginated<Reward>;
  stats: { active: number; redemptions: number; spent: number };
}) {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const form = useForm(blank);
  const edit = (reward?: Reward) => {
    setId(reward?.id ?? null);
    form.clearErrors();
    form.setData(
      reward
        ? {
            name: reward.name,
            description: reward.description || "",
            image: reward.image || "",
            points_cost: reward.points_cost,
            stock: reward.stock,
            is_active: reward.is_active,
            revision: reward.revision,
          }
        : blank,
    );
    setOpen(true);
  };
  return (
    <MerchantLayout
      store={store}
      section="rewards"
      title="سبب جميل لرِجعة جديدة."
      description="اصنع مكافآت يحبّها عملاؤك، وحدّد نقاطها والكمية المتاحة."
      action={
        <button className="button button-dark" onClick={() => edit()}>
          <Plus size={17} /> إضافة مكافأة
        </button>
      }
    >
      <div className="loyalty-stats">
        {[
          [Gift, "مكافآت مفعّلة", stats.active],
          [Sparkles, "مرات الاستبدال", stats.redemptions],
          [Coins, "نقاط استُبدلت", stats.spent],
        ].map(([Icon, label, value], i) => {
          const I = Icon as typeof Gift;
          return (
            <article className="stat-card" key={i}>
              <span>
                {label as string}
                <I size={18} />
              </span>
              <strong>{number(value as number)}</strong>
            </article>
          );
        })}
      </div>
      <div className="loyalty-guide">
        <span className="guide-icon">
          <Gift size={25} />
        </span>
        <div>
          <strong>من نقاط إلى لحظة حلوة</strong>
          <p>
            تظهر المكافآت المتاحة في متجرك. لإتمام الاستبدال، افتح ملف العميل وتحقق من هويته ورصيده.
          </p>
        </div>
        <Link className="text-link" href="/customers">
          ملفات العملاء <ArrowUpLeft size={17} />
        </Link>
      </div>
      {rewards.data.length ? (
        <div className="reward-admin-grid">
          {rewards.data.map((reward) => (
            <article className="reward-admin-card" key={reward.id}>
              <div className="reward-admin-image">
                {reward.image ? (
                  <img src={reward.image} alt={reward.name} loading="lazy" />
                ) : (
                  <Gift size={53} strokeWidth={1.2} />
                )}
                <span
                  className={`reward-availability ${!reward.is_active || reward.stock === 0 ? "inactive" : ""}`}
                >
                  {!reward.is_active
                    ? "مخفية"
                    : reward.stock === 0
                      ? "نفدت الكمية"
                      : "متاحة في المتجر"}
                </span>
              </div>
              <div className="reward-admin-body">
                <span className="reward-cost">
                  <Coins size={15} />
                  {number(reward.points_cost)} نقطة
                </span>
                <h2>{reward.name}</h2>
                <p>{reward.description || "مكافأة جميلة تستحق الرِجعة."}</p>
                <div>
                  <small>
                    {reward.stock === null
                      ? "كمية غير محدودة"
                      : `الكمية المتبقية: ${number(reward.stock)}`}
                  </small>
                  <button className="text-link" onClick={() => edit(reward)}>
                    تعديل <ArrowUpLeft size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="merchant-panel empty-state">
          <Gift size={48} strokeWidth={1.1} />
          <h3>شو بتحب تهدي عملاءك؟</h3>
          <p>منتج مجاني أو هدية مميزة. ابدأ بأول مكافأة.</p>
          <button className="button button-dark" onClick={() => edit()}>
            <Plus size={17} /> أضف أول مكافأة
          </button>
        </section>
      )}
      <Pagination page={rewards} label="صفحات المكافآت" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="merchant-dialog" dir="rtl">
          <DialogTitle>{id ? "تعديل المكافأة" : "مكافأة تستحق الرِجعة"}</DialogTitle>
          <DialogDescription>وضّح ما سيحصل عليه العميل، وعدد النقاط المطلوبة.</DialogDescription>
          <form
            className="merchant-form"
            onSubmit={(e) => {
              e.preventDefault();
              const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
              id ? form.put(`/rewards/${id}`, options) : form.post("/rewards", options);
            }}
          >
            <label>
              اسم المكافأة
              <input
                required
                maxLength={160}
                placeholder="مثلاً: كوب قهوة على حسابنا"
                value={form.data.name}
                onChange={(e) => form.setData("name", e.target.value)}
              />
            </label>
            <label>
              التفاصيل وشروط الاستخدام
              <textarea
                maxLength={2000}
                rows={3}
                value={form.data.description}
                onChange={(e) => form.setData("description", e.target.value)}
                placeholder="ما الذي يحصل عليه العميل؟"
              />
            </label>
            <ImageField
              label="صورة المكافأة"
              value={form.data.image}
              onChange={(url) => form.setData("image", url)}
            />
            <div className="form-grid">
              <label>
                النقاط المطلوبة
                <input
                  required
                  type="number"
                  min="1"
                  max="1000000"
                  step="1"
                  value={form.data.points_cost}
                  onChange={(e) => form.setData("points_cost", Number(e.target.value))}
                />
              </label>
              <label>
                الكمية المتاحة
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  value={form.data.stock ?? ""}
                  onChange={(e) =>
                    form.setData("stock", e.target.value === "" ? null : Number(e.target.value))
                  }
                  placeholder="اتركه فارغاً لكمية غير محدودة"
                />
              </label>
            </div>
            <small>عند الاستبدال تُخصم قطعة واحدة. الكمية صفر تخفي المكافأة من المتجر.</small>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.data.is_active}
                onChange={(e) => form.setData("is_active", e.target.checked)}
              />{" "}
              عرض المكافأة في المتجر وإتاحة استبدالها
            </label>
            <FormErrors errors={form.errors} />
            <button className="button button-dark" disabled={form.processing}>
              {form.processing ? "جارٍ الحفظ..." : "حفظ المكافأة"}
              <Check size={17} />
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </MerchantLayout>
  );
}
