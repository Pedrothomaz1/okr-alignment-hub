

## Phase 1: Authentication & RBAC Foundation

This phase establishes the core authentication system and role-based access control that all future features will build upon.

### 1. Database Setup (Lovable Cloud)

**Users & Profiles**
- Enable Lovable Cloud and set up the database
- Create a `profiles` table linked to Supabase Auth users (id, email, full_name, avatar_url, metadata, created_at, updated_at)
- Auto-create profile on signup via database trigger

**RBAC Tables**
- Create `app_role` enum (admin, okr_master, manager, member)
- Create `user_roles` table (user_id, role) with proper foreign keys and unique constraints
- Create `permissions` table (key, description, metadata) for granular permission checks (e.g., `okr.create`, `cycle.approve`)
- Create `role_permissions` junction table linking roles to permissions
- Create `audit_logs` table (actor_id, entity_type, entity_id, action, before/after JSONB, metadata, created_at)
- Add all necessary indexes for performance

**Security (RLS Policies)**
- `profiles`: users read/update own row; admins read all; no direct deletes
- `user_roles`: users read own roles; admins manage all roles
- `permissions` & `role_permissions`: read by authenticated users; write by admins only
- `audit_logs`: insert by triggers/service role; read by admins
- Use `security definer` function `has_role()` to avoid recursive RLS

### 2. Auth Sync & Audit

**Auth Sync Edge Function**
- Edge function triggered on auth events (user created/updated/deleted)
- On signup: insert profile row + assign default "member" role
- On update: sync email, name, avatar changes
- On delete: soft-delete (archive) the profile + audit log entry

**Audit Trigger**
- Database trigger on `profiles` and `user_roles` for INSERT/UPDATE/DELETE
- Captures before/after state and actor into `audit_logs`

### 3. Frontend Pages

**Login & Signup**
- Login page with email + password form
- Signup page with email, password, full name
- 2FA setup flow after initial login (using Supabase Auth MFA/TOTP)
- 2FA verification screen for subsequent logins
- Password reset flow
- Protected route wrapper that redirects unauthenticated users

**Admin: Roles & Permissions**
- Admin page listing all users with their roles
- Assign/remove roles modal with user search
- Permissions management view (view which permissions each role has)
- All admin pages gated behind `has_role(admin)` check

**Audit Log Viewer**
- Filterable table showing audit entries (by actor, date, entity type, action)
- Before/after JSON diff display
- Pagination and date range filters

### 4. Shared Hooks & Utilities
- `useAuth` hook: login, logout, signup, session management, 2FA enrollment/verification
- `useRoles` hook: check current user's roles and permissions
- `useAuditLogs` hook: fetch paginated audit entries
- Zod schemas for all form validation (login, signup, profile update)
- Centralized error handling with toast notifications

