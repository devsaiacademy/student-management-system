CREATE TABLE "app_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "app_settings_select_policy" ON "app_settings" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "app_settings_insert_policy" ON "app_settings" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "app_settings_update_policy" ON "app_settings" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.current_user_role() = 'admin');