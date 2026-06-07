import { PRODUCT_NAME } from "@/lib/brand";

type OnebriefLogoProps = {
  className?: string;
  size?: "default" | "lg";
};

/** Minimal wordmark for the slim client header. */
export default function OnebriefLogo({ className = "", size = "default" }: OnebriefLogoProps) {
  const text = size === "lg" ? "text-sm sm:text-base" : "text-xs";

  return (
    <span
      className={`inline-flex items-baseline font-semibold tracking-tight ${text} ${className}`}
      aria-label={PRODUCT_NAME}
    >
      <span className="text-white">ONE</span>
      <span className="text-neutral-500">brief</span>
    </span>
  );
}
