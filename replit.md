# SmartReserve

Demand-aware offer booking platform. Businesses create discounted time-slot offers; customers browse and book publicly with real-time occupancy signals and demand indicators.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite, Tailwind CSS v4, shadcn/ui components, Recharts, wouter router
- API: Express 5 + WebSocket (ws)
- DB: PostgreSQL + Drizzle ORM (5 tables: users, businesses, offers, slots, bookings)
- Auth: JWT (jsonwebtoken) + bcryptjs, Bearer token via localStorage
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)
- `lib/db/src/schema.ts` — Drizzle schema (users, businesses, offers, slots, bookings)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/seed.ts` — DB seeder (runs on first boot)
- `artifacts/smartreserve/src/pages/` — React page components
- `artifacts/smartreserve/src/pages/admin/` — Admin pages (dashboard, businesses, offers, slots, bookings)

## Admin credentials

- Email: `admin@smartreserve.com`
- Password: `password123`

## Architecture decisions

- Contract-first: OpenAPI spec defines all endpoints, Orval generates typed hooks and Zod schemas
- JWT stored in localStorage; `setAuthTokenGetter` attaches Bearer header to all API calls automatically
- DB seeding runs on server boot and is idempotent (skips if admin user exists)
- WebSocket server initialized on the same HTTP server at `/ws`, broadcasts booking events in real-time
- `serializeOffer` / `serializeSlot` convert Drizzle numeric strings to JS numbers and compute derived fields (discountPercent, occupancyPercent, demandLevel, availableCount)

## Product

- **Public home**: live demand stats, booking activity feed, featured/trending/filling-fast offers
- **Offers list**: search + filter by category/city, real-time demand badges, occupancy bars
- **Offer detail**: slot selection with occupancy indicators, demand signal (recent bookings, recommended slot), booking form with confirmation reference
- **Admin dashboard**: live KPIs, booking activity feed, bar/pie charts, top offers with revenue
- **Admin businesses**: CRUD for business profiles
- **Admin offers**: CRUD with status management (Draft → Active → Paused)
- **Admin slots**: per-offer slot management with occupancy visualization
- **Admin bookings**: searchable table with customer details

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- API server builds via esbuild before starting — always restart the workflow after backend changes
- `db.execute()` returns a `QueryResult` object (not an array); use `.rows[0]` to access results
- Never array-destructure `db.execute()` results; only `db.select()` results are arrays

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
