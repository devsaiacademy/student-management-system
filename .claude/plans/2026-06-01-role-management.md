. # Role Management — super_admin / admin / staff / parent

**Status:** Design locked — ready to implement
**Date:** 2026-06-01

End-to-end plan for introducing a 4-role model (`super_admin`, `admin`, `staff`, `parent`) plus a user-management UI. The current system has a 2-role model (`admin`, `student`) baked into the `user_profiles` table, `current_user_role()` SQL function, RLS policies on every table, and the `handle_new_user()` Postgres trigger. This plan tracks the design decisions, migration strategy, RLS rewrite, and UI work in one place. Each open question below has a recommended answer; we resolve them one at a time before writing code.

## Diagram

### Current model

```
auth.users (Supabase Auth)
   │
   │ on insert → handle_new_user() trigger
   ▼
              ┌──────────────────────────────┐
              │ Email shape decides role:    │
              │   *@otomatiks.in  → admin    │
              │   matches student → student  │
              │   else            → REJECT   │
              └──────────────────────────────┘
   │
   ▼
public.user_profiles (id, role varchar(20))
   │
   ▼
current_user_role()  ── used by every RLS policy ──→ 'admin' | 'student'
```

### Target model (proposed)

```
                                 super_admin       ← seeded via SQL only
                                      │
                                      ▼ can manage
                                    admin
                                      │
                                      ▼ can manage
                              ┌───── staff ─────┐
                              │                 │
                              ▼                 ▼
                          (operational)      parent
                                                │
                                                ▼ reads only
                                              own student data
```

| Role | Created by | Manages | Sees |
|------|-----------|---------|------|
| super_admin | SQL seed / migration | admin, staff, parent | everything |
| admin | super_admin | staff, parent | everything in scope |
| staff | admin, super_admin | nothing (v1) | scope-defined (TBD) |
| parent | admin, super_admin | nothing | only own student(s) |

### User lifecycle (resolved)

No invitation email is sent. The admin pre-provisions both `auth.users` and
`user_profiles` in one server-side mutation; the user then signs in normally
via magic link from `/login`. The old `handle_new_user()` trigger is dropped
entirely — no email-shape inference, no rejection-on-login path.

```
super_admin / admin clicks Add ─► enters Name + Email + Role
        │
        ▼   tRPC: users.create({ email, name, role })
SERVER (single mutation):
        1. supabase.auth.admin.createUser({ email, email_confirm: true })
              ► no email sent; returns { id: <uuid> }
        2. INSERT INTO user_profiles (id, email, name, role, is_active=true)
              ► id == auth.users.id from step 1
        │
        ▼
        ... time passes ...
        │
        ▼
User goes to /login on their own, enters their email
        │
        ▼
Supabase sends magic link (this is normal Auth flow, not our invite)
        │
        ▼
User clicks link → session established → app reads
        user_profiles WHERE id = auth.uid() → { role, email, name, is_active }
        │
        ▼
Redirect by role: super_admin/admin → /admin, staff → /staff, parent → /student
```

## Worked example

A super_admin adds Priya as staff:

1. UI form: Name="Priya", Email="priya@otomatiks.in", Role="staff" → tRPC `users.create`.
2. Server, in one flow:
   - `supabase.auth.admin.createUser({ email: "priya@otomatiks.in", email_confirm: true })` → returns `id = a-uuid`.
   - `INSERT INTO user_profiles (id, email, name, role, is_active) VALUES ('a-uuid', 'priya@otomatiks.in', 'Priya', 'staff', true)`.
   - **No email is sent by our server.** Priya doesn't receive anything yet.
3. Priya, at some later point, goes to `/login` herself, enters `priya@otomatiks.in` → Supabase sends magic link (standard Auth flow, not our invite).
4. Priya clicks link → session established → middleware/server reads `user_profiles WHERE id = auth.uid()` → `role='staff'` → routes her to `/staff`.

Privilege-escalation block:

- Admin opens the role dropdown for another admin user. Dropdown shows `staff`, `parent`, `admin`. **`super_admin` is hidden client-side AND server-side rejects the mutation** with `FORBIDDEN` if anyone tries to set it via crafted API call.

## Decisions (filled in as we grill)

| # | Decision | Status |
|---|----------|--------|
| 1 | Replace `student` role with `parent`, or keep `student` and add `parent` alongside it? | **resolved → rename.** `student` role becomes `parent`. Same login mechanism (`students.email` = parent's email); existing `students.auth_user_id` keeps its meaning. RLS swaps `'student'` → `'parent'`. |
| 2 | Role storage: pg enum `user_role` vs varchar + CHECK? | **resolved → pg enum** `user_role AS ENUM('super_admin','admin','staff','parent')`. Consistent with existing `payment_status` etc. enums in the schema. |
| 3 | User identity fields on `user_profiles`? | **resolved.** Add `email citext UNIQUE NOT NULL`, `name text NOT NULL`. Keep `id uuid PRIMARY KEY` = `auth.users.id`. No `is_active` column — see Q5. |
| 4 | Invitation flow vs self-signup? | **resolved → admin pre-provisions both rows.** Server-side `users.create` mutation calls `supabase.auth.admin.createUser({ email, email_confirm: true })` (no email sent), then `INSERT INTO user_profiles (id, email, name, role)` with the returned uuid. User then signs in via magic link at `/login`. The `handle_new_user()` trigger is dropped — profile creation is fully explicit in the tRPC mutation, no email-shape inference. |
| 5 | Deactivate semantics? | **resolved → no deactivate; delete only.** System is small enough that reversibility isn't worth the column. The spec's "deactivate" and "delete" collapse into a single verb: **Delete** = `supabase.auth.admin.deleteUser(uid)` + `DELETE FROM user_profiles WHERE id = uid`. No `is_active` flag, no force-signOut, no `auth.users.banned_until`. To revoke access in an emergency, delete the user; to re-grant later, re-create them via the Add form. |
| 6 | "Admin scope" — is multi-tenancy/branches a thing, or is scope just "everything"? | **resolved → no scope axis.** Admin, super_admin, and staff (per their capabilities) see all rows; no branches/tenancy. "Within their scope" in the spec is treated as boilerplate. |
| 7 | RLS rewrite approach? | **resolved.** Keep `current_user_role()` SQL function (returns text). Data tables (`students`, `enrollments`, `payments`, `student_progress`, `razorpay_orders`): `current_user_role() IN ('admin','super_admin','staff')` for read/write; parent branch stays `= 'parent'` with own-student filter. `user_profiles` writes: `IN ('admin','super_admin')`. Staff-specific carve-outs (mark-unpaid, toggle-partial) are enforced **only at the tRPC procedure layer**, not RLS — they're business-action gates, not row gates. |
| 8 | Bootstrapping super_admin — drop the `isOtomatiksAdminEmail` shim entirely? | **resolved → YES.** No email-shape checks anywhere. Access is decided only by `user_profiles.role` looked up via `auth.uid()`. Delete `isOtomatiksAdminEmail()`, the gmail backdoor, and the `@otomatiks.in` branch in `handle_new_user()`. |
| 9 | Staff capabilities in v1? | **resolved → admin minus three things.** Staff can do everything admin can EXCEPT: (a) create/edit/deactivate/delete users, (b) `markPaymentAsUnpaid`, (c) toggle `partialPaymentEnabled`. New middleware: `staffProcedure` (admin/super_admin/staff), `adminProcedure` (admin/super_admin only), `superAdminProcedure` (super_admin only — for creating `admin`-role users). |
| 10 | Parent ↔ student linking? | **resolved → reuse existing mechanism.** Parent is today's `student` role renamed; link stays as `students.email = auth.users.email` resolved at trigger time into `students.auth_user_id`. No new FK. (If we ever support "one parent, multiple kids", add a `parent_user_id` column then.) |

## Open questions

All design questions resolved during grilling. See Decisions table above.

## Manual step (you)

After the migration runs, **promote your own row to `super_admin` in the Supabase Studio**:

```sql
UPDATE public.user_profiles SET role = 'super_admin' WHERE email = '<your email>';
```

This step is intentionally not in the migration — `super_admin` is seeded by hand per the spec.

## Tasks

### 1. Database migration (`packages/db`)

- [ ] Create pg enum `user_role AS ENUM('super_admin','admin','staff','parent')`.
- [ ] `ALTER user_profiles.role TYPE user_role` with `CASE` to map `'student' → 'parent'`, `'admin' → 'admin'`.
- [ ] Add columns: `email citext NOT NULL UNIQUE`, `name text NOT NULL`. Backfill `email` from `auth.users.email`, `name` from `auth.users.raw_user_meta_data->>'name'` (fallback to email local-part). No `is_active` column — see Q5.
- [ ] `DROP TRIGGER on_auth_user_created` and `DROP FUNCTION handle_new_user()`.
- [ ] Rewrite all RLS policies that reference `'student'` → `'parent'`.
- [ ] Rewrite all RLS policies that reference `'admin'` for data tables → `IN ('admin','super_admin','staff')`.
- [ ] `user_profiles` RLS: self-read for everyone; admin+super_admin read/write on others; staff blocked from writing.
- [ ] Generate via `pnpm db:generate --name role_management_overhaul` (do not hand-write the timestamp/journal).

### 2. tRPC middleware (`packages/api/src`)

- [ ] Replace `isOtomatiksAdminEmail` callers; delete the file once unused.
- [ ] Extend `Context` to include `role: UserRole` and `userProfile: { id, email, name, role }`.
- [ ] New procedures: `staffProcedure` (admin/super_admin/staff), `adminProcedure` (admin/super_admin), `superAdminProcedure` (super_admin only).
- [ ] Repoint `payment.markPaymentAsUnpaid` and the partial-payment toggle in `razorpay.ts` to `adminProcedure` (already there — but the procedure itself changes meaning).
- [ ] Repoint all other operational mutations from `adminProcedure` → `staffProcedure`.

### 3. Users router (`packages/api/src/routers/users.ts` — new)

- [ ] `list` (adminProcedure): paginated list with name/email/role.
- [ ] `create` (adminProcedure): server-side `supabase.auth.admin.createUser({ email, email_confirm: true })` + `INSERT INTO user_profiles`. Role validation: admin cannot set role='admin' or 'super_admin'; super_admin cannot set role='super_admin'.
- [ ] `update` (adminProcedure): edit name + role (same role-elevation rules).
- [ ] `delete` (adminProcedure): `supabase.auth.admin.deleteUser(uid)` + `DELETE FROM user_profiles` (the only revoke path; per Q5 there is no deactivate).
- [ ] Wire into `appRouter`.

### 4. Student-creation parent linking (`packages/api/src/routers/students.ts`)

- [ ] In the create-student mutation, after inserting the `students` row, also `supabase.auth.admin.createUser` + `INSERT INTO user_profiles { role: 'parent' }` using the student's email.
- [ ] Handle the case where a row already exists for that email (idempotent).

### 5. Middleware + redirects (`apps/web/src/lib/supabase/middleware.ts` + admin/student layouts)

- [ ] Read role from `user_profiles` after auth; redirect by role (`super_admin`/`admin`/`staff` → `/admin`, `parent` → `/student`).
- [ ] If no `user_profiles` row exists for the authenticated `auth.uid()`: sign out + redirect to `/login?reason=no_profile`. (This is how "deleted" users get bounced — their auth.users row is gone too, so this is mainly a defensive net.)
- [ ] Drop the `isOtomatiksAdminEmail` calls from `admin/layout.tsx`.

### 6. Users page UI (`apps/web/src/app/admin/users/...` — new, matches mockup)

- [ ] Page with table: avatar / name / email / role / actions (edit, delete).
- [ ] Sticky header: Name, Email, Role dropdown, Add button.
- [ ] Add/Edit modal with form validation (zod).
- [ ] Role dropdown options derived from caller's role (admin sees staff/parent; super_admin sees staff/parent/admin — never super_admin).
- [ ] Loading skeleton matching the table layout (per `feedback_update_skeletons_with_ui`).
- [ ] Sidebar entry: "Users" (replacing the mockup's "Teachers" label — the page is generic).

### 7. Cleanup

- [ ] Remove `packages/api/src/lib/admin-email.ts`.
- [ ] Remove the hardcoded `connectbalajidev@gmail.com` backdoor.
- [ ] Update `welcome-redirector.tsx` to route by role.
- [ ] Smoke-test in the browser: create staff, log in as staff, hit operational pages, attempt mark-unpaid (should 403), deactivate self via another admin, confirm bounce.

## Out of scope

- Granular per-staff permission grants ("additional permissions in the future" per spec).
- Multi-tenancy / branch-level isolation.
- Audit log of user-management actions (worth a follow-up phase).
- Parent self-signup (parents are created server-side from add-student).
- Bulk import of staff/admin via CSV.
