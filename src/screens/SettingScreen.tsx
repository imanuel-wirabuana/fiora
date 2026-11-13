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
import { CustomItem } from "@/components/CustomItem"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { useRelationship } from "@/hooks/useRelationship"
import {
  AnniversarySection,
  LocationSharingSection,
  NotificationSection,
  PartnerAliasSection,
  ProfileSection,
  QuizSection,
  SettingRow,
  ThemeSection,
} from "@/components/setting"

export function SettingScreen() {
  const { user, signOutMutation } = useAuth()
  const { moodOptions, nudgeOptions } = useRelationship()

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* 1. Self CustomItem Card */}
      <CustomItem
        icon={<User className="size-3.5 text-primary" />}
        title="Self"
        contentClassName="flex flex-col gap-0.5"
      >
        <ProfileSection />
        <Separator />
        <ThemeSection />
        <Separator />
        <SettingRow
          href="/setting/app-appearance"
          icon={<Palette className="size-3.5" />}
          title="App Appearance"
          description="Theme colors, accents, and visual styling."
          action={
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Coming soon
              </span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          }
        />
        <Separator />
        <NotificationSection />
        <Separator />
        <SettingRow
          icon={<Timer className="size-3.5" />}
          title="Mood Reminder Interval"
          description="Get periodic nudges to log how you feel."
          action={
            <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Coming soon
            </span>
          }
          className="opacity-75"
        />
      </CustomItem>

      {/* 2. Relationship CustomItem Card */}
      <CustomItem
        variant="soft"
        icon={<Heart className="size-3.5 text-primary" />}
        title="Relationship"
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
          title="Mood"
          description="Customize emojis and emotions for you and your partner."
          action={
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-muted-foreground">
                ({moodOptions.length})
              </span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          }
        />
        <Separator />
        <SettingRow
          href="/setting/nudge"
          icon={<Send className="size-3.5" />}
          title="Nudge"
          description="Manage quick-tap reactions sent across to your partner."
          action={
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-muted-foreground">
                ({nudgeOptions.length})
              </span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          }
        />
        <Separator />
        <SettingRow
          href="/setting/important-dates"
          icon={<CalendarHeart className="size-3.5" />}
          title="Important Dates"
          description="Special milestones, anniversaries, and couple reminders."
          action={
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Coming soon
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
        title="Danger Zone"
        headerClassName="text-destructive"
        className="border-destructive/40 text-destructive"
        contentClassName="flex flex-col gap-0.5"
      >
        <SettingRow
          icon={<Flame className="size-3.5 text-amber-500" />}
          title="Take a Break"
          description="Temporarily pause shared prompts and notifications."
          action={
            <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Coming soon
            </span>
          }
          className="opacity-75"
        />
        <Separator />
        <SettingRow
          icon={<HeartCrack className="size-3.5 text-destructive" />}
          title="End Relationship"
          description="Permanently disconnect from your partner and unlink data."
          action={
            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
              Coming soon
            </span>
          }
          className="opacity-75"
        />
      </CustomItem>

      {/* 4. Account CustomItem Card */}
      <CustomItem
        icon={<LogOut className="size-3.5 text-muted-foreground" />}
        title="Account"
        description={user?.email ? `Signed in as ${user.email}` : "Signed in"}
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
            "Sign Out"
          )}
        </Button>
      </CustomItem>
    </div>
  )
}
