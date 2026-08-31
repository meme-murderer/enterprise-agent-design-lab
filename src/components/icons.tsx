import type { SVGProps } from "react";

export function SignalIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        d="M50 7 87 28v44L50 93 13 72V28Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
      />
      <path
        d="M31 50h38M50 29v42"
        stroke="currentColor"
        strokeWidth="5"
        opacity=".45"
      />
      <circle cx="50" cy="50" r="8" fill="#D3EDF2" />
    </svg>
  );
}

export function SmallCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="m4 10 4 4 8-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}
