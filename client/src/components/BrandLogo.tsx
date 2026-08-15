import type { CSSProperties } from "react";

export const SMART_MANAGER_LOGO_URL = "/manus-storage/smart-manager-official-master_88d60979.png";
export const SMART_MANAGER_LOGO_WEBP_URL = "/manus-storage/smart-manager-full_a19b3039.webp";
export const SMART_MANAGER_ICON_URL = "/manus-storage/smart-manager-mobile-icon_84bd91d9.png";
export const SMART_MANAGER_ICON_WEBP_URL = "/manus-storage/smart-manager-mobile-icon_dc820363.webp";
export const SMART_MANAGER_APP_ICON_URL = "/manus-storage/smart-manager-app-icon-512_2c222319.png";
export const SMART_MANAGER_FAVICON_URL = "/manus-storage/smart-manager-favicon_a6bf2186.ico";

type BrandLogoProps = {
  variant?: "full" | "horizontal" | "compact" | "mobile" | "app-icon";
  className?: string;
  style?: CSSProperties;
  decorative?: boolean;
  priority?: boolean;
  slogan?: boolean;
  tone?: "light" | "dark";
};

export function BrandLogo({ variant = "full", className = "", style, decorative = false, priority = false, slogan = true, tone = "dark" }: BrandLogoProps) {
  const label = "Smart Manager official logo";
  const imageLoading = priority ? "eager" : "lazy";

  if (variant === "horizontal") {
    return (
      <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`.trim()} style={style} role={decorative ? undefined : "img"} aria-label={decorative ? undefined : label} aria-hidden={decorative || undefined}>
        <picture className="block h-10 w-10 shrink-0 overflow-hidden rounded-[22%] bg-white shadow-[0_8px_20px_rgba(0,166,81,0.2)]">
          <source srcSet={SMART_MANAGER_ICON_WEBP_URL} type="image/webp" />
          <img src={SMART_MANAGER_ICON_URL} alt="" width={1024} height={1024} loading={imageLoading} decoding="async" className="h-full w-full object-contain" />
        </picture>
        <span className="min-w-0 leading-none">
          <span className={`block whitespace-nowrap font-heading text-[0.92rem] font-extrabold tracking-[-0.045em] ${tone === "light" ? "text-white" : "text-[#101828] dark:text-white"}`}>SMART MANAGER</span>
          {slogan ? <span className={`mt-1 hidden whitespace-nowrap text-[0.62rem] font-semibold tracking-[0.08em] sm:block ${tone === "light" ? "text-emerald-200" : "text-[#008A45]"}`}>SIMAMIA BIASHARA YAKO. POPOTE, WAKATI WOTE.</span> : null}
        </span>
      </span>
    );
  }

  if (variant === "compact" || variant === "mobile" || variant === "app-icon") {
    return (
      <span
        className={`relative isolate block aspect-square shrink-0 overflow-hidden rounded-[22%] bg-white shadow-[0_8px_20px_rgba(0,166,81,0.2)] ${className}`.trim()}
        style={style}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative || undefined}
      >
        <picture>
          <source srcSet={SMART_MANAGER_ICON_WEBP_URL} type="image/webp" />
          <img src={variant === "app-icon" ? SMART_MANAGER_APP_ICON_URL : SMART_MANAGER_ICON_URL} alt="" width={1024} height={1024} loading={imageLoading} decoding="async" className="h-full w-full object-contain" />
        </picture>
      </span>
    );
  }

  return (
    <picture className={`block ${className}`.trim()} style={style} aria-hidden={decorative || undefined}>
      <source srcSet={SMART_MANAGER_LOGO_WEBP_URL} type="image/webp" />
      <img src={SMART_MANAGER_LOGO_URL} alt={decorative ? "" : label} width={1536} height={1024} loading={imageLoading} decoding="async" className="block h-auto max-w-full object-contain" />
    </picture>
  );
}
