import { Shield, AlertTriangle, Activity, Users, Database, TrendingUp, Clock, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HydiaButton } from "@/components/ui/hydia-button"

const criticalAlerts = [
  { type: "Sécurité", message: "3 tentatives de connexion suspectes", severity: "high", time: "Il y a 15min" },
  { type: "Performance", message: "Latence API élevée détectée", severity: "medium", time: "Il y a 1h" },
  { type: "Maintenance", message: "Mise à jour sécurité disponible", severity: "low", time: "Il y a 2h" }
]

const recentActivities = [
  { action: "Configuration LDAP modifiée", user: "admin@entreprise.com", time: "14:30" },
  { action: "Nouvelle politique créée", user: "admin@entreprise.com", time: "14:15" },
  { action: "Audit de sécurité exporté", user: "dsi@entreprise.com", time: "13:45" },
  { action: "Utilisateur suspendu", user: "admin@entreprise.com", time: "13:30" }
]

const systemMetrics = [
  { name: "CPU", value: "45%", status: "normal" },
  { name: "Mémoire", value: "67%", status: "normal" },
  { name: "Stockage", value: "23%", status: "normal" },
  { name: "Réseau", value: "12 Mbps", status: "normal" }
]

export default function DsiDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord DSI</h1>
          <p className="text-muted-foreground">Vue d'ensemble technique et monitoring avancé</p>
        </div>
        <HydiaButton variant="primary">
          <Activity className="h-4 w-4" />
          Rapport complet
        </HydiaButton>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uptime système</p>
                <p className="text-2xl font-bold">99.8%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-hydia-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertes critiques</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-hydia-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilisateurs actifs</p>
                <p className="text-2xl font-bold">847</p>
              </div>
              <Users className="h-8 w-8 text-hydia-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Données traitées</p>
                <p className="text-2xl font-bold">2.4TB</p>
              </div>
              <Database className="h-8 w-8 text-hydia-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-hydia-warning" />
              Alertes critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border/30 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={alert.severity === 'high' ? 'destructive' : 
                                   alert.severity === 'medium' ? 'default' : 'secondary'}>
                        {alert.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{alert.time}</span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${
                    alert.severity === 'high' ? 'bg-destructive' :
                    alert.severity === 'medium' ? 'bg-hydia-warning' : 'bg-hydia-primary'
                  }`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-hydia-primary" />
              Métriques système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{metric.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{metric.value}</span>
                    <div className={`h-2 w-2 rounded-full ${
                      metric.status === 'normal' ? 'bg-hydia-success' : 'bg-hydia-warning'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-hydia-primary" />
            Activité récente des administrateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border/30 rounded-lg">
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">Par {activity.user}</p>
                </div>
                <span className="text-sm text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}