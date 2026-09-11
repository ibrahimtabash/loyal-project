import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify, type PlanTier } from "@/lib/loyalty";
import { toast } from "sonner";

export function CreateBusinessCard({ plan = "free" as PlanTier }: { plan?: PlanTier }) {
  const [name, setName] = useState("");
  const [rate, setRate] = useState("1");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("يجب تسجيل الدخول");
      const { error } = await supabase.from("businesses").insert({
        owner_id: uid,
        name,
        slug: slugify(name),
        points_per_currency: Number(rate) || 1,
        plan,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إنشاء المتجر");
      setName("");
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>أنشئ متجراً جديداً</CardTitle>
        <CardDescription>
          كل متجر له اشتراكه الخاص وعملاؤه ومكافآته المستقلة.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="bname">اسم المتجر</Label>
            <Input id="bname" required value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: مقهى الياسمين" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">النقاط لكل شيكل</Label>
            <Input id="rate" type="number" min="0.1" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} dir="ltr" />
          </div>
          <Button type="submit" disabled={mutation.isPending}>إنشاء المتجر</Button>
        </form>
      </CardContent>
    </Card>
  );
}
