import { lazy, Suspense, useEffect } from "react"
import { Redirect, Route, Switch } from "wouter"
import { DetailLayout, MainLayout } from "./components/layouts"
import { PWAInstallPrompt } from "./components/PWAInstallPrompt"
import { SplashScreen } from "./components/SplashScreen"
import { Skeleton } from "./components/ui/skeleton"
import { useAuth } from "./hooks/useAuth"
import { useIsMobile } from "./hooks/use-mobile"
import { usePresenceTracker } from "./hooks/usePartnerPresence"
import { useAutoPushSubscription } from "./hooks/usePushNotifications"
import { useRealtimeSync } from "./hooks/useRealtimeSync"
import { useRelationship } from "./hooks/useRelationship"
import { useScrollToTop } from "./hooks/useScrollToTop"
import { useDynamicFavicon } from "./hooks/useDynamicFavicon"

const DesktopShell = lazy(() =>
  import("./components/DesktopShell").then((m) => ({ default: m.DesktopShell }))
)
const HomeScreen = lazy(() =>
  import("./screens/HomeScreen").then((m) => ({ default: m.HomeScreen }))
)
const TimelineScreen = lazy(() =>
  import("./screens/TimelineScreen").then((m) => ({
    default: m.TimelineScreen,
  }))
)
const LocationSharingScreen = lazy(() =>
  import("./screens/LocationSharingScreen").then((m) => ({
    default: m.LocationSharingScreen,
  }))
)
const SpaceScreen = lazy(() =>
  import("./screens/SpaceScreen").then((m) => ({ default: m.SpaceScreen }))
)
const JournalScreen = lazy(() =>
  import("./screens/JournalScreen").then((m) => ({ default: m.JournalScreen }))
)
const JournalDetailScreen = lazy(() =>
  import("./screens/JournalDetailScreen").then((m) => ({
    default: m.JournalDetailScreen,
  }))
)
const NotificationScreen = lazy(() =>
  import("./screens/NotificationScreen").then((m) => ({
    default: m.NotificationScreen,
  }))
)
const SettingScreen = lazy(() =>
  import("./screens/SettingScreen").then((m) => ({ default: m.SettingScreen }))
)
const MoodSettingScreen = lazy(() =>
  import("./screens/MoodSettingScreen").then((m) => ({
    default: m.MoodSettingScreen,
  }))
)
const NudgeSettingScreen = lazy(() =>
  import("./screens/NudgeSettingScreen").then((m) => ({
    default: m.NudgeSettingScreen,
  }))
)
const ImportantDatesSettingScreen = lazy(() =>
  import("./screens/ImportantDatesSettingScreen").then((m) => ({
    default: m.ImportantDatesSettingScreen,
  }))
)
const AppAppearanceSettingScreen = lazy(() =>
  import("./screens/AppAppearanceSettingScreen").then((m) => ({
    default: m.AppAppearanceSettingScreen,
  }))
)
const QuizSummaryScreen = lazy(() =>
  import("./screens/QuizSummaryScreen").then((m) => ({
    default: m.QuizSummaryScreen,
  }))
)
const LoginScreen = lazy(() =>
  import("./screens/LoginScreen").then((m) => ({ default: m.LoginScreen }))
)
const RegisterScreen = lazy(() =>
  import("./screens/RegisterScreen").then((m) => ({
    default: m.RegisterScreen,
  }))
)
const SetupScreen = lazy(() =>
  import("./screens/SetupScreen").then((m) => ({ default: m.SetupScreen }))
)
const NotFoundScreen = lazy(() =>
  import("./screens/NotFoundScreen").then((m) => ({
    default: m.NotFoundScreen,
  }))
)

function RouteFallback() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-6 pb-20 sm:max-w-2xl">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-28 rounded-lg" />
        <Skeleton className="size-8 rounded-full" />
      </div>
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

function AppRoutes() {
  const { isAuthenticated, isInitialized } = useAuth()
  const { hasRelationship, isLoading: isRelationshipLoading } =
    useRelationship()

  useScrollToTop()
  useRealtimeSync()
  usePresenceTracker()
  useAutoPushSubscription()

  const isAppReady =
    isInitialized && (!isAuthenticated || !isRelationshipLoading)

  // Flow rules:
  // 1. Unauthenticated -> access only / and /register (other routes redirect to /)
  // 2. Authenticated WITHOUT relationship -> redirect to /setup (can only view /setup)
  // 3. Authenticated WITH relationship -> access protected routes; /setup and auth pages redirect to /home

  return (
    <div className="relative min-h-svh w-full md:min-h-full">
      <SplashScreen isVisible={!isAppReady} />
      {isAppReady ? (
        <Suspense fallback={<RouteFallback />}>
          <Switch>
      {/* 1. Auth routes (Login / Register) */}
      <Route path="/">
        {!isAuthenticated ? (
          <LoginScreen />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <Redirect to="/home" />
        )}
      </Route>

      <Route path="/register">
        {!isAuthenticated ? (
          <RegisterScreen />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <Redirect to="/home" />
        )}
      </Route>

      {/* 2. Setup route */}
      <Route path="/setup">
        {!isAuthenticated ? (
          <Redirect to="/" />
        ) : hasRelationship ? (
          <Redirect to="/home" />
        ) : (
          <SetupScreen />
        )}
      </Route>

      {/* 3. Main layout routes */}
      <Route path="/home">
        {!isAuthenticated ? (
          <Redirect to="/" />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <MainLayout>
            <HomeScreen />
          </MainLayout>
        )}
      </Route>

      <Route path="/timeline">
        {!isAuthenticated ? (
          <Redirect to="/" />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <MainLayout>
            <TimelineScreen />
          </MainLayout>
        )}
      </Route>

      <Route path="/journal">
        <Redirect to="/space/journal" />
      </Route>

      <Route path="/space">
        {!isAuthenticated ? (
          <Redirect to="/" />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <MainLayout>
            <SpaceScreen />
          </MainLayout>
        )}
      </Route>

      <Route path="/space/journal">
        {!isAuthenticated ? (
          <Redirect to="/" />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <DetailLayout title="Journal" backHref="/space">
            <JournalScreen />
          </DetailLayout>
        )}
      </Route>

      <Route path="/setting">
        {!isAuthenticated ? (
          <Redirect to="/" />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <MainLayout>
            <SettingScreen />
          </MainLayout>
        )}
      </Route>

      <Route path="/setting/mood">
        {!isAuthenticated ? (
          <Redirect to="/" />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <DetailLayout title="Mood Options" backHref="/setting">
            <MoodSettingScreen />
          </DetailLayout>
        )}
      </Route>

      <Route path="/setting/nudge">
        {!isAuthenticated ? (
          <Redirect to="/" />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <DetailLayout title="Nudges" backHref="/setting">
            <NudgeSettingScreen />
          </DetailLayout>
        )}
      </Route>

      <Route path="/setting/important-dates">
        {!isAuthenticated ? (
          <Redirect to="/" />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <DetailLayout title="Important Dates" backHref="/setting">
            <ImportantDatesSettingScreen />
          </DetailLayout>
        )}
      </Route>

      <Route path="/setting/app-appearance">
        {!isAuthenticated ? (
          <Redirect to="/" />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <DetailLayout title="App Appearance" backHref="/setting">
            <AppAppearanceSettingScreen />
          </DetailLayout>
        )}
      </Route>

      <Route path="/notification">
        {!isAuthenticated ? (
          <Redirect to="/" />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <DetailLayout title="Notification">
            <NotificationScreen />
          </DetailLayout>
        )}
      </Route>

      <Route path="/location">
        {!isAuthenticated ? (
          <Redirect to="/" />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <LocationSharingScreen />
        )}
      </Route>

      <Route path="/journal/:id">
        {!isAuthenticated ? (
          <Redirect to="/" />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <JournalDetailScreen />
        )}
      </Route>

      <Route path="/quiz-summary">
        {!isAuthenticated ? (
          <Redirect to="/" />
        ) : !hasRelationship ? (
          <Redirect to="/setup" />
        ) : (
          <DetailLayout title="Quiz Summary" backHref="/home">
            <QuizSummaryScreen />
          </DetailLayout>
        )}
      </Route>

          {/* Fallback */}
          <Route>
            <div className="flex min-h-svh items-center justify-center p-4">
              <NotFoundScreen />
            </div>
          </Route>
        </Switch>
        </Suspense>
      ) : null}
    </div>
  )
}

export function App() {
  useDynamicFavicon()
  const isMobile = useIsMobile()
  const { initialize } = useAuth()

  useEffect(() => {
    const unsubscribe = initialize()
    return () => {
      unsubscribe()
    }
  }, [initialize])

  if (isMobile) {
    return (
      <>
        <AppRoutes />
        <PWAInstallPrompt />
      </>
    )
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <DesktopShell>
        <AppRoutes />
      </DesktopShell>
    </Suspense>
  )
}

export default App
