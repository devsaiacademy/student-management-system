# Must-do

Outstanding work that the current implementation is knowingly cutting corners on. Each item has enough context that a future contributor (or future-you) can pick it up without re-reading a chat log.

---

## 1. Replace regex-based admin check with an `allowed_admins` table

### Current state

`isAdmin` in `packages/api/src/routers/auth.ts` calls `isOtomatiksAdminEmail(ctx.user.email)`, which tests the email against the regex `/^[^@\s]+@otomatiks\.in$/i` (defined in `packages/api/src/lib/admin-email.ts`).

Anyone whose email ends in `@otomatiks.in` is treated as an admin. That means:

- An employee who leaves the company but still has a mailbox remains an admin until their mailbox is disabled.
- Any distribution list or shared inbox at `@otomatiks.in` (`support@`, `hr@`, `interns@`) implicitly grants admin to everyone on it.
- A compromised company mailbox becomes an admin compromise.
- A rebrand to a different domain requires a code change + redeploy instead of a DB update.
- There is no "revoke admin" action short of disabling the Supabase user entirely.

This is a *stopgap*, not authorization.

### Target state

A dedicated table whose **only purpose** is to list the humans who are allowed to administer the system. `isAdmin` reads from this table. Nothing else derives admin status.

### Schema sketch

Two reasonable shapes; pick one based on whether you want to grant by email before a user has signed in.

**Option A — `allowed_admins` keyed by auth UID (simpler, no orphans)**

```sql
CREATE TABLE public.allowed_admins (
  user_id   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at  timestamptz NOT NULL DEFAULT now(),
  added_by  uuid REFERENCES auth.users(id),
  note      text
);

ALTER TABLE public.allowed_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY allowed_admins_select_own ON public.allowed_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY allowed_admins_select_admin ON public.allowed_admins
  FOR SELECT TO authenticated
  USING (public.current_user_role() = 'admin');
```

- `user_id` foreign-keys `auth.users`, so a row can only exist for someone who has signed up at least once.
- Granting admin requires the person to log in first, then you `INSERT INTO allowed_admins (user_id) VALUES ('<uid>')`.
- Revoking is a single `DELETE` and is instant.
- `ON DELETE CASCADE` means deleting the Supabase user auto-drops the admin grant.

**Option B — `allowed_emails` keyed by email (can pre-authorize)**

```sql
CREATE TABLE public.allowed_emails (
  email     text PRIMARY KEY,     -- store lowercased
  role      text NOT NULL CHECK (role IN ('admin')),
  added_at  timestamptz NOT NULL DEFAULT now(),
  added_by  uuid REFERENCES auth.users(id),
  note      text
);
```

- Lets you pre-authorize someone before they sign up: insert `('alice@otomatiks.in', 'admin', ...)` and the first time Alice logs in she's already an admin.
- Downside: email changes in Supabase auth don't propagate. Alice updates her email → she loses admin until someone updates the `allowed_emails` row.
- Also: you're back to using email as identity, which is the thing this migration is trying to get away from. Only choose this if the "pre-authorize before first login" workflow is non-negotiable.

**Recommendation**: Option A. Simpler, uses the stable identifier, no orphan rows, and the bootstrap pain ("Alice has to log in once before being granted admin") is a one-time manual SQL for your first admin and an admin UI operation for everyone after.

### Code changes

1. Add the table via a Drizzle schema file (`packages/db/src/schema/allowed-admins.ts`) and a migration.
2. Replace `isAdmin` in `packages/api/src/routers/auth.ts`:
   ```ts
   isAdmin: protectedProcedure.query(async ({ ctx }) => {
     const [row] = await db
       .select({ userId: allowedAdmins.userId })
       .from(allowedAdmins)
       .where(eq(allowedAdmins.userId, ctx.user.id))
       .limit(1);
     return Boolean(row);
   }),
   ```
3. Delete `isOtomatiksAdminEmail` from the **server path** (the router no longer imports it). Keep the helper file and its client-side usage — see item 2 below.
4. Bootstrap: in Supabase SQL editor, run `INSERT INTO allowed_admins (user_id) VALUES ('<your-auth-uid>');` once. Every subsequent admin is granted by an existing admin via an admin UI (which also doesn't exist yet — flag).
5. Consider adding a Postgres trigger that forbids deleting the last admin row, so you can't accidentally lock yourself out.

### What this closes

- Email-domain coupling is gone from authorization.
- Revoke is a `DELETE`.
- Audit trail lives in the table (`added_at`, `added_by`, `note`).
- No code change required to promote/demote — it's data.

---

## 2. The login form's domain check only fires on the admin path

### The quirk

`apps/web/src/components/login.tsx:28-67` branches on the `role` query param. Today there are two branches:

```ts
switch (role) {
  case "parent": {
    // Look up the email in the students table.
    // If no match → "You're email is not registered, contact admin for access."
    break;
  }
  default: {
    // Look up the email against the otomatiks.in regex.
    // If no match → "You are not allowed to login with this email, use your otomatiks.in email."
    break;
  }
}
```

The otomatiks.in domain check **only runs in the `default:` branch**, which is taken when:

- There is no `?role` query param at all, or
- `?role` is any value other than `"parent"` (e.g., a typo like `?role=admni`, or a future `?role=teacher` you add without updating this switch).

### Why this is not a bug today

The existing flow has exactly two entry points and both are correct:

| Entry point | `?role` | Which branch | Check used |
|---|---|---|---|
| Student / parent portal | `?role=parent` | `case "parent"` | Must exist in `students` table (by email) |
| Admin portal | absent or anything else | `default` | Must be `@otomatiks.in` |

A parent should *not* be domain-locked — they're external users signing in with their personal email to view their child's billing. A `.includes(...) / regex` check would lock them out, which is why the branch is structured this way. The UX copy even reflects this: the parent branch says "not registered, contact admin," while the admin branch says "use your otomatiks.in email."

### Why it is a footgun for later

The `default:` case is the problem. It's a catch-all that silently applies the admin rule to *any* unknown role. Concretely:

- Add `?role=teacher` later → falls into `default` → teacher has to have an `@otomatiks.in` email → probably wrong, probably not what you meant.
- A bug in the route that forwards `role` loses it → falls into `default` → suddenly all traffic hits the admin domain check.
- A user hand-edits the URL to `?role=student` to test → falls into `default` → wrong error message.

A `default` branch that silently does "the admin thing" is a time bomb that will go off the first time a new role is added without a corresponding case.

### Fix when you add a third role

Rewrite the branching so **there is no fallback** and every known role has an explicit case:

```ts
type LoginRole = "parent" | "admin"; // extend as needed

function assertRole(role: string | null): LoginRole {
  if (role === "parent") return "parent";
  if (role === null || role === "admin") return "admin"; // treat missing as admin
  throw new Error(`Unknown login role: ${role}`);
}

const loginRole = assertRole(role);

switch (loginRole) {
  case "parent": {
    // students table lookup
    break;
  }
  case "admin": {
    if (!isOtomatiksAdminEmail(email)) {
      // toast and return
    }
    break;
  }
}
```

Now:

- TypeScript catches any `case` missing from the switch via exhaustiveness checking (add `const _exhaustive: never = loginRole` at the bottom if you want it strict).
- An unknown `?role=foo` throws a loud error instead of silently applying the admin filter.
- Adding `teacher` means adding a `case "teacher"` — the compiler forces you to decide what rule applies, it doesn't default to admin.

### Is this a "must" now?

No. There are only two roles and the current shape works. This is a **"must remember when you add a third role"** — the reason it lives in this file is so future-you sees it before adding `?role=teacher` and wondering why teachers are being told to use `@otomatiks.in`.

### Related: the sidebar query params

See item 3 below. That issue was promoted out of this subsection because it's live today, not a future concern.

---

## 3. Sidebar logout redirects use fake role values

### The issue in one sentence

`admin-sidebar.tsx:48` redirects to `/login?role=teacher` and `student-sidebar.tsx:33` redirects to `/login?role=parent`, but the `login.tsx` switch only has `case "parent"` and a `default` fallback — so `?role=teacher` lands in `default`, which happens to be the admin domain check. The URL claims "teacher" but the code does "admin", purely by accident.

### The two files, exact lines

- `apps/web/src/components/admin/admin-sidebar.tsx:48` → `router.push("/login?role=teacher");`
  - **Lies.** There is no teacher role anywhere in this codebase. The string could be `?role=banana` and the behavior would be identical.
- `apps/web/src/components/student/student-sidebar.tsx:33` → `router.push("/login?role=parent");`
  - Correct. `"parent"` matches the explicit `case "parent"` at `apps/web/src/components/login.tsx:32`.

### Why it's a live bug, not a future concern

It's not producing wrong behavior *right now* — admins logging out do end up going through the admin domain check, which is what you want. But it's wrong in a way that will bite the moment someone trusts the URL:

- A future `case "teacher":` added to handle real teachers would silently remove the domain check from the admin logout path. Admins would stop being forced to use an `@otomatiks.in` email on relogin.
- A reviewer reading the sidebar assumes teachers are a role in this app. They aren't.
- Anyone who searches the codebase for `"teacher"` gets a misleading hit.

The bug is *semantic*, not *behavioral*. Semantic bugs are the ones you don't notice until the day you have to trust the symbol.

### The fix

Two equally valid options, pick one:

**Option A — drop the param entirely.** The logout flow doesn't need to communicate a role to the login page; the login page already defaults to the admin check when no role is present.

```ts
// admin-sidebar.tsx:48
router.push("/login");

// student-sidebar.tsx:33
router.push("/login?role=parent");  // keep — parent is legit
```

**Option B — use a truthful role string and make the switch exhaustive (ties into item 2).**

```ts
// admin-sidebar.tsx:48
router.push("/login?role=admin");

// login.tsx switch — add explicit case
case "admin": {
  if (!isOtomatiksAdminEmail(email)) { /* toast */ return; }
  break;
}
```

Option A is a one-character edit and doesn't touch `login.tsx`. Option B pairs naturally with item 2 (exhaustive switch when adding a third role). Do A now, do B when you do item 2.

---

## 4. Typed routes are enabled but bypassed with `as Route` casts

### The issue

`apps/web/next.config.ts` has `typedRoutes: true`. That flag makes Next.js generate a TypeScript `Route` union containing every valid URL in the app — any `<Link href="/typo">` becomes a compile error.

Four call sites opt *out* of that safety net with `as Route`:

| File | Line | Cast |
|---|---|---|
| `apps/web/src/components/admin/admin-sidebar.tsx` | 91 | `href={item.href as Route}` |
| `apps/web/src/components/student/student-sidebar.tsx` | 74 | `href={item.href as Route}` |
| `apps/web/src/components/admin/student-card.tsx` | 67 | ``href={`/admin/all-students/student/${student.id}` as Route}`` |
| `apps/web/src/components/admin/pagination.tsx` | 87 | `router.push(buildHref(page) as Route)` |

### Why each cast exists, and how to remove it

**Sidebars — `navItems.map(item => <Link href={item.href as Route}>)`**

The `navItems` array is inferred as `{ label: string; href: string; icon: ... }[]`, so `item.href` is `string`, which isn't assignable to `Route`. The fix is to narrow at the array declaration, not at the use site:

```ts
import type { Route } from "next";

const navItems = [
  { label: "Students", href: "/admin/all-students", icon: Users },
  { label: "Add Student", href: "/admin/add-student", icon: UserPlus },
  // ...
] as const satisfies ReadonlyArray<{ label: string; href: Route; icon: LucideIcon }>;
```

`as const` narrows each `href` to its literal string type (e.g., `"/admin/all-students"`), and `satisfies` verifies each literal against the generated `Route` union at compile time. Rename a route, the `navItems` array fails to compile, you find out before the browser does. The `as Route` at the JSX site goes away.

**`student-card.tsx:67` — dynamic student detail URL**

```tsx
href={`/admin/all-students/student/${student.id}` as Route}
```

The generated `Route` type has `` `/admin/all-students/student/${string}` `` as one of its variants. The template literal here produces `` `/admin/all-students/student/${number}` `` (because `student.id` is `number`), which doesn't match `${string}` exactly. Two fixes:

```tsx
// Option 1 — coerce to string
href={`/admin/all-students/student/${String(student.id)}`}

// Option 2 — use Link's object form (preferred)
<Link href={{
  pathname: "/admin/all-students/student/[student_id]",
  query: { student_id: student.id },
}}>
```

Option 2 is cleaner and is what typed routes was designed for: `pathname` validates against the generated dynamic-route literal, `query` validates against its dynamic segment names.

**`pagination.tsx:87` — `router.push(buildHref(page) as Route)`**

`buildHref` concatenates `pathname` (string) with query params: `${pathname}?${params.toString()}`. The result is `string`, which can't satisfy `Route`. Use `router.push`'s object form, which accepts `pathname` + `query` separately:

```ts
router.push({
  pathname: pathname as Route, // pathname came from usePathname() — it's a real route
  query: Object.fromEntries(params),
});
```

The remaining `as Route` on `pathname` is honest: `usePathname()` returns `string`, but at runtime it's guaranteed to be the current URL which *is* a valid route by construction. That's the one cast that's defensible.

### Alternative: turn typed routes off

If you don't want the safety, remove `typedRoutes: true` from `next.config.ts`, delete the four `as Route` casts, and delete the `Route` type imports. You lose the compile-time guarantee but the code stops lying about whether it has one. **Don't leave it half-on.** The current state — `typedRoutes: true` plus four escape hatches — is the worst of both worlds: you pay the build cost and get none of the safety.

### Why this is a must-fix, not a nice-to-have

Typed routes only works if *every* navigation in the app goes through it. A single `as Route` at a dynamic link means that family of URLs (student detail, in this case) will never catch a typo. A rename of `/admin/all-students/student/[student_id]` to `/admin/students/[student_id]` would succeed without touching `student-card.tsx`, and the card would 404 silently at runtime. That's the exact failure mode typed routes is supposed to prevent.

### Effort

Small. Item 4 is a ~30-minute fix across four files. Done right, it never regresses.

---

## Summary of the "must-do" queue

1. Stand up `allowed_admins` table, migrate `isAdmin` to read it, delete the email-regex path on the server.
2. When adding a third role, rewrite the `login.tsx` switch to be exhaustive with no `default:` fallback.
3. Fix the sidebar logout redirects — either drop the `?role` param from `admin-sidebar.tsx:48` or change it to `?role=admin` and pair with item 2.
4. Remove the four `as Route` casts by narrowing `navItems` with `as const satisfies`, using `Link`'s object form for dynamic routes, and `router.push`'s object form in the paginator — or disable `typedRoutes` entirely if you don't want the safety.
