import { ChevronRight, User } from "lucide-react"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { Badge } from "@/components/ui/badge"
import { useRelationship } from "@/hooks/useRelationship"
import { getDefaultAvatar } from "@/lib/relationship"
import { SettingRow } from "./SettingRow"

export function ProfileSection() {
  const { currentMember } = useRelationship()

  if (!currentMember) {
    return null
  }

  const savedName = currentMember.content?.name || ""
  const savedAvatar =
    currentMember.content?.avatar ||
    getDefaultAvatar(currentMember.content?.gender || null)

  return (
    <SettingRow
      href="/setting/profile"
      icon={<User className="size-3.5" />}
      title="Profile"
      description="Avatar, display name, and birth date."
      action={
        <div className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className="max-w-[130px] gap-1.5 px-2 py-0.5 text-[10px] font-medium"
          >
            <AnimatedEmoji
              emoji={savedAvatar}
              size={14}
              replayOnTap={false}
              className="shrink-0"
              fallbackClassName="text-[11px]"
            />
            <span className="truncate">{savedName || "Set profile"}</span>
          </Badge>
          <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      }
    />
  )
}
