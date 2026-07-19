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
  const initials = initialsOf(name) || "?";

  if (collapsed) {
    return (
      <SidebarFooter className="border-t border-sidebar-border/60 p-2">
        <div className="flex flex-col items-center gap-2">
          <div className="relative grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-sidebar" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Abmelden"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    );
  }

  return (
    <SidebarFooter className="p-3">
      <div className="flex items-center gap-3 rounded-xl p-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm">
          {initials}
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-sm font-semibold">{name}</span>
          {roleLabel && (
            <span className="mt-0.5 w-fit rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
              {roleLabel}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label="Abmelden"
          title="Abmelden"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </SidebarFooter>
  );
}
