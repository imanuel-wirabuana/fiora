import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function JournalScreen() {
  return (
    <section className="flex flex-col gap-4">
      Search
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Journal {number}</CardTitle>
            </CardHeader>
            <CardContent></CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
