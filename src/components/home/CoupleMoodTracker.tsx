import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

function YourMood() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>You</CardTitle>
      </CardHeader>
      <CardContent>test</CardContent>
    </Card>
  )
}

function PartnerMood() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Partner</CardTitle>
      </CardHeader>
      <CardContent>test</CardContent>
    </Card>
  )
}

export { YourMood, PartnerMood }
