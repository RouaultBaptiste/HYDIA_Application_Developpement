import { useState } from "react"
import { Server, Database, Shield, Wifi, AlertCircle, CheckCircle, Clock, Activity, Settings, RefreshCw, Play, Upload, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HydiaButton } from "@/components/ui/hydia-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

const services = [
  { name: "Base de données", status: "active", latency: "12ms", uptime: "99.9%" },
  { name: "Authentification", status: "active", latency: "8ms", uptime: "100%" },
  { name: "API Gateway", status: "warning", latency: "45ms", uptime: "98.7%" },
  { name: "Stockage fichiers", status: "active", latency: "15ms", uptime: "99.8%" }
]

const incidents = [
  { date: "2024-03-19", type: "Maintenance", description: "Mise à jour sécurité base de données", status: "resolved" },
  { date: "2024-03-18", type: "Incident", description: "Latence élevée API Gateway", status: "resolved" },
  { date: "2024-03-15", type: "Maintenance", description: "Mise à jour certificats SSL", status: "resolved" }
]

export default function Infrastructure() {
  const [isADConfigOpen, setIsADConfigOpen] = useState(false)
  const [adConfig, setAdConfig] = useState({
    server: "",
    port: "636",
    username: "",
    password: "",
    baseDN: "",
    autoSync: false,
    syncInterval: "24"
  })
  const { toast } = useToast()

  const handleADSync = () => {
    toast({
      title: "Synchronisation lancée",
      description: "La synchronisation avec Active Directory a démarré",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Infrastructure</h1>
          <p className="text-muted-foreground">Synchronisation AD/Azure et monitoring des services</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isADConfigOpen} onOpenChange={setIsADConfigOpen}>
            <DialogTrigger asChild>
              <HydiaButton variant="outline">
                <Settings className="h-4 w-4" />
                Config AD/Azure
              </HydiaButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configuration Active Directory / Azure</DialogTitle>
                <DialogDescription>
                  Configurez la synchronisation avec votre annuaire d'entreprise
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="ad" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ad">Active Directory</TabsTrigger>
                  <TabsTrigger value="azure">Azure AD</TabsTrigger>
                </TabsList>
                <TabsContent value="ad" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="server">Serveur LDAPS</Label>
                      <Input 
                        id="server" 
                        placeholder="ldaps://dc.entreprise.com"
                        value={adConfig.server}
                        onChange={(e) => setAdConfig({...adConfig, server: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port">Port</Label>
                      <Input 
                        id="port" 
                        placeholder="636"
                        value={adConfig.port}
                        onChange={(e) => setAdConfig({...adConfig, port: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Utilisateur de service</Label>
                      <Input 
                        id="username" 
                        placeholder="CN=service,OU=Users,DC=entreprise,DC=com"
                        value={adConfig.username}
                        onChange={(e) => setAdConfig({...adConfig, username: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input 
                        id="password" 
                        type="password"
                        value={adConfig.password}
                        onChange={(e) => setAdConfig({...adConfig, password: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basedn">Base DN</Label>
                    <Input 
                      id="basedn" 
                      placeholder="OU=Users,DC=entreprise,DC=com"
                      value={adConfig.baseDN}
                      onChange={(e) => setAdConfig({...adConfig, baseDN: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Synchronisation automatique</Label>
                      <p className="text-sm text-muted-foreground">Active la synchronisation périodique</p>
                    </div>
                    <Switch 
                      checked={adConfig.autoSync}
                      onCheckedChange={(checked) => setAdConfig({...adConfig, autoSync: checked})}
                    />
                  </div>
                  {adConfig.autoSync && (
                    <div className="space-y-2">
                      <Label htmlFor="interval">Intervalle (heures)</Label>
                      <Select value={adConfig.syncInterval} onValueChange={(value) => setAdConfig({...adConfig, syncInterval: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 heure</SelectItem>
                          <SelectItem value="6">6 heures</SelectItem>
                          <SelectItem value="12">12 heures</SelectItem>
                          <SelectItem value="24">24 heures</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="azure" className="space-y-4">
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Configuration Azure AD</h3>
                    <p className="text-muted-foreground mb-4">
                      Connectez Hydia à votre Azure Active Directory pour synchroniser utilisateurs et groupes
                    </p>
                    <HydiaButton variant="primary">
                      Configurer Azure AD
                    </HydiaButton>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <HydiaButton variant="outline" onClick={() => setIsADConfigOpen(false)}>
                  Annuler
                </HydiaButton>
                <HydiaButton variant="primary">
                  Tester la connexion
                </HydiaButton>
                <HydiaButton variant="primary">
                  Enregistrer
                </HydiaButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <HydiaButton variant="primary" onClick={handleADSync}>
            <RefreshCw className="h-4 w-4" />
            Synchroniser
          </HydiaButton>
        </div>
      </div>

      {/* Section Synchronisation AD */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Synchronisation Active Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dernière synchronisation</span>
                <Badge variant="secondary">Il y a 2h</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Utilisateurs synchronisés</span>
                <span className="font-semibold">847</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Groupes synchronisés</span>
                <span className="font-semibold">23</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Conflits détectés</span>
                <Badge variant="destructive">3</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Nouveaux utilisateurs</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Utilisateurs désactivés</span>
                <span className="font-semibold">5</span>
              </div>
            </div>
            <div className="space-y-2">
              <HydiaButton variant="outline" className="w-full">
                <Download className="h-4 w-4" />
                Exporter le mappage
              </HydiaButton>
              <HydiaButton variant="outline" className="w-full">
                <Upload className="h-4 w-4" />
                Importer mappage
              </HydiaButton>
              <HydiaButton variant="primary" className="w-full" onClick={handleADSync}>
                <Play className="h-4 w-4" />
                Lancer synchronisation
              </HydiaButton>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Services actifs</p>
                <p className="text-2xl font-bold">4/4</p>
              </div>
              <CheckCircle className="h-8 w-8 text-hydia-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uptime moyen</p>
                <p className="text-2xl font-bold">99.6%</p>
              </div>
              <Activity className="h-8 w-8 text-hydia-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Latence moyenne</p>
                <p className="text-2xl font-bold">20ms</p>
              </div>
              <Wifi className="h-8 w-8 text-hydia-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Incidents actifs</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <AlertCircle className="h-8 w-8 text-hydia-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Statut des services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${
                    service.status === 'active' ? 'bg-hydia-success' :
                    service.status === 'warning' ? 'bg-hydia-warning' : 'bg-destructive'
                  }`} />
                  <div>
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">Uptime: {service.uptime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium">{service.latency}</p>
                    <p className="text-xs text-muted-foreground">Latence</p>
                  </div>
                  <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                    {service.status === 'active' ? 'Actif' : 
                     service.status === 'warning' ? 'Attention' : 'Hors ligne'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Historique des incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {incidents.map((incident, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${
                    incident.type === 'Incident' ? 'bg-hydia-warning' : 'bg-hydia-primary'
                  }`} />
                  <div>
                    <p className="font-medium">{incident.description}</p>
                    <p className="text-sm text-muted-foreground">{incident.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">{incident.date}</p>
                  <Badge variant="secondary" className="text-xs">
                    Résolu
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}