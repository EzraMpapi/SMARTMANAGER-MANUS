import React, { useState, type CSSProperties } from "react";

export const SMART_MANAGER_LOGO_URL = "/brand/smart-manager-logo.png";
export const SMART_MANAGER_MARK_URL = "/manus-storage/smart-manager-mark_aa277576.png";
export const SMART_MANAGER_LOGO_ANIMATION_URL = "/manus-storage/1000411291_698e34d5.mp4";

type BrandLogoProps = {
  variant?: "full" | "compact";
  className?: string;
  style?: CSSProperties;
  decorative?: boolean;
  priority?: boolean;
  animated?: boolean;
};

export function BrandLogo({ variant = "full", className = "", style, decorative = false, priority = false, animated = false }: BrandLogoProps) {
  const [animationFailed, setAnimationFailed] = useState(false);
  const label = "Smart Manager official logo";
  const imageClass = variant === "compact"
    ? "absolute inset-0 h-full w-full object-contain p-[5%]"
    : "relative z-0 block h-auto max-w-full object-contain";
  const videoClass = variant === "compact"
    ? "absolute inset-0 h-full w-full object-contain p-[5%]"
    : "pointer-events-none absolute inset-0 z-1 h-full w-full object-contain";
  const wrapperClass = variant === "compact"
    ? `relative isolate block aspect-square shrink-0 overflow-hidden rounded-[22%] bg-white ${className}`
    : `relative isolate block overflow-hidden ${className}`;
  const image = <img src={variant === "compact" ? SMART_MANAGER_MARK_URL : SMART_MANAGER_LOGO_URL} alt={decorative ? "" : label} width={variant === "compact" ? 768 : 1536} height={variant === "compact" ? 768 : 1024} loading={priority ? "eager" : "lazy"} decoding="async" className={`${imageClass} sm-animated-logo-fallback`.trim()} />;
  const video = animated && !animationFailed ? <video
    className={`${videoClass} sm-animated-logo-video`.trim()}
    autoPlay
    loop
    muted
    playsInline
    preload={priority ? "auto" : "metadata"}
    poster={SMART_MANAGER_LOGO_URL}
    aria-hidden="true"
    tabIndex={-1}
    onError={() => setAnimationFailed(true)}
  >
    <source src={SMART_MANAGER_LOGO_ANIMATION_URL} type="video/mp4" />
  </video> : null;

  return (
    <span
      className={wrapperClass.trim()}
      style={style}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    >
      {image}
      {video}
    </span>
  );
}
