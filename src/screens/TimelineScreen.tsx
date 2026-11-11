import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TimelineScreen() {
  return (
    <section className="flex flex-col gap-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>test</CardContent>
      </Card>
      filters
      {[1, 2, 3, 4, 5].map((number) => (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Mood {number}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </section>
  )
}
