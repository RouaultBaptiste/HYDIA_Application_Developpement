import { useState } from "react"
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  BarChart3,
  FileText,
  Video,
  Play,
  CheckCircle,
  Clock,
  Download,
  Eye
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Formation = {
  id: string
  title: string
  description: string
  type: 'video' | 'document' | 'interactive'
  duration: string
  category: string
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé'
  createdAt: string
  isActive: boolean
  enrolledUsers: number
  completionRate: number
  averageScore: number
}

type UserProgress = {
  id: string
  userId: string
  userName: string
  userEmail: string
  formationTitle: string
  progress: number
  status: 'not_started' | 'in_progress' | 'completed'
  score?: number
  completedAt?: string
  lastActivity: string
}

const mockFormations: Formation[] = [
  {
    id: '1',
    title: 'Fondamentaux de la cybersécurité',
    description: 'Formation complète sur les bases de la sécurité informatique',
    type: 'video',
    duration: '45 min',
    category: 'Sécurité',
    difficulty: 'Débutant',
    createdAt: '2024-01-10',
    isActive: true,
    enrolledUsers: 156,
    completionRate: 78,
    averageScore: 85
  },
  {
    id: '2',
    title: 'Gestion des mots de passe',
    description: 'Bonnes pratiques pour la création et gestion de mots de passe',
    type: 'interactive',
    duration: '30 min',
    category: 'Authentification',
    difficulty: 'Débutant',
    createdAt: '2024-01-15',
    isActive: true,
    enrolledUsers: 203,
    completionRate: 92,
    averageScore: 88
  },
  {
    id: '3',
    title: 'Conformité RGPD',
    description: 'Comprendre et appliquer les réglementations RGPD',
    type: 'document',
    duration: '60 min',
    category: 'Conformité',
    difficulty: 'Intermédiaire',
    createdAt: '2024-01-20',
    isActive: false,
    enrolledUsers: 89,
    completionRate: 65,
    averageScore: 79
  }
]

const mockUserProgress: UserProgress[] = [
  {
    id: '1',
    userId: 'u1',
    userName: 'Marie Dupont',
    userEmail: 'marie.dupont@company.com',
    formationTitle: 'Fondamentaux de la cybersécurité',
    progress: 100,
    status: 'completed',
    score: 92,
    completedAt: '2024-01-25',
    lastActivity: '2024-01-25'
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'Pierre Martin',
    userEmail: 'pierre.martin@company.com',
    formationTitle: 'Gestion des mots de passe',
    progress: 65,
    status: 'in_progress',
    lastActivity: '2024-01-30'
  },
  {
    id: '3',
    userId: 'u3',
    userName: 'Sophie Dubois',
    userEmail: 'sophie.dubois@company.com',
    formationTitle: 'Conformité RGPD',
    progress: 0,
    status: 'not_started',
    lastActivity: '2024-01-28'
  }
]

export default function AdminFormations() {
  const [formations] = useState<Formation[]>(mockFormations)
  const [userProgress] = useState<UserProgress[]>(mockUserProgress)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredFormations = formations.filter(formation =>
    formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formation.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalFormations = formations.length
  const activeFormations = formations.filter(f => f.isActive).length
  const totalEnrollments = formations.reduce((acc, f) => acc + f.enrolledUsers, 0)
  const averageCompletion = Math.round(
    formations.reduce((acc, f) => acc + f.completionRate, 0) / formations.length
  )

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

  const getStatusIcon = (status: UserProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-hydia-success" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-hydia-warning" />
      default:
        return <BookOpen className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des formations</h1>
          <p className="text-muted-foreground">
            Créez et gérez les formations de sécurité pour vos équipes
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle formation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle formation</DialogTitle>
              <DialogDescription>
                Ajoutez une nouvelle formation de sécurité pour vos équipes
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Titre
                </Label>
                <Input id="title" className="col-span-3" />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea id="description" className="col-span-3" />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Vidéo</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="interactive">Interactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Durée
                </Label>
                <Input id="duration" placeholder="ex: 30 min" className="col-span-3" />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="difficulty" className="text-right">
                  Difficulté
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner une difficulté" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Débutant">Débutant</SelectItem>
                    <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                    <SelectItem value="Avancé">Avancé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                Créer la formation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total formations</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFormations}</div>
            <p className="text-xs text-muted-foreground">
              {activeFormations} actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inscriptions totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              Tous utilisateurs confondus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de completion</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCompletion}%</div>
            <p className="text-xs text-muted-foreground">
              Moyenne des formations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84%</div>
            <p className="text-xs text-muted-foreground">
              Toutes formations confondues
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="formations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="formations">Formations</TabsTrigger>
          <TabsTrigger value="progress">Progression utilisateurs</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
        </TabsList>

        {/* Onglet Formations */}
        <TabsContent value="formations" className="space-y-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Rechercher une formation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Inscrits</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Score moyen</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFormations.map((formation) => (
                  <TableRow key={formation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formation.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {formation.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(formation.type)}
                        <Badge variant="outline">{formation.difficulty}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{formation.duration}</TableCell>
                    <TableCell>{formation.enrolledUsers}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={formation.completionRate} className="w-16 h-2" />
                        <span className="text-sm">{formation.completionRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{formation.averageScore}%</TableCell>
                    <TableCell>
                      <Badge variant={formation.isActive ? 'default' : 'secondary'}>
                        {formation.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Onglet Progression */}
        <TabsContent value="progress" className="space-y-6">
          <div className="flex items-center justify-between">
            <Input
              placeholder="Rechercher un utilisateur..."
              className="max-w-sm"
            />
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Dernière activité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userProgress.map((progress) => (
                  <TableRow key={progress.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{progress.userName}</div>
                        <div className="text-sm text-muted-foreground">
                          {progress.userEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{progress.formationTitle}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress.progress} className="w-16 h-2" />
                        <span className="text-sm">{progress.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(progress.status)}
                        <span className="text-sm">
                          {progress.status === 'completed' ? 'Terminée' :
                           progress.status === 'in_progress' ? 'En cours' : 'Non commencée'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {progress.score ? `${progress.score}%` : '-'}
                    </TableCell>
                    <TableCell>{progress.lastActivity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Onglet Analytiques */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Formations les plus populaires</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formations
                  .sort((a, b) => b.enrolledUsers - a.enrolledUsers)
                  .slice(0, 3)
                  .map((formation) => (
                    <div key={formation.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{formation.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {formation.enrolledUsers} inscrits
                        </div>
                      </div>
                      <Progress value={(formation.enrolledUsers / 250) * 100} className="w-16 h-2" />
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taux de réussite par formation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formations.map((formation) => (
                  <div key={formation.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{formation.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Score moyen: {formation.averageScore}%
                      </div>
                    </div>
                    <Progress value={formation.completionRate} className="w-16 h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}