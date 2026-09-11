import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/whatsapp-guide")({
  head: () => ({
    meta: [
      { title: "دليل ربط واتساب بزنس | رِجعة" },
      {
        name: "description",
        content:
          "خطوات مصوّرة لأصحاب المتاجر للحصول على معرّف الرقم ورمز الوصول واسم القالب من منصة ميتا وربطها بحساب رِجعة.",
      },
      { property: "og:title", content: "دليل ربط واتساب بزنس | رِجعة" },
      { property: "og:description", content: "خطوات بسيطة لربط رقم واتساب الرسمي بمتجرك." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuidePage,
});

type Step = {
  n: number;
  title: string;
  body: string;
  visual: "meta" | "app" | "number" | "token" | "template" | "connect";
  hint?: string;
};

const steps: Step[] = [
  {
    n: 1,
    title: "افتح حساب مطوّري ميتا",
    body: "ادخل على منصة المطوّرين لدى ميتا وسجّل الدخول بحساب فيسبوك الخاص بالمتجر (وليس حسابك الشخصي إن أمكن).",
    visual: "meta",
    hint: "developers.facebook.com",
  },
  {
    n: 2,
    title: "أنشئ تطبيقاً واختر واتساب",
    body: "اضغط «Create App» ثم اختر نوع «Business»، وبعد إنشائه أضف منتج WhatsApp من قائمة المنتجات.",
    visual: "app",
  },
  {
    n: 3,
    title: "انسخ معرّف الرقم (Phone Number ID)",
    body: "من صفحة إعداد واتساب ستجد رقم الاختبار أو رقمك الرسمي، وتحته رقم طويل اسمه Phone Number ID — انسخه.",
    visual: "number",
    hint: "مثال: 123456789012345",
  },
  {
    n: 4,
    title: "أنشئ رمز وصول دائم",
    body: "من إعدادات الأعمال أنشئ مستخدم نظام، امنحه صلاحية whatsapp_business_messaging، ثم أصدر رمز وصول دائم وانسخه فوراً.",
    visual: "token",
    hint: "الرمز يظهر مرة واحدة فقط",
  },
  {
    n: 5,
    title: "اعتمد قالب رسالة",
    body: "من قسم Message Templates أنشئ قالباً باللغة العربية للرسائل الترويجية وانتظر اعتماده، ثم انسخ اسمه بالضبط.",
    visual: "template",
    hint: "الرسائل الحرة مسموحة فقط خلال ٢٤ ساعة من رسالة العميل",
  },
  {
    n: 6,
    title: "الصق البيانات في رِجعة",
    body: "ارجع لصفحة حملات واتساب، اضغط «ربط واتساب بزنس»، والصق معرّف الرقم ورمز الوصول واسم القالب ثم احفظ.",
    visual: "connect",
  },
];

function Visual({ kind }: { kind: Step["visual"] }) {
  const chrome = (children: React.ReactNode) => (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center gap-1.5 border-b bg-muted/50 px-3 py-2">
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
      </div>
      <div className="space-y-2 p-4">{children}</div>
    </div>
  );

  const bar = (w: string, strong = false) => (
    <div className={`h-2.5 rounded-full ${strong ? "bg-primary/70" : "bg-muted"}`} style={{ width: w }} />
  );

  if (kind === "meta")
    return chrome(
      <>
        {bar("45%", true)}
        {bar("80%")}
        {bar("60%")}
        <div className="mt-3 inline-flex rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary">
          تسجيل الدخول
        </div>
      </>,
    );

  if (kind === "app")
    return chrome(
      <div className="grid grid-cols-3 gap-2">
        {["Business", "Consumer", "Gaming"].map((t, i) => (
          <div
            key={t}
            className={`rounded-xl border p-3 text-center text-[11px] ${i === 0 ? "border-primary bg-primary/10 font-semibold text-primary" : "text-muted-foreground"}`}
          >
            {t}
          </div>
        ))}
      </div>,
    );

  if (kind === "number")
    return chrome(
      <>
        {bar("35%")}
        <div className="rounded-xl border border-dashed border-primary/60 bg-primary/5 p-3">
          <p className="text-[11px] text-muted-foreground">Phone Number ID</p>
          <p className="font-mono text-sm" dir="ltr">
            123456789012345
          </p>
        </div>
        {bar("55%")}
      </>,
    );

  if (kind === "token")
    return chrome(
      <>
        {bar("40%")}
        <div className="rounded-xl border border-dashed border-primary/60 bg-primary/5 p-3">
          <p className="text-[11px] text-muted-foreground">Permanent access token</p>
          <p className="truncate font-mono text-sm" dir="ltr">
            EAAG••••••••••••••••••
          </p>
        </div>
        <div className="inline-flex rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary">نسخ</div>
      </>,
    );

  if (kind === "template")
    return chrome(
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border p-3">
          <span className="font-mono text-xs" dir="ltr">
            points_reminder_ar
          </span>
          <Badge className="rounded-full bg-primary/15 text-primary">معتمد</Badge>
        </div>
        <div className="flex items-center justify-between rounded-xl border p-3 opacity-60">
          <span className="font-mono text-xs" dir="ltr">
            welcome_ar
          </span>
          <Badge variant="secondary" className="rounded-full">
            قيد المراجعة
          </Badge>
        </div>
      </div>,
    );

  return chrome(
    <>
      <p className="text-xs font-semibold">ربط واتساب بزنس</p>
      <div className="rounded-lg border px-3 py-2 text-[11px] text-muted-foreground">Phone Number ID</div>
      <div className="rounded-lg border px-3 py-2 text-[11px] text-muted-foreground">رمز الوصول</div>
      <div className="inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
        حفظ الربط
      </div>
    </>,
  );
}

function GuidePage() {
  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">دليل ربط واتساب بزنس</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ست خطوات للحصول على بيانات الربط من ميتا وإدخالها في متجرك.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/whatsapp">
            <ArrowRight className="size-4" />
            العودة للحملات
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {steps.map((s) => (
          <Card key={s.n} className="overflow-hidden">
            <CardHeader className="flex-row items-start gap-3 space-y-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {s.n}
              </span>
              <div>
                <CardTitle className="text-base">{s.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Visual kind={s.visual} />
              {s.hint && (
                <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground" dir="auto">
                  {s.hint}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <ExternalLink className="size-5 text-muted-foreground" />
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            كل هذه الخطوات تتم في منصة مطوّري ميتا. بعد الحفظ في رِجعة يمكنك إرسال الرسائل تلقائياً بدون فتح تطبيق واتساب.
          </p>
          <Button asChild className="gap-2">
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">
              فتح منصة ميتا
            </a>
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
