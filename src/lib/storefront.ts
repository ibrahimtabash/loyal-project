import { supabase } from "@/integrations/supabase/client";

export type StoreTheme = {
  id: string;
  name: string;
  desc: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  brand: string;
  accent: string;
  onBrand: string;
  radius: string;
  font: string;
  /** decorative CSS background layer painted over the hero / page */
  pattern: string;
  /** silhouette of the hero block */
  shape: "arch" | "wave" | "blob" | "sharp" | "ribbon" | "grid";
};

export const STORE_THEMES: StoreTheme[] = [
  {
    id: "oasis",
    name: "واحة",
    desc: "أقواس ناعمة ولمسة مرجانية",
    bg: "#F7F4EF",
    surface: "#FFFFFF",
    text: "#1B2430",
    muted: "#6B7280",
    brand: "#FF6B5A",
    accent: "#FFC7A8",
    onBrand: "#FFFFFF",
    radius: "1.75rem",
    font: "'Cairo', sans-serif",
    pattern:
      "radial-gradient(circle at 18% 20%, rgba(255,255,255,.35) 0 2px, transparent 3px), radial-gradient(circle at 70% 60%, rgba(255,255,255,.28) 0 2px, transparent 3px)",
    shape: "arch",
  },
  {
    id: "midnight",
    name: "ليلي",
    desc: "داكن أنيق بموجات ضوئية",
    bg: "#0F1621",
    surface: "#182231",
    text: "#F3F6FA",
    muted: "#9AA7B8",
    brand: "#3D95CE",
    accent: "#7BE0C9",
    onBrand: "#FFFFFF",
    radius: "1.5rem",
    font: "'Cairo', sans-serif",
    pattern:
      "repeating-linear-gradient(115deg, rgba(255,255,255,.06) 0 1px, transparent 1px 14px)",
    shape: "wave",
  },
  {
    id: "mint",
    name: "نعناع",
    desc: "منعش بأشكال دائرية",
    bg: "#F1FAF6",
    surface: "#FFFFFF",
    text: "#12312A",
    muted: "#5E7C74",
    brand: "#14A37F",
    accent: "#BDF0DC",
    onBrand: "#FFFFFF",
    radius: "2rem",
    font: "'Cairo', sans-serif",
    pattern:
      "radial-gradient(circle at 85% 10%, rgba(255,255,255,.4) 0 60px, transparent 61px), radial-gradient(circle at 10% 90%, rgba(255,255,255,.25) 0 40px, transparent 41px)",
    shape: "blob",
  },
  {
    id: "sand",
    name: "رمال",
    desc: "دافئ بخطوط المقاهي",
    bg: "#FBF4E8",
    surface: "#FFFDF9",
    text: "#3B2A1A",
    muted: "#8A7358",
    brand: "#C9821F",
    accent: "#F0D3A0",
    onBrand: "#FFFFFF",
    radius: "1.25rem",
    font: "'Cairo', sans-serif",
    pattern:
      "repeating-linear-gradient(45deg, rgba(255,255,255,.18) 0 10px, transparent 10px 20px)",
    shape: "ribbon",
  },
  {
    id: "rose",
    name: "وردي",
    desc: "ناعم للصالونات بأشكال منحنية",
    bg: "#FDF2F6",
    surface: "#FFFFFF",
    text: "#3A1B2A",
    muted: "#8B6577",
    brand: "#D6417B",
    accent: "#FFD1E3",
    onBrand: "#FFFFFF",
    radius: "2.25rem",
    font: "'Cairo', sans-serif",
    pattern:
      "radial-gradient(ellipse at 20% 0%, rgba(255,255,255,.45) 0 40%, transparent 41%)",
    shape: "blob",
  },
  {
    id: "carbon",
    name: "كربون",
    desc: "عصري بشبكة وحواف حادة",
    bg: "#F4F4F5",
    surface: "#FFFFFF",
    text: "#111113",
    muted: "#6C6C74",
    brand: "#111113",
    accent: "#D4D4D8",
    onBrand: "#FFFFFF",
    radius: "0.9rem",
    font: "'Cairo', sans-serif",
    pattern:
      "linear-gradient(rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px)",
    shape: "grid",
  },
];

export const getTheme = (id?: string | null) =>
  STORE_THEMES.find((t) => t.id === id) ?? STORE_THEMES[0]!;

export const heroShapeStyle = (t: StoreTheme): React.CSSProperties => {
  switch (t.shape) {
    case "arch":
      return { borderRadius: "0 0 45% 45% / 0 0 14% 14%" };
    case "wave":
      return { borderRadius: "0 0 60% 40% / 0 0 22% 12%" };
    case "blob":
      return { borderRadius: "0 0 38% 62% / 0 0 18% 24%" };
    case "ribbon":
      return { borderRadius: "0 0 2.5rem 2.5rem" };
    case "grid":
      return { borderRadius: "0" };
    default:
      return { borderRadius: "0 0 2rem 2rem" };
  }
};

export const themeVars = (t: StoreTheme) =>
  ({
    "--sf-bg": t.bg,
    "--sf-surface": t.surface,
    "--sf-text": t.text,
    "--sf-muted": t.muted,
    "--sf-brand": t.brand,
    "--sf-accent": t.accent,
    "--sf-on-brand": t.onBrand,
    "--sf-radius": t.radius,
  }) as React.CSSProperties;


export type Product = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
  reward_points: number;
  sort_order: number;
  created_at: string;
};

export type Order = {
  id: string;
  business_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  address: string | null;
  note: string | null;
  total: number;
  points_awarded: number;
  status: string;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
};

export const ORDER_STATUS: { id: string; label: string }[] = [
  { id: "new", label: "جديد" },
  { id: "preparing", label: "قيد التجهيز" },
  { id: "delivered", label: "تم التسليم" },
  { id: "canceled", label: "ملغى" },
];

export const statusText = (s: string) =>
  ORDER_STATUS.find((x) => x.id === s)?.label ?? s;

export async function fetchProducts(businessId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchOrders(businessId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function fetchOrderItems(orderId: string) {
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);
  if (error) throw error;
  return (data ?? []) as OrderItem[];
}

export async function fetchStoreBySlug(slug: string) {
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, slug, theme, description, logo_url, cover_url, currency, points_per_currency, whatsapp_phone, is_published")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchPublicProducts(businessId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_available", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export const money = (n: number) => `${Number(n).toLocaleString("ar-EG")} ₪`;
