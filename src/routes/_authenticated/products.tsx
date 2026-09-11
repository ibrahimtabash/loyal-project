import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { fetchProducts, money } from "@/lib/storefront";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({
    meta: [
      { title: "المنتجات | رِجعة — متجرك الإلكتروني" },
      { name: "description", content: "أضف منتجات متجرك بأسعارها وصورها ونقاط المكافأة لكل منتج." },
      { property: "og:title", content: "المنتجات | رِجعة" },
      { property: "og:description", content: "إدارة منتجات المتجر الإلكتروني." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { active } = useActiveBusiness();
  const id = active?.id;
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [points, setPoints] = useState("0");
  const [description, setDescription] = useState("");

  const products = useQuery({ queryKey: ["products", id], queryFn: () => fetchProducts(id!), enabled: !!id });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["products", id] });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").insert({
        business_id: id!,
        name,
        price: Number(price) || 0,
        category: category || null,
        image_url: image || null,
        reward_points: Number(points) || 0,
        description: description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تمت إضافة المنتج");
      setName(""); setPrice(""); setImage(""); setDescription(""); setPoints("0");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ pid, value }: { pid: string; value: boolean }) => {
      const { error } = await supabase.from("products").update({ is_available: value }).eq("id", pid);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (pid: string) => {
      const { error } = await supabase.from("products").delete().eq("id", pid);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم الحذف"); invalidate(); },
  });

  if (!id) {
    return <AppShell><p className="text-muted-foreground">أنشئ متجراً أولاً من لوحة التحكم.</p></AppShell>;
  }

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">المنتجات</h1>
      <p className="mb-6 text-sm text-muted-foreground">كل منتج تضيفه يظهر مباشرة في متجرك الإلكتروني.</p>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit rounded-3xl">
          <CardHeader><CardTitle className="text-base">منتج جديد</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
              <div className="space-y-2">
                <Label htmlFor="pname">اسم المنتج</Label>
                <Input id="pname" required value={name} onChange={(e) => setName(e.target.value)} placeholder="لاتيه بارد" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pprice">السعر (₪)</Label>
                  <Input id="pprice" type="number" min="0" step="0.5" required value={price} onChange={(e) => setPrice(e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ppoints">نقاط المكافأة</Label>
                  <Input id="ppoints" type="number" min="0" value={points} onChange={(e) => setPoints(e.target.value)} dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pcat">التصنيف</Label>
                <Input id="pcat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="مشروبات" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pimg">رابط الصورة</Label>
                <Input id="pimg" value={image} onChange={(e) => setImage(e.target.value)} dir="ltr" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdesc">الوصف</Label>
                <Textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <Button type="submit" className="rounded-full" disabled={add.isPending}>إضافة المنتج</Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {(products.data ?? []).map((p) => (
            <Card key={p.id} className="overflow-hidden rounded-3xl">
              <div className="flex h-36 items-center justify-center bg-secondary/60">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <ImageIcon className="size-8 text-muted-foreground" />
                )}
              </div>
              <CardContent className="space-y-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category || "بدون تصنيف"}</p>
                  </div>
                  <p className="font-bold">{money(p.price)}</p>
                </div>
                {p.description && <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-muted-foreground">+{p.reward_points} نقطة</span>
                  <div className="flex items-center gap-2">
                    <Switch checked={p.is_available} onCheckedChange={(v) => toggle.mutate({ pid: p.id, value: v })} />
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(p.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(products.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">لم تضف أي منتج بعد.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
