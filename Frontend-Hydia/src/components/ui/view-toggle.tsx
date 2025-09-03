import { Grid, List } from "lucide-react"
import { HydiaButton } from "@/components/ui/hydia-button"

export type ViewMode = "grid" | "list"

interface ViewToggleProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  className?: string
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <HydiaButton
        variant={view === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("grid")}
        className="h-8 w-8 p-0"
        title="Vue grille"
      >
        <Grid className="h-4 w-4" />
      </HydiaButton>
      <HydiaButton
        variant={view === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("list")}
        className="h-8 w-8 p-0"
        title="Vue liste"
      >
        <List className="h-4 w-4" />
      </HydiaButton>
    </div>
  )
}