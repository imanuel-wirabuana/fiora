import { useEffect } from "react"
import { Redirect, Route, Switch } from "wouter"
import { DesktopShell } from "./components/DesktopShell"
import { DetailLayout, MainLayout } from "./components/layouts"
import { PWAInstallPrompt } from "./components/PWAInstallPrompt"
import { SplashScreen } from "./components/SplashScreen"
import { useAuth } from "./hooks/useAuth"
import { useIsMobile } from "./hooks/use-mobile"
import { usePresenceTracker } from "./hooks/usePartnerPresence"
import { useAutoPushSubscription } from "./hooks/usePushNotifications"
import { useRelationship } from "./hooks/useRelationship"
import { useDynamicFavicon } from "./hooks/useDynamicFavicon"
import {
  HomeScreen,
  JournalScreen,
  SpaceScreen,
  LocationSharingScreen,
  LoginScreen,
  NotFoundScreen,
  NotificationScreen,
  QuizSummaryScreen,
  RegisterScreen,
  SettingScreen,
  MoodSettingScreen,
  NudgeSettingScreen,
  ImportantDatesSettingScreen,
  AppAppearanceSettingScreen,
  SetupScreen,
  TimelineScreen,
} from "./screens"

function AppRoutes() {
  const { isAuthenticated, isInitialized } = useAuth()
  const { hasRelationship, isLoading: isRelationshipLoading } =
    useRelationship()

  usePresenceTracker()
  useAutoPushSubscription()

  // Wait until auth session check finishes
  if (!isInitialized) {
    return <SplashScreen />
  }

  // If user is logged in, wait until relationship status is fetched
  if (isAuthenticated && isRelationshipLoading) {
    return <SplashScreen />
  }

  // Flow rules:
  // 1. Unauthenticated -> access only / and /register (other routes redirect to /)
  // 2. Authenticated WITHOUT relationship -> redirect to /setup (can only view /setup)
  // 3. Authenticated WITH relationship -> access protected routes; /setup and auth pages redirect to /home

  return (
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
    <DesktopShell>
      <AppRoutes />
    </DesktopShell>
  )
}

export default App
