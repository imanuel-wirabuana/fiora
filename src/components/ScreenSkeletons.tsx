import { CustomSkeleton } from "@/components/CustomSkeleton"

export function AuthScreenSkeleton() {
  return (
    <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col justify-between overflow-hidden bg-background p-6 lg:min-h-full">
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <CustomSkeleton className="size-16 rounded-3xl" />
        <CustomSkeleton className="h-6 w-28 rounded-lg" />
        <CustomSkeleton className="h-3.5 w-44 rounded-md" />
      </div>
      <div className="flex flex-col gap-3 rounded-3xl border border-border/50 bg-card p-5">
        <CustomSkeleton className="h-5 w-24 rounded-md" />
        <CustomSkeleton className="h-10 w-full rounded-xl" />
        <CustomSkeleton className="h-10 w-full rounded-xl" />
        <CustomSkeleton className="mt-1 h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function SetupScreenSkeleton() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-between gap-6 p-5">
      <div className="flex flex-col gap-3 pt-4">
        <CustomSkeleton className="h-2 w-full rounded-full" />
        <CustomSkeleton className="h-6 w-40 rounded-lg" />
        <CustomSkeleton className="h-3.5 w-56 rounded-md" />
      </div>
      <CustomSkeleton className="h-64 w-full rounded-3xl" />
      <CustomSkeleton className="h-11 w-full rounded-2xl" />
    </div>
  )
}

export function HomeScreenSkeleton() {
  return (
    <section className="flex flex-col gap-4">
      {/* PartnerPresenceSection */}
      <CustomSkeleton className="h-14 w-full" />

      {/* CoupleMoodTracker (2-column grid) */}
      <div className="grid grid-cols-2 gap-3">
        <CustomSkeleton className="h-40 w-full" />
        <CustomSkeleton className="h-40 w-full" />
      </div>

      {/* NudgeSection */}
      <CustomSkeleton className="h-20 w-full" />

      {/* DailyQuizSection */}
      <CustomSkeleton className="h-36 w-full" />
    </section>
  )
}

export function TimelineScreenSkeleton() {
  return (
    <section className="flex flex-col gap-3">
      {/* TimelineFilterSection */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <CustomSkeleton className="h-7 w-12 rounded-full" />
          <CustomSkeleton className="h-7 w-14 rounded-full" />
          <CustomSkeleton className="h-7 w-14 rounded-full" />
        </div>
        <CustomSkeleton className="h-7 w-22 rounded-full" />
      </div>

      {/* TimelineFeedSection */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <CustomSkeleton className="h-3.5 w-14 rounded-md" />
          <CustomSkeleton className="h-3 w-5 rounded-md" />
        </div>
        {Array.from({ length: 4 }).map((_, idx) => (
          <CustomSkeleton key={idx} className="h-20 w-full" />
        ))}
      </div>
    </section>
  )
}

export function SpaceScreenSkeleton() {
  return (
    <section className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <CustomSkeleton className="h-28 w-full" />
        <CustomSkeleton className="h-28 w-full" />
        <CustomSkeleton className="h-28 w-full" />
        <CustomSkeleton className="h-28 w-full" />
      </div>
    </section>
  )
}

export function JournalScreenSkeleton() {
  return (
    <section className="flex flex-col gap-3">
      {/* Search + Filter */}
      <div className="flex items-center gap-2">
        <CustomSkeleton className="h-9 flex-1 rounded-xl" />
        <CustomSkeleton className="h-9 w-9 rounded-xl" />
      </div>
      <div className="flex gap-1.5">
        <CustomSkeleton className="h-7 w-12 rounded-full" />
        <CustomSkeleton className="h-7 w-16 rounded-full" />
        <CustomSkeleton className="h-7 w-16 rounded-full" />
      </div>

      {/* 3-column masonry grid */}
      <div className="columns-3 gap-2 space-y-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <CustomSkeleton
            key={idx}
            className="w-full break-inside-avoid"
            style={{ height: idx % 2 === 0 ? 112 : 144 }}
          />
        ))}
      </div>
    </section>
  )
}

export function JournalDetailScreenSkeleton() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-13 items-center justify-between border-b border-border/50 px-4">
        <CustomSkeleton className="size-8 rounded-full" />
        <div className="flex gap-1.5">
          <CustomSkeleton className="size-8 rounded-full" />
          <CustomSkeleton className="size-8 rounded-full" />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CustomSkeleton className="size-8 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <CustomSkeleton className="h-3.5 w-20 rounded-md" />
              <CustomSkeleton className="h-3 w-32 rounded-md" />
            </div>
          </div>
          <CustomSkeleton className="h-5 w-16 rounded-full" />
        </div>
        <CustomSkeleton className="h-7 w-3/4 rounded-lg" />
        <div className="space-y-2.5 pt-2">
          <CustomSkeleton className="h-4 w-full rounded-md" />
          <CustomSkeleton className="h-4 w-11/12 rounded-md" />
          <CustomSkeleton className="h-4 w-4/5 rounded-md" />
          <CustomSkeleton className="h-4 w-full rounded-md" />
          <CustomSkeleton className="h-4 w-2/3 rounded-md" />
        </div>
      </main>
    </div>
  )
}

export function SettingScreenSkeleton() {
  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Self Card */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border/60 p-3.5">
        <CustomSkeleton className="h-4 w-16 rounded-md" />
        {Array.from({ length: 4 }).map((_, idx) => (
          <CustomSkeleton key={idx} className="h-11 w-full rounded-xl" />
        ))}
      </div>

      {/* Relationship Card */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border/60 p-3.5">
        <CustomSkeleton className="h-4 w-24 rounded-md" />
        {Array.from({ length: 4 }).map((_, idx) => (
          <CustomSkeleton key={idx} className="h-11 w-full rounded-xl" />
        ))}
      </div>

      <CustomSkeleton className="h-10 w-full rounded-xl" />
    </div>
  )
}

export function SettingSubScreenSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <CustomSkeleton className="h-12 w-full" />
      {Array.from({ length: 4 }).map((_, idx) => (
        <CustomSkeleton key={idx} className="h-16 w-full" />
      ))}
      <CustomSkeleton className="mt-1 h-10 w-full rounded-xl" />
    </div>
  )
}

export function NotificationScreenSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        <CustomSkeleton className="h-7 w-12 rounded-full" />
        <CustomSkeleton className="h-7 w-16 rounded-full" />
        <CustomSkeleton className="h-7 w-16 rounded-full" />
        <CustomSkeleton className="h-7 w-16 rounded-full" />
      </div>
      {Array.from({ length: 5 }).map((_, idx) => (
        <CustomSkeleton key={idx} className="h-18 w-full" />
      ))}
    </div>
  )
}

export function LocationSharingScreenSkeleton() {
  return (
    <div className="relative flex h-svh w-full flex-col justify-between overflow-hidden bg-background p-4 md:h-full">
      <CustomSkeleton className="absolute inset-0 rounded-none" />
      <div className="relative z-10 flex items-center justify-between">
        <CustomSkeleton className="size-9 rounded-full" />
        <CustomSkeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="relative z-10 flex flex-col gap-2 rounded-3xl border border-border/60 bg-card/90 p-4 backdrop-blur-xs">
        <CustomSkeleton className="mx-auto h-1.5 w-10 rounded-full" />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <CustomSkeleton className="h-14 w-full rounded-xl" />
          <CustomSkeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function QuizSummaryScreenSkeleton() {
  return (
    <section className="flex flex-col gap-3">
      <CustomSkeleton className="h-10 w-full rounded-2xl" />
      <CustomSkeleton className="h-24 w-full" />
      {Array.from({ length: 3 }).map((_, idx) => (
        <CustomSkeleton key={idx} className="h-32 w-full" />
      ))}
    </section>
  )
}

