import Link from "next/link";
import type { ReactNode } from "react";
import { SignalIcon } from "@/components/icons";

export function AppShell({
  children,
  facilitator = false,
}: {
  children: ReactNode;
  facilitator?: boolean;
}) {
  return (
    <div className="min-h-screen bg-offwhite text-slate">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-aicc-deep text-white print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="Enterprise Agent Design Lab home"
          >
            <SignalIcon className="h-9 w-9 text-white" />
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              Enterprise Agent Design Lab
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs font-medium uppercase tracking-[0.12em] text-white/55 sm:block">
              AICC 2026
            </span>
            {facilitator ? (
              <Link className="nav-link" href="/">
                Participant view
              </Link>
            ) : (
              <Link className="nav-link" href="/facilitator">
                Facilitator
              </Link>
            )}
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-fog bg-white print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-cool-gray sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            This workshop does not connect to company systems or take any
            action.
          </span>
          <span className="font-medium uppercase tracking-[0.1em]">
            AICC 2026 Â· Workshop lab
          </span>
        </div>
      </footer>
    </div>
  );
}
