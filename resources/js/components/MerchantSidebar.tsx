import { Link, router } from "@inertiajs/react";
import {
  Gift,
  LayoutDashboard,
  LogOut,
  Package,
  Settings2,
  ShoppingBag,
  Users,
} from "lucide-react";
export const merchantNavigation = [
  ["dashboard", "نظرة عامة", LayoutDashboard],
  ["products", "المنتجات", Package],
  ["orders", "الطلبات", ShoppingBag],
  ["customers", "العملاء", Users],
  ["rewards", "المكافآت", Gift],
  ["store", "إعدادات المتجر", Settings2],
] as const;
export default function MerchantSidebar({
  store,
  section,
}: {
  store: { name: string; is_published?: boolean };
  section: string;
}) {
  return (
    <aside className="merchant-sidebar">
      <Link className="platform-logo" href="/">
        مَدار<span>MADAR</span>
      </Link>
      <div className="sidebar-store">
        {store.name}
        <small>{store.is_published ? "متجرك منشور" : "متجرك قيد الإعداد"}</small>
      </div>
      <nav aria-label="لوحة التاجر">
        {merchantNavigation.map(([key, label, Icon]) => (
          <Link
            key={key}
            href={`/${key}`}
            className={section === key ? "active" : ""}
            aria-current={section === key ? "page" : undefined}
          >
            <Icon size={19} />
            {label}
          </Link>
        ))}
      </nav>
      <button
        className="logout-button"
        onClick={() => router.post("/logout")}
        aria-label="تسجيل الخروج"
      >
        <LogOut size={17} />
        <span>تسجيل الخروج</span>
      </button>
    </aside>
  );
}
