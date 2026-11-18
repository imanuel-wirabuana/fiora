import { useTranslation } from "react-i18next"
import { FormDrawer } from "@/components/FormDrawer"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface JournalFormSectionProps {
  isOpen: boolean
  onClose: () => void
  title: string
  setTitle: (value: string) => void
  onSave: () => Promise<boolean>
  isSaving: boolean
}

export function JournalFormSection({
  isOpen,
  onClose,
  title,
  setTitle,
  onSave,
  isSaving,
}: JournalFormSectionProps) {
  const { t } = useTranslation("journal")

  return (
    <FormDrawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={t("form.title")}
      description={t("form.description")}
      submitLabel={t("form.submit")}
      successLabel={t("form.success")}
      isPending={isSaving}
      submitDisabled={!title.trim()}
      onSubmit={onSave}
    >
      <Field className="gap-1.5">
        <FieldLabel className="text-[11px] font-medium text-muted-foreground">
          {t("form.titleLabel")}
        </FieldLabel>
        <Input
          type="text"
          placeholder={t("form.titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          autoFocus
          className="h-11 rounded-2xl text-xs"
        />
      </Field>
    </FormDrawer>
  )
}
