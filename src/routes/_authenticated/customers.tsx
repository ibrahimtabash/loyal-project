import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { fetchCustomers, fetchRewards, type Customer } from "@/lib/loyalty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "العملاء | رِجعة — نظام نقاط العملاء" },
      { name: "description", content: "أضف عملاءك وامنحهم نقاطاً على مشترياتهم واستبدل نقاطهم بالمكافآت." },
      { property: "og:title", content: "العملاء | رِجعة" },
      { property: "og:description", content: "إدارة عملاء برنامج الولاء ونقاطهم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { active } = useActiveBusiness();
  const id = active?.id;
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [target, setTarget] = useState<Customer | null>(null);

  const customers = useQuery({ queryKey: ["customers", id], queryFn: () => fetchCustomers(id!), enabled: !!id });
  const rewards = useQuery({ queryKey: ["rewards", id], queryFn: () => fetchRewards(id!), enabled: !!id });

  const addCustomer = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("customers").insert({ business_id: id!, name, phone });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تمت إضافة العميل");
      setName(""); setPhone("");
      queryClient.invalidateQueries({ queryKey: ["customers", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["customers", id] });
    queryClient.invalidateQueries({ queryKey: ["transactions", id] });
  };

  if (!id) {
    return <AppShell><p className="text-muted-foreground">أنشئ متجراً أولاً من لوحة التحكم.</p></AppShell>;
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-bold">العملاء</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">إضافة عميل</CardTitle></CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => { e.preventDefault(); addCustomer.mutate(); }}
          >
            <div className="min-w-[180px] flex-1 space-y-2">
              <Label htmlFor="cname">الاسم</Label>
              <Input id="cname" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="min-w-[160px] flex-1 space-y-2">
              <Label htmlFor="cphone">الجوال</Label>
              <Input id="cphone" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
            </div>
            <Button type="submit" disabled={addCustomer.isPending}>إضافة</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">الجوال</TableHead>
                <TableHead className="text-right">النقاط</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(customers.data ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell dir="ltr" className="text-right">{c.phone || "—"}</TableCell>
                  <TableCell>{c.points_balance.toLocaleString("ar-EG")}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setTarget(c)}>نقاط</Button>
                  </TableCell>
                </TableRow>
              ))}
              {(customers.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-muted-foreground">لا يوجد عملاء بعد.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PointsDialog
        customer={target}
        businessId={id}
        rate={active?.points_per_currency ?? 1}
        rewards={rewards.data ?? []}
        onClose={() => setTarget(null)}
        onDone={refresh}
      />
    </AppShell>
  );
}

function PointsDialog({
  customer, businessId, rate, rewards, onClose, onDone,
}: {
  customer: Customer | null;
  businessId: string;
  rate: number;
  rewards: { id: string; title: string; points_cost: number; is_active: boolean }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [rewardId, setRewardId] = useState<string>("");

  const earn = useMutation({
    mutationFn: async () => {
      const points = Math.round(Number(amount) * rate);
      if (points <= 0) throw new Error("أدخل قيمة فاتورة صحيحة");
      const { error } = await supabase.from("transactions").insert({
        business_id: businessId, customer_id: customer!.id, type: "earn",
        points, amount: Number(amount), note: "منح نقاط على فاتورة",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم منح النقاط"); setAmount(""); onDone(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const redeem = useMutation({
    mutationFn: async () => {
      const r = rewards.find((x) => x.id === rewardId);
      if (!r) throw new Error("اختر مكافأة");
      const { error } = await supabase.from("transactions").insert({
        business_id: businessId, customer_id: customer!.id, type: "redeem",
        points: r.points_cost, reward_id: r.id, note: r.title,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم استبدال المكافأة"); onDone(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!customer} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer?.name} — {customer?.points_balance ?? 0} نقطة</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amt">قيمة الفاتورة</Label>
            <div className="flex gap-2">
              <Input id="amt" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} dir="ltr" />
              <Button onClick={() => earn.mutate()} disabled={earn.isPending}>منح النقاط</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              يحصل العميل على {rate} نقطة لكل شيكل.
            </p>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>استبدال مكافأة</Label>
            <div className="flex gap-2">
              <Select value={rewardId} onValueChange={setRewardId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="اختر مكافأة" /></SelectTrigger>
                <SelectContent>
                  {rewards.filter((r) => r.is_active).map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.title} — {r.points_cost} نقطة</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="secondary" onClick={() => redeem.mutate()} disabled={redeem.isPending}>استبدال</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
