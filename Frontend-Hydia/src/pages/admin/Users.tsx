import { useState } from "react"
import { Users as UsersIcon, Plus, Shield, Mail, Calendar, MoreHorizontal, Settings, UserPlus, Download, Search, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HydiaButton } from "@/components/ui/hydia-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const users = [
  { id: 1, name: "Marie Dupont", email: "marie.dupont@entreprise.com", role: "Admin", status: "active", lastLogin: "2024-03-20", group: "IT Admins", source: "AD" },
  { id: 2, name: "Jean Martin", email: "jean.martin@entreprise.com", role: "User", status: "active", lastLogin: "2024-03-19", group: "Sales", source: "Local" },
  { id: 3, name: "Sophie Bernard", email: "sophie.bernard@entreprise.com", role: "Manager", status: "inactive", lastLogin: "2024-03-15", group: "HR", source: "Azure" }
]

const groups = [
  { id: 1, name: "IT Admins", users: 12, permissions: ["admin", "read", "write"], source: "AD" },
  { id: 2, name: "Sales Team", users: 45, permissions: ["read", "write"], source: "AD" },
  { id: 3, name: "HR Department", users: 8, permissions: ["read", "hr"], source: "Azure" },
  { id: 4, name: "Finance", users: 15, permissions: ["read", "finance"], source: "Local" }
]

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">Administrez les comptes, groupes et permissions</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
            <DialogTrigger asChild>
              <HydiaButton variant="outline">
                <Settings className="h-4 w-4" />
                Gérer groupes & droits
              </HydiaButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Gestion des groupes et permissions</DialogTitle>
                <DialogDescription>
                  Créez et gérez les groupes d'utilisateurs et leurs permissions
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="groups" className="w-full">
                <TabsList>
                  <TabsTrigger value="groups">Groupes</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>
                <TabsContent value="groups" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Groupes existants</h3>
                    <HydiaButton variant="primary" size="sm">
                      <Plus className="h-4 w-4" />
                      Nouveau groupe
                    </HydiaButton>
                  </div>
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <div key={group.id} className="flex items-center justify-between p-3 border border-border/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                            <UsersIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium">{group.name}</h4>
                            <p className="text-sm text-muted-foreground">{group.users} utilisateurs</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={group.source === 'AD' ? 'default' : group.source === 'Azure' ? 'secondary' : 'outline'}>
                            {group.source}
                          </Badge>
                          <div className="flex gap-1">
                            {group.permissions.map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                          <HydiaButton variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </HydiaButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="permissions" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Permissions système</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="admin">Administration complète</Label>
                          <Switch id="admin" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="audit">Accès audit</Label>
                          <Switch id="audit" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="users">Gestion utilisateurs</Label>
                          <Switch id="users" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Permissions données</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="read">Lecture</Label>
                          <Switch id="read" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="write">Écriture</Label>
                          <Switch id="write" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="delete">Suppression</Label>
                          <Switch id="delete" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <HydiaButton variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                  Fermer
                </HydiaButton>
                <HydiaButton variant="primary">
                  Sauvegarder
                </HydiaButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <HydiaButton variant="outline">
            <Download className="h-4 w-4" />
            Exporter
          </HydiaButton>
          <HydiaButton variant="primary">
            <UserPlus className="h-4 w-4" />
            Nouvel utilisateur
          </HydiaButton>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="admin">Administrateurs</SelectItem>
            <SelectItem value="manager">Managers</SelectItem>
            <SelectItem value="user">Utilisateurs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilisateurs actifs</p>
                <p className="text-2xl font-bold">847</p>
              </div>
              <UsersIcon className="h-8 w-8 text-hydia-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nouveaux ce mois</p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <div className="text-hydia-success text-2xl">👥</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Shield className="h-8 w-8 text-hydia-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border border-border/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">{user.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      <Badge variant={user.source === 'AD' ? 'default' : user.source === 'Azure' ? 'secondary' : 'outline'} className="text-xs">
                        {user.source}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Groupe: {user.group}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">Rôle</p>
                  </div>
                  <div className="text-center">
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Statut</p>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium">{user.lastLogin}</span>
                    <p className="text-xs text-muted-foreground">Dernière connexion</p>
                  </div>
                  <div className="flex gap-1">
                    <HydiaButton variant="ghost" size="icon" title="Modifier">
                      <Mail className="h-4 w-4" />
                    </HydiaButton>
                    <HydiaButton variant="ghost" size="icon" title="Suspendre">
                      <Shield className="h-4 w-4" />
                    </HydiaButton>
                    <HydiaButton variant="ghost" size="icon" title="Plus d'options">
                      <MoreHorizontal className="h-4 w-4" />
                    </HydiaButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}