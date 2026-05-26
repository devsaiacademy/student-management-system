import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  jsonb,
  timestamp,
  pgPolicy,
} from "drizzle-orm/pg-core";

export const appSettings = pgTable(
  "app_settings",
  {
    key: varchar("key", { length: 100 }).primaryKey(),
    value: jsonb("value").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  () => [
    pgPolicy("app_settings_select_policy", {
      for: "select",
      to: "authenticated",
      using: sql`true`,
    }),
    pgPolicy("app_settings_insert_policy", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`public.current_user_role() = 'admin'`,
    }),
    pgPolicy("app_settings_update_policy", {
      for: "update",
      to: "authenticated",
      using: sql`public.current_user_role() = 'admin'`,
    }),
  ]
).enableRLS();
