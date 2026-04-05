# Client setup

## 1. Clone the repository

```bash
git clone <repository-url>
cd student-management-system
```

## 2. Get the Supabase API URL

In the [Supabase Dashboard](https://supabase.com/dashboard), open your project:

**Integrations → Data API → API URL**

Use this value as **`NEXT_PUBLIC_SUPABASE_URL`** wherever you configure the app (your hosting provider’s environment variables).

## 3. Get the public anon key

In the same project:

**Project Settings → API → Project API keys → `anon` `public`**

Use this value as **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**.

## 4. Get the database URL (direct connection)

In the Supabase project:

**Connect → DIRECT URL** (direct Postgres connection)

Use this value as **`DATABASE_URL`**.

> Migrations in this repo need a connection that can run DDL (including on `auth.users`). The **direct** URL is the right default. If your host only allows a pooler URL for the running app, you can still use **DIRECT_URL** for migrations and CI.

## 5. Add `DATABASE_URL` to GitHub Actions secrets

1. On GitHub: open the repo → **Settings → Secrets and variables → Actions**.
2. **New repository secret**
3. Name: **`DATABASE_URL`**
4. Value: the **DIRECT URL** from step 4.

The workflow `.github/workflows/migrate.yml` runs `pnpm db:migrate` on pushes to **`main`**, using that secret.

## 6. Production environment (hosting)

On the platform that runs the Next.js app (`apps/web`), set at least:

| Variable | Source |
|----------|--------|
| `DATABASE_URL` | Same as step 4 (or your approved runtime connection string). |
| `NEXT_PUBLIC_SUPABASE_URL` | Step 2 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Step 3 |
| `NODE_ENV` | `production` |

Optional: **`CORS_ORIGIN`** — your live site URL, if you use it.

## 7. Configure Supabase Authentication

In the Supabase Dashboard, open your project:

**Authentication → URL Configuration**

1. Set **Site URL** to `http://localhost:3000` (or your production URL).
2. Add `http://localhost:3000/auth/callback` to **Redirect URLs**.

**Authentication → Email Templates**

Update the following templates to use `token_hash` verification:

**Confirm signup:**

```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Confirm your mail</a></p>
```

**Magic Link:**

```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink">Log In</a></p>
```

## 8. Auth behavior (after migrations)

New sign-ups are handled by a database trigger on **`auth.users`**: users with email **`%@otomatiks.in`** become **admin**; others must match a **`students`** row by email or sign-up is denied. Add students (or change the trigger in your fork) to match your org.
