import { Shield, Lock, Users, FileText, Settings, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HydiaButton } from "@/components/ui/hydia-button"
import { Switch } from "@/components/ui/switch"

const policies = [
  { 
    name: "Politique de mots de passe", 
    description: "Complexité minimale, renouvellement obligatoire",
    status: "active",
    rules: ["8 caractères minimum", "Majuscules et minuscules", "Chiffres obligatoires", "Caractères spéciaux"]
  },
  { 
    name: "Authentification à deux facteurs", 
    description: "2FA obligatoire pour les administrateurs",
    status: "active",
    rules: ["Obligatoire pour admin", "Recommandée pour utilisateurs", "SMS ou app authenticator"]
  },
  { 
    name: "Politique de partage", 
    description: "Règles de partage et d'expiration des liens",
    status: "active",
    rules: ["Expiration max 30 jours", "Audit des téléchargements", "Limitation d'accès par IP"]
  }
]

const rlsRules = [
  { table: "users", description: "Accès aux données utilisateur selon le rôle", enabled: true },
  { table: "documents", description: "Visibilité des documents selon les permissions", enabled: true },
  { table: "passwords", description: "Accès aux mots de passe par propriétaire uniquement", enabled: true },
  { table: "audit_logs", description: "Logs visibles par les administrateurs uniquement", enabled: true }
]

export default function Policies() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Politiques de sécurité</h1>
          <p className="text-muted-foreground">Configuration des règles et politiques d'accès</p>
        </div>
        <HydiaButton variant="primary">
          <Settings className="h-4 w-4" />
          Modifier
        </HydiaButton>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Politiques actives</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Shield className="h-8 w-8 text-hydia-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conformité</p>
                <p className="text-2xl font-bold">100%</p>
              </div>
              <Check className="h-8 w-8 text-hydia-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Règles RLS</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <Lock className="h-8 w-8 text-hydia-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Politiques de sécurité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {policies.map((policy, index) => (
              <div key={index} className="p-4 border border-border/30 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{policy.name}</h3>
                    <p className="text-sm text-muted-foreground">{policy.description}</p>
                  </div>
                  <Badge variant="default">Actif</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {policy.rules.map((rule, ruleIndex) => (
                    <div key={ruleIndex} className="flex items-center gap-2 text-sm">
                      <Check className="h-3 w-3 text-hydia-success" />
                      {rule}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Règles RLS (Row Level Security)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rlsRules.map((rule, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border/30 rounded-lg">
                <div>
                  <h3 className="font-medium">{rule.table}</h3>
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                </div>
                <Switch checked={rule.enabled} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}