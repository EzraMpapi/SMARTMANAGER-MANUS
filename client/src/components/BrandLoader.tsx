import { BrandLogo } from "./BrandLogo";

type BrandLoaderProps = {
  label?: string;
  className?: string;
};

/**
 * A source-preserving motion treatment for route and workspace transitions.
 * The visible mark is always the approved Smart Manager logo asset.
 */
export function BrandLoader({ label = "Loading Smart Manager", className = "" }: BrandLoaderProps) {
  return (
    <div className={`sm-brand-loader ${className}`.trim()} role="status" aria-live="polite" aria-label={label}>
      <div className="sm-brand-loader__mark" aria-hidden="true">
        <BrandLogo variant="app-icon" decorative priority className="h-full w-full" />
        <span className="sm-brand-loader__circuit sm-brand-loader__circuit--one" />
        <span className="sm-brand-loader__circuit sm-brand-loader__circuit--two" />
        <span className="sm-brand-loader__circuit sm-brand-loader__circuit--three" />
        <span className="sm-brand-loader__uplift">↗</span>
      </div>
      <span className="sm-brand-loader__label">{label}</span>
    </div>
  );
}
