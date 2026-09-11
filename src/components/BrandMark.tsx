import logo from "@/assets/rejaa-logo.png";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="رِجعة">
      <img
        src={logo}
        alt="شعار رِجعة"
        width={1024}
        height={1024}
        loading="lazy"
        className="size-9 rounded-xl object-contain"
      />

      {!compact && (
        <span className="font-display text-xl font-black leading-none tracking-tight text-current">
          رِجعة<span className="text-accent">.</span>
        </span>
      )}
    </span>
  );
}
