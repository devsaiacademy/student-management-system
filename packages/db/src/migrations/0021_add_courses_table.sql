CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "courses_select_policy" ON "courses" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "courses_insert_policy" ON "courses" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
CREATE POLICY "courses_update_policy" ON "courses" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
CREATE POLICY "courses_delete_policy" ON "courses" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.current_user_role() IN ('admin', 'super_admin'));