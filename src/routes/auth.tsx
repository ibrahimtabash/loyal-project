import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BrandMark } from "@/components/BrandMark";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | رِجعة — نظام نقاط العملاء" },
      { name: "description", content: "سجّل الدخول أو أنشئ حساباً جديداً لإدارة برنامج نقاط الولاء الخاص بمتجرك." },
      { property: "og:title", content: "تسجيل الدخول | رِجعة" },
      { property: "og:description", content: "ادخل إلى لوحة تحكم برنامج ولاء العملاء." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("تعذر تسجيل الدخول: " + error.message);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error("تعذر إنشاء الحساب: " + error.message);
      return;
    }
    if (!data.session) {
      toast.success("تم الإرسال! افتح بريدك وأكّد الحساب للمتابعة.");
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("تعذر الدخول عبر Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-lg border-2 border-primary bg-card shadow-2xl md:grid-cols-[.85fr_1.15fr]">
        <div className="hidden bg-primary p-10 text-primary-foreground md:flex md:flex-col md:justify-between">
          <Link to="/"><BrandMark /></Link>
          <div>
            <p className="mb-3 text-sm font-semibold text-accent">بطاقة دخولك</p>
            <h1 className="font-display text-4xl font-extrabold leading-tight">عملاؤك أقرب، ونقاطهم أوضح.</h1>
            <p className="mt-4 text-sm leading-7 text-primary-foreground/65">أدر متاجرك وبرامج المكافآت من مكان واحد بروح تشبه علامتك.</p>
          </div>
          <span className="text-xs text-primary-foreground/45">كل نقطة تقرّبهم</span>
        </div>
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader>
            <div className="mb-4 md:hidden"><BrandMark /></div>
            <CardTitle className="font-display text-2xl font-extrabold">مرحباً بك</CardTitle>
            <CardDescription>أدر نقاط عملائك ومكافآتهم من مكان واحد.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">دخول</TabsTrigger>
                <TabsTrigger value="signup">حساب جديد</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>تسجيل الدخول</Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم الكامل</Label>
                    <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email2">البريد الإلكتروني</Label>
                    <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2">كلمة المرور</Label>
                    <Input id="password2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>إنشاء الحساب</Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> أو <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={google}>
              المتابعة عبر Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
