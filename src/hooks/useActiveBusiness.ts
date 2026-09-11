import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBusinesses, type Business } from "@/lib/loyalty";

const KEY = "wala_active_business";

export function useBusinesses() {
  return useQuery({ queryKey: ["businesses"], queryFn: fetchBusinesses });
}

export function useActiveBusiness() {
  const { data: businesses = [], isLoading } = useBusinesses();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setActiveId(window.localStorage.getItem(KEY));
  }, []);

  const select = (id: string) => {
    window.localStorage.setItem(KEY, id);
    setActiveId(id);
  };

  const active: Business | undefined =
    businesses.find((b) => b.id === activeId) ?? businesses[0];

  return { businesses, active, isLoading, select };
}
