import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { fetchCustomers } from "@/lib/loyalty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/receipts")({
  head: () => ({
    meta: [
      { title: "الفواتير | رِجعة — فواتير بنقاط ورمز QR" },
      { name: "description", content: "أنشئ فاتورة صغيرة قابلة للطباعة مع رمز QR يمنح عميلك نقاطه فور مسحه." },
      { property: "og:title", content: "الفواتير | رِجعة" },
      { property: "og:description", content: "فواتير مطبوعة برمز QR تضيف نقاط الولاء تلقائياً." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReceiptsPage,
});

type Receipt = {
  id: string;
  amount: number;
  points: number;
  token: string;
  phone: string | null;
  customer_id: string | null;
  claimed_at: string | null;
  created_at: string;
};

const makeToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(9)))
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 14);

function ReceiptsPage() {
  const { active } = useActiveBusiness();
  const id = active?.id;
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [customerId, setCustomerId] = useState("none");
  const [phone, setPhone] = useState("");
  const [printing, setPrinting] = useState<Receipt | null>(null);

  const customers = useQuery({ queryKey: ["customers", id], queryFn: () => fetchCustomers(id!), enabled: !!id });
  const receipts = useQuery({
    queryKey: ["receipts", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select("id, amount, points, token, phone, customer_id, claimed_at, created_at")
        .eq("business_id", id!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as Receipt[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const value = Number(amount);
      if (!(value > 0)) throw new Error("أدخل قيمة فاتورة صحيحة");
      const points = Math.round(value * (active?.points_per_currency ?? 1));
      const chosen = customerId !== "none" ? customers.data?.find((c) => c.id === customerId) : undefined;
      const { data, error } = await supabase
        .from("receipts")
        .insert({
          business_id: id!,
          customer_id: chosen?.id ?? null,
          phone: chosen?.phone ?? (phone.trim() || null),
          amount: value,
          points,
          token: makeToken(),
        })
        .select("id, amount, points, token, phone, customer_id, claimed_at, created_at")
        .single();
      if (error) throw error;
      return data as Receipt;
    },
    onSuccess: (r) => {
      toast.success("تم إنشاء الفاتورة");
      setAmount(""); setPhone(""); setCustomerId("none");
      queryClient.invalidateQueries({ queryKey: ["receipts", id] });
      setPrinting(r);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!id) {
    return <AppShell><p className="text-muted-foreground">أنشئ متجراً أولاً من لوحة التحكم.</p></AppShell>;
  }

  const customerName = (r: Receipt) =>
    customers.data?.find((c) => c.id === r.customer_id)?.name ?? r.phone ?? "غير محدد";

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-bold">الفواتير</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">فاتورة جديدة</CardTitle></CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
          >
            <div className="min-w-[140px] flex-1 space-y-2">
              <Label htmlFor="amount">قيمة الفاتورة</Label>
              <Input id="amount" type="number" min="1" required dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="min-w-[180px] flex-1 space-y-2">
              <Label>العميل</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون — يسجّل العميل جواله</SelectItem>
                  {(customers.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {customerId === "none" && (
              <div className="min-w-[150px] flex-1 space-y-2">
                <Label htmlFor="rphone">جوال العميل (اختياري)</Label>
                <Input id="rphone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" />
              </div>
            )}
            <Button type="submit" disabled={create.isPending}>إنشاء وطباعة</Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            يحصل العميل على {active?.points_per_currency ?? 1} نقطة لكل شيكل، وتُضاف تلقائياً عند مسح الرمز.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">القيمة</TableHead>
                <TableHead className="text-right">النقاط</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(receipts.data ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{customerName(r)}</TableCell>
                  <TableCell>{Number(r.amount).toLocaleString("ar-EG")}</TableCell>
                  <TableCell>{r.points.toLocaleString("ar-EG")}</TableCell>
                  <TableCell>
                    <Badge variant={r.claimed_at ? "default" : "secondary"}>
                      {r.claimed_at ? "تم استلام النقاط" : "بانتظار المسح"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setPrinting(r)}>
                      <Printer className="size-4" /> طباعة
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(receipts.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-muted-foreground">لا توجد فواتير بعد.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!printing} onOpenChange={(o) => !o && setPrinting(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>فاتورة قابلة للطباعة</DialogTitle></DialogHeader>
          {printing && (
            <>
              <div className="print-receipt mx-auto w-[70mm] rounded-xl border bg-white p-4 text-center text-black">
                <p className="text-base font-bold">{active?.name}</p>
                <p className="mt-1 text-xs">
                  {new Date(printing.created_at).toLocaleString("ar-EG")}
                </p>
                <div className="my-3 border-y border-dashed py-2 text-sm">
                  <p>القيمة: {Number(printing.amount).toLocaleString("ar-EG")} شيكل</p>
                  <p className="font-bold">النقاط: {printing.points.toLocaleString("ar-EG")}</p>
                  {(printing.phone || printing.customer_id) && (
                    <p className="text-xs">العميل: {customerName(printing)}</p>
                  )}
                </div>
                <div className="mx-auto w-[38mm]">
                  <QRCode
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/r/${printing.token}`}
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>
                <p className="mt-2 text-xs">امسح الرمز لتحصل على نقاطك</p>
                <p className="mt-1 text-[10px]">رِجعة</p>
              </div>
              <Button className="gap-2" onClick={() => window.print()}>
                <Printer className="size-4" /> طباعة
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
