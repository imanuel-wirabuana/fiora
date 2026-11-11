import { Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type PrivacyFilter = "all" | "private" | "shared"

interface JournalFilterSectionProps {
  search: string
  setSearch: (value: string) => void
  privacyFilter: PrivacyFilter
  setPrivacyFilter: (filter: PrivacyFilter) => void
  isCreating: boolean
  setIsCreating: (creating: boolean) => void
}

export function JournalFilterSection({
  search,
  setSearch,
  privacyFilter,
  setPrivacyFilter,
  isCreating,
  setIsCreating,
}: JournalFilterSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Search & New Entry Action */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search journals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 text-xs rounded-xl"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="h-9 gap-1.5 px-3 rounded-xl text-xs"
        >
          <Plus className="size-3.5" />
          New Entry
        </Button>
      </div>

      {/* Visibility Filter Tabs */}
      <div className="flex items-center gap-1.5">
        {(["all", "private", "shared"] as const).map((tab) => (
          <Button
            key={tab}
            variant={privacyFilter === tab ? "default" : "outline"}
            size="xs"
            onClick={() => setPrivacyFilter(tab)}
            className="capitalize rounded-full px-3 text-xs"
          >
            {tab}
          </Button>
        ))}
      </div>
    </div>
  )
}

