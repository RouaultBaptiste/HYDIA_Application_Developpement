import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Key,
  FileText,
  StickyNote,
  Users,
  Share2,
  Settings,
  Shield,
  Activity,
  Database,
  ChevronDown,
  ChevronRight,
  BookOpen
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import hydiaLogo from "@/assets/hydia-logo.png"

const userModules = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Mots de passe", url: "/passwords", icon: Key },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Notes sécurisées", url: "/notes", icon: StickyNote },
  { title: "Partage collaboratif", url: "/sharing", icon: Share2 },
  { title: "Formations", url: "/formations", icon: BookOpen },
]

const adminModules = [
  { title: "Dashboard DSI", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Gestion utilisateurs", url: "/admin/users", icon: Users },
  { title: "Audit de sécurité", url: "/admin/audit", icon: Activity },
  { title: "Infrastructure", url: "/admin/infrastructure", icon: Database },
  { title: "Politiques", url: "/admin/policies", icon: Shield },
  { title: "Formations", url: "/admin/formations", icon: BookOpen },
  { title: "Configuration", url: "/admin/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"
  
  const [adminOpen, setAdminOpen] = useState(
    adminModules.some(module => currentPath.startsWith(module.url))
  )

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }

  const getNavClassName = (path: string) =>
    isActive(path)
      ? "bg-hydia-primary/20 text-hydia-primary border-r-2 border-hydia-primary font-medium"
      : "hover:bg-accent hover:text-foreground"

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img 
            src={hydiaLogo} 
            alt="HYDIA" 
            className="h-8 w-8 object-contain"
          />
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-hydia-primary">HYDIA</h1>
              <p className="text-xs text-muted-foreground">Données Sécurisées</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Modules Utilisateur */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-hydia-primary font-semibold">
            {!collapsed && "Modules Utilisateur"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userModules.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Section DSI/Admin */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-hydia-primary font-semibold">
            {!collapsed && "Administration DSI"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible open={adminOpen} onOpenChange={setAdminOpen}>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="hover:bg-accent">
                    <Shield className="h-4 w-4" />
                    {!collapsed && (
                      <>
                        <span>DSI / IT Admin</span>
                        {adminOpen ? (
                          <ChevronDown className="h-4 w-4 ml-auto" />
                        ) : (
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        )}
                      </>
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                
                {!collapsed && (
                  <CollapsibleContent>
                    <SidebarMenu className="ml-4 mt-2">
                      {adminModules.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink to={item.url} className={getNavClassName(item.url)}>
                              <item.icon className="h-4 w-4" />
                              <span className="text-sm">{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                )}
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}