import { Settings as SettingsIcon, Globe, Bell, Palette, Shield, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HydiaButton } from "@/components/ui/hydia-button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const modules = [
  { name: "Audit complet", description: "Enregistrement de toutes les actions utilisateur", enabled: true },
  { name: "Export de données", description: "Autoriser l'export CSV/JSON des données", enabled: true },
  { name: "Partage externe", description: "Partage de fichiers avec des utilisateurs externes", enabled: false },
  { name: "Notifications email", description: "Alertes par email pour les événements critiques", enabled: true }
]

const globalSettings = [
  { category: "Sécurité", settings: [
    { name: "Session timeout", value: "4 heures", type: "select" },
    { name: "Tentatives de connexion max", value: "5", type: "select" },
    { name: "Force HTTPS", value: true, type: "switch" }
  ]},
  { category: "Interface", settings: [
    { name: "Thème par défaut", value: "Sombre", type: "select" },
    { name: "Langue par défaut", value: "Français", type: "select" },
    { name: "Animations", value: true, type: "switch" }
  ]}
]

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground">Paramètres globaux et préférences de l'application</p>
        </div>
        <HydiaButton variant="primary">
          <Download className="h-4 w-4" />
          Exporter config
        </HydiaButton>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Modules actifs</p>
                <p className="text-2xl font-bold">3/4</p>
              </div>
              <SettingsIcon className="h-8 w-8 text-hydia-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilisateurs connectés</p>
                <p className="text-2xl font-bold">127</p>
              </div>
              <Globe className="h-8 w-8 text-hydia-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notifications</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Bell className="h-8 w-8 text-hydia-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sécurité</p>
                <p className="text-2xl font-bold">100%</p>
              </div>
              <Shield className="h-8 w-8 text-hydia-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Gestion des modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modules.map((module, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border/30 rounded-lg">
                <div>
                  <h3 className="font-semibold">{module.name}</h3>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={module.enabled ? 'default' : 'secondary'}>
                    {module.enabled ? 'Actif' : 'Inactif'}
                  </Badge>
                  <Switch checked={module.enabled} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {globalSettings.map((category, index) => (
          <Card key={index} className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category.settings.map((setting, settingIndex) => (
                  <div key={settingIndex} className="flex items-center justify-between">
                    <span className="font-medium">{setting.name}</span>
                    {setting.type === 'switch' ? (
                      <Switch checked={setting.value as boolean} />
                    ) : (
                      <Select value={setting.value as string}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={setting.value as string}>{setting.value}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}