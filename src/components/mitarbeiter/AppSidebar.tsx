import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Radio,
  PhoneCall,
  StickyNote,
  Ticket,
  BarChart3,
  User,
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

const workItems = [
  { title: "Cockpit", url: "/mitarbeiter", icon: LayoutDashboard, end: true },
  { title: "Meine Kunden", url: "/mitarbeiter/kunden", icon: Building2 },
  { title: "Live-Anrufe", url: "/mitarbeiter/live", icon: Radio },
  { title: "Anruf erfassen", url: "/mitarbeiter/erfassen", icon: PhoneCall },
];

const docItems = [
  { title: "Notizen", url: "/mitarbeiter/notizen", icon: StickyNote },
  { title: "Tickets", url: "/mitarbeiter/tickets", icon: Ticket },
];

const meItems = [
  { title: "Meine Statistik", url: "/mitarbeiter/statistik", icon: BarChart3 },
  { title: "Profil & Vertrag", url: "/mitarbeiter/profil", icon: User },
];

export function MitarbeiterSidebar() {
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
                Mitarbeiter
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Arbeit", workItems)}
        {renderGroup("Dokumentation", docItems)}
        {renderGroup("Persönlich", meItems)}
      </SidebarContent>
    </Sidebar>
  );
}
