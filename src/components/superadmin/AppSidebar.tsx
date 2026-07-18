import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Link2,
  PhoneCall,
  StickyNote,
  Ticket,
  FileSignature,
  Wallet,
  Receipt,
  Settings,
  Headphones,
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

const mainItems = [
  { title: "Übersicht", url: "/superadmin", icon: LayoutDashboard, end: true },
  { title: "Kunden", url: "/superadmin/kunden", icon: Building2 },
  { title: "Mitarbeiter", url: "/superadmin/mitarbeiter", icon: Users },
  { title: "Zuweisungen", url: "/superadmin/zuweisungen", icon: Link2 },
];

const opsItems = [
  { title: "Anrufe", url: "/superadmin/anrufe", icon: PhoneCall },
  { title: "Notizen", url: "/superadmin/notizen", icon: StickyNote },
  { title: "Tickets", url: "/superadmin/tickets", icon: Ticket },
];

const finItems = [
  { title: "Verträge", url: "/superadmin/vertraege", icon: FileSignature },
  { title: "Auszahlungen", url: "/superadmin/auszahlungen", icon: Wallet },
  { title: "Abrechnung", url: "/superadmin/abrechnung", icon: Receipt },
];

const systemItems = [
  { title: "Einstellungen", url: "/superadmin/einstellungen", icon: Settings },
];

export function SuperadminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const isActive = (path: string, end?: boolean) =>
    end ? pathname === path : pathname === path || pathname.startsWith(path + "/");

  const renderGroup = (
    label: string,
    items: { title: string; url: string; icon: typeof LayoutDashboard; end?: boolean }[],
  ) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url, item.end)}
                tooltip={item.title}
                className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:rounded-full data-[active=true]:hover:bg-primary data-[active=true]:hover:text-primary-foreground"
              >
                <NavLink to={item.url} end={item.end}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-deep text-primary">
            <Headphones className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">
                Sekreteriat<span className="text-primary">24</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Superadmin
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Allgemein", mainItems)}
        {renderGroup("Betrieb", opsItems)}
        {renderGroup("Finanzen", finItems)}
        {renderGroup("System", systemItems)}
      </SidebarContent>
      <SidebarUserFooter roleLabel="Superadmin" />
    </Sidebar>
  );
}
