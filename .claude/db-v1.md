# Database Schema v1 - Complete Reference

## Overview

PostgreSQL database managed via Drizzle ORM with Supabase. 6 tables, 5 enums, 7 foreign keys, 27 RLS policies, and 4 trigger functions.

---

## Tables

### 1. `user_profiles`

Maps authenticated users to roles. Created automatically on signup via trigger.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, references `auth.users(id)` |
| role | varchar(20) | NOT NULL — `admin` or `student` |
| created_at | timestamp | NOT NULL, default `now()` |
| updated_at | timestamp | NOT NULL, auto-updated |

**Purpose:** Single source of truth for user roles. All RLS policies check this table.

---

### 2. `students`

Primary student records. Each student has one row with personal, academic, and parent information.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| auth_user_id | uuid | Unique, nullable — links to `auth.users` |
| name | varchar(100) | NOT NULL |
| roll_number | varchar(50) | NOT NULL, unique |
| age | integer | NOT NULL |
| phone_number | varchar(15) | NOT NULL |
| email | varchar(100) | NOT NULL, unique — used for login |
| school_name | varchar(255) | NOT NULL |
| standard | varchar(20) | NOT NULL |
| academic_year | varchar(20) | NOT NULL |
| enrolled_medium | varchar(50) | NOT NULL |
| mother_name | varchar(100) | Nullable |
| mother_occupation | varchar(100) | Nullable |
| father_name | varchar(100) | Nullable |
| father_occupation | varchar(100) | Nullable |
| student_status | enum | NOT NULL, default `active` |
| created_at | timestamp | NOT NULL, default `now()` |
| updated_at | timestamp | NOT NULL, auto-updated |

**Purpose:** Student profiles. The `auth_user_id` column is auto-populated when a student first logs in.

---

### 3. `enrollments`

Course enrollments for students. One student can have multiple enrollments.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| student_id | integer | NOT NULL, FK → `students.id` (cascade delete) |
| course | varchar(100) | NOT NULL |
| level | varchar(50) | NOT NULL |
| duration | varchar(50) | NOT NULL |
| tutor_name | varchar(100) | NOT NULL |
| total_fees | integer | NOT NULL |
| payment_plan | enum | NOT NULL — `single` or `flexible` |
| emi_months | integer | Nullable |
| created_at | timestamp | NOT NULL, default `now()` |
| updated_at | timestamp | NOT NULL, auto-updated |

**Purpose:** Tracks which courses a student is enrolled in, fees, and payment plan type.

---

### 4. `student_progress`

Progress tracking for each enrollment.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| student_id | integer | NOT NULL, FK → `students.id` (cascade delete) |
| enrollment_id | integer | NOT NULL, FK → `enrollments.id` (cascade delete) |
| course | varchar(100) | NOT NULL |
| level | varchar(50) | NOT NULL |
| duration | varchar(50) | NOT NULL |
| kit_provided | boolean | NOT NULL, default `false` |
| tutor_name | varchar(100) | NOT NULL |
| status | enum | NOT NULL, default `in_progress` |
| start_date | date | NOT NULL |
| end_date | date | Nullable |
| created_at | timestamp | NOT NULL, default `now()` |
| updated_at | timestamp | NOT NULL, auto-updated |

**Purpose:** Tracks course delivery progress, kit provision, and completion status per enrollment.

---

### 5. `payments`

Payment ledger entries. One enrollment can have multiple payment records (for EMI plans).

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| student_id | integer | NOT NULL, FK → `students.id` (cascade delete) |
| enrollment_id | integer | NOT NULL, FK → `enrollments.id` (cascade delete) |
| razorpay_order_id | integer | Nullable, FK → `razorpay_orders.id` (set null) |
| amount | integer | NOT NULL |
| description | varchar(255) | Nullable |
| currency | varchar(3) | NOT NULL, default `INR` |
| payment_method | enum | NOT NULL — `cash`, `razorpay`, or `others` |
| payment_status | enum | NOT NULL, default `unpaid` |
| emi_number | integer | Nullable |
| due_date | date | NOT NULL |
| paid_date | date | Nullable |
| created_at | timestamp | NOT NULL, default `now()` |
| updated_at | timestamp | NOT NULL, auto-updated |

**Purpose:** Tracks all payment transactions — both online (Razorpay) and manual (cash, bank transfer).

---

### 6. `razorpay_orders`

Razorpay order records for online payment processing.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| student_id | integer | NOT NULL, FK → `students.id` (cascade delete) |
| razorpay_order_id | varchar(255) | NOT NULL, unique |
| amount | integer | NOT NULL |
| currency | varchar(3) | NOT NULL, default `INR` |
| receipt | varchar(255) | Nullable |
| status | varchar(50) | NOT NULL, default `created` |
| razorpay_payment_id | varchar(255) | Nullable |
| razorpay_signature | varchar(255) | Nullable |
| notes | json | Nullable |
| created_at | timestamp | NOT NULL, default `now()` |
| updated_at | timestamp | NOT NULL, auto-updated |

**Purpose:** Stores Razorpay order data including payment ID and signature for verification.

---

## Enums

| Enum | Values |
|------|--------|
| `payment_plan` | `single`, `flexible` |
| `student_status` | `active`, `in_active`, `discontinue` |
| `payment_status` | `paid`, `unpaid` |
| `payment_method` | `cash`, `razorpay`, `others` |
| `student_progress_status` | `in_progress`, `completed` |

---

## Foreign Keys

| Table | Column | References | On Delete |
|-------|--------|-----------|-----------|
| `enrollments` | `student_id` | `students.id` | cascade |
| `payments` | `student_id` | `students.id` | cascade |
| `payments` | `enrollment_id` | `enrollments.id` | cascade |
| `payments` | `razorpay_order_id` | `razorpay_orders.id` | set null |
| `razorpay_orders` | `student_id` | `students.id` | cascade |
| `student_progress` | `student_id` | `students.id` | cascade |
| `student_progress` | `enrollment_id` | `enrollments.id` | cascade |

---

## Row-Level Security (RLS)

All 6 tables have RLS enabled. Access is controlled by checking `public.current_user_role()`, which returns the user's role from `user_profiles`.

### How `current_user_role()` Works

```sql
CREATE FUNCTION public.current_user_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;
```

This function:
- Reads the role from `user_profiles` for the current authenticated user
- Uses `SECURITY DEFINER` to bypass RLS on `user_profiles` (prevents recursion)
- Uses `SET search_path = public` to prevent schema injection attacks
- Returns `'admin'` or `'student'`

### Admin Policies

Admin can perform all CRUD operations on all tables:

```sql
-- Example: students table
SELECT:  public.current_user_role() = 'admin'
INSERT:  public.current_user_role() = 'admin'
UPDATE:  public.current_user_role() = 'admin'
DELETE:  public.current_user_role() = 'admin'
```

### Student Policies

Students can only see their own data:

```sql
-- students table: must match their auth_user_id
SELECT: auth.uid() = auth_user_id AND public.current_user_role() = 'student'

-- Child tables (enrollments, payments, etc.): must match their student_id
SELECT: student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
        AND public.current_user_role() = 'student'
```

### `user_profiles` Table Policies

| Policy | Condition |
|--------|-----------|
| `user_profiles_select_own` | `auth.uid() = id` — users can see their own profile |
| `user_profiles_select_admin` | `current_user_role() = 'admin'` — admins can see all profiles |

### RLS Summary by Table

| Table | Admin | Student |
|-------|-------|---------|
| `user_profiles` | Read all | Read own |
| `students` | Full CRUD | Read own |
| `enrollments` | Full CRUD | Read own |
| `student_progress` | Full CRUD | Read own |
| `payments` | Full CRUD | Read own |
| `razorpay_orders` | Full CRUD | Read own |

---

## Trigger Functions

There are 4 trigger functions in the database. Each serves a specific purpose.

### 1. `current_user_role()` — Role Lookup Helper

**Type:** SQL function (not a trigger)  
**Purpose:** Returns the current user's role without triggering RLS recursion.

```sql
CREATE FUNCTION public.current_user_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;
```

**Why it exists:** RLS policies need to check the user's role. If they query `user_profiles` directly from within a policy on `user_profiles` itself, PostgreSQL detects infinite recursion. This function uses `SECURITY DEFINER` to bypass RLS, breaking the recursion loop.

**Used by:** All 27 RLS policies across all 6 tables.

---

### 2. `handle_new_user()` — Auto Role Assignment

**Type:** Trigger function  
**When it fires:** `AFTER INSERT` on `auth.users` (every time a new user signs up)

**What it does:**

```
1. Check if email matches admin domain (e.g., @yourdomain.com)
   → YES: assign role = 'admin'

2. Check if email exists in students table
   → YES: assign role = 'student'
   → Also auto-link: UPDATE students SET auth_user_id = new.id

3. Neither match
   → REJECT: raise exception, login denied
```

**Full code:**

```sql
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Check admin domain (case-insensitive)
  IF new.email ILIKE '%@yourdomain.com' THEN
    user_role := 'admin';

  -- Check if this email belongs to a pre-registered student
  ELSIF EXISTS (SELECT 1 FROM public.students WHERE LOWER(email) = LOWER(new.email)) THEN
    user_role := 'student';

  -- Unknown email → deny login
  ELSE
    RAISE EXCEPTION 'Login denied: email % is not whitelisted or registered as a student', new.email;
  END IF;

  -- Create the user profile
  INSERT INTO public.user_profiles (id, role)
  VALUES (new.id, user_role);

  -- Auto-link student record (only for students, not admins)
  IF user_role = 'student' THEN
    UPDATE public.students SET auth_user_id = new.id WHERE LOWER(email) = LOWER(new.email);
  END IF;

  RETURN new;
END;
$$;
```

**The trigger:**

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Key behaviors:**

- **Admin signup:** Email matches domain → role = `admin` → profile created → done
- **Student first login:** Email found in `students` table → role = `student` → profile created → `auth_user_id` auto-linked → student can now access their data
- **Unknown email:** No match → exception raised → transaction rolls back → signup fails
- **Returning user:** User already exists in `auth.users` → no INSERT → trigger does NOT fire → normal authentication
- **Case-insensitive:** Uses `ILIKE` and `LOWER()` so `Rahul@Gmail.com` matches `rahul@gmail.com`

**Note:** This trigger must be created via Supabase Dashboard SQL Editor (not via `db migrate`) because it requires elevated permissions to attach to `auth.users`.

---

### 3. `validate_payment_student_match()` — Payment Integrity

**Type:** Trigger function  
**When it fires:** `BEFORE INSERT OR UPDATE` on `payments`

**What it does:**

```
Before saving a payment:
  1. Look up the enrollment → find its student_id
  2. Compare: does enrollment.student_id match payment.student_id?
  3. If YES → allow
  4. If NO → reject with error
```

**Full code:**

```sql
CREATE FUNCTION public.validate_payment_student_match()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (SELECT student_id FROM public.enrollments WHERE id = NEW.enrollment_id) != NEW.student_id THEN
    RAISE EXCEPTION 'Enrollment % does not belong to student %', NEW.enrollment_id, NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$;
```

**The trigger:**

```sql
CREATE TRIGGER check_payment_student_match
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_student_match();
```

**Why it exists:** Prevents data corruption where a payment record links a student to an enrollment they don't own. This can happen due to:
- Frontend bugs sending wrong `studentId`
- API bugs that don't derive `studentId` from the enrollment
- Manual SQL mistakes in the database editor

**Example of what it blocks:**

```sql
-- This would be allowed by FKs alone (both IDs exist)
-- But the trigger rejects it:
INSERT INTO payments (student_id, enrollment_id, amount)
VALUES (1, 5, 4000);
-- Error: "Enrollment 5 does not belong to student 1"
```

---

### 4. `validate_progress_student_match()` — Progress Integrity

**Type:** Trigger function  
**When it fires:** `BEFORE INSERT OR UPDATE` on `student_progress`

**What it does:**

```
Before saving a progress record:
  1. Look up the enrollment → find its student_id
  2. Compare: does enrollment.student_id match progress.student_id?
  3. If YES → allow
  4. If NO → reject with error
```

**Full code:**

```sql
CREATE FUNCTION public.validate_progress_student_match()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (SELECT student_id FROM public.enrollments WHERE id = NEW.enrollment_id) != NEW.student_id THEN
    RAISE EXCEPTION 'Enrollment % does not belong to student %', NEW.enrollment_id, NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$;
```

**The trigger:**

```sql
CREATE TRIGGER check_progress_student_match
  BEFORE INSERT OR UPDATE ON public.student_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_progress_student_match();
```

**Why it exists:** Same reason as payment validation — prevents a student's progress from being recorded against another student's enrollment.

---

## Trigger Summary

| Trigger | Table | When | Purpose |
|---------|-------|------|---------|
| `on_auth_user_created` | `auth.users` | AFTER INSERT | Auto-assign role + link student |
| `check_payment_student_match` | `payments` | BEFORE INSERT/UPDATE | Validate student-enrollment match |
| `check_progress_student_match` | `student_progress` | BEFORE INSERT/UPDATE | Validate student-enrollment match |

| Function | Type | Purpose |
|----------|------|---------|
| `current_user_role()` | SQL function | Returns user's role (bypasses RLS recursion) |
| `handle_new_user()` | Trigger function | Role assignment on signup |
| `validate_payment_student_match()` | Trigger function | Payment data integrity |
| `validate_progress_student_match()` | Trigger function | Progress data integrity |

---

## Setup Notes

### What `db push` / `db migrate` Creates

- All 6 tables
- All 5 enums
- All 7 foreign keys
- All 27 RLS policies
- `current_user_role()` function
- `validate_payment_student_match()` function + trigger
- `validate_progress_student_match()` function + trigger

### What Must Be Created Manually (Supabase Dashboard SQL Editor)

- `handle_new_user()` function + `on_auth_user_created` trigger on `auth.users`

This is because `db migrate` connects via `DATABASE_URL` which doesn't have permission to create triggers on the `auth` schema (managed by Supabase).

### Before Deploying

Replace `@yourdomain.com` in the `handle_new_user()` function with your actual admin email domain.
