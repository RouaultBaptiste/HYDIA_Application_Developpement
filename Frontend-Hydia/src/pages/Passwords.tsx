import { useState, useEffect } from "react"
import { Search, Plus, Key, Eye, EyeOff, Copy, Edit, Trash2, Star, Shield, Globe, Building, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HydiaButton } from "@/components/ui/hydia-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CategorySelector } from "@/components/ui/category-selector"
import { useToast } from "@/hooks/use-toast"
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle"
import { usePasswords } from "@/hooks/usePasswords"
import { useAuth } from "@/hooks/useAuth"
import { PasswordDTO } from "@/lib/passwordApi"

// Fonction pour calculer la force du mot de passe
const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (!password) return 'weak';
  
  // Critères de force
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(password);
  const isLongEnough = password.length >= 8;
  
  // Calcul du score
  let score = 0;
  if (hasLowerCase) score++;
  if (hasUpperCase) score++;
  if (hasNumbers) score++;
  if (hasSpecialChars) score++;
  if (isLongEnough) score++;
  
  // Détermination de la force
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};

// Fonction pour formater la date
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR');
};

export default function Passwords() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [newPassword, setNewPassword] = useState({
    title: "",
    username: "",
    password: "",
    url: "",
    notes: "",
    categoryId: "",
    favorite: false
  })
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const { toast } = useToast()
  const { user } = useAuth()
  const { 
    passwords, 
    categories, 
    loading, 
    error, 
    createPassword, 
    updatePassword, 
    deletePassword, 
    searchPasswords, 
    generatePassword, 
    createCategory 
  } = usePasswords()

  // Gérer la création d'une catégorie
  const handleCreateCategory = async (name: string) => {
    if (!user?.id) return;
    
    const result = await createCategory(name);
    if (result) {
      toast({
        title: "Catégorie créée",
        description: `La catégorie ${name} a été créée avec succès.`
      });
    }
  }

  // Gérer la génération d'un mot de passe
  const handleGeneratePassword = async () => {
    if (!user?.id) return;
    
    const options = {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true
    };
    
    const password = await generatePassword(options);
    if (password) {
      setGeneratedPassword(password);
      setNewPassword(prev => ({ ...prev, password }));
    }
  }

  // Gérer l'ajout d'un mot de passe
  const handleAddPassword = async () => {
    if (!user?.id) return;
    
    if (!newPassword.title || !newPassword.username || !newPassword.password) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    const result = await createPassword({
      ...newPassword,
      strength: calculatePasswordStrength(newPassword.password)
    });

    if (result) {
      toast({
        title: "Mot de passe ajouté",
        description: `Le mot de passe pour ${newPassword.title} a été ajouté avec succès.`
      });

      // Réinitialiser le formulaire
      setNewPassword({
        title: "",
        username: "",
        password: "",
        url: "",
        notes: "",
        categoryId: "",
        favorite: false
      });
      setIsAddDialogOpen(false);
    }
  }
  
  // Gérer la suppression d'un mot de passe
  const handleDeletePassword = async (passwordId: string) => {
    if (!user?.id) return;
    
    if (confirm("Êtes-vous sûr de vouloir supprimer ce mot de passe ?")) {
      const success = await deletePassword(passwordId);
      if (success) {
        toast({
          title: "Mot de passe supprimé",
          description: "Le mot de passe a été supprimé avec succès."
        });
      }
    }
  }
  
  // Gérer la recherche de mots de passe
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    await searchPasswords(searchQuery);
  }
  
  // Gérer la copie d'un mot de passe
  const handleCopyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast({
      title: "Copié",
      description: "Mot de passe copié dans le presse-papier."
    });
  }
  
  // Gérer la visibilité d'un mot de passe
  const togglePasswordVisibility = (passwordId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [passwordId]: !prev[passwordId]
    }));
  }

  // Charger les données au montage du composant
  useEffect(() => {
    if (user?.id) {
      // Les données seront chargées automatiquement par le hook usePasswords
    }
  }, [user?.id]);

  // Filtrer les mots de passe par catégorie et recherche
  const filteredPasswords = Array.isArray(passwords) ? passwords.filter(password => {
    const matchesCategory = selectedCategory === "all" || password.categoryId === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      password.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      password.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      password.url?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) : [];

  // Formater une date pour l'affichage
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      year: '2-digit'
    });
  }

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "strong": return "text-hydia-success"
      case "medium": return "text-hydia-warning"
      case "weak": return "text-hydia-danger"
      default: return "text-muted-foreground"
    }
  }

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case "strong": return <Badge className="bg-hydia-success/10 text-hydia-success border-hydia-success/20">Fort</Badge>
      case "medium": return <Badge className="bg-hydia-warning/10 text-hydia-warning border-hydia-warning/20">Moyen</Badge>
      case "weak": return <Badge className="bg-hydia-danger/10 text-hydia-danger border-hydia-danger/20">Faible</Badge>
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestionnaire de mots de passe</h1>
          <p className="text-muted-foreground">Gérez et sécurisez tous vos mots de passe en un seul endroit</p>
        </div>
        <Drawer open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DrawerTrigger asChild>
            <HydiaButton variant="primary" className="animate-fade-in">
              <Plus className="h-4 w-4" />
              Nouveau mot de passe
            </HydiaButton>
          </DrawerTrigger>
          <DrawerContent side="right" className="animate-slide-in-right">
            <DrawerHeader>
              <DrawerTitle>Ajouter un nouveau mot de passe</DrawerTitle>
              <DrawerDescription>Enregistrez un nouveau mot de passe de manière sécurisée</DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 px-4 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="service-name">Nom du service</Label>
                <Input 
                  id="service-name" 
                  value={newPassword.title}
                  onChange={(e) => setNewPassword(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Gmail, LinkedIn..." 
                  className="transition-all focus:scale-[1.02]" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email / Identifiant</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={newPassword.username}
                  onChange={(e) => setNewPassword(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="votre@email.com" 
                  className="transition-all focus:scale-[1.02]" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Site web</Label>
                <Input 
                  id="website" 
                  value={newPassword.url}
                  onChange={(e) => setNewPassword(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com" 
                  className="transition-all focus:scale-[1.02]" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={newPassword.password}
                  onChange={(e) => setNewPassword(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••••••" 
                  className="transition-all focus:scale-[1.02]" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Catégorie</Label>
                <CategorySelector
                  categories={categories.map(cat => ({ id: cat.id, name: cat.name, color: "#3B82F6", key: cat.id }))}
                  selectedCategory={newPassword.categoryId}
                  onCategorySelect={(categoryId) => setNewPassword(prev => ({ ...prev, categoryId }))}
                  onCategoryCreate={handleCreateCategory}
                  placeholder="Choisir une catégorie..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea 
                  id="notes" 
                  value={newPassword.notes}
                  onChange={(e) => setNewPassword(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informations supplémentaires..." 
                  className="transition-all focus:scale-[1.02]" 
                />
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="favorite" 
                  checked={newPassword.favorite}
                  onChange={(e) => setNewPassword(prev => ({ ...prev, favorite: e.target.checked }))}
                  className="rounded" 
                />
                <Label htmlFor="favorite" className="text-sm">Ajouter aux favoris</Label>
              </div>
            </div>
            <DrawerFooter>
              <HydiaButton 
                variant="primary" 
                className="hover-scale"
                onClick={handleAddPassword}
                disabled={!newPassword.title.trim() || !newPassword.username.trim() || !newPassword.password.trim()}
              >
                <Shield className="h-4 w-4" />
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
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un mot de passe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous ({Array.isArray(passwords) ? passwords.length : 0})</SelectItem>
            {Array.isArray(categories) ? categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name} ({Array.isArray(passwords) ? passwords.filter(p => p.categoryId === category.id).length : 0})
              </SelectItem>
            )) : null}
          </SelectContent>
        </Select>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Password Content */}
      {viewMode === "grid" ? (
        <div className="grid gap-4">
          {filteredPasswords.map((password) => (
            <Card key={password.id} className="bg-gradient-card border-border/50 hover:shadow-card transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <Key className="h-6 w-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{password.title}</h3>
                        {password.favorite && <Star className="h-4 w-4 text-hydia-warning fill-current" />}
                        {getStrengthBadge(password.strength || 'medium')}
                      </div>
                      <p className="text-sm text-muted-foreground">{password.username}</p>
                      <p className="text-xs text-muted-foreground">{password.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-muted rounded-md p-2 font-mono text-sm">
                      <span className="min-w-0">
                        {showPasswords[password.id] ? password.password : "••••••••••••"}
                      </span>
                      <HydiaButton
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => togglePasswordVisibility(password.id)}
                      >
                        {showPasswords[password.id] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </HydiaButton>
                      <HydiaButton
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyPassword(password.id)}
                      >
                        <Copy className="h-3 w-3" />
                      </HydiaButton>
                    </div>
                    
                    <HydiaButton variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </HydiaButton>
                    <HydiaButton 
                      variant="ghost" 
                      size="icon" 
                      className="text-hydia-danger hover:text-hydia-danger"
                      onClick={() => handleDeletePassword(password.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </HydiaButton>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Dernière modification: {formatDate(password.updatedAt)}</span>
                    <span className={`font-medium ${getStrengthColor(password.strength || 'medium')}`}>
                      Force: {password.strength === 'strong' ? 'Fort' : password.strength === 'medium' ? 'Moyen' : 'Faible'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-card border-border/50 overflow-hidden">
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/30 text-sm font-medium text-muted-foreground bg-muted/20">
              <div className="col-span-3">Site internet</div>
              <div className="col-span-3">Identifiant</div>
              <div className="col-span-2">Mot de passe</div>
              <div className="col-span-2">Catégorie</div>
              <div className="col-span-1">Dernière utilisation</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border/20">
              {filteredPasswords.map((password) => (
                <div key={password.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-accent/30 transition-all duration-200 group">
                  {/* Site */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <Key className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{password.url}</p>
                        {password.favorite && <Star className="h-4 w-4 text-hydia-warning fill-current flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{password.title}</p>
                    </div>
                  </div>
                  
                  {/* Identifiant */}
                  <div className="col-span-3">
                    <p className="text-sm font-medium truncate">{password.username}</p>
                  </div>
                  
                  {/* Mot de passe */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 max-w-full">
                      <div className="flex items-center gap-1 bg-muted/50 rounded-md px-3 py-2 font-mono text-sm min-w-0 flex-1">
                        <span className="truncate text-hydia-primary">
                          {showPasswords[password.id] ? password.password : "••••••••••••"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <HydiaButton
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => togglePasswordVisibility(password.id)}
                        >
                          {showPasswords[password.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </HydiaButton>
                        <HydiaButton
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyPassword(password.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </HydiaButton>
                      </div>
                    </div>
                  </div>
                  
                  {/* Catégorie */}
                  <div className="col-span-2">
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="text-xs w-fit">
                        {categories.find(cat => cat.id === password.categoryId)?.name || "Non catégorisé"}
                      </Badge>
                      {getStrengthBadge(password.strength || 'medium')}
                    </div>
                  </div>
                  
                  {/* Dernière utilisation */}
                  <div className="col-span-1">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(password.updatedAt)}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="col-span-1 flex justify-center">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <HydiaButton variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </HydiaButton>
                      <HydiaButton 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-hydia-danger hover:text-hydia-danger"
                        onClick={() => handleDeletePassword(password.id)}
                      >
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

      {filteredPasswords.length === 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-12 text-center">
            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun mot de passe trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Aucun résultat pour votre recherche" : "Commencez par ajouter votre premier mot de passe"}
            </p>
            <HydiaButton variant="primary" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Ajouter un mot de passe
            </HydiaButton>
          </CardContent>
        </Card>
      )}
    </div>
  )
}