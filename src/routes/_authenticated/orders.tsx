import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { fetchOrderItems, fetchOrders, money, ORDER_STATUS, statusText, type Order } from "@/lib/storefront";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Coins } from "lucide-react";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "الطلبات | رِجعة — إدارة طلبات المتجر" },
      { name: "description", content: "تابع طلبات متجرك الإلكتروني وحدّث حالتها وامنح عملاءك نقاط الولاء." },
      { property: "og:title", content: "الطلبات | رِجعة" },
      { property: "og:description", content: "إدارة طلبات المتجر الإلكتروني ونقاط الولاء." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { active } = useActiveBusiness();
  const id = active?.id;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<Order | null>(null);

  const orders = useQuery({ queryKey: ["orders", id], queryFn: () => fetchOrders(id!), enabled: !!id });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["orders", id] });

  const setStatus = useMutation({
    mutationFn: async ({ oid, status }: { oid: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", oid);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const award = useMutation({
    mutationFn: async (order: Order) => {
      let customerId = order.customer_id;
      if (!customerId) {
        const { data: existing } = await supabase
          .from("customers").select("id")
          .eq("business_id", order.business_id).eq("phone", order.customer_phone).maybeSingle();
        if (existing) customerId = existing.id;
        else {
          const { data: created, error } = await supabase.from("customers")
            .insert({ business_id: order.business_id, name: order.customer_name, phone: order.customer_phone })
            .select("id").single();
          if (error) throw error;
          customerId = created.id;
        }
        await supabase.from("orders").update({ customer_id: customerId }).eq("id", order.id);
      }
      const points = order.points_awarded || Math.round(Number(order.total) * (active?.points_per_currency ?? 1));
      const { error: txError } = await supabase.from("transactions").insert({
        business_id: order.business_id, customer_id: customerId, type: "earn",
        points, amount: order.total, note: "نقاط على طلب من المتجر",
      });
      if (txError) throw txError;
    },
    onSuccess: () => {
      toast.success("تم منح النقاط للعميل");
      queryClient.invalidateQueries({ queryKey: ["customers", id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", id] });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!id) {
    return <AppShell><p className="text-muted-foreground">أنشئ متجراً أولاً من لوحة التحكم.</p></AppShell>;
  }

  const list = orders.data ?? [];

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">الطلبات</h1>
      <p className="mb-6 text-sm text-muted-foreground">طلبات واردة من متجرك الإلكتروني.</p>

      <div className="space-y-3">
        {list.map((o) => (
          <Card key={o.id} className="rounded-3xl">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <button type="button" className="text-right" onClick={() => setOpen(o)}>
                <p className="font-semibold">{o.customer_name}</p>
                <p dir="ltr" className="text-right text-xs text-muted-foreground">{o.customer_phone}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("ar-EG")}
                </p>
              </button>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="rounded-full">{statusText(o.status)}</Badge>
                <span className="font-bold">{money(o.total)}</span>
                <Select value={o.status} onValueChange={(v) => setStatus.mutate({ oid: o.id, status: v })}>
                  <SelectTrigger className="w-36 rounded-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => award.mutate(o)} disabled={award.isPending}>
                  <Coins className="size-4" /> منح النقاط
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground">لا توجد طلبات بعد.</p>}
      </div>

      <OrderDialog order={open} onClose={() => setOpen(null)} />
    </AppShell>
  );
}

function OrderDialog({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const items = useQuery({
    queryKey: ["order-items", order?.id],
    queryFn: () => fetchOrderItems(order!.id),
    enabled: !!order,
  });

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader><DialogTitle>تفاصيل الطلب</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <p>العميل: <strong>{order?.customer_name}</strong></p>
          <p dir="ltr" className="text-right">{order?.customer_phone}</p>
          {order?.address && <p>العنوان: {order.address}</p>}
          {order?.note && <p>ملاحظة: {order.note}</p>}
          <div className="space-y-2 border-t pt-3">
            {(items.data ?? []).map((it) => (
              <div key={it.id} className="flex justify-between">
                <span>{it.name} × {it.quantity}</span>
                <span>{money(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t pt-3 font-bold">
            <span>الإجمالي</span><span>{money(order?.total ?? 0)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
