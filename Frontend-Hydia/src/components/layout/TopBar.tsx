import { Bell, Search, Settings, User, Shield, LogOut, Sun, Moon, Building2 } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { HydiaButton } from "@/components/ui/hydia-button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/hooks/use-theme"
import { useAuth } from "@/hooks/useAuth"

export function TopBar() {
  const { theme, toggleTheme } = useTheme()
  const { user, organizations, currentOrgId, logout } = useAuth()

  const currentOrg = organizations.find(org => org.id === currentOrgId)
  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'Utilisateur'

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm supports-[backdrop-filter]:bg-card/20">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover:bg-accent" />
          
          {/* Global Search */}
          <div className="relative w-96 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans HYDIA..."
              className="pl-10 bg-input/50 border-border/50 focus:border-hydia-primary"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Current Organization */}
          {currentOrg && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-hydia-primary" />
              <Badge variant="outline" className="border-hydia-primary/50 text-hydia-primary">
                {currentOrg.name}
              </Badge>
            </div>
          )}

          {/* Security Status */}
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-hydia-success" />
            <Badge variant="outline" className="border-hydia-success/50 text-hydia-success">
              Sécurisé
            </Badge>
          </div>

          {/* Notifications */}
          <HydiaButton variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-hydia-danger rounded-full text-xs flex items-center justify-center text-white">
              3
            </span>
          </HydiaButton>

          {/* Theme Toggle */}
          <HydiaButton 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="transition-all duration-300 hover:scale-110"
            title={theme === "light" ? "Basculer vers le thème sombre" : "Basculer vers le thème clair"}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 transition-transform duration-300" />
            ) : (
              <Sun className="h-4 w-4 transition-transform duration-300" />
            )}
          </HydiaButton>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <HydiaButton variant="ghost" className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-medium">{displayName}</span>
              </HydiaButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
              <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-hydia-danger"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}