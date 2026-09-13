import { Head, usePage } from "@inertiajs/react";
import { ArrowUpLeft, Eye } from "lucide-react";
import MerchantSidebar from "./MerchantSidebar";
import type { MerchantStore } from "../loyalty-types";
export default function MerchantLayout({
  store,
  section,
  title,
  description,
  action,
  children,
}: {
  store: MerchantStore;
  section: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const page = usePage<{ auth: { user: { name: string } }; flash: { success: string | null } }>();
  return (
    <div className={`merchant-shell ${section === "customers" || section === "rewards" ? "loyalty-workspace" : ""}`}>
      <Head title={title} />
      <MerchantSidebar store={store} section={section} />
      <main className="merchant-main">
        <div className="merchant-top">
          <span>أهلاً، {page.props.auth.user.name} 👋</span>
          {store.is_published && (
            <a href={`/s/${store.slug}`} className="text-link" target="_blank" rel="noreferrer">
              <Eye size={16} /> زيارة المتجر <ArrowUpLeft size={14} />
            </a>
          )}
        </div>
        {page.props.flash.success && (
          <div className="merchant-success" role="status">
            {page.props.flash.success}
          </div>
        )}
        <div className="merchant-heading">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {action}
        </div>
        {children}
      </main>
    </div>
  );
}
