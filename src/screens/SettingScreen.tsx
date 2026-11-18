import {
  CalendarHeart,
  ChevronRight,
  Flame,
  Heart,
  HeartCrack,
  LogOut,
  Palette,
  Send,
  ShieldAlert,
  Smile,
  Timer,
  User,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { CustomItem } from "@/components/CustomItem"
import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { useRelationship } from "@/hooks/useRelationship"
import { getAppThemeById } from "@/lib/themes"
import {
  AnniversarySection,
  LanguageSection,
  LocationSharingSection,
  NotificationSection,
  PartnerAliasSection,
  ProfileSection,
  QuizSection,
  SettingRow,
  ThemeSection,
} from "@/components/setting"

export function SettingScreen() {
  const { t } = useTranslation(["setting", "common"])
  const { user, signOutMutation } = useAuth()
  const { moodOptions, nudgeOptions } = useRelationship()
  const { appTheme } = useTheme()
  const activeTheme = getAppThemeById(appTheme)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-3 pb-20 sm:max-w-2xl">
      {/* 1. Self CustomItem Card */}
      <CustomItem
        icon={<User className="size-3.5 text-primary" />}
        title={t("sections.self")}
        contentClassName="flex flex-col gap-0.5"
      >
        <ProfileSection />
        <Separator />
        <ThemeSection />
        <Separator />
        <LanguageSection />
        <Separator />
        <NotificationSection />
        <Separator />
        <SettingRow
          icon={<Timer className="size-3.5" />}
          title={t("moodReminder.title")}
          description={t("moodReminder.description")}
          action={
            <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {t("common:status.comingSoon")}
            </span>
          }
          className="opacity-75"
        />
        <Separator />
        <SettingRow
          href="/setting/app-appearance"
          icon={<Palette className="size-3.5" />}
          title={t("appAppearance.title")}
          description={t("appAppearance.description")}
          action={
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px] font-medium">
                {activeTheme.name}
              </Badge>
              <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          }
        />
      </CustomItem>

      {/* 2. Relationship CustomItem Card */}
      <CustomItem
        variant="soft"
        icon={<Heart className="size-3.5 text-primary" />}
        title={t("sections.relationship")}
        contentClassName="flex flex-col gap-0.5"
      >
        <PartnerAliasSection />
        <Separator />
        <AnniversarySection />
        <Separator />
        <LocationSharingSection />
        <Separator />
        <QuizSection />
        <Separator />
        <SettingRow
          href="/setting/mood"
          icon={<Smile className="size-3.5" />}
          title={t("mood.title")}
          description={t("mood.description")}
          action={
            <div className="flex items-center gap-1.5">
              <Badge variant="default" className="font-mono text-[11px]">
                {moodOptions.length}
              </Badge>
              <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          }
        />
        <Separator />
        <SettingRow
          href="/setting/nudge"
          icon={<Send className="size-3.5" />}
          title={t("nudge.title")}
          description={t("nudge.description")}
          action={
            <div className="flex items-center gap-1.5">
              <Badge variant="default" className="font-mono text-[11px]">
                {nudgeOptions.length}
              </Badge>
              <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          }
        />
        <Separator />
        <SettingRow
          href="/setting/important-dates"
          icon={<CalendarHeart className="size-3.5" />}
          title={t("importantDates.title")}
          description={t("importantDates.description")}
          action={
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {t("common:status.comingSoon")}
              </span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          }
        />
      </CustomItem>

      {/* 3. Danger Zone CustomItem Card */}
      <CustomItem
        variant="outline"
        icon={<ShieldAlert className="size-3.5 text-destructive" />}
        title={t("sections.dangerZone")}
        headerClassName="text-destructive"
        className="border-destructive/40 text-destructive"
        contentClassName="flex flex-col gap-0.5"
      >
        <SettingRow
          icon={<Flame className="size-3.5 text-amber-500" />}
          title={t("danger.takeBreakTitle")}
          description={t("danger.takeBreakDescription")}
          action={
            <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {t("common:status.comingSoon")}
            </span>
          }
          className="opacity-75"
        />
        <Separator />
        <SettingRow
          icon={<HeartCrack className="size-3.5 text-destructive" />}
          title={t("danger.endRelationshipTitle")}
          description={t("danger.endRelationshipDescription")}
          action={
            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
              {t("common:status.comingSoon")}
            </span>
          }
          className="opacity-75"
        />
      </CustomItem>

      {/* 4. Account CustomItem Card */}
      <CustomItem
        icon={<LogOut className="size-3.5 text-muted-foreground" />}
        title={t("sections.account")}
        description={
          user?.email
            ? t("account.signedInAs", { email: user.email })
            : t("account.signedIn")
        }
        className="gap-3"
      >
        <Button
          variant="destructive"
          onClick={() => signOutMutation.mutate()}
          disabled={signOutMutation.isPending}
          className="w-full rounded-2xl text-xs sm:w-auto"
        >
          {signOutMutation.isPending ? (
            <Spinner className="size-4" />
          ) : (
            t("account.signOut")
          )}
        </Button>
      </CustomItem>
    </div>
  )
}
