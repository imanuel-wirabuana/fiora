import { lazy, Suspense, useEffect } from "react"
import { Redirect, Route, Switch } from "wouter"
import { DetailLayout, MainLayout } from "./components/layouts"
import { PWAInstallPrompt } from "./components/PWAInstallPrompt"
import {
  AuthScreenSkeleton,
  HomeScreenSkeleton,
  JournalDetailScreenSkeleton,
  JournalScreenSkeleton,
  LocationSharingScreenSkeleton,
  NotificationScreenSkeleton,
  QuizSummaryScreenSkeleton,
  SettingScreenSkeleton,
  SettingSubScreenSkeleton,
  SetupScreenSkeleton,
  SpaceScreenSkeleton,
  TimelineScreenSkeleton,
} from "./components/ScreenSkeletons"
import { SplashScreen } from "./components/SplashScreen"
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
const AuthScreen = lazy(() =>
  import("./screens/AuthScreen").then((m) => ({ default: m.AuthScreen }))
)
const SetupScreen = lazy(() =>
  import("./screens/SetupScreen").then((m) => ({ default: m.SetupScreen }))
)
const NotFoundScreen = lazy(() =>
  import("./screens/NotFoundScreen").then((m) => ({
    default: m.NotFoundScreen,
  }))
)

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
        <Switch>
          {/* 1. Auth routes (Login / Register) */}
          <Route path="/">
            {!isAuthenticated ? (
              <Suspense fallback={<AuthScreenSkeleton />}>
                <AuthScreen defaultTab="login" />
              </Suspense>
            ) : !hasRelationship ? (
              <Redirect to="/setup" />
            ) : (
              <Redirect to="/home" />
            )}
          </Route>

          <Route path="/register">
            {!isAuthenticated ? (
              <Suspense fallback={<AuthScreenSkeleton />}>
                <AuthScreen defaultTab="register" />
              </Suspense>
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
              <Suspense fallback={<SetupScreenSkeleton />}>
                <SetupScreen />
              </Suspense>
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
                <Suspense fallback={<HomeScreenSkeleton />}>
                  <HomeScreen />
                </Suspense>
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
                <Suspense fallback={<TimelineScreenSkeleton />}>
                  <TimelineScreen />
                </Suspense>
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
                <Suspense fallback={<SpaceScreenSkeleton />}>
                  <SpaceScreen />
                </Suspense>
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
                <Suspense fallback={<JournalScreenSkeleton />}>
                  <JournalScreen />
                </Suspense>
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
                <Suspense fallback={<SettingScreenSkeleton />}>
                  <SettingScreen />
                </Suspense>
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
                <Suspense fallback={<SettingSubScreenSkeleton />}>
                  <MoodSettingScreen />
                </Suspense>
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
                <Suspense fallback={<SettingSubScreenSkeleton />}>
                  <NudgeSettingScreen />
                </Suspense>
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
                <Suspense fallback={<SettingSubScreenSkeleton />}>
                  <ImportantDatesSettingScreen />
                </Suspense>
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
                <Suspense fallback={<SettingSubScreenSkeleton />}>
                  <AppAppearanceSettingScreen />
                </Suspense>
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
                <Suspense fallback={<NotificationScreenSkeleton />}>
                  <NotificationScreen />
                </Suspense>
              </DetailLayout>
            )}
          </Route>

          <Route path="/location">
            {!isAuthenticated ? (
              <Redirect to="/" />
            ) : !hasRelationship ? (
              <Redirect to="/setup" />
            ) : (
              <Suspense fallback={<LocationSharingScreenSkeleton />}>
                <LocationSharingScreen />
              </Suspense>
            )}
          </Route>

          <Route path="/journal/:id">
            {!isAuthenticated ? (
              <Redirect to="/" />
            ) : !hasRelationship ? (
              <Redirect to="/setup" />
            ) : (
              <Suspense fallback={<JournalDetailScreenSkeleton />}>
                <JournalDetailScreen />
              </Suspense>
            )}
          </Route>

          <Route path="/quiz-summary">
            {!isAuthenticated ? (
              <Redirect to="/" />
            ) : !hasRelationship ? (
              <Redirect to="/setup" />
            ) : (
              <DetailLayout title="Quiz Summary" backHref="/home">
                <Suspense fallback={<QuizSummaryScreenSkeleton />}>
                  <QuizSummaryScreen />
                </Suspense>
              </DetailLayout>
            )}
          </Route>

          {/* Fallback */}
          <Route>
            <div className="flex min-h-svh items-center justify-center p-4">
              <Suspense fallback={<AuthScreenSkeleton />}>
                <NotFoundScreen />
              </Suspense>
            </div>
          </Route>
        </Switch>
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
    <Suspense fallback={null}>
      <DesktopShell>
        <AppRoutes />
      </DesktopShell>
    </Suspense>
  )
}

export default App
