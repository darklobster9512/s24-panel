import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Building2,
  Users,
  Link2,
  PhoneCall,
  StickyNote,
  FileSignature,
  Wallet,
  Receipt,
  Settings,
  Headphones,
  UserPlus,

} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarUserFooter } from "@/components/SidebarUserFooter";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

type SidebarItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  badge?: number;
};

const mainItems: SidebarItem[] = [
  { title: "Übersicht", url: "/superadmin", icon: LayoutDashboard, end: true },
  { title: "Kunden", url: "/superadmin/kunden", icon: Building2 },
  { title: "Mitarbeiter", url: "/superadmin/mitarbeiter", icon: Users },
  { title: "Zuweisungen", url: "/superadmin/zuweisungen", icon: Link2 },
];

const opsItems = (newApplicationsCount: number): SidebarItem[] => [
  { title: "Anrufe", url: "/superadmin/anrufe", icon: PhoneCall },
  { title: "Notizen", url: "/superadmin/notizen", icon: StickyNote },
  {
    title: "Bewerbungen",
    url: "/superadmin/bewerbungen",
    icon: UserPlus,
    badge: newApplicationsCount,
  },
];

const finItems = (pendingCount: number): SidebarItem[] => [
  { title: "Verträge", url: "/superadmin/vertraege", icon: FileSignature },
  {
    title: "Arbeitsverträge",
    url: "/superadmin/arbeitsvertraege",
    icon: FileSignature,
    badge: pendingCount,
  },
  { title: "Auszahlungen", url: "/superadmin/auszahlungen", icon: Wallet },
  { title: "Abrechnung", url: "/superadmin/abrechnung", icon: Receipt },
];

const systemItems: SidebarItem[] = [
  { title: "Einstellungen", url: "/superadmin/einstellungen", icon: Settings },
];

export function SuperadminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const pendingCountQuery = useQuery({
    queryKey: ["open-contracts-count"],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("employee_contracts")
        .select("id", { count: "exact", head: true })
        .neq("status", "completed");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const newApplicationsQuery = useQuery({
    queryKey: ["new-applications-count"],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "neu");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const pendingCount = pendingCountQuery.data ?? 0;
  const newApplicationsCount = newApplicationsQuery.data ?? 0;

  const isActive = (path: string, end?: boolean) =>
    end ? pathname === path : pathname === path || pathname.startsWith(path + "/");

  const renderGroup = (label: string, items: SidebarItem[]) => (
    <SidebarGroup className="px-2 py-2">
      {!collapsed && (
        <SidebarGroupLabel className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground/80">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url, item.end)}
                tooltip={item.title}
                className="group/item relative h-9 rounded-lg font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-semibold data-[active=true]:shadow-[0_2px_10px_-3px_hsl(var(--primary)/0.5)] data-[active=true]:hover:bg-primary data-[active=true]:hover:text-primary-foreground"
              >
                <NavLink to={item.url} end={item.end} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </span>
                  {!collapsed && item.badge ? (
                    <Badge className="ml-auto h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px] font-semibold">
                      {item.badge}
                    </Badge>
                  ) : null}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/60">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-ink-deep to-ink text-primary shadow-sm">
            <Headphones className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">
                Sekreteriat<span className="text-primary">24</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Superadmin
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-1 py-2">
        {renderGroup("Allgemein", mainItems)}
        {renderGroup("Betrieb", opsItems)}
        {renderGroup("Finanzen", finItems(pendingCount))}
        {renderGroup("System", systemItems)}
      </SidebarContent>
      <SidebarUserFooter roleLabel="Superadmin" />
    </Sidebar>
  );
}
