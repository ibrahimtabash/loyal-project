import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { fetchCustomers, fetchTransactions, type Customer } from "@/lib/loyalty";
import { fetchOrders, money, statusText } from "@/lib/storefront";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageCircle, Phone, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({
    meta: [
      { title: "إدارة العلاقات | رِجعة — CRM للعملاء" },
      { name: "description", content: "ملف كامل لكل عميل: النقاط، الطلبات، سجل التفاعل والملاحظات." },
      { property: "og:title", content: "إدارة العلاقات | رِجعة" },
      { property: "og:description", content: "نظام CRM متكامل لعملاء متجرك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CrmPage,
});

type Note = { id: string; kind: string; body: string; created_at: string };

function CrmPage() {
  const { active } = useActiveBusiness();
  const id = active?.id;
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const customers = useQuery({ queryKey: ["customers", id], queryFn: () => fetchCustomers(id!), enabled: !!id });
  const orders = useQuery({ queryKey: ["orders", id], queryFn: () => fetchOrders(id!), enabled: !!id });
  const txs = useQuery({ queryKey: ["transactions", id], queryFn: () => fetchTransactions(id!, 200), enabled: !!id });

  if (!id) {
    return <AppShell><p className="text-muted-foreground">أنشئ متجراً أولاً من لوحة التحكم.</p></AppShell>;
  }

  const list = (customers.data ?? []).filter(
    (c) => c.name.includes(q.trim()) || (c.phone ?? "").includes(q.trim()),
  );
  const current = selected ?? list[0] ?? null;
  const customerOrders = (orders.data ?? []).filter(
    (o) => o.customer_id === current?.id || (current?.phone && o.customer_phone === current.phone),
  );
  const customerTxs = (txs.data ?? []).filter((t) => t.customer_id === current?.id);
  const spent = customerOrders.reduce((s, o) => s + Number(o.total), 0);

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">إدارة العلاقات</h1>
      <p className="mb-6 text-sm text-muted-foreground">ملف متكامل لكل عميل: النقاط، الطلبات وسجل التفاعل.</p>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit rounded-3xl">
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center gap-2 rounded-full bg-secondary/60 px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الجوال" className="w-full bg-transparent text-sm outline-none" />
            </div>
            <div className="max-h-[520px] space-y-1 overflow-y-auto">
              {list.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c)}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-right transition-colors ${
                    current?.id === c.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <span className="truncate text-sm">{c.name}</span>
                  <span className="text-xs">{c.points_balance} نقطة</span>
                </button>
              ))}
              {list.length === 0 && <p className="text-sm text-muted-foreground">لا يوجد عملاء.</p>}
            </div>
          </CardContent>
        </Card>

        {current ? (
          <div className="space-y-6">
            <Card className="rounded-3xl">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <div>
                  <h2 className="text-xl font-bold">{current.name}</h2>
                  <p dir="ltr" className="text-right text-sm text-muted-foreground">{current.phone || "—"}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <Stat label="الرصيد" value={`${current.points_balance} نقطة`} />
                  <Stat label="الطلبات" value={String(customerOrders.length)} />
                  <Stat label="إجمالي الإنفاق" value={money(spent)} />
                </div>
                {current.phone && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-full" asChild>
                      <a href={`https://wa.me/${current.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                        <MessageCircle className="size-4" /> واتساب
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full" asChild>
                      <a href={`tel:${current.phone}`}><Phone className="size-4" /> اتصال</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl">
                <CardHeader><CardTitle className="text-base">آخر الطلبات</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {customerOrders.slice(0, 6).map((o) => (
                    <div key={o.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
                      <span>{new Date(o.created_at).toLocaleDateString("ar-EG")}</span>
                      <Badge variant="secondary" className="rounded-full">{statusText(o.status)}</Badge>
                      <span className="font-semibold">{money(o.total)}</span>
                    </div>
                  ))}
                  {customerOrders.length === 0 && <p className="text-sm text-muted-foreground">لا توجد طلبات.</p>}
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader><CardTitle className="text-base">حركة النقاط</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {customerTxs.slice(0, 6).map((t) => (
                    <div key={t.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
                      <span>{t.note || (t.type === "earn" ? "كسب نقاط" : "استبدال")}</span>
                      <span className={t.type === "earn" ? "font-semibold text-emerald-600" : "font-semibold text-destructive"}>
                        {t.type === "earn" ? "+" : "−"}{t.points}
                      </span>
                    </div>
                  ))}
                  {customerTxs.length === 0 && <p className="text-sm text-muted-foreground">لا توجد حركة.</p>}
                </CardContent>
              </Card>
            </div>

            <NotesCard businessId={id} customer={current} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">اختر عميلاً لعرض ملفه.</p>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/60 px-4 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function NotesCard({ businessId, customer }: { businessId: string; customer: Customer }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const notes = useQuery({
    queryKey: ["customer-notes", customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_notes")
        .select("id, kind, body, created_at")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Note[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("customer_notes").insert({
        business_id: businessId, customer_id: customer.id, body, kind: "note",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      toast.success("تمت إضافة الملاحظة");
      queryClient.invalidateQueries({ queryKey: ["customer-notes", customer.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="rounded-3xl">
      <CardHeader><CardTitle className="text-base">سجل التفاعل والملاحظات</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => { e.preventDefault(); if (body.trim()) add.mutate(); }}
        >
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="اكتب ملاحظة عن العميل…" className="min-w-[220px] flex-1 rounded-2xl" />
          <Button type="submit" className="rounded-full" disabled={add.isPending}>إضافة</Button>
        </form>
        <div className="space-y-2">
          {(notes.data ?? []).map((n) => (
            <div key={n.id} className="rounded-2xl bg-secondary/50 p-3 text-sm">
              <p>{n.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("ar-EG")}</p>
            </div>
          ))}
          {(notes.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">لا توجد ملاحظات بعد.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
