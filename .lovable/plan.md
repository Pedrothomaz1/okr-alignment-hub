

## Phase 2: DashboardLayout with Sidebar + Cycles & Governance

This phase adds two things: (1) a proper enterprise layout with a persistent dark-green sidebar navigation using the LexFlow design system, and (2) the Cycles & Governance database tables and UI.

---

### Part A: DashboardLayout with Sidebar

**New files:**
- `src/components/layout/AppSidebar.tsx` -- Dark-green sidebar with navigation items (Dashboard, Admin, 2FA Settings), user info footer, sign-out button. Uses the shadcn `Sidebar` component with LexFlow sidebar tokens.
- `src/components/layout/DashboardLayout.tsx` -- Wraps `SidebarProvider` + `AppSidebar` + global header with `SidebarTrigger` + `<main>` content area with `p-6`. Uses `<Outlet>` for nested routes.

**Modified files:**
- `src/App.tsx` -- Restructure routes so all protected pages are nested under `DashboardLayout`. Admin pages nested further under `AdminRoute`. Routes become:
  - `/` -> DashboardLayout -> Dashboard (home)
  - `/settings/2fa` -> DashboardLayout -> MFASettings
  - `/admin/users` -> DashboardLayout -> AdminRoute -> UsersRoles
  - `/admin/audit` -> DashboardLayout -> AdminRoute -> AuditLogs
  - `/cycles` -> DashboardLayout -> CyclesList (new)
  - `/cycles/:id` -> DashboardLayout -> CycleDetail (new)
- `src/pages/Dashboard.tsx` -- Remove inline header (now in layout), keep only the welcome card and stat cards content.
- `src/pages/admin/AdminLayout.tsx` -- Remove standalone layout wrapper since sidebar is now global. Convert to a simple component or remove entirely (admin pages render directly inside DashboardLayout).

**Sidebar navigation items:**
- Dashboard (Home icon) -> `/`
- Cycles (CalendarDays icon) -> `/cycles`
- Admin group (visible only for admin role):
  - Users & Roles (Users icon) -> `/admin/users`
  - Audit Logs (FileText icon) -> `/admin/audit`
- Settings group:
  - 2FA Settings (Shield icon) -> `/settings/2fa`
- Footer: User avatar/name + Sign Out button

---

### Part B: Cycles & Governance Database

**New database tables (migration):**

1. `cycles` table:
   - `id` UUID PK
   - `name` text NOT NULL
   - `description` text
   - `start_date` date NOT NULL
   - `end_date` date NOT NULL
   - `status` text NOT NULL DEFAULT 'draft' (draft, active, closed, archived)
   - `created_by` UUID NOT NULL (references profiles.id)
   - `metadata` JSONB
   - `created_at`, `updated_at` timestamps
   - Indexes on status, dates, created_by

2. RLS policies on `cycles`:
   - SELECT: all authenticated users can read
   - INSERT: users with `admin` or `okr_master` role
   - UPDATE: users with `admin` or `okr_master` role
   - DELETE: admin only

3. Audit trigger on `cycles` table (reuses existing `audit_trigger_fn`)

**New frontend files:**

- `src/hooks/useCycles.ts` -- CRUD hook using TanStack Query for cycles (list, create, update, delete)
- `src/pages/cycles/CyclesList.tsx` -- Table listing all cycles with status badges, date ranges, actions (create, edit, archive). Uses `.card-elevated`, `.table-row-hover`, `.btn-cta` for "New Cycle" button.
- `src/pages/cycles/CycleForm.tsx` -- Dialog/modal form to create or edit a cycle (name, description, start/end dates, status). Uses React Hook Form + Zod validation.
- `src/pages/cycles/CycleDetail.tsx` -- Detail view for a single cycle showing metadata, status, timeline. Placeholder sections for future OKR linking.

---

### Technical Details

**Database migration SQL:**
- CREATE TABLE `cycles` with all columns and indexes
- Enable RLS, add 4 policies (select, insert, update, delete) using `has_role()` function
- CREATE TRIGGER for audit logging on cycles
- Validation trigger for `end_date > start_date`

**Files created (6):**
- `src/components/layout/AppSidebar.tsx`
- `src/components/layout/DashboardLayout.tsx`
- `src/hooks/useCycles.ts`
- `src/pages/cycles/CyclesList.tsx`
- `src/pages/cycles/CycleForm.tsx`
- `src/pages/cycles/CycleDetail.tsx`

**Files modified (3):**
- `src/App.tsx` -- Route restructuring
- `src/pages/Dashboard.tsx` -- Remove header, keep content only
- `src/pages/admin/AdminLayout.tsx` -- Simplify or remove

**No new dependencies needed.** All components use existing shadcn/ui + Lucide icons + TanStack Query.

