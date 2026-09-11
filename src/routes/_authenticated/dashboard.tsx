import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { CreateBusinessCard } from "@/components/CreateBusinessCard";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { fetchCustomers, fetchRewards, fetchTransactions, planName, statusLabel } from "@/lib/loyalty";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Coins, Gift, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | رِجعة — نظام نقاط العملاء" },
      { name: "description", content: "تابع نقاط عملائك وعمليات الكسب والاستبدال وأداء برنامج الولاء في متجرك." },
      { property: "og:title", content: "لوحة التحكم | رِجعة" },
      { property: "og:description", content: "نظرة سريعة على نقاط العملاء والمكافآت." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { active, isLoading, businesses } = useActiveBusiness();
  const id = active?.id;

  const customers = useQuery({ queryKey: ["customers", id], queryFn: () => id ? fetchCustomers(id) : Promise.resolve([]), enabled: !!id });
  const rewards = useQuery({ queryKey: ["rewards", id], queryFn: () => id ? fetchRewards(id) : Promise.resolve([]), enabled: !!id });
  const txs = useQuery({ queryKey: ["transactions", id], queryFn: () => id ? fetchTransactions(id) : Promise.resolve([]), enabled: !!id });

  if (isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-40 w-full" />
      </AppShell>
    );
  }

  if (businesses.length === 0) {
    return (
      <AppShell>
        <h1 className="mb-2 text-2xl font-bold">ابدأ ببرنامج الولاء</h1>
        <p className="mb-6 text-muted-foreground">أنشئ متجرك الأول لتبدأ منح النقاط لعملائك.</p>
        <div className="max-w-md">
          <CreateBusinessCard />
        </div>
      </AppShell>
    );
  }

  const list = customers.data ?? [];
  const totalPoints = list.reduce((s, c) => s + c.points_balance, 0);
  const earned = (txs.data ?? []).filter((t) => t.type === "earn").reduce((s, t) => s + t.points, 0);

  const stats = [
    { label: "العملاء", value: list.length, icon: Users },
    { label: "إجمالي النقاط", value: totalPoints, icon: Coins },
    { label: "المكافآت المفعّلة", value: (rewards.data ?? []).filter((r) => r.is_active).length, icon: Gift },
    { label: "نقاط ممنوحة مؤخراً", value: earned, icon: TrendingUp },
  ];

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-primary pb-5">
        <div>
          <p className="mb-1 text-xs font-bold text-accent">بطاقة أداء المتجر</p>
          <h1 className="font-display text-3xl font-extrabold md:text-4xl">{active?.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {active?.points_per_currency} نقطة لكل {active?.currency === "ILS" ? "شيكل" : active?.currency}
          </p>
        </div>
        {active && (
          <Badge variant="secondary" className="rounded-sm border border-primary/15 px-3 py-1.5">
            {planName(active.plan)} · {statusLabel[active.subscription_status]}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, index) => (
          <Card key={s.label} className={index === 1 ? "bg-primary text-primary-foreground shadow-sm" : ""}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`flex size-11 items-center justify-center rounded-md ${index === 1 ? "bg-primary-foreground/20 text-primary-foreground" : "bg-accent/20 text-accent-foreground"}`}>
                <s.icon className="size-5" />
              </div>
              <div>
                <p className={`text-xs ${index === 1 ? "text-primary-foreground/65" : "text-muted-foreground"}`}>{s.label}</p>
                <p className="font-display text-2xl font-extrabold">{s.value.toLocaleString("ar-EG")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-primary/15 shadow-none">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><span className="size-2 bg-brand-gold" /> أعلى العملاء نقاطاً</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {list.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <span className="text-sm">{c.name}</span>
                <span className="text-sm font-semibold">{c.points_balance.toLocaleString("ar-EG")} نقطة</span>
              </div>
            ))}
            {list.length === 0 && <p className="text-sm text-muted-foreground">لا يوجد عملاء بعد.</p>}
          </CardContent>
        </Card>

        <Card className="border-primary/15 shadow-none">
          <CardHeader className="bg-secondary/60"><CardTitle className="flex items-center gap-2 text-base"><span className="size-2 bg-brand-peach" /> آخر العمليات</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(txs.data ?? []).slice(0, 6).map((t) => {
              const c = list.find((x) => x.id === t.customer_id);
              return (
                <div key={t.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
                  <span>{c?.name ?? "عميل"}</span>
                  <span className={t.type === "earn" ? "font-semibold text-emerald-600" : "font-semibold text-destructive"}>
                    {t.type === "earn" ? "+" : "−"}{t.points}
                  </span>
                </div>
              );
            })}
            {(txs.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">لا توجد عمليات بعد.</p>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
