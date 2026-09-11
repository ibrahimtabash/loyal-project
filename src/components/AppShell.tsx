import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutDashboard, Users, Gift, CreditCard, Receipt, LogOut, MessageCircle, Store, Package, ShoppingBag, Contact } from "lucide-react";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { planName, statusLabel } from "@/lib/loyalty";
import { BrandMark } from "@/components/BrandMark";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "/store", label: "متجري", icon: Store },
  { to: "/products", label: "المنتجات", icon: Package },
  { to: "/orders", label: "الطلبات", icon: ShoppingBag },
  { to: "/crm", label: "إدارة العلاقات", icon: Contact },
  { to: "/customers", label: "العملاء", icon: Users },
  { to: "/receipts", label: "الفواتير", icon: Receipt },
  { to: "/rewards", label: "المكافآت", icon: Gift },
  { to: "/whatsapp", label: "حملات واتساب", icon: MessageCircle },
  { to: "/billing", label: "الاشتراكات", icon: CreditCard },
] as const;


export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { businesses, active, select } = useActiveBusiness();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background p-0 md:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1500px] gap-5">
      <aside className="hidden w-72 shrink-0 flex-col justify-between rounded-lg bg-sidebar p-6 text-sidebar-foreground border border-sidebar-border md:flex">
        <div>
          <Link to="/dashboard" className="mb-10 block">
            <BrandMark />
          </Link>

          {businesses.length > 0 && (
            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold text-sidebar-foreground/55">بطاقة المتجر</p>
              <Select value={active?.id ?? ""} onValueChange={select}>
                <SelectTrigger className="w-full border-sidebar-border bg-sidebar-accent text-sidebar-foreground">
                  <SelectValue placeholder="اختر متجراً" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {active && (
                <div className="mt-2 flex items-center gap-2 text-xs text-sidebar-foreground/70">
                  <Badge className="rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
                    {planName(active.plan)}
                  </Badge>
                  <span>{statusLabel[active.subscription_status]}</span>
                </div>
              )}
            </div>
          )}

          <nav className="space-y-1">
            {nav.map((item) => {
              const activeLink = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                   className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-all ${
                    activeLink
                       ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground"
                       : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <Button
          variant="ghost"
          className="justify-start gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={signOut}
        >
          <LogOut className="size-4" />
          تسجيل الخروج
        </Button>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 overflow-x-auto border-b bg-card px-4 py-3 md:hidden">
          <Link to="/dashboard" className="ml-2 shrink-0"><BrandMark compact /></Link>
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                pathname === item.to ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Button variant="ghost" size="sm" onClick={signOut}>خروج</Button>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-7 md:px-8 md:py-9">{children}</main>
      </div>
      </div>
    </div>
  );
}
