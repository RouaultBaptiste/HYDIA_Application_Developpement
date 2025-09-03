import { Activity, FileText, Key, Users, Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HydiaButton } from "@/components/ui/hydia-button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const securityMetrics = [
  { label: "Mots de passe sécurisés", value: 156, total: 160, percentage: 97.5 },
  { label: "Documents chiffrés", value: 1247, total: 1250, percentage: 99.8 },
  { label: "Accès autorisés", value: 89, total: 92, percentage: 96.7 },
  { label: "Conformité RGPD", value: 100, total: 100, percentage: 100 },
]

const recentActivity = [
  {
    action: "Document partagé",
    user: "Marie Dupont",
    target: "Rapport_Q4_2024.pdf",
    time: "Il y a 5 min",
    status: "success"
  },
  {
    action: "Connexion utilisateur",
    user: "Jean Martin",
    target: "Dashboard",
    time: "Il y a 12 min",
    status: "info"
  },
  {
    action: "Tentative d'accès bloquée",
    user: "Inconnu",
    target: "192.168.1.100",
    time: "Il y a 23 min",
    status: "warning"
  },
  {
    action: "Mot de passe mis à jour",
    user: "Sophie Bernard",
    target: "LinkedIn",
    time: "Il y a 1h",
    status: "success"
  }
]

const quickStats = [
  {
    title: "Utilisateurs actifs",
    value: "847",
    icon: Users,
    trend: "+12%",
    description: "Cette semaine"
  },
  {
    title: "Documents sécurisés",
    value: "1,247",
    icon: FileText,
    trend: "+8%",
    description: "Ce mois"
  },
  {
    title: "Mots de passe gérés",
    value: "3,156",
    icon: Key,
    trend: "+15%",
    description: "Total"
  },
  {
    title: "Niveau de sécurité",
    value: "98.7%",
    icon: Shield,
    trend: "+2.1%",
    description: "Score global"
  }
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord HYDIA</h1>
          <p className="text-muted-foreground">Aperçu de la sécurité et des activités de votre organisation</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-hydia-success text-hydia-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Système sécurisé
          </Badge>
          <HydiaButton variant="primary">
            <Activity className="h-4 w-4" />
            Rapport de sécurité
          </HydiaButton>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.title} className="bg-gradient-card border-border/50 hover:shadow-hydia transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-hydia-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="text-hydia-success font-medium">{stat.trend}</span>
                <span className="ml-1">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Security Metrics */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-hydia-primary" />
              Métriques de sécurité
            </CardTitle>
            <CardDescription>État de conformité et sécurité en temps réel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {securityMetrics.map((metric) => (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{metric.label}</span>
                  <span className="text-muted-foreground">
                    {metric.value}/{metric.total}
                  </span>
                </div>
                <Progress 
                  value={metric.percentage} 
                  className="h-2"
                />
                <div className="text-right text-xs text-hydia-primary font-medium">
                  {metric.percentage}%
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-hydia-primary" />
              Activité récente
            </CardTitle>
            <CardDescription>Dernières actions de sécurité dans votre organisation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-hydia-success' :
                    activity.status === 'warning' ? 'bg-hydia-warning' :
                    'bg-hydia-primary'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user} → {activity.target}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border/30">
              <HydiaButton variant="minimal" className="w-full">
                Voir toute l'activité
              </HydiaButton>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>Accès direct aux fonctionnalités les plus utilisées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HydiaButton variant="professional" className="justify-start h-12">
              <Key className="h-4 w-4" />
              Nouveau mot de passe
            </HydiaButton>
            <HydiaButton variant="professional" className="justify-start h-12">
              <FileText className="h-4 w-4" />
              Importer document
            </HydiaButton>
            <HydiaButton variant="professional" className="justify-start h-12">
              <Users className="h-4 w-4" />
              Gérer les accès
            </HydiaButton>
            <HydiaButton variant="professional" className="justify-start h-12">
              <Shield className="h-4 w-4" />
              Audit sécurité
            </HydiaButton>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}