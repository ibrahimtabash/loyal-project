import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, Leaf, Store, Check } from "lucide-react";
export default function Auth({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const form = useForm({
    name: "",
    store_name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  return (
    <main className="auth-page">
      <Head title={register ? "أنشئ متجرك" : "تسجيل الدخول"} />
      <section className="auth-aside">
        <Link className="platform-logo" href="/">
          رِجعة<span>REJAA</span>
        </Link>
        <div>
          <Leaf size={48} strokeWidth={1} />
          <h1>
            بداية صغيرة.
            <br />
            وحكاية تكبر معك.
          </h1>
          <p>
            متجرك، طلباتك، وعلاقتك بعملائك.
            <br />
            كلها في مكان واحد.
          </p>
          <span>
            <Check size={17} /> متجرك بهويتك
          </span>
          <span>
            <Check size={17} /> طلبات مباشرة عبر واتساب
          </span>
          <span>
            <Check size={17} /> تجربة جميلة على كل شاشة
          </span>
        </div>
        <small>مصممة لأصحاب المشاريع الطموحة.</small>
      </section>
      <section className="auth-main">
        <Link href="/" className="text-link">
          العودة للرئيسية <ArrowLeft size={17} />
        </Link>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.post(register ? "/register" : "/login");
          }}
        >
          <span className="form-icon">
            <Store size={25} />
          </span>
          <h2>{register ? "خلّينا نبدأ حكاية متجرك." : "أهلاً بعودتك."}</h2>
          <p>
            {register
              ? "أنشئ حسابك، ثم أضف لمستك الخاصة إلى المتجر."
              : "سجّل دخولك لتتابع ما يحدث في متجرك."}
          </p>
          {register && (
            <>
              <label>
                اسمك
                <input
                  required
                  autoComplete="name"
                  value={form.data.name}
                  onChange={(e) => form.setData("name", e.target.value)}
                />
              </label>
              <label>
                اسم المتجر
                <input
                  required
                  value={form.data.store_name}
                  onChange={(e) => form.setData("store_name", e.target.value)}
                  placeholder="ما اسم مشروعك؟"
                />
              </label>
            </>
          )}
          <label>
            البريد الإلكتروني
            <input
              required
              type="email"
              dir="ltr"
              autoComplete="email"
              value={form.data.email}
              onChange={(e) => form.setData("email", e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            كلمة المرور
            <input
              required
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              value={form.data.password}
              onChange={(e) => form.setData("password", e.target.value)}
              minLength={register ? 12 : undefined}
            />
            {register && <small>12 حرفاً على الأقل، تتضمن حروفاً وأرقاماً.</small>}
          </label>
          {register && (
            <label>
              تأكيد كلمة المرور
              <input
                required
                type="password"
                autoComplete="new-password"
                value={form.data.password_confirmation}
                onChange={(e) => form.setData("password_confirmation", e.target.value)}
              />
            </label>
          )}
          {Object.keys(form.errors).length > 0 && (
            <div className="form-errors" role="alert">
              {Object.values(form.errors).map((error, i) => (
                <p key={i}>{error}</p>
              ))}
            </div>
          )}
          <button className="button button-dark" disabled={form.processing}>
            {form.processing ? "لحظات..." : register ? "أنشئ متجري" : "تسجيل الدخول"}{" "}
            <ArrowLeft size={17} />
          </button>
          <p className="auth-switch">
            {register ? "عندك حساب؟" : "أول مرة معنا؟"}{" "}
            <Link href={register ? "/login" : "/register"}>
              {register ? "سجّل دخولك" : "أنشئ متجرك"}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
