import { useState, useEffect } from "react"
import { Search, Plus, StickyNote, Tag, Edit, Trash2, Star, Calendar, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HydiaButton } from "@/components/ui/hydia-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CategorySelector } from "@/components/ui/category-selector"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { NotesAPI, type NoteDTO } from "@/lib/api"

const categories = [
  { id: "meeting", name: "Réunions", color: "#3B82F6" },
  { id: "project", name: "Projets", color: "#10B981" },
  { id: "personal", name: "Personnel", color: "#F59E0B" },
  { id: "todo", name: "À faire", color: "#EF4444" },
  { id: "ideas", name: "Idées", color: "#8B5CF6" }
]

const noteTags = [
  { id: "all", label: "Toutes", count: 234 },
  { id: "meeting", label: "Réunions", count: 89 },
  { id: "project", label: "Projets", count: 76 },
  { id: "personal", label: "Personnel", count: 45 },
  { id: "todo", label: "À faire", count: 24 }
]

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  encrypted: boolean
  favorite: boolean
  lastModified: string
  version: number
  author: string
}

const INITIAL_NOTES: Note[] = [
  {
    id: "1",
    title: "Réunion équipe produit - Q1 2024",
    content: "## Points abordés\n\n- Roadmap produit pour Q1\n- Budget alloué : 150k€\n- Nouvelles embauches prévues\n- Timeline des releases\n\n### Actions :\n\n- [ ] Finaliser les specs techniques\n- [ ] Planifier les entretiens\n- [x] Présenter le budget au COMEX",
    tags: ["meeting", "product", "q1"],
    encrypted: true,
    favorite: true,
    lastModified: "2024-03-20T10:30:00",
    version: 3,
    author: "Marie Dupont"
  },
  {
    id: "2",
    title: "Projet Migration Cloud",
    content: "## Objectifs\n\nMigration de l'infrastructure vers AWS d'ici fin Q2.\n\n### Étapes :\n\n1. **Audit infrastructure actuelle** ✅\n2. **Choix architecture cible** 🔄\n3. **Migration base de données**\n4. **Tests & validation**\n5. **Go-live**\n\n> ⚠️ **Attention** : Prévoir une fenêtre de maintenance de 4h",
    tags: ["project", "cloud", "aws"],
    encrypted: true,
    favorite: false,
    lastModified: "2024-03-19T15:45:00",
    version: 8,
    author: "Jean Martin"
  },
  {
    id: "3",
    title: "Idées amélioration UX",
    content: "## Feedbacks utilisateurs\n\n### Points d'amélioration :\n\n- Simplifier le processus d'onboarding\n- Améliorer la recherche globale\n- Optimiser le temps de chargement\n- Ajouter un mode sombre\n\n### Prochaines étapes :\n\n- Wireframes des nouvelles pages\n- Tests utilisateurs\n- Priorisation avec l'équipe produit",
    tags: ["ux", "feedback", "product"],
    encrypted: false,
    favorite: true,
    lastModified: "2024-03-18T09:15:00",
    version: 2,
    author: "Sophie Bernard"
  },
  {
    id: "4",
    title: "Liste des courses",
    content: "## Courses de la semaine\n\n### Alimentaire :\n\n- [ ] Pain\n- [ ] Lait\n- [ ] Fruits\n- [ ] Légumes\n- [x] Pâtes\n\n### Maison :\n\n- [ ] Produits d'entretien\n- [ ] Ampoules LED\n- [x] Piles",
    tags: ["personal", "todo"],
    encrypted: false,
    favorite: false,
    lastModified: "2024-03-17T20:00:00",
    version: 1,
    author: "Marie Dupont"
  }
]

export default function Notes() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [noteCategories, setNoteCategories] = useState(categories)
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES)
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    categoryId: "",
    encrypted: false,
    favorite: false
  })
  const { toast } = useToast()
  const organizationId = (import.meta as any).env?.VITE_ORG_ID || "demo"

  // Fetch notes from backend if API URL is configured
  useEffect(() => {
    const hasApi = Boolean((import.meta as any).env?.VITE_API_URL)
    if (!hasApi) return
    let cancelled = false
    ;(async () => {
      try {
        const response = await NotesAPI.list(organizationId)
        if (cancelled) return
        
        // Handle both direct array and wrapped response
        const list = Array.isArray(response) ? response : (response?.notes || response?.data?.notes || [])
        
        if (!Array.isArray(list)) {
          console.warn('[Notes] API response is not an array:', response)
          return
        }
        
        const mapped: Note[] = list.map((n: NoteDTO) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          tags: n.tags || [],
          encrypted: !!n.encrypted,
          favorite: !!n.favorite,
          lastModified: n.updatedAt || new Date().toISOString(),
          version: n.version ?? 1,
          author: n.author || "Vous",
        }))
        setNotes(mapped)
      } catch (e: any) {
        console.error('[Notes] Error loading notes:', e)
        toast({ title: "Erreur de chargement", description: e?.message || "Impossible de récupérer les notes" })
      }
    })()
    return () => { cancelled = true }
  }, [organizationId, toast])

  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editNote, setEditNote] = useState({
    title: "",
    content: "",
    categoryId: "",
    encrypted: false,
    favorite: false
  })

  const openEdit = (note: Note) => {
    setEditingNote(note)
    setEditNote({
      title: note.title,
      content: note.content,
      categoryId: note.tags[0] || "",
      encrypted: note.encrypted,
      favorite: note.favorite,
    })
  }

  const handleCreateCategory = (name: string) => {
    const newCategory = {
      id: `cat_${Date.now()}`,
      name,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }
    setNoteCategories(prev => [...prev, newCategory])
    toast({
      title: "Catégorie créée",
      description: `La catégorie "${name}" a été ajoutée`,
    })
  }

  const handleCreateNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return
    const now = new Date().toISOString()
    const tempId = `tmp_${Date.now()}`
    const optimistic: Note = {
      id: tempId,
      title: newNote.title.trim(),
      content: newNote.content,
      tags: newNote.categoryId ? [newNote.categoryId] : [],
      encrypted: newNote.encrypted,
      favorite: newNote.favorite,
      lastModified: now,
      version: 1,
      author: "Vous",
    }
    setNotes(prev => [optimistic, ...prev])
    setNewNote({ title: "", content: "", categoryId: "", encrypted: false, favorite: false })
    setIsAddDialogOpen(false)
    toast({ title: "Note créée", description: `La note "${optimistic.title}" a été créée.` })

    const hasApi = Boolean((import.meta as any).env?.VITE_API_URL)
    if (!hasApi) return
    try {
      const created = await NotesAPI.create(organizationId, {
        title: optimistic.title,
        content: optimistic.content,
        tags: optimistic.tags,
        encrypted: optimistic.encrypted,
        favorite: optimistic.favorite,
      })
      setNotes(prev => prev.map(n => n.id === tempId ? {
        ...n,
        id: created.id,
        lastModified: created.updatedAt || now,
        version: created.version ?? 1,
        author: created.author || n.author,
      } : n))
    } catch (e: any) {
      // rollback
      setNotes(prev => prev.filter(n => n.id !== tempId))
      toast({ title: "Création échouée", description: e?.message || "Erreur API" })
    }
  }

  const handleDeleteNote = async (id: string) => {
    const prevNotes = notes
    setNotes(prev => prev.filter(n => n.id !== id))
    if (selectedNote?.id === id) setSelectedNote(null)
    toast({ title: "Note supprimée", description: "La note a été supprimée." })

    const hasApi = Boolean((import.meta as any).env?.VITE_API_URL)
    if (!hasApi) return
    try {
      await NotesAPI.remove(organizationId, id)
    } catch (e: any) {
      // rollback
      setNotes(prevNotes)
      toast({ title: "Suppression échouée", description: e?.message || "Erreur API" })
    }
  }

  const handleToggleFavorite = async (id: string) => {
    const before = notes
    const toggled = before.find(n => n.id === id)
    const nextFav = !toggled?.favorite
    setNotes(prev => prev.map(n => n.id === id ? { ...n, favorite: nextFav } : n))

    const hasApi = Boolean((import.meta as any).env?.VITE_API_URL)
    if (!hasApi) return
    try {
      await NotesAPI.update(organizationId, id, { favorite: nextFav })
    } catch (e: any) {
      setNotes(before)
      toast({ title: "Mise à jour échouée", description: e?.message || "Erreur API" })
    }
  }

  const handleUpdateNote = async () => {
    if (!editingNote) return
    if (!editNote.title.trim() || !editNote.content.trim()) return
    const now = new Date().toISOString()
    const before = notes
    setNotes(prev => prev.map(n => n.id === editingNote.id ? {
      ...n,
      title: editNote.title.trim(),
      content: editNote.content,
      tags: editNote.categoryId ? [editNote.categoryId] : [],
      encrypted: editNote.encrypted,
      favorite: editNote.favorite,
      lastModified: now,
      version: n.version + 1,
    } : n))
    toast({ title: "Note mise à jour", description: `La note "${editNote.title}" a été mise à jour.` })
    setSelectedNote(prev => (prev && prev.id === editingNote.id ? null : prev))
    const currentEditingId = editingNote.id
    setEditingNote(null)

    const hasApi = Boolean((import.meta as any).env?.VITE_API_URL)
    if (!hasApi) return
    try {
      const updated = await NotesAPI.update(organizationId, currentEditingId, {
        title: editNote.title.trim(),
        content: editNote.content,
        tags: editNote.categoryId ? [editNote.categoryId] : [],
        encrypted: editNote.encrypted,
        favorite: editNote.favorite,
      })
      setNotes(prev => prev.map(n => n.id === currentEditingId ? {
        ...n,
        lastModified: updated.updatedAt || now,
        version: updated.version ?? n.version,
        author: updated.author || n.author,
      } : n))
    } catch (e: any) {
      setNotes(before)
      toast({ title: "Mise à jour échouée", description: e?.message || "Erreur API" })
    }
  }

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesTag = selectedTag === "all" || note.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "À l'instant"
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    if (diffInHours < 48) return "Hier"
    return date.toLocaleDateString('fr-FR')
  }

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      meeting: "bg-blue-100 text-blue-800 border-blue-200",
      project: "bg-green-100 text-green-800 border-green-200",
      personal: "bg-purple-100 text-purple-800 border-purple-200",
      todo: "bg-orange-100 text-orange-800 border-orange-200",
      ux: "bg-pink-100 text-pink-800 border-pink-200",
      product: "bg-indigo-100 text-indigo-800 border-indigo-200"
    }
    return colors[tag] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes sécurisées</h1>
          <p className="text-muted-foreground">Créez, organisez et sécurisez vos notes avec support Markdown</p>
        </div>
        <Drawer open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DrawerTrigger asChild>
            <HydiaButton variant="primary" className="animate-fade-in">
              <Plus className="h-4 w-4" />
              Nouvelle note
            </HydiaButton>
          </DrawerTrigger>
          <DrawerContent side="right" className="animate-slide-in-right">
            <DrawerHeader>
              <DrawerTitle>Créer une nouvelle note</DrawerTitle>
              <DrawerDescription>Rédigez votre note avec support Markdown</DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 px-4 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="note-title">Titre de la note</Label>
                <Input 
                  id="note-title" 
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre de votre note..." 
                  className="transition-all focus:scale-[1.02]" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-content">Contenu (Markdown supporté)</Label>
                <Textarea 
                  id="note-content" 
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="# Titre de niveau 1&#10;&#10;Votre contenu ici...&#10;&#10;- Point 1&#10;- Point 2&#10;&#10;**Texte en gras**"
                  className="min-h-[200px] font-mono text-sm transition-all focus:scale-[1.02]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Catégorie</Label>
                <CategorySelector
                  categories={noteCategories}
                  selectedCategory={newNote.categoryId}
                  onCategorySelect={(categoryId) => setNewNote(prev => ({ ...prev, categoryId }))}
                  onCategoryCreate={handleCreateCategory}
                  placeholder="Choisir une catégorie..."
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="encrypt" 
                    checked={newNote.encrypted}
                    onChange={(e) => setNewNote(prev => ({ ...prev, encrypted: e.target.checked }))}
                    className="rounded" 
                  />
                  <Label htmlFor="encrypt" className="text-sm">Chiffrer cette note</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="favorite" 
                    checked={newNote.favorite}
                    onChange={(e) => setNewNote(prev => ({ ...prev, favorite: e.target.checked }))}
                    className="rounded" 
                  />
                  <Label htmlFor="favorite" className="text-sm">Ajouter aux favoris</Label>
                </div>
              </div>
            </div>
            <DrawerFooter>
              <HydiaButton 
                variant="primary" 
                className="hover-scale"
                onClick={handleCreateNote}
                disabled={!newNote.title.trim() || !newNote.content.trim()}
              >
                <StickyNote className="h-4 w-4" />
                Créer la note
              </HydiaButton>
              <DrawerClose asChild>
                <HydiaButton variant="outline">
                  Annuler
                </HydiaButton>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedTag} onValueChange={setSelectedTag}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {noteTags.map(tag => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.label} ({tag.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.map((note) => (
          <Card 
            key={note.id} 
            className="bg-gradient-card border-border/50 hover:shadow-card transition-all duration-200 cursor-pointer"
            onClick={() => setSelectedNote(note)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {note.favorite && <Star className="h-4 w-4 text-hydia-warning fill-current" />}
                    {note.encrypted && <Lock className="h-4 w-4 text-hydia-success" />}
                    <span className="text-xs text-muted-foreground">v{note.version}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground line-clamp-4">
                  {note.content.replace(/[#*`\-\[\]]/g, '').substring(0, 150)}...
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className={`text-xs ${getTagColor(tag)}`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(note.lastModified)}
                  </div>
                  <span>Par {note.author}</span>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <HydiaButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(note) }}>
                    <Edit className="h-3 w-3" />
                  </HydiaButton>
                  <HydiaButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleToggleFavorite(note.id) }}>
                    <Star className={`h-3 w-3 ${note.favorite ? 'text-hydia-warning fill-current' : ''}`} />
                  </HydiaButton>
                  <HydiaButton 
                    variant="ghost" 
                    size="sm" 
                    className="text-hydia-danger hover:text-hydia-danger"
                    onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id) }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </HydiaButton>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-12 text-center">
            <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune note trouvée</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Aucun résultat pour votre recherche" : "Commencez par créer votre première note"}
            </p>
            <HydiaButton variant="primary" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Créer une note
            </HydiaButton>
          </CardContent>
        </Card>
      )}

      {/* Edit Note Drawer */}
      {editingNote && (
        <Drawer open={!!editingNote} onOpenChange={(open) => { if (!open) setEditingNote(null) }}>
          <DrawerContent side="right" className="animate-slide-in-right">
            <DrawerHeader>
              <DrawerTitle>Modifier la note</DrawerTitle>
              <DrawerDescription>Mettez à jour le contenu de votre note</DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 px-4 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="edit-note-title">Titre de la note</Label>
                <Input
                  id="edit-note-title"
                  value={editNote.title}
                  onChange={(e) => setEditNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre de votre note..."
                  className="transition-all focus:scale-[1.02]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-note-content">Contenu (Markdown supporté)</Label>
                <Textarea
                  id="edit-note-content"
                  value={editNote.content}
                  onChange={(e) => setEditNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="# Titre de niveau 1\n\nVotre contenu ici...\n\n- Point 1\n- Point 2\n\n**Texte en gras**"
                  className="min-h-[200px] font-mono text-sm transition-all focus:scale-[1.02]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Catégorie</Label>
                <CategorySelector
                  categories={noteCategories}
                  selectedCategory={editNote.categoryId}
                  onCategorySelect={(categoryId) => setEditNote(prev => ({ ...prev, categoryId }))}
                  onCategoryCreate={handleCreateCategory}
                  placeholder="Choisir une catégorie..."
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-encrypt"
                    checked={editNote.encrypted}
                    onChange={(e) => setEditNote(prev => ({ ...prev, encrypted: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="edit-encrypt" className="text-sm">Chiffrer cette note</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-favorite"
                    checked={editNote.favorite}
                    onChange={(e) => setEditNote(prev => ({ ...prev, favorite: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="edit-favorite" className="text-sm">Ajouter aux favoris</Label>
                </div>
              </div>
            </div>
            <DrawerFooter>
              <HydiaButton
                variant="primary"
                className="hover-scale"
                onClick={handleUpdateNote}
                disabled={!editNote.title.trim() || !editNote.content.trim()}
              >
                <Edit className="h-4 w-4" />
                Enregistrer
              </HydiaButton>
              <DrawerClose asChild>
                <HydiaButton variant="outline">
                  Annuler
                </HydiaButton>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* Note Detail Modal */}
      {selectedNote && (
        <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">{selectedNote.title}</DialogTitle>
                  <DialogDescription className="mt-2">
                    Modifié {formatDate(selectedNote.lastModified)} par {selectedNote.author} • Version {selectedNote.version}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedNote.favorite && <Star className="h-5 w-5 text-hydia-warning fill-current" />}
                  {selectedNote.encrypted && <Lock className="h-5 w-5 text-hydia-success" />}
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1">
                {selectedNote.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className={`text-xs ${getTagColor(tag)}`}>
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="prose prose-sm max-w-none p-4 bg-muted/30 rounded-lg">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedNote.content}
                </ReactMarkdown>
              </div>
            </div>
            
            <DialogFooter>
              <HydiaButton variant="outline" onClick={() => setSelectedNote(null)}>
                Fermer
              </HydiaButton>
              <HydiaButton variant="primary" onClick={() => { if (selectedNote) { openEdit(selectedNote); setSelectedNote(null) } }}>
                <Edit className="h-4 w-4" />
                Modifier
              </HydiaButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}