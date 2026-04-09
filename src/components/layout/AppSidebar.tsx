import { Home, CalendarDays, Users, FileText, Shield, LogOut, User, GitBranch, FileQuestion, ChevronsUpDown, ClipboardList, Heart, Award, UsersRound, FileBarChart, Link2, Target, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Ciclos", url: "/cycles", icon: CalendarDays },
  { title: "Iniciativas", url: "/initiatives", icon: Target },
  { title: "Alinhamento", url: "/alignment", icon: GitBranch },
];

const engagementItems = [
  { title: "PPP Semanal", url: "/weekly", icon: ClipboardList },
  { title: "Pulse Survey", url: "/pulse", icon: Heart },
  { title: "Kudos", url: "/kudos", icon: Award },
];

const settingsItems = [
  { title: "Meu Perfil", url: "/settings/profile", icon: User },
  { title: "Autenticação 2FA", url: "/settings/2fa", icon: Shield },
];

const adminSettingsItems = [
  { title: "Integrações", url: "/settings/integrations", icon: Link2 },
];

const adminItems = [
  { title: "Usuários & Papéis", url: "/admin/users", icon: Users },
  { title: "Permissões", url: "/admin/permissions", icon: ShieldCheck },
  { title: "Logs de Auditoria", url: "/admin/audit", icon: FileText },
  { title: "Change Requests", url: "/admin/change-requests", icon: FileQuestion },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useRoles(user?.id);
  const { can } = usePermissions();
  const navigate = useNavigate();
  

  const { data: profileData } = useQuery({
    queryKey: ["sidebar-avatar", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const avatarUrl = profileData?.avatar_url || user?.user_metadata?.avatar_url;

  const initials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5 flex items-center justify-center border-b border-sidebar-border/50">
        <span className="text-xl font-extrabold tracking-tight text-sidebar-foreground">
          Vektor<span className="text-cta">Flow</span>
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-2xs uppercase tracking-widest">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="transition-smooth hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
      </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-2xs uppercase tracking-widest">
            Engajamento
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {engagementItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="transition-smooth hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(can("ppp.view_team") || can("reports.view")) && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60 text-2xs uppercase tracking-widest">
              Gestão
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {can("ppp.view_team") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/leader"
                        className="transition-smooth hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-medium"
                      >
                        <UsersRound className="h-4 w-4" />
                        <span>Minha Equipe</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {can("reports.view") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/reports"
                        className="transition-smooth hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-medium"
                      >
                        <FileBarChart className="h-4 w-4" />
                        <span>Relatórios</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

    </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || undefined} alt={user?.user_metadata?.full_name || "Usuário"} />
                    <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user?.user_metadata?.full_name || "Usuário"}
                    </p>
                    <p className="text-2xs text-sidebar-foreground/60 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/60" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                {settingsItems.map((item) => (
                  <DropdownMenuItem key={item.url} onClick={() => navigate(item.url)}>
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.title}
                  </DropdownMenuItem>
                ))}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    {adminItems.map((item) => (
                      <DropdownMenuItem key={item.url} onClick={() => navigate(item.url)}>
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.title}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
