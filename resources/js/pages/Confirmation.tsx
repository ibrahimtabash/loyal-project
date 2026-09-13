import { Head, Link } from "@inertiajs/react";
import { Check, ArrowLeft, MessageCircle, Package } from "lucide-react";
import { money, type Order } from "../types";
import { getStoreTheme } from "../lib/store-themes";
export default function Confirmation({
  order,
  store,
  whatsappUrl,
}: {
  order: Order;
  store: { name: string; slug: string; accent?: string; theme?: string };
  whatsappUrl: string;
}) {
  const theme = getStoreTheme(store.theme);
  return (
    <main className={`confirmation-page theme-${theme.id}`} style={{ "--store-accent": store.accent || theme.accent } as React.CSSProperties}>
      <Head title={`طلبك #${order.id}`} />
      <Link className="text-link" href={`/s/${store.slug}`}>
        <ArrowLeft size={17} /> العودة إلى {store.name}
      </Link>
      <section className="confirmation-card">
        <span className="success-icon">
          <Check size={32} />
        </span>
        <span className="eyebrow">شكراً لاختيارك {store.name}</span>
        <h1>اختياراتك وصلت إلينا.</h1>
        <p>
          تم حفظ طلبك <strong>#{order.id}</strong>. بقيت خطوة: أرسل تفاصيله عبر واتساب ليتواصل معك
          المتجر ويؤكده.
        </p>
        <div className="confirmation-items">
          {order.items.map((item) => (
            <div key={item.id}>
              <span>
                <Package size={16} />
                {item.name} <small>× {item.quantity}</small>
              </span>
              <strong>{money(item.price * item.quantity, order.currency)}</strong>
            </div>
          ))}
          <div>
            <span>التوصيل</span>
            <strong>{money(order.delivery_fee, order.currency)}</strong>
          </div>
          <div className="summary-total">
            <span>الإجمالي</span>
            <strong>{money(order.total, order.currency)}</strong>
          </div>
        </div>
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="button button-dark">
          <MessageCircle size={20} /> افتح واتساب وأرسل الطلب <ArrowLeft size={18} />
        </a>
        <small>لم يتم إرسال رسالة تلقائياً. تأكيد الطلب وتفاصيل الدفع مع المتجر.</small>
      </section>
    </main>
  );
}
