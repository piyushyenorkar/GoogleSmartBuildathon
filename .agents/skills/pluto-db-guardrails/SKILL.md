---
name: pluto-db-guardrails
description: Enforce PostgreSQL multi-tenant schema rules, Row Level Security (RLS), ScaNN vector indexing, and parameterized query guardrails when creating or modifying Pluto Campus database tables and queries.
---

# Pluto Campus Database Guardrails

This skill provides strict guardrails and procedural standards for writing and modifying PostgreSQL database schemas, queries, and migrations for **Pluto Campus**.

---

## 1. Schema Naming & Structural Conventions

1. **Naming Standard**: Always use `snake_case` for all table names, column names, constraints, and custom enum types.
2. **Primary Keys**: Every table MUST have a primary key named `id` of type `UUID` with default `gen_random_uuid()` (or `uuid_generate_v4()`).
3. **Audit Timestamps**: Every table MUST include:
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
4. **Foreign Key Naming**: Foreign keys must follow the `<parent_table_singular>_id` pattern (e.g., `college_id`, `event_id`, `user_id`) with explicit `REFERENCES <parent_table>(id) ON DELETE CASCADE` (or `SET NULL` where historical tracking is required).

---

## 2. Multi-Tenant Campus Isolation

Pluto Campus operates across multiple universities and departments. Data isolation is mandatory:

1. **Campus Scoping**: Any table that belongs to an institution (e.g., `events`, `competitions`, `announcements`, `college_departments`, `college_requests`) MUST include a `college_id UUID REFERENCES colleges(id)`.
2. **Academic Hierarchy**:
   - `college_id` ➔ University / Institution level
   - `department` (text) ➔ Academic Department (e.g. *Computer Engineering*, *Mechanical Engineering*)
   - `course` (text) ➔ Program (e.g. *B.Tech*, *BCA*, *MBA*)
   - `year` (text) ➔ Academic Year (e.g. *1*, *2*, *3*, *4*)
   - `section` (text) ➔ Class Division (e.g. *A*, *B*)
3. **Universal Events**: Events flagged with `is_universal = true` are visible globally across all campuses in the Community feed (`/community`). Campus-specific events (`is_universal = false`) MUST be strictly scoped to `college_id`.

---

## 3. Row Level Security (RLS) Rules

1. **Always Enable RLS**:
   ```sql
   ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
   ```
2. **Public / Authenticated Separation**:
   - Read policies for events:
     ```sql
     CREATE POLICY "Public read approved events" ON public.events
     FOR SELECT USING (
       status IN ('approved', 'live') AND 
       (is_universal = true OR college_id = (SELECT college_id FROM public.users WHERE id = auth.uid()))
     );
     ```
   - Organizer write policies:
     ```sql
     CREATE POLICY "Organizers manage own events" ON public.events
     FOR ALL USING (created_by = auth.uid());
     ```
3. **Admin Overrides**:
   - `college_admin` can read/update all records within their matching `college_id`.
   - `department_admin` can read/approve records within their matching `college_id` AND `department`.
   - Service Role (`SUPABASE_SERVICE_ROLE_KEY`) bypasses RLS for backend operations (payments, cron, disbursements).

---

## 4. Query Safety & Parameterization

1. **Never Concatenate Raw Strings**: Always use parameterized queries (`$1, $2, ...` or ORM/query-builder methods) to eliminate SQL injection vulnerabilities.
2. **Blocked Destructive Commands**:
   - Never issue `DROP TABLE` or `DROP SCHEMA` in operational or production scripts.
   - Never issue `TRUNCATE` or `DELETE` without an explicit, validated `WHERE` clause.
3. **Pagination & Limits**:
   - Public-facing query feeds (`events`, `competitions`, `teams`) must enforce a default limit (e.g., `LIMIT 50`) and explicit cursor or offset pagination.

---

## 5. Indexing & Vector Search (ScaNN / pgvector)

1. **Foreign Key Indexing**: Every foreign key column must have a matching b-tree index:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_events_college_id ON public.events(college_id);
   CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
   CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON public.bookings(event_id);
   ```
2. **Hybrid Semantic Search**:
   - When vector search is enabled for event recommendations:
     ```sql
     ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description_embedding vector(768);
     CREATE INDEX IF NOT EXISTS idx_events_embedding ON public.events 
     USING scann (description_embedding cosine) WITH (num_leaves = 100);
     ```
