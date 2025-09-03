import { useState } from "react"
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Users, 
  FileText,
  Video,
  Trophy,
  Plus,
  Filter
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Formation = {
  id: string
  title: string
  description: string
  type: 'video' | 'document' | 'interactive'
  duration: string
  progress: number
  status: 'available' | 'in_progress' | 'completed'
  category: string
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé'
  completedAt?: string
  score?: number
}

const mockFormations: Formation[] = [
  {
    id: '1',
    title: 'Fondamentaux de la cybersécurité',
    description: 'Apprenez les bases essentielles de la sécurité informatique en entreprise.',
    type: 'video',
    duration: '45 min',
    progress: 100,
    status: 'completed',
    category: 'Sécurité',
    difficulty: 'Débutant',
    completedAt: '2024-01-15',
    score: 92
  },
  {
    id: '2',
    title: 'Gestion des mots de passe sécurisés',
    description: 'Bonnes pratiques pour créer et gérer des mots de passe robustes.',
    type: 'interactive',
    duration: '30 min',
    progress: 65,
    status: 'in_progress',
    category: 'Authentification',
    difficulty: 'Débutant'
  },
  {
    id: '3',
    title: 'Conformité RGPD et protection des données',
    description: 'Comprendre les obligations légales et les bonnes pratiques RGPD.',
    type: 'document',
    duration: '60 min',
    progress: 0,
    status: 'available',
    category: 'Conformité',
    difficulty: 'Intermédiaire'
  },
  {
    id: '4',
    title: 'Phishing et ingénierie sociale',
    description: 'Reconnaître et éviter les tentatives de phishing et d\'ingénierie sociale.',
    type: 'video',
    duration: '35 min',
    progress: 0,
    status: 'available',
    category: 'Sécurité',
    difficulty: 'Intermédiaire'
  }
]

export default function Formations() {
  const [formations] = useState<Formation[]>(mockFormations)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const filteredFormations = formations.filter(formation => {
    const matchesSearch = formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formation.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || formation.category === filterCategory
    const matchesStatus = filterStatus === "all" || formation.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusIcon = (status: Formation['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-hydia-success" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-hydia-warning" />
      default:
        return <BookOpen className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTypeIcon = (type: Formation['type']) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />
      case 'document':
        return <FileText className="h-4 w-4" />
      case 'interactive':
        return <Play className="h-4 w-4" />
    }
  }

  const getStatusBadgeVariant = (status: Formation['status']) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'in_progress':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const completedCount = formations.filter(f => f.status === 'completed').length
  const inProgressCount = formations.filter(f => f.status === 'in_progress').length
  const averageScore = formations
    .filter(f => f.score)
    .reduce((acc, f) => acc + (f.score || 0), 0) / formations.filter(f => f.score).length

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Formations</h1>
        <p className="text-muted-foreground">
          Développez vos compétences en cybersécurité et conformité
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total formations</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <CheckCircle className="h-4 w-4 text-hydia-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-hydia-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
            <Trophy className="h-4 w-4 text-hydia-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageScore ? Math.round(averageScore) : '-'}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-4">
          <Input
            placeholder="Rechercher une formation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="Sécurité">Sécurité</SelectItem>
              <SelectItem value="Conformité">Conformité</SelectItem>
              <SelectItem value="Authentification">Authentification</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="completed">Terminée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des formations */}
      <Tabs defaultValue="grid" className="space-y-6">
        <TabsList>
          <TabsTrigger value="grid">Vue grille</TabsTrigger>
          <TabsTrigger value="list">Vue liste</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredFormations.map((formation) => (
              <Card key={formation.id} className="hover:shadow-card transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{formation.title}</CardTitle>
                      <CardDescription>{formation.description}</CardDescription>
                    </div>
                    {getStatusIcon(formation.status)}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getTypeIcon(formation.type)}
                    <span className="text-sm text-muted-foreground">{formation.duration}</span>
                    <Badge variant="outline" className="ml-auto">
                      {formation.difficulty}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Badge variant={getStatusBadgeVariant(formation.status)}>
                    {formation.status === 'completed' ? 'Terminée' :
                     formation.status === 'in_progress' ? 'En cours' : 'Disponible'}
                  </Badge>

                  {formation.progress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progression</span>
                        <span>{formation.progress}%</span>
                      </div>
                      <Progress value={formation.progress} className="h-2" />
                    </div>
                  )}

                  {formation.score && (
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="h-4 w-4 text-hydia-primary" />
                      <span>Score : {formation.score}%</span>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    variant={formation.status === 'completed' ? 'outline' : 'default'}
                  >
                    {formation.status === 'completed' ? 'Revoir' : 
                     formation.status === 'in_progress' ? 'Continuer' : 'Commencer'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {filteredFormations.map((formation) => (
            <Card key={formation.id} className="hover:shadow-card transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(formation.status)}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{formation.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {formation.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {getTypeIcon(formation.type)}
                      <span className="text-sm text-muted-foreground">{formation.duration}</span>
                    </div>

                    <Badge variant="outline">{formation.difficulty}</Badge>

                    {formation.progress > 0 && (
                      <div className="w-24">
                        <Progress value={formation.progress} className="h-2" />
                      </div>
                    )}

                    {formation.score && (
                      <div className="flex items-center gap-1 text-sm">
                        <Trophy className="h-4 w-4 text-hydia-primary" />
                        <span>{formation.score}%</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    variant={formation.status === 'completed' ? 'outline' : 'default'}
                    size="sm"
                  >
                    {formation.status === 'completed' ? 'Revoir' : 
                     formation.status === 'in_progress' ? 'Continuer' : 'Commencer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {filteredFormations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune formation trouvée</h3>
            <p className="text-muted-foreground text-center">
              Essayez de modifier vos critères de recherche ou filtres.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}