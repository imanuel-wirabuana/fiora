# Agent Guidelines & Separation of Concerns (SoC)

> **App Overview:** **Fiora** is a couple-focused mood tracker, relationship timeline, and connection app built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, **shadcn/ui**, **wouter**, **TanStack Query (React Query)**, **Zustand**, and **Supabase** (with Realtime synchronization).

---

## 1. Architecture & Layer Boundaries

All code contributions must respect the following single-responsibility directory boundaries:

```
src/
├── assets/          # Static assets (images, svg, global media)
├── components/      # UI components
│   ├── ui/          # Primitives / design system (managed by shadcn CLI, rarely touched directly)
│   ├── layouts/     # Screen shell layouts (MainLayout, DetailLayout)
│   └── [feature]/   # Feature-specific dumb & composite components (e.g., home/, setup/, timeline/)
├── screens/         # Page/route-level view containers (mounted directly by router)
├── hooks/           # Reusable React hooks, TanStack Query queries/mutations & custom lifecycle/state logic
├── services/        # Supabase clients, external API calls, HTTP network requests & Realtime channels
├── stores/          # Zustand global/shared client state (client session sync, preferences, active UI state)
├── types/           # Shared TypeScript interfaces, domain models, and DB schema types
└── lib/             # Pure utility functions, QueryClient config, formatter helpers (e.g. utils.ts)
```

---

## 2. Separation of Concerns (SoC) Rules

### A. Screens (`src/screens/*`)

- **Responsibility:** Act as the orchestrator/assembler for a given route.
- **Rules:**
  - **No direct database or fetch calls:** Screens must never invoke Supabase or external APIs directly. Delegate all I/O and server mutations to custom hooks (`src/hooks`).
  - **No inline global state management:** Delegate global client state to stores (`src/stores`).
  - **Composition over monoliths:** Break complex page layouts down into feature components (`src/components/<feature>/`).
  - **Route handling:** Screens receive route params or use `wouter` navigation; layout wrappers (`MainLayout`, `DetailLayout`) belong in `src/App.tsx` routing definitions.

### B. Feature Components (`src/components/<feature>/*`)

- **Responsibility:** Domain-specific visual components (e.g., `CoupleMoodTracker`, `DailyQuizCard`, `GenderStep`).
- **Rules:**
  - Keep components modular, focused, and testable.
  - Rely on props for data or cleanly bind to dedicated hooks.
  - Reuse primitive building blocks from `src/components/ui/` rather than writing custom primitive controls.

### C. UI Primitives (`src/components/ui/*`)

- **Responsibility:** Headless and styled design system primitives generated via `shadcn`.
- **Rules:**
  - **Zero domain logic:** Must not import business domain entities, services, or Zustand stores.
  - Rely strictly on props, `clsx`/`tailwind-merge` (`cn`), and Base UI / Radix primitives.
  - Add new primitives using `npx shadcn@latest add <component>` whenever possible.

### D. Services & API Layer (`src/services/*`)

- **Responsibility:** Direct interaction with Supabase client, REST endpoints, external SDKs, and Supabase Realtime channels.
- **Rules:**
  - Isolate all Supabase calls (`supabase.from(...)`, auth methods, storage queries, `supabase.channel(...)`).
  - Return typed domain models or data shapes defined in `src/types`.
  - Realtime subscriptions must return a cleanup function (e.g., `() => supabase.removeChannel(channel)`).
  - Handle low-level error transformation and network exception normalization.
  - Never import UI components, React hooks, or React Query / Zustand primitives inside service modules.

### E. Server vs. Client State Management

#### 1. Server State: TanStack Query (`src/hooks/*`)

- **Responsibility:** Asynchronous server state, cache synchronization, background refetching, and mutations.
  - Examples: Querying couple mood timelines, partner answers, journal entries, executing mutations (`signIn`, `signUp`, `signOut`, `createRelationship`, `logMood`).
- **Rules:**
  - Encapsulate `useQuery` and `useMutation` inside dedicated custom hooks in `src/hooks/` (e.g., `useAuth.ts`, `useRelationship.ts`, `useMood.ts`).
  - Always define typed query keys using key factories (e.g., `relationshipKeys = { all: ['relationship'] as const, ... }`).
  - Call service functions (`src/services/*`) inside `queryFn` and `mutationFn`.
  - Use `onSuccess` / `onError` to handle cache invalidation (`queryClient.invalidateQueries`) and notify client stores if needed.

#### 2. Client State: Zustand (`src/stores/*`)

- **Responsibility:** Synchronous, purely client-side or global UI state.
  - Examples: Active auth session holder from realtime listeners, offline drafts, transient interactive modal/sheet state, theme settings.
- **Rules:**
  - Do **not** duplicate server cache in Zustand if React Query already manages it.
  - Keep stores lean and domain-focused (e.g., `authStore.ts`, `themeStore.ts`).
  - Avoid storing derived state that can be computed on the fly.

### F. Realtime Architecture & Synchronization Rules

- **Full Realtime First:** Fiora is a couple-focused application. Changes made by either partner (such as joining a relationship, changing custom moods, logging moods, answering quizzes, sending nudges) must reflect in real time without manual reloads.
- **Subscription Lifecycle:**
  - Service functions define the channel and Postgres change listeners (`postgres_changes` on `INSERT`, `UPDATE`, `DELETE`) and return an unsubscribe handler.
  - Hooks subscribe to these channels inside `useEffect` and trigger `queryClient.invalidateQueries(...)` to seamlessly synchronize TanStack Query's cache.
  - Subscriptions must always clean up on unmount or when the target entity ID (e.g., `relationshipId`, `userId`) changes.

### G. Custom Hooks (`src/hooks/*`)

- **Responsibility:** Bridge UI components with business logic, side-effects, subscriptions, React Query, and stores.
- **Rules:**
  - Encapsulate reusable behavior (e.g., device detection `use-mobile.ts`, Supabase Realtime subscriptions `useRelationship.ts`, React Query mutations).
  - Keep UI components declarative: UI triggers hook functions/mutations and renders hook return values (`isPending`, `data`, `error`).

### H. Types (`src/types/*`)

- **Responsibility:** Single source of truth for TypeScript types and interfaces.
- **Rules:**
  - Separate database models (e.g., `supabase.ts` generated types) from frontend view models or domain objects (e.g., `auth.ts`, `mood.ts`, `relationship.ts`, `user.ts`).
  - Avoid declaring duplicate interfaces across multiple component files; export shared types here.

### I. Utilities (`src/lib/*`)

- **Responsibility:** Deterministic, pure helper functions and client configurations.
- **Rules:**
  - Formatting (dates with `date-fns`, currency, string helpers, code generators).
  - Class name merging (`cn` utility in `src/lib/utils.ts`).
  - Library setups (e.g., `queryClient.ts`).
  - Must remain strictly side-effect free and testable.

---

## 3. Styling & Layout Conventions

- **Tailwind CSS v4:** Utilize utility classes and theme tokens (`bg-primary`, `text-card-foreground`, etc.).
- **Mobile-First Responsive Frame:** The app features a mobile-optimized shell (`PhoneMockup` / `DesktopShell`). New screens must be responsive within mobile viewport bounds (`max-w-md` mobile container or phone preview).
- **Navigation:** Bottom navigation tabs are defined in `src/components/BottomNav.tsx` and orchestrated via `MainLayout.tsx`.
- **Drawer Forms:** Always use `FormDrawer` (`src/components/FormDrawer.tsx`) for drawer-based forms. Do not add a Cancel button (users dismiss via swipe or backdrop), and rely on `FormDrawer`'s built-in `isPending` spinner and `isSuccess` emerald confirmation state.

---

## 4. Agent Checklist Before Committing Changes

1. **Did I put domain/API logic inside a UI component?** -> Move it to `services/` or `hooks/`.
2. **Is this server state (fetching/mutating)?** -> Use TanStack Query (`useQuery` / `useMutation`) in `hooks/`.
3. **Is this client-only global UI state?** -> Add a Zustand store in `stores/`.
4. **Is this shared partner/couple data?** -> Ensure Supabase Realtime triggers cache invalidation in `hooks/`.
5. **Are types placed in their own definition files?** -> Move shared models to `types/`.
6. **Is code formatted and type-safe?** -> Run `bun run typecheck` and `bun run lint`.
