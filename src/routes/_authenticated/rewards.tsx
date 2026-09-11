import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { fetchRewards } from "@/lib/loyalty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({
    meta: [
      { title: "المكافآت | رِجعة — نظام نقاط العملاء" },
      { name: "description", content: "أنشئ مكافآت يستبدلها عملاؤك بنقاطهم وحدد تكلفة كل مكافأة." },
      { property: "og:title", content: "المكافآت | رِجعة" },
      { property: "og:description", content: "إدارة مكافآت برنامج النقاط." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const { active } = useActiveBusiness();
  const id = active?.id;
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState("100");
  const [description, setDescription] = useState("");

  const rewards = useQuery({ queryKey: ["rewards", id], queryFn: () => fetchRewards(id!), enabled: !!id });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["rewards", id] });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("rewards").insert({
        business_id: id!, title, description, points_cost: Number(cost),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تمت إضافة المكافأة"); setTitle(""); setDescription(""); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ rid, value }: { rid: string; value: boolean }) => {
      const { error } = await supabase.from("rewards").update({ is_active: value }).eq("id", rid);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (rid: string) => {
      const { error } = await supabase.from("rewards").delete().eq("id", rid);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم الحذف"); invalidate(); },
  });

  if (!id) {
    return <AppShell><p className="text-muted-foreground">أنشئ متجراً أولاً من لوحة التحكم.</p></AppShell>;
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-bold">المكافآت</h1>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">مكافأة جديدة</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
              <div className="space-y-2">
                <Label htmlFor="rtitle">العنوان</Label>
                <Input id="rtitle" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="قهوة مجانية" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rcost">تكلفة النقاط</Label>
                <Input id="rcost" type="number" min="1" required value={cost} onChange={(e) => setCost(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rdesc">الوصف</Label>
                <Textarea id="rdesc" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <Button type="submit" disabled={add.isPending}>إضافة</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {(rewards.data ?? []).map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-sm text-muted-foreground">{r.description || "بدون وصف"}</p>
                  <p className="mt-1 text-sm font-medium text-accent-foreground">{r.points_cost} نقطة</p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={r.is_active} onCheckedChange={(v) => toggle.mutate({ rid: r.id, value: v })} />
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(r.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(rewards.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">لم تضف أي مكافأة بعد.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
