import { Globe, Lock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

interface JournalFormSectionProps {
  isOpen: boolean
  onClose: () => void
  title: string
  setTitle: (value: string) => void
  body: string
  setBody: (value: string) => void
  isShared: boolean
  setIsShared: (value: boolean) => void
  onSave: (e: React.FormEvent) => void
  isSaving: boolean
}

export function JournalFormSection({
  isOpen,
  onClose,
  title,
  setTitle,
  body,
  setBody,
  isShared,
  setIsShared,
  onSave,
  isSaving,
}: JournalFormSectionProps) {
  if (!isOpen) return null

  return (
    <form
      onSubmit={onSave}
      className="flex flex-col gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs shadow-xs"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-xs text-foreground">
          Write a Journal Entry
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          className="size-6 text-muted-foreground"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <Input
        type="text"
        placeholder="Title (e.g. Our trip to the beach)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={60}
        className="h-8 bg-background text-xs rounded-xl"
        autoFocus
      />

      <Textarea
        placeholder="Write your sweet memory or thoughts..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="bg-background text-xs rounded-xl resize-none"
      />

      {/* Privacy Choice (Default Private) */}
      <div className="flex items-center justify-between rounded-xl bg-background/80 p-2 border border-border/60">
        <div className="flex items-center gap-1.5">
          {isShared ? (
            <Globe className="size-3.5 text-emerald-500" />
          ) : (
            <Lock className="size-3.5 text-amber-500" />
          )}
          <span className="text-xs font-medium text-foreground">
            {isShared ? "Shared with partner" : "Private (only you can see)"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={!isShared ? "default" : "outline"}
            size="xs"
            onClick={() => setIsShared(false)}
            className="h-6 px-2 text-[10px]"
          >
            Private
          </Button>
          <Button
            type="button"
            variant={isShared ? "default" : "outline"}
            size="xs"
            onClick={() => setIsShared(true)}
            className="h-6 px-2 text-[10px]"
          >
            Shared
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="xs"
          disabled={isSaving || !title.trim() || !body.trim()}
          className="gap-1.5"
        >
          {isSaving ? <Spinner className="size-3" /> : "Save Entry"}
        </Button>
      </div>
    </form>
  )
}

