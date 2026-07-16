import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Headphones, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
}

export function DashboardShell({
  title,
  subtitle,
  badge,
  children,
}: DashboardShellProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate("/auth", { replace: true });
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-ink-deep text-primary">
              <Headphones className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              Assistify Pro
            </span>
            {badge && (
              <span className="ml-2 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-medium text-ink">
                {badge}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:inline">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" /> Abmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  icon: ReactNode;
}

export function StatCard({ label, value, delta, icon }: StatCardProps) {
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
        <div className="mt-1 text-xs font-medium text-primary-foreground/70">
          <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-ink">
            {delta}
          </span>
        </div>
      )}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card-elegant">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
