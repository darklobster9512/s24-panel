import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function SidebarUserFooter({ roleLabel }: { roleLabel?: string }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      // Prefer employees.first_name/last_name, fallback to profiles.full_name
      const { data: emp } = await supabase
        .from("employees")
        .select("first_name,last_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (emp && (emp.first_name || emp.last_name)) {
        setDisplayName(`${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim());
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (prof?.full_name) setDisplayName(prof.full_name);
      else setDisplayName(user.email?.split("@")[0] ?? "");
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSignOut() {
    await signOut();
    navigate("/auth", { replace: true });
  }

  const name = displayName || user?.email?.split("@")[0] || "Benutzer";
  const email = user?.email ?? "";
  const initials = initialsOf(name) || "?";

  if (collapsed) {
    return (
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex flex-col items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            {initials}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-8 w-8"
            aria-label="Abmelden"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    );
  }

  return (
    <SidebarFooter className="border-t border-sidebar-border p-3">
      <div className={cn("flex items-center gap-3 rounded-xl bg-sidebar-accent/40 p-2")}>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          {initials}
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-sm font-semibold">{name}</span>
          <span className="truncate text-[11px] text-muted-foreground">
            {email}
          </span>
          {roleLabel && (
            <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {roleLabel}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="h-8 w-8 shrink-0"
          aria-label="Abmelden"
          title="Abmelden"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </SidebarFooter>
  );
}
