import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "border-aicc-blue bg-aicc-blue text-white hover:bg-aicc-blue-hover",
  accent: "border-aicc-sky bg-aicc-sky text-aicc-deep hover:bg-aicc-sky-hover",
  secondary:
    "border-aicc-blue bg-transparent text-aicc-blue hover:bg-aicc-sky/45",
  ghost:
    "border-transparent bg-transparent text-aicc-blue hover:bg-aicc-sky/45",
  danger: "border-error bg-white text-error hover:bg-red-50",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  href?: string;
  full?: boolean;
};

export function Button({
  children,
  variant = "primary",
  href,
  full,
  className = "",
  ...props
}: Props) {
  const classes = `button ${variants[variant]} ${full ? "w-full" : ""} ${className}`;
  if (href)
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
