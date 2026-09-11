import { Link } from "@inertiajs/react";
import type { Paginated } from "../loyalty-types";
export default function Pagination({
  page,
  label = "الصفحات",
}: {
  page: Pick<Paginated<unknown>, "links" | "last_page">;
  label?: string;
}) {
  if (page.last_page <= 1) return null;
  return (
    <nav className="pagination" aria-label={label}>
      {page.links.map((link, i) => {
        const text = i === 0 ? "السابق" : i === page.links.length - 1 ? "التالي" : link.label;
        return link.url ? (
          <Link
            href={link.url}
            key={i}
            preserveScroll
            className={link.active ? "active" : ""}
            aria-current={link.active ? "page" : undefined}
          >
            {text}
          </Link>
        ) : (
          <span key={i}>{text}</span>
        );
      })}
    </nav>
  );
}
