import { LogOut } from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"

export function AccountSection() {
  const { user, signOutMutation } = useAuth()

  const handleSignOut = () => {
    signOutMutation.mutate()
  }

  return (
    <CustomItem
      icon={<LogOut className="size-3.5 text-primary" />}
      title="Account"
      description={user?.email ? `Signed in as ${user.email}` : "Signed in"}
      className="gap-3"
    >
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
    </CustomItem>
  )
}

