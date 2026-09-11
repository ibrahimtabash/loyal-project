import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { CreateBusinessCard } from "@/components/CreateBusinessCard";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { PLANS, planName, statusLabel, type PlanTier } from "@/lib/loyalty";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "الاشتراكات | رِجعة — نظام نقاط العملاء" },
      { name: "description", content: "أدر اشتراك كل متجر على حدة وبدّل بين الباقات المجانية والاحترافية وباقة الأعمال." },
      { property: "og:title", content: "الاشتراكات | رِجعة" },
      { property: "og:description", content: "باقات واشتراكات متعددة لمتاجرك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const { businesses, active, select } = useActiveBusiness();
  const queryClient = useQueryClient();

  const changePlan = useMutation({
    mutationFn: async (plan: PlanTier) => {
      const { error } = await supabase
        .from("businesses")
        .update({
          plan,
          subscription_status: plan === "free" ? "active" : "active",
          current_period_end: new Date(Date.now() + 30 * 864e5).toISOString(),
        })
        .eq("id", active!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث الاشتراك");
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <h1 className="mb-2 text-2xl font-bold">الاشتراكات</h1>
      <p className="mb-8 text-muted-foreground">لكل متجر اشتراك مستقل بباقته الخاصة.</p>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((b) => (
          <Card key={b.id} className={b.id === active?.id ? "border-accent" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{b.name}</p>
                <Badge variant="secondary">{planName(b.plan)}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {statusLabel[b.subscription_status]} · يجدد في{" "}
                {new Date(b.current_period_end).toLocaleDateString("ar-EG")}
              </p>
              {b.id !== active?.id && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => select(b.id)}>
                  إدارة هذا المتجر
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {active && (
        <>
          <h2 className="mb-4 text-lg font-semibold">باقات متجر «{active.name}»</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((p) => (
              <Card key={p.id} className={p.id === active.plan ? "border-2 border-accent" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    {p.name}
                    {p.id === active.plan && <Badge>الحالية</Badge>}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">{p.price}</span> شيكل / شهرياً
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="mb-5 space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="size-4 text-accent" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={p.id === active.plan ? "outline" : "default"}
                    disabled={p.id === active.plan || changePlan.isPending}
                    onClick={() => changePlan.mutate(p.id)}
                  >
                    {p.id === active.plan ? "مفعّلة" : "التبديل لهذه الباقة"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="mt-10 max-w-md">
        <CreateBusinessCard />
      </div>
    </AppShell>
  );
}
