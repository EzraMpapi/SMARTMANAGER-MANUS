import type { CSSProperties } from "react";

export const SMART_MANAGER_LOGO_URL = "/manus-storage/smart-manager-official-logo_0bf4409d.png";

type BrandLogoProps = {
  variant?: "full" | "compact";
  className?: string;
  style?: CSSProperties;
  decorative?: boolean;
  priority?: boolean;
};

export function BrandLogo({ variant = "full", className = "", style, decorative = false, priority = false }: BrandLogoProps) {
  const label = "Smart Manager official logo";
  if (variant === "compact") {
    return (
      <span
        className={`relative isolate block aspect-square shrink-0 overflow-hidden rounded-[22%] bg-white ${className}`.trim()}
        style={style}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative || undefined}
      >
        <img
          src={SMART_MANAGER_LOGO_URL}
          alt=""
          width={1254}
          height={1254}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute left-1/2 top-0 h-auto w-full max-w-none -translate-x-1/2 origin-top scale-[1.76]"
        />
      </span>
    );
  }

  return <img src={SMART_MANAGER_LOGO_URL} alt={decorative ? "" : label} width={1254} height={1254} loading={priority ? "eager" : "lazy"} decoding="async" className={`block h-auto max-w-full object-contain ${className}`.trim()} style={style} aria-hidden={decorative || undefined} />;
}
