import { Button } from "@/components/ui/button"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"

export function AccountSection() {
  const { user, signOutMutation } = useAuth()

  const handleSignOut = () => {
    signOutMutation.mutate()
  }

  return (
    <Item variant="outline" className="w-full flex-col items-start gap-3">
      <ItemHeader className="flex-col items-start gap-1">
        <ItemTitle>Account</ItemTitle>
        <ItemDescription>
          {user?.email ? `Signed in as ${user.email}` : "Signed in"}
        </ItemDescription>
      </ItemHeader>
      <ItemContent className="w-full">
        <Button
          variant="destructive"
          onClick={handleSignOut}
          disabled={signOutMutation.isPending}
          className="w-full rounded-2xl text-xs sm:w-auto"
        >
          {signOutMutation.isPending ? (
            <Spinner className="size-4" />
          ) : (
            "Sign Out"
          )}
        </Button>
      </ItemContent>
    </Item>
  )
}

