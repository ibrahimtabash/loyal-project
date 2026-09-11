import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Leaf } from "lucide-react";
export default function Error({ status }: { status: number }) {
  const messages: Record<number, [string, string]> = {
    403: ["هذه الصفحة غير متاحة لحسابك", "ارجع إلى لوحة متجرك لمتابعة العمل."],
    404: ["يبدو أنك وصلت إلى مكان هادئ.", "الصفحة غير موجودة، أو أن المتجر لم يُنشر بعد."],
    419: ["انتهت صلاحية الجلسة", "ارجع إلى الصفحة وحدّثها قبل المحاولة مجدداً."],
    429: ["لنأخذ لحظة قصيرة", "وصلت طلبات كثيرة خلال وقت قصير. انتظر دقيقة ثم حاول مجدداً."],
    503: ["نرتّب بعض التفاصيل", "المنصة في صيانة مؤقتة. يسعدنا رجوعك بعد قليل."],
  };
  const [title, description] = messages[status] || [
    "تعذّر تحميل الصفحة",
    "حاول مرة أخرى بعد قليل.",
  ];
  return (
    <main className="confirmation-page">
      <Head title={title} />
      <section className="confirmation-card">
        <Leaf size={45} strokeWidth={1} />
        <span className="eyebrow">{status}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <Link className="button button-dark" href="/">
          إلى الرئيسية <ArrowLeft size={17} />
        </Link>
      </section>
    </main>
  );
}
