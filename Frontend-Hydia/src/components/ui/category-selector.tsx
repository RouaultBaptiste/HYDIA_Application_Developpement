import React, { useState } from "react"
import { Plus, Check } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  color?: string
}

interface CategorySelectorProps {
  categories: Category[]
  selectedCategory?: string
  onCategorySelect: (categoryId: string) => void
  onCategoryCreate: (name: string) => void
  placeholder?: string
  className?: string
}

export function CategorySelector({
  categories,
  selectedCategory,
  onCategorySelect,
  onCategoryCreate,
  placeholder = "Sélectionner une catégorie...",
  className
}: CategorySelectorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      onCategoryCreate(newCategoryName.trim())
      setNewCategoryName("")
      setIsCreating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCreateCategory()
    } else if (e.key === "Escape") {
      setIsCreating(false)
      setNewCategoryName("")
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Select value={selectedCategory} onValueChange={onCategorySelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                {category.color && (
                  <div 
                    className="w-3 h-3 rounded-full border border-border/20" 
                    style={{ backgroundColor: category.color }}
                  />
                )}
                {category.name}
              </div>
            </SelectItem>
          ))}
          <div className="border-t border-border/20 mt-1 pt-1">
            {!isCreating ? (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-hydia-primary hover:bg-accent rounded-sm transition-colors duration-200"
              >
                <Plus className="h-3 w-3" />
                Nouvelle catégorie
              </button>
            ) : (
              <div className="p-2 space-y-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Nom de la catégorie"
                  className="h-8 text-sm"
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                    className="h-7 px-2 text-xs"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreating(false)
                      setNewCategoryName("")
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  )
}