

## Phase 3: Objectives & Key Results (OKRs)

This phase adds the core OKR functionality -- Objectives linked to Cycles, and Key Results linked to Objectives -- completing the main business logic of the platform.

---

### Part A: Database Tables

**New tables via migration:**

1. **`objectives`** table:
   - `id` UUID PK (default `gen_random_uuid()`)
   - `title` text NOT NULL
   - `description` text
   - `cycle_id` UUID NOT NULL (FK -> cycles.id ON DELETE CASCADE)
   - `owner_id` UUID NOT NULL (FK -> profiles.id)
   - `status` text NOT NULL DEFAULT 'on_track' (on_track, at_risk, behind, completed)
   - `progress` integer NOT NULL DEFAULT 0 (0-100, computed from key results)
   - `metadata` JSONB DEFAULT '{}'
   - `created_at`, `updated_at` timestamps
   - Indexes on cycle_id, owner_id, status

2. **`key_results`** table:
   - `id` UUID PK (default `gen_random_uuid()`)
   - `title` text NOT NULL
   - `description` text
   - `objective_id` UUID NOT NULL (FK -> objectives.id ON DELETE CASCADE)
   - `owner_id` UUID NOT NULL (FK -> profiles.id)
   - `kr_type` text NOT NULL DEFAULT 'percentage' (percentage, number, currency, boolean)
   - `start_value` numeric NOT NULL DEFAULT 0
   - `target_value` numeric NOT NULL DEFAULT 100
   - `current_value` numeric NOT NULL DEFAULT 0
   - `unit` text (e.g. '%', 'R$', 'users')
   - `status` text NOT NULL DEFAULT 'on_track'
   - `metadata` JSONB DEFAULT '{}'
   - `created_at`, `updated_at` timestamps
   - Indexes on objective_id, owner_id

3. **RLS policies:**
   - SELECT on both tables: all authenticated users
   - INSERT/UPDATE on objectives: admin, okr_master, or owner
   - INSERT/UPDATE on key_results: admin, okr_master, or owner
   - DELETE on both: admin only

4. **Triggers:**
   - Audit trigger on both tables (reuse `audit_trigger_fn`)
   - Auto-update `objectives.progress` when key_results change (trigger function that calculates average progress)
   - `updated_at` auto-update trigger on both tables

5. **Enable realtime** on `key_results` for live progress updates

---

### Part B: Frontend -- Hooks

**New files:**
- `src/hooks/useObjectives.ts` -- CRUD hook for objectives filtered by cycle_id. Uses TanStack Query with queryKey `["objectives", cycleId]`.
- `src/hooks/useKeyResults.ts` -- CRUD hook for key results filtered by objective_id. Includes a `updateProgress` mutation for quick value updates. QueryKey `["key-results", objectiveId]`.

---

### Part C: Frontend -- Pages and Components

**New files:**
- `src/pages/objectives/ObjectivesList.tsx` -- Lists objectives for a given cycle. Shows progress bar, status badge, owner avatar, and KR count. Accessed from CycleDetail page.
- `src/pages/objectives/ObjectiveForm.tsx` -- Dialog form to create/edit an objective (title, description, owner selection, status).
- `src/pages/objectives/ObjectiveDetail.tsx` -- Detail view showing objective info + list of Key Results with inline progress editing (slider or number input).
- `src/components/okr/KeyResultCard.tsx` -- Card component for a single KR showing title, progress bar (colored by status), current/target values, and inline edit capability.
- `src/components/okr/KeyResultForm.tsx` -- Dialog form to create/edit a key result (title, type, start/target/current values, unit).
- `src/components/okr/ProgressBar.tsx` -- Reusable progress bar with color coding: green (on_track), yellow (at_risk), red (behind), blue (completed).

**Modified files:**
- `src/pages/cycles/CycleDetail.tsx` -- Replace the "Nenhum OKR vinculado" placeholder with the actual ObjectivesList component. Add "Novo Objetivo" button for authorized users.
- `src/App.tsx` -- Add routes:
  - `/objectives/:id` -> DashboardLayout -> ObjectiveDetail
- `src/components/layout/AppSidebar.tsx` -- Add "Objetivos" nav item (Target icon) -> `/cycles` (objectives are accessed through cycles)

---

### Technical Details

**Database migration SQL (single migration):**
- CREATE TABLE `objectives` with columns, indexes, RLS (4 policies), audit trigger
- CREATE TABLE `key_results` with columns, indexes, RLS (4 policies), audit trigger
- CREATE FUNCTION `update_objective_progress()` -- recalculates objective progress as average of its KRs
- CREATE TRIGGER on `key_results` AFTER INSERT/UPDATE/DELETE to call `update_objective_progress()`
- CREATE TRIGGER for `updated_at` on both tables
- ALTER PUBLICATION `supabase_realtime` ADD TABLE `key_results`

**Files created (8):**
- `src/hooks/useObjectives.ts`
- `src/hooks/useKeyResults.ts`
- `src/pages/objectives/ObjectivesList.tsx`
- `src/pages/objectives/ObjectiveForm.tsx`
- `src/pages/objectives/ObjectiveDetail.tsx`
- `src/components/okr/KeyResultCard.tsx`
- `src/components/okr/KeyResultForm.tsx`
- `src/components/okr/ProgressBar.tsx`

**Files modified (3):**
- `src/pages/cycles/CycleDetail.tsx` -- Integrate ObjectivesList
- `src/App.tsx` -- Add objective detail route
- `src/components/layout/AppSidebar.tsx` -- Minor nav update

**No new dependencies needed.**

