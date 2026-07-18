import { Suspense, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Loader2, PhoneCall, Circle } from "lucide-react";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { MitarbeiterSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Status = "verfuegbar" | "pause" | "nicht-bereit";
const STATUS_META: Record<Status, { label: string; dot: string; ring: string }> = {
  "verfuegbar": { label: "Verfügbar", dot: "bg-primary", ring: "ring-primary/40" },
  "pause": { label: "Pause", dot: "bg-amber-400", ring: "ring-amber-400/40" },
  "nicht-bereit": { label: "Nicht bereit", dot: "bg-destructive", ring: "ring-destructive/40" },
};

export default function MitarbeiterLayout() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [status, setStatus] = useState<Status>("verfuegbar");

  async function handleSignOut() {
    await signOut();
    navigate("/auth", { replace: true });
  }

  const meta = STATUS_META[status];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-surface">
        <MitarbeiterSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur">
            <SidebarTrigger />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium ring-2 ring-transparent transition hover:ring-2",
                    meta.ring,
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                  {meta.label}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {(Object.keys(STATUS_META) as Status[]).map((s) => (
                  <DropdownMenuItem key={s} onClick={() => setStatus(s)} className="gap-2">
                    <span className={cn("h-2 w-2 rounded-full", STATUS_META[s].dot)} />
                    {STATUS_META[s].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button asChild size="sm" className="ml-2 gap-2">
              <Link to="/mitarbeiter/erfassen">
                <PhoneCall className="h-4 w-4" /> Anruf erfassen
              </Link>
            </Button>

            <div className="ml-auto flex items-center gap-3">
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

// ————————————————————————————————————————————
// Shared building blocks (mirror of Superadmin ones)

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
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
  title?: React.ReactNode;
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
          <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-ink">{delta}</span>
        </div>
      )}
    </div>
  );
}

export function ClientLogo({
  logo,
  logoUrl,
  name,
  size = "md",
}: {
  logo?: string;
  logoUrl?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sz = size === "sm" ? "h-8 w-8 text-base" : size === "lg" ? "h-14 w-14 text-2xl" : "h-10 w-10 text-lg";
  return (
    <div
      className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/15 text-ink", sz)}
      aria-label={name}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{logo ?? name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

export { Circle };
