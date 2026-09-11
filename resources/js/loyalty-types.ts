export type MerchantStore = { name: string; slug: string; currency: string; is_published: boolean };
export type Paginated<T> = {
  data: T[];
  total: number;
  last_page: number;
  links: { url: string | null; active: boolean; label: string }[];
};
export type CustomerRecord = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  points_balance: number;
  created_at: string;
  orders_count?: number;
  orders_max_created_at?: string | null;
};
export type PointEntry = {
  id: number;
  kind: "earn" | "redemption" | "adjustment";
  delta: number;
  balance_after: number;
  description: string;
  order_id: number | null;
  created_at: string;
};
export type Reward = {
  id: number;
  name: string;
  description?: string | null;
  image: string | null;
  points_cost: number;
  stock: number | null;
  is_active: boolean;
  revision: number;
};
export const number = (value: number) => new Intl.NumberFormat("ar").format(value);
export const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("ar", { year: "numeric", month: "short", day: "numeric" })
    : "—";
