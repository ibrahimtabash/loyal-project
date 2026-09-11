import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { claimReceipt, getReceipt } from "@/lib/receipts.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { BrandMark } from "@/components/BrandMark";
import { CheckCircle2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/r/$token")({
  head: () => ({
    meta: [
      { title: "استلام نقاط فاتورتك | رِجعة" },
      { name: "description", content: "امسح فاتورتك واحصل على نقاط الولاء الخاصة بك فوراً في متجرك المفضل." },
      { property: "og:title", content: "استلام نقاط فاتورتك | رِجعة" },
      { property: "og:description", content: "احصل على نقاط الولاء من فاتورتك خلال ثوانٍ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClaimPage,
});

function ClaimPage() {
  const { token } = Route.useParams();
  const load = useServerFn(getReceipt);
  const claimFn = useServerFn(claimReceipt);
  const [phone, setPhone] = useState("");

  const receipt = useQuery({ queryKey: ["receipt", token], queryFn: () => load({ data: { token } }) });
  const claim = useMutation({
    mutationFn: () => claimFn({ data: { token, phone: phone || undefined } }),
    onSuccess: (d) => receipt.refetch().then(() => d),
  });

  const data = claim.data ?? receipt.data;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-6 p-6 text-center">
          <div className="flex justify-center"><BrandMark /></div>

          {receipt.isLoading && <p className="text-muted-foreground">جارٍ التحميل…</p>}

          {data?.status === "not_found" && (
            <p className="text-muted-foreground">هذه الفاتورة غير موجودة.</p>
          )}

          {data && data.status !== "not_found" && (
            <>
              <div>
                <p className="text-sm text-muted-foreground">{data.businessName}</p>
                <p className="font-display text-3xl font-black">
                  {data.points?.toLocaleString("ar-EG")} نقطة
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  فاتورة بقيمة {data.amount?.toLocaleString("ar-EG")} {data.currency === "ILS" ? "شيكل" : data.currency}
                </p>
              </div>

              {data.status === "claimed" ? (
                <div className="space-y-2">
                  <CheckCircle2 className="mx-auto size-10 text-primary" />
                  <p className="font-semibold">تمت إضافة النقاط إلى حسابك</p>
                  {typeof data.balance === "number" && (
                    <p className="text-sm text-muted-foreground">
                      رصيدك الآن {data.balance.toLocaleString("ar-EG")} نقطة
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-right">
                  {data.needsPhone && (
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم جوالك</Label>
                      <Input
                        id="phone"
                        dir="ltr"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="05xxxxxxxx"
                      />
                    </div>
                  )}
                  <Button
                    className="w-full gap-2"
                    disabled={claim.isPending || (data.needsPhone && phone.trim().length < 6)}
                    onClick={() => claim.mutate()}
                  >
                    <Sparkles className="size-4" />
                    استلام النقاط
                  </Button>
                  {claim.isError && (
                    <p className="text-sm text-destructive">{(claim.error as Error).message}</p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
