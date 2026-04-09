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

`admin-sidebar.tsx:48` redirects to `/login?role=teacher` on logout and `student-sidebar.tsx:33` redirects to `/login?role=parent`. The admin one is already wrong by the logic above — `?role=teacher` falls into `default` (admin domain check) despite the name. Probably meant to be `?role=admin`. Low priority, but fix it at the same time you harden the switch.

---

## Summary of the "must-do" queue

1. Stand up `allowed_admins` table, migrate `isAdmin` to read it, delete the email-regex path on the server.
2. When adding a third role, rewrite the `login.tsx` switch to be exhaustive with no `default:` fallback, and fix the sidebar logout redirects at the same time.
