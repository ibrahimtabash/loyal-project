import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { fetchProducts, getTheme, money, STORE_THEMES, themeVars } from "@/lib/storefront";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Search, ShoppingBag, Home, Gift, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/store")({
  head: () => ({
    meta: [
      { title: "متجري | رِجعة — متجر إلكتروني بشكل تطبيق" },
      { name: "description", content: "صمّم متجرك الإلكتروني بشكل تطبيق جوال واختر الثيم المناسب لنشاطك." },
      { property: "og:title", content: "متجري | رِجعة" },
      { property: "og:description", content: "ثيمات جاهزة ومتجر إلكتروني بشكل تطبيق جوال." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const { active } = useActiveBusiness();
  const id = active?.id;
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState("oasis");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [cover, setCover] = useState("");
  const [whats, setWhats] = useState("");
  const [published, setPublished] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    if (!active) return;
    const b = active as unknown as Record<string, string | boolean | null>;
    setTheme((b["theme"] as string) ?? "oasis");
    setDescription((b["description"] as string) ?? "");
    setLogo((b["logo_url"] as string) ?? "");
    setCover((b["cover_url"] as string) ?? "");
    setWhats((b["whatsapp_phone"] as string) ?? "");
    setPublished(Boolean(b["is_published"]));
  }, [active?.id]);

  const products = useQuery({ queryKey: ["products", id], queryFn: () => fetchProducts(id!), enabled: !!id });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("businesses")
        .update({
          theme,
          description: description || null,
          logo_url: logo || null,
          cover_url: cover || null,
          whatsapp_phone: whats || null,
          is_published: published,
        })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حفظ إعدادات المتجر");
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!id || !active) {
    return <AppShell><p className="text-muted-foreground">أنشئ متجراً أولاً من لوحة التحكم.</p></AppShell>;
  }

  const link = `${origin}/s/${active.slug}`;
  const t = getTheme(theme);

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">متجري الإلكتروني</h1>
      <p className="mb-6 text-sm text-muted-foreground">اختر الثيم، اضبط الهوية، وشارك رابط متجرك مع عملائك.</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="text-base">اختر الثيم</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {STORE_THEMES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setTheme(th.id)}
                  className={`relative overflow-hidden rounded-3xl border-2 p-4 text-right transition-all ${
                    theme === th.id ? "border-primary shadow-md" : "border-border hover:border-primary/40"
                  }`}
                  style={{ background: th.bg, color: th.text }}
                >
                  <span className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: th.pattern, backgroundSize: th.shape === "grid" ? "18px 18px" : "auto" }} />
                  {theme === th.id && (
                    <span className="absolute left-3 top-3 flex size-6 items-center justify-center rounded-full" style={{ background: th.brand, color: th.onBrand }}>
                      <Check className="size-3.5" />
                    </span>
                  )}
                  <div className="relative mb-3 flex gap-1.5">
                    <span className="size-6 rounded-full" style={{ background: th.brand }} />
                    <span className="size-6 rounded-full" style={{ background: th.accent }} />
                    <span className="size-6 rounded-full" style={{ background: th.surface }} />
                  </div>
                  <p className="relative font-bold">{th.name}</p>
                  <p className="relative text-xs opacity-70">{th.desc}</p>
                </button>

              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="text-base">هوية المتجر</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sdesc">نبذة عن المتجر</Label>
                <Textarea id="sdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="قهوة مختصة وحلويات طازجة كل يوم" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="slogo">رابط الشعار</Label>
                  <Input id="slogo" dir="ltr" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scover">رابط صورة الغلاف</Label>
                  <Input id="scover" dir="ltr" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="swa">رقم واتساب المتجر</Label>
                <Input id="swa" dir="ltr" value={whats} onChange={(e) => setWhats(e.target.value)} placeholder="970599..." />
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-secondary/60 p-4">
                <div>
                  <p className="font-semibold">نشر المتجر</p>
                  <p className="text-xs text-muted-foreground">عند التفعيل يصبح الرابط متاحاً للعملاء.</p>
                </div>
                <Switch checked={published} onCheckedChange={setPublished} />
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-2xl border p-3">
                <span dir="ltr" className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{link}</span>
                <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => { navigator.clipboard.writeText(link); toast.success("تم نسخ الرابط"); }}>
                  <Copy className="size-4" /> نسخ
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-full" asChild>
                  <a href={link} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> فتح</a>
                </Button>
              </div>

              <Button className="rounded-full" disabled={save.isPending} onClick={() => save.mutate()}>حفظ التغييرات</Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 lg:h-fit">
          <p className="mb-3 text-center text-xs text-muted-foreground">معاينة مباشرة</p>
          <PhonePreview
            name={active.name}
            description={description}
            logo={logo}
            cover={cover}
            themeId={theme}
            products={(products.data ?? []).slice(0, 4).map((p) => ({ id: p.id, name: p.name, price: p.price, image: p.image_url }))}
          />
          <p className="mt-3 text-center text-xs text-muted-foreground">{t.name}</p>
        </div>
      </div>
    </AppShell>
  );
}

function PhonePreview({
  name, description, logo, cover, themeId, products,
}: {
  name: string;
  description: string;
  logo: string;
  cover: string;
  themeId: string;
  products: { id: string; name: string; price: number; image: string | null }[];
}) {
  const t = getTheme(themeId);
  return (
    <div className="mx-auto w-[300px] rounded-[2.75rem] border-8 border-foreground/85 bg-foreground/85 shadow-2xl">
      <div className="relative h-[560px] overflow-hidden rounded-[2.1rem]" style={{ ...themeVars(t), background: "var(--sf-bg)", color: "var(--sf-text)" }}>
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2">
          <span className="h-5 w-24 rounded-full bg-foreground/85" />
        </div>
        <div className="h-28 w-full" style={{ background: cover ? `url(${cover}) center/cover` : "var(--sf-brand)" }} />
        <div className="-mt-8 px-4">
          <div className="flex items-center gap-3 rounded-[var(--sf-radius)] p-3" style={{ background: "var(--sf-surface)" }}>
            <div className="size-12 shrink-0 overflow-hidden rounded-2xl" style={{ background: "var(--sf-brand)" }}>
              {logo && <img src={logo} alt="" className="size-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{name}</p>
              <p className="truncate text-[11px]" style={{ color: "var(--sf-muted)" }}>{description || "متجر إلكتروني"}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-full px-3 py-2 text-[11px]" style={{ background: "var(--sf-surface)", color: "var(--sf-muted)" }}>
            <Search className="size-3.5" /> ابحث عن منتج
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {(products.length ? products : [{ id: "a", name: "منتج", price: 20, image: null }, { id: "b", name: "منتج", price: 35, image: null }]).map((p) => (
              <div key={p.id} className="overflow-hidden rounded-[var(--sf-radius)]" style={{ background: "var(--sf-surface)" }}>
                <div className="h-16" style={{ background: p.image ? `url(${p.image}) center/cover` : "var(--sf-bg)" }} />
                <div className="p-2">
                  <p className="truncate text-[11px] font-semibold">{p.name}</p>
                  <p className="text-[11px] font-bold" style={{ color: "var(--sf-brand)" }}>{money(p.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-3 bottom-3 flex items-center justify-around rounded-full py-2.5" style={{ background: "var(--sf-surface)" }}>
          <Home className="size-4" style={{ color: "var(--sf-brand)" }} />
          <ShoppingBag className="size-4" style={{ color: "var(--sf-muted)" }} />
          <Gift className="size-4" style={{ color: "var(--sf-muted)" }} />
          <User className="size-4" style={{ color: "var(--sf-muted)" }} />
        </div>
      </div>
    </div>
  );
}
