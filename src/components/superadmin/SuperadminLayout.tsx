import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { SuperadminSidebar } from "./AppSidebar";
import { Input } from "@/components/ui/input";

export default function SuperadminLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-surface">
        <SuperadminSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Suche nach Kunden, Mitarbeitern, Anrufen…"
                className="h-9 pl-9"
              />
            </div>
          </header>
          <main className="flex-1 px-6 py-8">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border/60 bg-card p-6 shadow-card-elegant ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card-elegant">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-ink">
          {icon}
        </div>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight">{value}</div>
      {delta && (
        <div className="mt-1 text-xs font-medium">
          <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-ink">
            {delta}
          </span>
        </div>
      )}
    </div>
  );
}
