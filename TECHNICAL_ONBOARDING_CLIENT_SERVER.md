# SMART MANAGER: Technical Onboarding Guide

## 1. Purpose and scope

This guide explains the client/server architecture of **SMART MANAGER**, the boundaries between browser code and server code, the authentication and tenant-isolation model, the local development workflow, and the rules for adding new features safely. It is intended for developers joining the project who need a reliable path from repository checkout to a tested pull request.

The repository is a React/Vite frontend with a TypeScript/Express server, tRPC procedures, Supabase-backed authentication and persistence, Drizzle-based database utilities, automated tests, and Vercel/CI deployment configuration. The repository also contains optional vertical workspaces such as healthcare, pharmacy, school, hotel, restaurant, fleet, banking, microfinance, and community operations.

> **Core rule:** Browser code may present data and request authorized operations. It must not contain server secrets, service-role credentials, payment credentials, webhook secrets, or unverified tenant-wide access.

## 2. Architecture at a glance

The runtime has four important paths.

```text
Browser
  │
  ├─ React routes and workspace UI
  ├─ Supabase public client for authentication/session handling
  └─ tRPC client → /api/trpc
                         │
                         ▼
                  Express API app
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     Auth/context     tRPC routers     Scheduled/webhook routes
          │              │              │
          ▼              ▼              ▼
   Supabase JWT     validated inputs   provider verification
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      Supabase       Drizzle DB       External providers
      REST/RLS       utilities        email, payments, SMS, WhatsApp
```

The production API entry is `api/index.ts`. It imports the generated server bundle from `dist/api.js` and returns the Express application. The normal server entry is `server/_core/index.ts`. It starts the HTTP server locally, mounts Vite in development, and serves the built frontend in production. When `VERCEL=1`, the server entry does not open its own listener because Vercel loads the API handler as a serverless function.

## 3. Repository map

| Path | Responsibility | Typical change |
|---|---|---|
| `client/src/main.tsx` | Browser bootstrap, QueryClient, tRPC client, auth headers, service-worker registration | Change client providers or request transport |
| `client/src/App.tsx` | React providers and application routes | Add a route or adjust auth-gated surfaces |
| `client/src/BusinessSphereDashboard.jsx` | Main ERP shell and legacy/core dashboard composition | Modify shell layout, navigation, module routing, or shared dashboard behavior |
| `client/src/components/` | Feature workspaces and reusable UI components | Add or change a bounded module/workspace |
| `client/src/contexts/` | Auth, theme, language, and dashboard preference contexts | Change cross-cutting client state |
| `client/src/lib/` | Client utilities, Supabase auth client, tRPC transport, session storage, exports, guards | Change client-side infrastructure |
| `client/src/navigation/` | Enterprise navigation groups, ordering, visibility and presentation rules | Add or reorganize navigation items |
| `server/_core/` | Server bootstrap, Express app, environment, context, static serving and shared runtime utilities | Change server startup or request context |
| `server/routers.ts` | tRPC application router and procedure registration | Add a typed API query or mutation |
| `server/*.ts` | Domain services, provider integrations, persistence boundaries and contracts | Implement server-side business behavior |
| `shared/` | Types and constants shared by browser and server | Change a cross-layer data contract |
| `drizzle/` | Drizzle schema and migration metadata | Change legacy/local database schema or migrations |
| `supabase/migrations/` | Supabase SQL migrations and RLS/schema changes | Change the production tenant database contract |
| `supabase/functions/` | Supabase Edge Functions where applicable | Add a Supabase-native edge operation |
| `browser-tests/` | Playwright journeys and visual/interaction coverage | Validate user-visible flows |
| `server/*.test.ts` | Vitest unit, contract and integration tests | Protect server and source-level contracts |
| `.github/workflows/` | CI, schema checks, deployment, security and Android release automation | Change delivery gates |
| `api/` | Vercel API entrypoint | Keep aligned with generated `dist/api.js` output |

## 4. Client architecture

### 4.1 Browser bootstrap

`client/src/main.tsx` creates the TanStack Query client and the typed tRPC client. It mounts the application under `trpc.Provider`, `QueryClientProvider`, and the root `App` component.

The tRPC transport calls `/api/trpc` through `httpBatchLink`. Requests use `superjson` so dates and other supported structured values can cross the transport correctly. The request header logic attempts to obtain the current Supabase access token and sends it as both `Authorization` and `x-supabase-authorization`. The fetch wrapper also supplies credentials and invokes the session-recovery helper when an authenticated request requires recovery.

Do not create a second API client for an ordinary application procedure. Use the existing `trpc` client and the procedure exposed by `server/routers.ts`.

### 4.2 Application providers and routing

`client/src/App.tsx` composes the following cross-cutting layers:

1. `ErrorBoundary` protects the full application surface.
2. `AuthProvider` loads the public Supabase configuration, manages session state, and hydrates the authorized profile/workspace identity.
3. `ThemeProvider` manages theme preferences.
4. `LanguageProvider` manages language state.
5. `DashboardPreferencesProvider` manages presentation preferences.
6. `TooltipProvider` and `Toaster` provide shared interaction primitives.
7. The internal router maps `/`, `/app`, `/patient/sms-preferences`, and not-found paths.

Protected routes are rendered through `ProtectedSurface`. It distinguishes loading, unauthenticated, authentication error, unauthorized identity, public auth screens, and an authenticated application state. A new protected route should use the existing protection boundary rather than checking tokens directly in the page component.

### 4.3 Dashboard shell and workspaces

`BusinessSphereDashboard.jsx` is the main ERP shell. It contains the sidebar, topbar, responsive navigation, command palette entry point, notifications, settings access, profile menu placement, module presentation filtering, and the dispatch logic for workspace content.

The shell is intentionally permission-aware. A module should be hidden or locked when the current role, subscription, or presentation policy does not permit it. Do not use a client-only visibility change as a substitute for server authorization.

Large or bounded workspaces are placed in `client/src/components/`. Current examples include `OperationsCommandCenters.jsx`, `FinanceCommandCenters.jsx`, `PeopleCommandCenters.jsx`, `SectorCommandCenters.jsx`, `VerticalCommandCenters.jsx`, `HealthcareClinicWorkspace.jsx`, `PharmacyWorkspace.jsx`, `RestaurantWorkspace.jsx`, and `GlobalAdminControlCenter.tsx`.

When adding a workspace, keep the shell responsible for routing and high-level access while the workspace component owns its local presentation, filters, loading states, empty states, and user actions.

### 4.4 Client data access

Use the following pattern for server-backed data:

```tsx
const query = trpc.example.list.useQuery(input, {
  enabled: Boolean(requiredContext),
  retry: false,
});

const mutation = trpc.example.create.useMutation({
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: [["example", "list"]] });
  },
});
```

The exact invalidation key should follow the existing tRPC/TanStack Query conventions used by the neighboring feature. A client component should not fetch Supabase tables directly for a server-governed operation when an existing protected procedure is available.

## 5. Server architecture

### 5.1 Server startup and API composition

`server/_core/index.ts` loads environment variables, creates the Express API application through `createApiApp()`, and selects one of two modes:

- In development, it dynamically mounts the Vite development bridge.
- In production, it serves the built static frontend.

The same API application is exported for the Vercel entrypoint. This avoids maintaining a separate server implementation for local and hosted execution.

`server/_core/apiApp.ts` mounts Express routes for health checks, scheduled jobs, webhooks, and the tRPC middleware. The tRPC middleware is mounted at `/api/trpc` and uses `appRouter` plus `createContext`.

### 5.2 tRPC router model

`server/routers.ts` is the application router. A procedure normally has three layers:

1. **Input schema:** Validate and normalize input with Zod or the established project schema.
2. **Authorization boundary:** Use the appropriate protected/admin/role-aware procedure and request context.
3. **Domain operation:** Delegate to a domain service, persistence boundary, or provider module.

A simplified pattern is:

```ts
const exampleRouter = router({
  list: protectedProcedure
    .input(exampleListInput)
    .query(({ ctx, input }) => listExamples(ctx.req, input)),

  create: protectedProcedure
    .input(exampleCreateInput)
    .mutation(({ ctx, input }) => createExample(ctx.req, input)),
});
```

The real project contains many domain routers and service functions. Follow the nearest existing module rather than creating a new style.

### 5.3 Request context and identity

The server must derive identity from the authenticated request. The browser-provided JWT is a credential for identifying the session, not a permission grant for arbitrary tenant data.

Server operations should establish:

- authenticated user identity,
- profile and role,
- company/workspace identity,
- module/subscription access where relevant,
- write permission for the requested action,
- audit information for consequential mutations.

A request that cannot establish the required tenant identity must fail closed. Do not return synthetic tenant data to make an empty dashboard look populated.

### 5.4 Persistence boundaries

Supabase is the primary application data boundary for tenant-scoped rows and RLS-protected data. The repository also contains Drizzle database utilities in `server/db.ts` and schema/migration assets under `drizzle/`. Treat each existing persistence path as deliberate. Before adding a new table or write path, determine whether the feature belongs in Supabase migrations, Drizzle migrations, or an existing provider boundary.

Critical persistence helpers validate table names and payload boundaries before attempting writes. Preserve this order:

1. Validate the action and payload.
2. Validate the table/schema contract.
3. Establish tenant/company scope.
4. Perform the write using server-only credentials.
5. Record audit information where the domain requires it.
6. Return a safe response without provider secrets or unbounded raw errors.

Never put `SUPABASE_SECRET_KEY`, service-role credentials, payment keys, webhook secrets, or database URLs in browser code or `VITE_*` variables.

## 6. Authentication and authorization

### 6.1 Supabase session lifecycle

The browser auth client is in `client/src/lib/supabaseAuthClient.ts`. `AuthContext.tsx` initializes the client when public configuration is available, reads the existing session, listens for auth state changes, supports email/password and OAuth sign-in, supports password recovery, and hydrates the profile/workspace identity required by the application.

The intended session flow is:

```text
Public Supabase config
        ↓
Supabase auth session
        ↓
JWT attached to tRPC requests
        ↓
Server verifies request identity
        ↓
Profile/company/role hydration
        ↓
Protected dashboard surface
```

If identity hydration fails, the application should show the existing secure error or unauthorized state. Do not bypass the state machine by rendering tenant data from local storage.

### 6.2 Role and module access

Role-based navigation is implemented through enterprise navigation and the dashboard's visible-module/presentation filtering. This filtering is for safe user experience and discoverability. The server remains the source of truth for authorization.

Every mutation must perform a server-side authorization check. A hidden button is not an authorization mechanism.

For new permissions, update the relevant role/module contract, add tests for at least one allowed and one denied case, and verify that saved presentation preferences cannot surface a module that the current role cannot access.

### 6.3 Tenant isolation

All tenant-scoped reads and writes must be associated with the authenticated company/workspace. A developer should be able to answer these questions before merging a feature:

- Which request identity is used?
- Which company/workspace ID is used?
- Where is the tenant scope enforced?
- Which RLS or server guard protects the query?
- What happens when the company is missing or unauthorized?
- Is the action recorded in an audit ledger?

## 7. Environment configuration

The repository deliberately separates public configuration from server-only secrets.

| Variable group | Example values | Exposure |
|---|---|---|
| Public Supabase config | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Browser-safe, subject to Supabase RLS |
| Server Supabase config | `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Server/CI only |
| Runtime/security | `JWT_SECRET`, `DATABASE_URL`, `OWNER_OPEN_ID` | Server/CI only |
| Email | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Server only |
| Payment | `HARAKAPAY_API_KEY`, collection/webhook URLs | Server only |
| Healthcare SMS | provider URL, API key and webhook secret | Server only |
| Fleet/telemetry | `FLEET_TELEMATICS_WEBHOOK_SECRET` | Server only |
| Build/deployment | `VERCEL`, `BUILT_IN_FORGE_API_URL`, provider-specific values | Deployment environment |

Use `.env.example` as the starting reference. Never commit real credentials. Keep separate values for local development, preview, production, and CI. A URL is not automatically public; treat provider endpoints and callback URLs as configuration, while keys and signatures remain secrets.

## 8. Local development

### 8.1 Prerequisites

Install Node.js 22 or a compatible project-supported Node version, pnpm, Git, and access to the repository. A local Supabase project or an approved test configuration is recommended for authenticated flows.

### 8.2 Install and run

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The development server starts from `server/_core/index.ts`. It mounts the Vite bridge and serves the application locally. The preferred port is controlled by `PORT`; if occupied, the server searches the next available port.

### 8.3 Useful commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the development server with watch mode |
| `pnpm check` | Run TypeScript type-checking without emitting files |
| `pnpm test` | Run the Vitest suite |
| `pnpm exec vitest run path/to/test.ts` | Run a focused test file |
| `pnpm build` | Verify schema guard, Vite build and server bundles |
| `pnpm test:browser` | Run Playwright browser tests after the browser prebuild |
| `pnpm test:browser:offline` | Run offline fallback browser coverage |
| `pnpm test:browser:operations-visual` | Run operations visual/interaction coverage |
| `pnpm db:push` | Generate and apply Drizzle migrations where that path is appropriate |
| `pnpm verify:supabase-schema` | Run the Supabase schema verification guard |
| `pnpm format` | Format the repository with Prettier; review the resulting diff |

Before starting a feature, run at least `pnpm check` and the relevant focused tests to establish a clean baseline.

## 9. Adding a new feature

A safe feature normally follows this sequence.

### Step 1: Define the boundary

Write down the module, user roles, tenant scope, data sources, mutation actions, external providers, and expected empty/error states. Decide whether the feature is core ERP behavior or an optional vertical integration.

### Step 2: Inspect neighboring patterns

Find a similar workspace or router. Reuse its input schemas, loading conventions, error handling, source labels, audit patterns, and test structure. Avoid introducing a second state-management or API pattern.

### Step 3: Design the data contract

If data changes, define the table/schema/migration first. Include tenant/company identifiers, timestamps, status values, and audit fields required by the domain. Add or update RLS and schema contract tests before the UI depends on the data.

### Step 4: Implement server behavior

Add a typed procedure to the appropriate router. Validate input, enforce identity and permissions, delegate to a domain service, and avoid exposing raw provider responses. Add tests for happy paths, invalid input, unauthorized access, tenant mismatch, and provider failure where applicable.

### Step 5: Implement the client surface

Add a route or workspace entry through the existing navigation system. Use the existing tRPC client, TanStack Query loading/error patterns, responsive primitives, and shared empty states. Keep controls keyboard accessible and ensure the feature works in the mobile navigation path if the module is reachable there.

### Step 6: Add observability and audit behavior

For consequential mutations, record the actor, company, action, target and reason where the existing domain requires it. Add safe operational telemetry without logging tokens, passwords, payment credentials, or raw personal data unnecessarily.

### Step 7: Validate progressively

Run focused unit/contract tests first. Then run `pnpm check`, the relevant browser test, `git diff --check`, and the full `pnpm test`. Run `pnpm build` before opening the pull request. If the normal build requires deployment credentials, report that explicitly and run the equivalent local build steps that are available.

## 10. Testing strategy

The project uses several test layers.

| Layer | Tool/location | Use it for |
|---|---|---|
| Unit | Vitest, `server/*.test.ts` | Pure functions and domain transformations |
| Contract | Vitest source contracts | Stable UI, API, schema and security assumptions |
| Integration | Vitest integration tests | Router/service/persistence interactions |
| Browser | Playwright, `browser-tests/` | User journeys, navigation and responsive behavior |
| Build | TypeScript, Vite, esbuild | Compile and production-bundle compatibility |
| Schema | Supabase/Drizzle verification tests | Migration and RLS assumptions |

A source-contract test is not a replacement for a browser test. It protects an intentional source-level invariant, such as the existence of a security guard, an accessible label, or a module binding. When a redesign removes a legacy string, update the contract to test the new behavior rather than adding dead compatibility text solely to satisfy a stale assertion.

## 11. Deployment model

### Preview and production

The expected deployment path is:

```text
git branch → pull request → CI checks → Vercel preview → review → merge main → production deployment
```

Vercel builds the frontend and server bundles. The build invokes the Supabase schema verification precheck before the production build. The API entrypoint uses the generated `dist/api.js` bundle.

### Required deployment checks

Before production release, confirm:

- public Supabase URL and anonymous key are present,
- server Supabase URL and secret are present only in server environments,
- schema verification has a valid database/configuration path,
- callback/webhook URLs use HTTPS and the production domain,
- environment values are configured independently for preview and production,
- CI checks are green,
- browser smoke tests cover login, logout, navigation, a representative read, and one authorized mutation,
- no secrets or local files are included in the commit.

### Android wrapper

The `android/` directory contains a Trusted Web Activity wrapper around the web application. It reuses the production web app and does not create a second data layer. Production Android releases require organization-controlled signing secrets and a valid Digital Asset Links file. Android signing material must remain outside source files and frontend environment variables.

## 12. Security rules for contributors

1. Treat all browser input as untrusted.
2. Enforce authorization on the server for every query and mutation.
3. Enforce tenant/company scope on every tenant-scoped operation.
4. Keep service-role, database, payment, webhook, email and signing secrets server-side.
5. Do not log access tokens, refresh tokens, passwords or full payment payloads.
6. Validate provider webhook signatures before processing events.
7. Use idempotency for payment, webhook and scheduled operations where supported.
8. Prefer confirmed data over synthetic placeholder records.
9. Preserve audit trails for consequential administrative actions.
10. Add a regression test when fixing a security or data-isolation defect.

## 13. Troubleshooting guide

### The app displays “Authentication is unavailable”

Check that the public Supabase URL and anonymous key are configured, that the browser can reach Supabase, and that the auth redirect URL matches the current origin. Do not substitute the service-role key in the browser.

### tRPC returns an unauthorized error

Inspect whether the current Supabase session has an access token, whether `client/src/main.tsx` attached it to the request, and whether the server can hydrate the profile/company identity. Then confirm that the procedure's role and tenant guards allow the operation.

### A mutation succeeds but the UI is stale

Confirm that the mutation invalidates the relevant TanStack Query procedure and that the query key matches the existing tRPC query. Avoid manually duplicating server state in local storage.

### The build fails during Supabase verification

The normal `pnpm build` runs `pnpm verify:supabase-schema` first. Confirm the schema verification environment and the intended read-only database URL. Do not bypass schema verification for a production release without a documented equivalent check.

### A browser test is flaky on mobile

Check the mobile navigation path, touch-target size, safe-area handling, fixed overlays, viewport configuration, and whether the test is asserting a stable accessibility contract rather than a fragile implementation detail.

## 14. Pull request checklist

A contributor should confirm the following before requesting review:

- The feature has a documented user and tenant boundary.
- Inputs and mutations are validated server-side.
- Permissions are enforced on the server.
- Database changes include the correct migration/RLS/test updates.
- UI states cover loading, empty, error and success outcomes.
- Mobile and keyboard behavior have been considered.
- Relevant focused tests pass.
- `pnpm check` passes.
- Full `pnpm test` passes or any known environmental skip/failure is documented.
- `git diff --check` passes.
- `pnpm build` passes or the credential-gated step is clearly reported.
- No secrets, generated artifacts, or unrelated formatting changes are included.
- The PR explains the data contract, permission model, tests and deployment considerations.

## References

[1]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS "SMARTMANAGER-MANUS source repository"
[2]: https://supabase.com/docs/guides/auth "Supabase Auth documentation"
[3]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security documentation"
[4]: https://trpc.io/docs "tRPC documentation"
[5]: https://tanstack.com/query/latest/docs/framework/react/overview "TanStack Query React documentation"
[6]: https://vite.dev/guide/ "Vite documentation"
[7]: https://playwright.dev/docs/intro "Playwright documentation"
[8]: https://vercel.com/docs "Vercel documentation"
