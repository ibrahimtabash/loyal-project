import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { fetchCustomers, fetchRewards, fetchTransactions, type Customer, type Reward } from "@/lib/loyalty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MessageCircle, Send, Plug, CheckCircle2, BookOpen } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  getWhatsappStatus,
  connectWhatsapp,
  disconnectWhatsapp,
  sendWhatsappMessages,
} from "@/lib/whatsapp.functions";

export const Route = createFileRoute("/_authenticated/whatsapp")({
  head: () => ({
    meta: [
      { title: "حملات واتساب | رِجعة — نظام نقاط العملاء" },
      { name: "description", content: "أرسل رسائل واتساب جماعية لعملائك لتحفيزهم على العودة واستخدام نقاطهم واستلام مكافآتهم." },
      { property: "og:title", content: "حملات واتساب | رِجعة" },
      { property: "og:description", content: "رسائل واتساب جماعية تعيد عملاءك للمتجر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WhatsappPage,
});

const DEFAULT_TEMPLATE =
  "أهلاً {الاسم} 👋\nعندك {النقاط} نقطة في {المتجر}.\nتقدر تستبدلها بـ {المكافأة} — ننتظر زيارتك 💚";

function toIntlPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `966${digits.slice(1)}`;
  return digits;
}

function WhatsappPage() {
  const { active } = useActiveBusiness();
  const id = active?.id;
  const queryClient = useQueryClient();

  const customers = useQuery({ queryKey: ["customers", id], queryFn: () => fetchCustomers(id!), enabled: !!id });
  const rewards = useQuery({ queryKey: ["rewards", id], queryFn: () => fetchRewards(id!), enabled: !!id });
  const txs = useQuery({ queryKey: ["transactions", id, 500], queryFn: () => fetchTransactions(id!, 500), enabled: !!id });

  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [minPoints, setMinPoints] = useState("0");
  const [inactiveDays, setInactiveDays] = useState("0");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [visitCustomer, setVisitCustomer] = useState<Customer | null>(null);

  const lastVisit = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of txs.data ?? []) if (!map[t.customer_id]) map[t.customer_id] = t.created_at;
    return map;
  }, [txs.data]);

  const list = useMemo(() => {
    const min = Number(minPoints) || 0;
    const days = Number(inactiveDays) || 0;
    const cutoff = Date.now() - days * 86400000;
    return (customers.data ?? []).filter((c) => {
      if (!c.phone) return false;
      if (c.points_balance < min) return false;
      if (days > 0) {
        const lv = lastVisit[c.id];
        if (lv && new Date(lv).getTime() > cutoff) return false;
      }
      return true;
    });
  }, [customers.data, minPoints, inactiveDays, lastVisit]);

  const chosen = list.filter((c) => selected[c.id]);

  const bestReward = (points: number): Reward | undefined => {
    const activeRewards = (rewards.data ?? []).filter((r) => r.is_active);
    return (
      [...activeRewards].filter((r) => r.points_cost <= points).sort((a, b) => b.points_cost - a.points_cost)[0] ??
      [...activeRewards].sort((a, b) => a.points_cost - b.points_cost)[0]
    );
  };

  const render = (c: Customer) => {
    const r = bestReward(c.points_balance);
    return template
      .replaceAll("{الاسم}", c.name)
      .replaceAll("{النقاط}", String(c.points_balance))
      .replaceAll("{المتجر}", active?.name ?? "")
      .replaceAll("{المكافأة}", r ? r.title : "مكافأة مميزة");
  };

  const statusFn = useServerFn(getWhatsappStatus);
  const sendFn = useServerFn(sendWhatsappMessages);
  const status = useQuery({
    queryKey: ["wa-status", id],
    queryFn: () => statusFn({ data: { businessId: id! } }),
    enabled: !!id,
  });
  const connected = !!status.data?.connected && status.data?.isActive !== false;

  const [useTemplate, setUseTemplate] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  const openChat = (c: Customer) => {
    const phone = toIntlPhone(c.phone ?? "");
    if (!phone) {
      toast.error("رقم الجوال غير صالح");
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(render(c))}`, "_blank", "noopener");
    setSent((s) => ({ ...s, [c.id]: true }));
  };

  const autoSend = useMutation({
    mutationFn: async (targets: Customer[]) => {
      const res = await sendFn({
        data: {
          businessId: id!,
          mode: useTemplate ? "template" : "text",
          templateName: status.data?.defaultTemplate ?? "",
          templateLang: status.data?.templateLang ?? "ar",
          messages: targets.map((c) => ({
            phone: toIntlPhone(c.phone ?? ""),
            body: render(c),
            params: [c.name, String(c.points_balance)],
          })),
        },
      });
      return { res, targets };
    },
    onSuccess: ({ res, targets }) => {
      const ok = res.results.filter((r) => r.ok).length;
      const failed = res.results.find((r) => !r.ok);
      setSent((s) => {
        const next = { ...s };
        targets.forEach((c, i) => { if (res.results[i]?.ok) next[c.id] = true; });
        return next;
      });
      if (ok > 0) toast.success(`تم إرسال ${ok} رسالة تلقائياً`);
      if (failed) toast.error(failed.error ?? "تعذر إرسال بعض الرسائل");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendAll = () => {
    if (chosen.length === 0) {
      toast.error("اختر عميلاً واحداً على الأقل");
      return;
    }
    if (connected) {
      autoSend.mutate(chosen);
      return;
    }
    chosen.forEach((c, i) => setTimeout(() => openChat(c), i * 700));
    toast.success(`جارٍ فتح ${chosen.length} محادثة واتساب`);
  };

  if (!id) {
    return <AppShell><p className="text-muted-foreground">أنشئ متجراً أولاً من لوحة التحكم.</p></AppShell>;
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-2 text-2xl font-bold">حملات واتساب</h1>
          <p className="text-sm text-muted-foreground">
            اربط رقم واتساب بزنس الخاص بمتجرك لإرسال الرسائل تلقائياً، أو أرسلها يدوياً بفتح المحادثات.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/whatsapp-guide">
            <BookOpen className="size-4" />
            دليل الربط
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          {connected ? (
            <>
              <CheckCircle2 className="size-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">واتساب بزنس مرتبط — الإرسال تلقائي</p>
                <p className="text-xs text-muted-foreground" dir="ltr">{status.data?.displayPhone}</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={useTemplate} onCheckedChange={(v) => setUseTemplate(!!v)} />
                استخدام القالب المعتمد
              </label>
              <Button variant="outline" size="sm" onClick={() => setConnectOpen(true)}>تعديل</Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await disconnectWhatsapp({ data: { businessId: id } });
                  status.refetch();
                  toast.success("تم إلغاء الربط");
                }}
              >
                إلغاء الربط
              </Button>
            </>
          ) : (
            <>
              <Plug className="size-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">واتساب بزنس غير مرتبط</p>
                <p className="text-xs text-muted-foreground">
                  اربط رقمك الرسمي لإرسال الرسائل بدون فتح تطبيق واتساب.
                </p>
              </div>
              <Button size="sm" className="gap-2" onClick={() => setConnectOpen(true)}>
                <Plug className="size-4" /> ربط واتساب بزنس
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <ConnectDialog
        open={connectOpen}
        businessId={id}
        onClose={() => setConnectOpen(false)}
        onDone={() => status.refetch()}
      />


      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">الرسالة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea rows={6} value={template} onChange={(e) => setTemplate(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              يمكنك استخدام: {"{الاسم}"} · {"{النقاط}"} · {"{المكافأة}"} · {"{المتجر}"}
            </p>
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="mp">الحد الأدنى للنقاط</Label>
                <Input id="mp" type="number" min="0" dir="ltr" value={minPoints} onChange={(e) => setMinPoints(e.target.value)} />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="inact">لم يزر منذ (يوم)</Label>
                <Input id="inact" type="number" min="0" dir="ltr" value={inactiveDays} onChange={(e) => setInactiveDays(e.target.value)} />
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">
              {list[0] ? render(list[0]) : "لا يوجد عملاء مطابقون بعد."}
            </div>
            <Button className="w-full gap-2" onClick={sendAll} disabled={chosen.length === 0 || autoSend.isPending}>
              <Send className="size-4" />
              {autoSend.isPending
                ? "جارٍ الإرسال..."
                : `${connected ? "إرسال تلقائي" : "إرسال"} إلى ${chosen.length} عميل`}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">العملاء ({list.length})</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelected(Object.fromEntries(list.map((c) => [c.id, true])))}>
                تحديد الكل
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected({})}>مسح</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {list.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Checkbox
                  checked={!!selected[c.id]}
                  onCheckedChange={(v) => setSelected((s) => ({ ...s, [c.id]: !!v }))}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{c.phone}</p>
                </div>
                <span className="text-sm">{c.points_balance} نقطة</span>
                {sent[c.id] && <span className="text-xs text-primary">أُرسلت</span>}
                <Button size="sm" variant="outline" className="gap-1" onClick={() => openChat(c)}>
                  <MessageCircle className="size-4" /> إرسال
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setVisitCustomer(c)}>زيارة</Button>
              </div>
            ))}
            {list.length === 0 && <p className="text-sm text-muted-foreground">لا يوجد عملاء بأرقام جوال مطابقة للفلاتر.</p>}
          </CardContent>
        </Card>
      </div>

      <VisitDialog
        customer={visitCustomer}
        businessId={id}
        rate={active?.points_per_currency ?? 1}
        rewards={(rewards.data ?? []).filter((r) => r.is_active)}
        onClose={() => setVisitCustomer(null)}
        onDone={() => {
          queryClient.invalidateQueries({ queryKey: ["customers", id] });
          queryClient.invalidateQueries({ queryKey: ["transactions", id] });
          queryClient.invalidateQueries({ queryKey: ["transactions", id, 500] });
        }}
      />
    </AppShell>
  );
}

function VisitDialog({
  customer, businessId, rate, rewards, onClose, onDone,
}: {
  customer: Customer | null;
  businessId: string;
  rate: number;
  rewards: Reward[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [rewardId, setRewardId] = useState("");
  const [amount, setAmount] = useState("");

  const reward = rewards.find((r) => r.id === rewardId);
  const newPoints = Math.round((Number(amount) || 0) * rate);

  const apply = useMutation({
    mutationFn: async () => {
      if (!customer) return;
      if (!reward && newPoints <= 0) throw new Error("اختر مكافأة أو أدخل قيمة الفاتورة");
      if (reward) {
        if (customer.points_balance < reward.points_cost) throw new Error("رصيد النقاط غير كافٍ لهذه المكافأة");
        const { error } = await supabase.from("transactions").insert({
          business_id: businessId, customer_id: customer.id, type: "redeem",
          points: reward.points_cost, reward_id: reward.id, note: `استبدال: ${reward.title}`,
        });
        if (error) throw error;
      }
      if (newPoints > 0) {
        const { error } = await supabase.from("transactions").insert({
          business_id: businessId, customer_id: customer.id, type: "earn",
          points: newPoints, amount: Number(amount), note: "نقاط زيارة جديدة",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("تم تحديث نقاط العميل");
      setRewardId(""); setAmount("");
      onDone(); onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const balanceAfter =
    (customer?.points_balance ?? 0) - (reward?.points_cost ?? 0) + newPoints;

  return (
    <Dialog open={!!customer} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>زيارة {customer?.name} — {customer?.points_balance ?? 0} نقطة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>المكافأة المستخدمة (خصم نقاط)</Label>
            <Select value={rewardId} onValueChange={setRewardId}>
              <SelectTrigger><SelectValue placeholder="بدون استبدال" /></SelectTrigger>
              <SelectContent>
                {rewards.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.title} — {r.points_cost} نقطة</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vamt">قيمة الفاتورة الجديدة</Label>
            <Input id="vamt" type="number" min="0" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <p className="text-xs text-muted-foreground">تُضاف {newPoints} نقطة ({rate} نقطة لكل شيكل).</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            الرصيد بعد الزيارة: <strong>{balanceAfter}</strong> نقطة
          </div>
          <Button className="w-full" onClick={() => apply.mutate()} disabled={apply.isPending}>
            تأكيد الزيارة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConnectDialog({
  open, businessId, onClose, onDone,
}: {
  open: boolean;
  businessId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [lang, setLang] = useState("ar");

  const save = useMutation({
    mutationFn: async () => {
      if (!phoneNumberId || !accessToken) throw new Error("أدخل مُعرّف الرقم ورمز الوصول");
      const res = await connectWhatsapp({
        data: {
          businessId,
          phoneNumberId,
          accessToken,
          wabaId,
          defaultTemplate: templateName,
          templateLang: lang,
        },
      });
      if (!res.connected) throw new Error(res.error ?? "تعذر الربط");
      return res;
    },
    onSuccess: () => {
      toast.success("تم ربط واتساب بزنس بنجاح");
      setAccessToken("");
      onDone();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ربط واتساب بزنس</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="rounded-lg bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">
            من حسابك في منصة ميتا للمطورين (WhatsApp Cloud API) انسخ «مُعرّف رقم الهاتف» و«رمز الوصول
            الدائم»، وألصقهما هنا. الرمز يُحفظ بشكل آمن ولا يظهر لأي متجر آخر.
          </p>
          <div className="space-y-2">
            <Label htmlFor="pnid">مُعرّف رقم الهاتف (Phone Number ID)</Label>
            <Input id="pnid" dir="ltr" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tok">رمز الوصول الدائم</Label>
            <Input id="tok" type="password" dir="ltr" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waba">مُعرّف حساب واتساب بزنس (اختياري)</Label>
            <Input id="waba" dir="ltr" value={wabaId} onChange={(e) => setWabaId(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="tpl">اسم القالب المعتمد (اختياري)</Label>
              <Input id="tpl" dir="ltr" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
            </div>
            <div className="w-28 space-y-2">
              <Label htmlFor="lng">لغة القالب</Label>
              <Input id="lng" dir="ltr" value={lang} onChange={(e) => setLang(e.target.value)} />
            </div>
          </div>
          <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "جارٍ التحقق..." : "تحقق واحفظ"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
