import { useState } from "react"
import { Share2, Link, Users, Clock, Calendar, Shield, Eye, Copy, Settings, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HydiaButton } from "@/components/ui/hydia-button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

const sharedItems = [
  {
    id: 1,
    name: "Rapport_Annuel_2024.pdf",
    type: "document",
    sharedWith: ["marie.dupont@entreprise.com", "jean.martin@entreprise.com"],
    permissions: "read",
    expiresAt: "2024-04-15",
    createdAt: "2024-03-15",
    accessCount: 24,
    lastAccess: "2024-03-20T14:30:00",
    isProtected: true,
    owner: "Sophie Bernard"
  },
  {
    id: 2,
    name: "Projet Migration Cloud - Notes",
    type: "note",
    sharedWith: ["equipe-tech@entreprise.com"],
    permissions: "edit",
    expiresAt: "2024-05-01",
    createdAt: "2024-03-10",
    accessCount: 45,
    lastAccess: "2024-03-20T09:15:00",
    isProtected: false,
    owner: "Jean Martin"
  },
  {
    id: 3,
    name: "Mots de passe - Serveurs Production",
    type: "password",
    sharedWith: ["admin@entreprise.com", "devops@entreprise.com"],
    permissions: "view",
    expiresAt: "2024-06-30",
    createdAt: "2024-02-28",
    accessCount: 12,
    lastAccess: "2024-03-19T16:45:00",
    isProtected: true,
    owner: "Admin Team"
  },
  {
    id: 4,
    name: "Budget Q1 2024",
    type: "document",
    sharedWith: ["direction@entreprise.com"],
    permissions: "comment",
    expiresAt: "2024-12-31",
    createdAt: "2024-03-01",
    accessCount: 8,
    lastAccess: "2024-03-18T11:20:00",
    isProtected: true,
    owner: "Marie Dupont"
  }
]

const getTypeIcon = (type: string) => {
  switch (type) {
    case "document": return "📄"
    case "note": return "📝"
    case "password": return "🔑"
    default: return "📁"
  }
}

const getPermissionBadge = (permission: string) => {
  switch (permission) {
    case "read":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Lecture</Badge>
    case "edit":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Modification</Badge>
    case "view":
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Visualisation</Badge>
    case "comment":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Commentaire</Badge>
    default:
      return <Badge variant="secondary">Inconnu</Badge>
  }
}

export default function Sharing() {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const { toast } = useToast()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "À l'instant"
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    if (diffInHours < 48) return "Hier"
    return date.toLocaleDateString('fr-FR')
  }

  const generateShareLink = (item: any) => {
    const link = `https://hydia.app/shared/${item.id}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Lien copié !",
      description: "Le lien de partage a été copié dans le presse-papiers",
    })
  }

  const revokeAccess = (item: any) => {
    toast({
      title: "Accès révoqué",
      description: `L'accès à "${item.name}" a été révoqué`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partage collaboratif</h1>
          <p className="text-muted-foreground">Gérez les accès et partagez vos ressources de manière sécurisée</p>
        </div>
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogTrigger asChild>
            <HydiaButton variant="primary">
              <Share2 className="h-4 w-4" />
              Nouveau partage
            </HydiaButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Partager un élément</DialogTitle>
              <DialogDescription>Configurez les droits d'accès pour un élément</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item-select">Élément à partager</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un élément" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doc1">Rapport Q4 2024.pdf</SelectItem>
                    <SelectItem value="note1">Notes réunion produit</SelectItem>
                    <SelectItem value="pass1">Accès serveur staging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emails">Partager avec (emails)</Label>
                <Textarea 
                  id="emails" 
                  placeholder="marie@entreprise.com&#10;jean@entreprise.com"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permission">Niveau d'accès</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner les droits" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Visualisation uniquement</SelectItem>
                    <SelectItem value="read">Lecture</SelectItem>
                    <SelectItem value="comment">Lecture + Commentaires</SelectItem>
                    <SelectItem value="edit">Modification complète</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Date d'expiration</Label>
                <Input id="expiry" type="date" />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="password-protect" className="rounded" />
                <Label htmlFor="password-protect" className="text-sm">Protéger par mot de passe</Label>
              </div>
            </div>
            <DialogFooter>
              <HydiaButton variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                Annuler
              </HydiaButton>
              <HydiaButton variant="primary">
                <Share2 className="h-4 w-4" />
                Partager
              </HydiaButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Éléments partagés</p>
                <p className="text-2xl font-bold">89</p>
              </div>
              <Share2 className="h-8 w-8 text-hydia-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilisateurs actifs</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <Users className="h-8 w-8 text-hydia-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accès cette semaine</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <Eye className="h-8 w-8 text-hydia-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Protégés</p>
                <p className="text-2xl font-bold">67</p>
              </div>
              <Shield className="h-8 w-8 text-hydia-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shared Items */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Éléments partagés</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{sharedItems.length} éléments</span>
          </div>
        </div>
        
        <div className="grid gap-6">
          {sharedItems.map((item) => (
            <Card key={item.id} className="bg-gradient-card border-border/50 hover:shadow-card transition-all duration-300 hover:scale-[1.01] group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-6 flex-1">
                    <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center text-2xl shadow-lg">
                      {getTypeIcon(item.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        {item.isProtected && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-hydia-success/10 rounded-full">
                            <Shield className="h-3 w-3 text-hydia-success" />
                            <span className="text-xs text-hydia-success font-medium">Protégé</span>
                          </div>
                        )}
                        {getPermissionBadge(item.permissions)}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-xs">👤</span>
                          </div>
                          <span>{item.owner}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>{item.accessCount} accès</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Expire le {formatDate(item.expiresAt)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Partagé avec {item.sharedWith.length} personne{item.sharedWith.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.sharedWith.slice(0, 4).map((email, index) => (
                            <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                              {email.split('@')[0]}
                            </Badge>
                          ))}
                          {item.sharedWith.length > 4 && (
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              +{item.sharedWith.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/30">
                        <Clock className="h-3 w-3" />
                        <span>Dernier accès: {formatDateTime(item.lastAccess)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <HydiaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => generateShareLink(item)}
                      className="hover-scale"
                    >
                      <Link className="h-4 w-4" />
                    </HydiaButton>
                    <HydiaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                      className="hover-scale"
                    >
                      <Settings className="h-4 w-4" />
                    </HydiaButton>
                    <HydiaButton
                      variant="ghost"
                      size="sm"
                      className="text-hydia-danger hover:text-hydia-danger hover-scale"
                      onClick={() => revokeAccess(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </HydiaButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Item Settings Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Paramètres de partage</DialogTitle>
              <DialogDescription>{selectedItem.name}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Partagé avec</Label>
                <div className="space-y-1">
                  {selectedItem.sharedWith.map((email: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{email}</span>
                      <HydiaButton variant="ghost" size="sm" className="text-hydia-danger">
                        <Trash2 className="h-3 w-3" />
                      </HydiaButton>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Permissions</Label>
                <Select defaultValue={selectedItem.permissions}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Visualisation</SelectItem>
                    <SelectItem value="read">Lecture</SelectItem>
                    <SelectItem value="comment">Commentaires</SelectItem>
                    <SelectItem value="edit">Modification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Date d'expiration</Label>
                <Input type="date" defaultValue={selectedItem.expiresAt} />
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>Lien de partage:</span>
                  <HydiaButton
                    variant="ghost"
                    size="sm"
                    onClick={() => generateShareLink(selectedItem)}
                  >
                    <Copy className="h-3 w-3" />
                  </HydiaButton>
                </div>
                <code className="text-xs text-muted-foreground break-all">
                  https://hydia.app/shared/{selectedItem.id}
                </code>
              </div>
            </div>
            
            <DialogFooter>
              <HydiaButton variant="outline" onClick={() => setSelectedItem(null)}>
                Fermer
              </HydiaButton>
              <HydiaButton variant="primary">
                Sauvegarder
              </HydiaButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}