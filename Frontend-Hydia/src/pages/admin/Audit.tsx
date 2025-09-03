import { useState } from "react"
import { Activity, Shield, AlertTriangle, CheckCircle, Search, Play, Download, FileText, TrendingUp, Users, Database } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HydiaButton } from "@/components/ui/hydia-button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

const vulnerabilities = [
  { id: 1, title: "Politique de mots de passe faible", severity: "high", score: 8.5, description: "Les exigences de complexité sont insuffisantes", category: "Authentification" },
  { id: 2, title: "Groupes AD avec privilèges excessifs", severity: "medium", score: 6.2, description: "3 groupes ont des droits administrateur non nécessaires", category: "Permissions" },
  { id: 3, title: "Utilisateurs inactifs avec accès", severity: "medium", score: 5.8, description: "12 comptes inactifs depuis plus de 90 jours", category: "Gestion utilisateurs" },
  { id: 4, title: "Partages réseau non sécurisés", severity: "low", score: 3.2, description: "2 partages sans restriction d'accès", category: "Réseau" }
]

const auditHistory = [
  { date: "2024-03-20", score: 78, issues: 15, critical: 2, status: "completed" },
  { date: "2024-03-15", score: 75, issues: 18, critical: 3, status: "completed" },
  { date: "2024-03-10", score: 72, issues: 22, critical: 4, status: "completed" }
]

export default function Audit() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const { toast } = useToast()

  const startSecurityScan = async () => {
    setIsScanning(true)
    setScanProgress(0)
    
    // Simulation du scan
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsScanning(false)
          toast({
            title: "Audit terminé",
            description: "Le scan de sécurité a détecté 4 vulnérabilités",
          })
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive text-destructive-foreground'
      case 'medium': return 'bg-hydia-warning text-black'
      case 'low': return 'bg-hydia-success text-white'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit de sécurité</h1>
          <p className="text-muted-foreground">Analysez la sécurité de votre infrastructure AD/Azure</p>
        </div>
        <div className="flex gap-2">
          <HydiaButton variant="outline">
            <Download className="h-4 w-4" />
            Exporter rapport
          </HydiaButton>
          <HydiaButton variant="primary" onClick={startSecurityScan} disabled={isScanning}>
            <Search className="h-4 w-4" />
            {isScanning ? 'Scan en cours...' : 'Lancer audit'}
          </HydiaButton>
        </div>
      </div>

      {isScanning && (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Audit de sécurité en cours...</h3>
                <span className="text-sm text-muted-foreground">{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Analyse des permissions, politiques et configurations AD/Azure
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score de sécurité</p>
                <p className="text-2xl font-bold text-hydia-warning">78/100</p>
              </div>
              <Shield className="h-8 w-8 text-hydia-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vulnérabilités</p>
                <p className="text-2xl font-bold text-destructive">4</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Criticité élevée</p>
                <p className="text-2xl font-bold text-destructive">2</p>
              </div>
              <Activity className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dernier audit</p>
                <p className="text-2xl font-bold">Hier</p>
              </div>
              <CheckCircle className="h-8 w-8 text-hydia-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vulnerabilities" className="w-full">
        <TabsList>
          <TabsTrigger value="vulnerabilities">Vulnérabilités</TabsTrigger>
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="vulnerabilities" className="space-y-4">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Vulnérabilités détectées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vulnerabilities.map((vuln) => (
                  <div key={vuln.id} className="p-4 border border-border/30 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{vuln.title}</h3>
                          <Badge className={getSeverityColor(vuln.severity)}>
                            {vuln.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">Score: {vuln.score}/10</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{vuln.description}</p>
                        <Badge variant="secondary">{vuln.category}</Badge>
                      </div>
                      <HydiaButton variant="outline" size="sm">
                        <FileText className="h-4 w-4" />
                        Détails
                      </HydiaButton>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Recommandations intelligentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-hydia-primary/5 border border-hydia-primary/20 rounded-lg">
                  <h3 className="font-semibold text-hydia-primary mb-2">🔒 Renforcement des mots de passe</h3>
                  <p className="text-sm mb-3">Implémentez une politique de mots de passe plus stricte avec minimum 12 caractères et authentification multi-facteurs obligatoire.</p>
                  <HydiaButton variant="outline" size="sm">Appliquer</HydiaButton>
                </div>
                
                <div className="p-4 bg-hydia-warning/5 border border-hydia-warning/20 rounded-lg">
                  <h3 className="font-semibold text-hydia-warning mb-2">👥 Réorganisation des groupes AD</h3>
                  <p className="text-sm mb-3">Suggestion de nouvelle structure d'OU basée sur l'organisation métier pour une meilleure sécurité.</p>
                  <HydiaButton variant="outline" size="sm">Voir proposition</HydiaButton>
                </div>
                
                <div className="p-4 bg-hydia-success/5 border border-hydia-success/20 rounded-lg">
                  <h3 className="font-semibold text-hydia-success mb-2">🛡️ Nettoyage des permissions</h3>
                  <p className="text-sm mb-3">Identification de 23 permissions obsolètes pouvant être révoquées sans impact métier.</p>
                  <HydiaButton variant="outline" size="sm">Planifier</HydiaButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Historique des audits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditHistory.map((audit, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Audit du {audit.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {audit.issues} problèmes • {audit.critical} critiques
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-hydia-warning">{audit.score}/100</p>
                        <p className="text-xs text-muted-foreground">Score</p>
                      </div>
                      <HydiaButton variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </HydiaButton>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  )
}