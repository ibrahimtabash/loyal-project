export type Store = {
  name: string;
  slug: string;
  description: string | null;
  tagline: string;
  currency: string;
  city: string | null;
  hero_image: string | null;
  accent: string;
  theme?: string;
  delivery_fee: number;
  whatsapp_phone: string | null;
  is_published?: boolean;
};
export type Product = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number;
  compare_price: number | null;
  image: string | null;
  reward_points: number;
  is_featured: boolean;
  is_available?: boolean;
};
export type Order = {
  id: number;
  customer_id?: number | null;
  token: string;
  customer_name: string;
  customer_phone: string;
  address: string | null;
  note: string | null;
  fulfillment: string;
  status: string;
  currency: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  reward_points: number;
  created_at: string;
  items: { id: number; name: string; price: number; quantity: number }[];
};
export const money = (value: number, currency = "ILS") =>
  new Intl.NumberFormat("ar", { style: "currency", currency, maximumFractionDigits: 2 }).format(
    value / 100,
  );
export const statuses: Record<string, string> = {
  new: "بانتظار التأكيد",
  confirmed: "مؤكد",
  preparing: "قيد التجهيز",
  delivered: "تم التسليم",
  canceled: "ملغى",
};
