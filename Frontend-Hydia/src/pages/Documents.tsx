import { useState } from "react"
import { Search, Plus, FileText, Download, Upload, Eye, Share2, Trash2, Filter, Grid, List } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HydiaButton } from "@/components/ui/hydia-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { CategorySelector } from "@/components/ui/category-selector"
import { useToast } from "@/hooks/use-toast"

const documentTypes = [
  { id: "all", label: "Tous", count: 1247 },
  { id: "pdf", label: "PDF", count: 658 },
  { id: "doc", label: "Documents", count: 234 },
  { id: "img", label: "Images", count: 189 },
  { id: "xls", label: "Tableaux", count: 166 }
]

const categories = [
  { id: "work", name: "Travail", color: "#3B82F6" },
  { id: "personal", name: "Personnel", color: "#10B981" },
  { id: "finance", name: "Finance", color: "#F59E0B" },
  { id: "legal", name: "Juridique", color: "#EF4444" },
  { id: "marketing", name: "Marketing", color: "#8B5CF6" }
]

const documents = [
  {
    id: 1,
    name: "Rapport_Annuel_2024.pdf",
    type: "pdf",
    size: "2.4 MB",
    uploadDate: "2024-03-15",
    lastAccess: "2024-03-20",
    encrypted: true,
    shared: false,
    tags: ["rapport", "2024", "finances"],
    owner: "Marie Dupont",
    categoryId: "finance"
  },
  {
    id: 2,
    name: "Contrat_Prestataire_ABC.docx",
    type: "doc",
    size: "156 KB",
    uploadDate: "2024-03-10",
    lastAccess: "2024-03-18",
    encrypted: true,
    shared: true,
    tags: ["contrat", "juridique"],
    owner: "Jean Martin",
    categoryId: "legal"
  },
  {
    id: 3,
    name: "Budget_Q1_2024.xlsx",
    type: "xls",
    size: "890 KB",
    uploadDate: "2024-03-01",
    lastAccess: "2024-03-19",
    encrypted: true,
    shared: true,
    tags: ["budget", "Q1", "finances"],
    owner: "Sophie Bernard",
    categoryId: "finance"
  },
  {
    id: 4,
    name: "Logo_Entreprise_HD.png",
    type: "img",
    size: "1.2 MB",
    uploadDate: "2024-02-28",
    lastAccess: "2024-03-15",
    encrypted: false,
    shared: false,
    tags: ["logo", "branding"],
    owner: "Design Team",
    categoryId: "marketing"
  }
]

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf": return "🔴"
    case "doc": return "🔵"
    case "xls": return "🟢"
    case "img": return "🟡"
    default: return "📄"
  }
}

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [documentCategories, setDocumentCategories] = useState(categories)
  const [newDocumentCategory, setNewDocumentCategory] = useState("")
  const { toast } = useToast()

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = selectedType === "all" || doc.type === selectedType
    return matchesSearch && matchesType
  })

  const handleDownload = (document: any) => {
    toast({
      title: "Téléchargement",
      description: `Téléchargement de ${document.name} en cours...`,
    })
  }

  const handleShare = (document: any) => {
    toast({
      title: "Partage",
      description: `Lien de partage généré pour ${document.name}`,
    })
  }

  const handleCreateCategory = (name: string) => {
    const newCategory = {
      id: `cat_${Date.now()}`,
      name,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }
    setDocumentCategories(prev => [...prev, newCategory])
    toast({
      title: "Catégorie créée",
      description: `La catégorie "${name}" a été ajoutée`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestionnaire de documents</h1>
          <p className="text-muted-foreground">Stockez, organisez et partagez vos documents en toute sécurité</p>
        </div>
        <div className="flex items-center gap-2">
          <HydiaButton variant="outline">
            <Upload className="h-4 w-4" />
            Importer
          </HydiaButton>
          <HydiaButton 
            variant="primary"
            onClick={() => setIsCreateDrawerOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nouveau document
          </HydiaButton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total documents</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
              <FileText className="h-8 w-8 text-hydia-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chiffrés</p>
                <p className="text-2xl font-bold">1,205</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-hydia-success/20 flex items-center justify-center">
                <span className="text-hydia-success text-lg">🔒</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Partagés</p>
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
                <p className="text-sm font-medium text-muted-foreground">Stockage utilisé</p>
                <p className="text-2xl font-bold">8.9 GB</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-hydia-warning/20 flex items-center justify-center">
                <span className="text-hydia-warning text-lg">💾</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label} ({type.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <HydiaButton
            variant={viewMode === "grid" ? "primary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </HydiaButton>
          <HydiaButton
            variant={viewMode === "list" ? "primary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </HydiaButton>
        </div>
      </div>

      {/* Documents Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="bg-gradient-card border-border/50 hover:shadow-card transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getFileIcon(document.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{document.name}</h3>
                      <p className="text-sm text-muted-foreground">{document.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {document.encrypted && (
                      <Badge className="bg-hydia-success/10 text-hydia-success border-hydia-success/20 text-xs">
                        🔒
                      </Badge>
                    )}
                    {document.shared && (
                      <Badge className="bg-hydia-primary/10 text-hydia-primary border-hydia-primary/20 text-xs">
                        📤
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex flex-wrap gap-1">
                    {document.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Par {document.owner}</p>
                </div>

                <div className="flex items-center gap-2">
                  <HydiaButton variant="ghost" size="sm" onClick={() => handleDownload(document)}>
                    <Download className="h-3 w-3" />
                  </HydiaButton>
                  <HydiaButton variant="ghost" size="sm">
                    <Eye className="h-3 w-3" />
                  </HydiaButton>
                  <HydiaButton variant="ghost" size="sm" onClick={() => handleShare(document)}>
                    <Share2 className="h-3 w-3" />
                  </HydiaButton>
                  <HydiaButton variant="ghost" size="sm" className="text-hydia-danger hover:text-hydia-danger">
                    <Trash2 className="h-3 w-3" />
                  </HydiaButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {filteredDocuments.map((document) => (
                <div key={document.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="text-xl">{getFileIcon(document.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{document.name}</h3>
                          {document.encrypted && <span className="text-hydia-success">🔒</span>}
                          {document.shared && <span className="text-hydia-primary">📤</span>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{document.size}</span>
                          <span>Par {document.owner}</span>
                          <span>Modifié le {new Date(document.uploadDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex gap-1 mt-1">
                          {document.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <HydiaButton variant="ghost" size="sm" onClick={() => handleDownload(document)}>
                        <Download className="h-4 w-4" />
                      </HydiaButton>
                      <HydiaButton variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </HydiaButton>
                      <HydiaButton variant="ghost" size="sm" onClick={() => handleShare(document)}>
                        <Share2 className="h-4 w-4" />
                      </HydiaButton>
                      <HydiaButton variant="ghost" size="sm" className="text-hydia-danger hover:text-hydia-danger">
                        <Trash2 className="h-4 w-4" />
                      </HydiaButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredDocuments.length === 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun document trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Aucun résultat pour votre recherche" : "Commencez par importer votre premier document"}
            </p>
            <HydiaButton variant="primary">
              <Upload className="h-4 w-4" />
              Importer un document
            </HydiaButton>
          </CardContent>
        </Card>
      )}

      {/* Create Document Drawer */}
      <Drawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen}>
        <DrawerContent side="right" className="animate-slide-in-right">
          <DrawerHeader>
            <DrawerTitle>Nouveau Document</DrawerTitle>
          </DrawerHeader>
          <div className="p-6 space-y-6 flex-1">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nom du document</label>
                <Input placeholder="Mon document..." className="animate-fade-in" />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Catégorie</label>
                <CategorySelector
                  categories={documentCategories}
                  selectedCategory={newDocumentCategory}
                  onCategorySelect={setNewDocumentCategory}
                  onCategoryCreate={handleCreateCategory}
                  placeholder="Choisir une catégorie..."
                  className="animate-fade-in"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Fichier</label>
                <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-hydia-primary/50 transition-colors duration-200 animate-fade-in">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Glissez un fichier ici ou cliquez pour parcourir</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t">
              <HydiaButton 
                variant="primary" 
                className="flex-1"
                onClick={() => {
                  toast({
                    title: "Document créé",
                    description: "Le document a été ajouté avec succès",
                  })
                  setIsCreateDrawerOpen(false)
                }}
              >
                Créer le document
              </HydiaButton>
              <HydiaButton 
                variant="outline" 
                onClick={() => setIsCreateDrawerOpen(false)}
              >
                Annuler
              </HydiaButton>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}