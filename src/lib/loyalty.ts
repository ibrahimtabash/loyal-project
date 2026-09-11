import { supabase } from "@/integrations/supabase/client";

export type PlanTier = "free" | "pro" | "business";

export type Business = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  currency: string;
  points_per_currency: number;
  plan: PlanTier;
  subscription_status: "trialing" | "active" | "past_due" | "canceled";
  current_period_end: string;
  created_at: string;
};

export type Customer = {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  points_balance: number;
  created_at: string;
};

export type Reward = {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  points_cost: number;
  is_active: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  business_id: string;
  customer_id: string;
  reward_id: string | null;
  type: "earn" | "redeem";
  points: number;
  amount: number | null;
  note: string | null;
  created_at: string;
};

export const PLANS: {
  id: PlanTier;
  name: string;
  price: number;
  customers: number;
  features: string[];
}[] = [
  {
    id: "free",
    name: "المجانية",
    price: 0,
    customers: 100,
    features: ["حتى 100 عميل", "مكافأتان", "سجل العمليات", "لوحة تحكم أساسية"],
  },
  {
    id: "pro",
    name: "الاحترافية",
    price: 99,
    customers: 2000,
    features: ["حتى 2000 عميل", "مكافآت غير محدودة", "تقارير النقاط", "دعم عبر البريد"],
  },
  {
    id: "business",
    name: "الأعمال",
    price: 299,
    customers: 100000,
    features: ["عملاء بلا حدود", "فروع ومتاجر متعددة", "تقارير متقدمة", "دعم ذو أولوية"],
  },
];

export const planName = (p: PlanTier) => PLANS.find((x) => x.id === p)?.name ?? p;

export const statusLabel: Record<Business["subscription_status"], string> = {
  trialing: "فترة تجريبية",
  active: "نشط",
  past_due: "متأخر السداد",
  canceled: "ملغى",
};

export async function fetchBusinesses() {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Business[];
}

export async function fetchCustomers(businessId: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .order("points_balance", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Customer[];
}

export async function fetchRewards(businessId: string) {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("business_id", businessId)
    .order("points_cost", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Reward[];
}

export async function fetchTransactions(businessId: string, limit = 25) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export function slugify(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "store"}-${Math.random().toString(36).slice(2, 7)}`;
}
