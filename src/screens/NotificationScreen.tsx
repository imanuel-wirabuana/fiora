import { NotificationListSection } from "@/components/notification"

export function NotificationScreen() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-2.5 px-4 pt-3 pb-20 sm:max-w-2xl">
      <NotificationListSection />
    </section>
  )
}
