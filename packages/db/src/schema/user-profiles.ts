import { sql } from "drizzle-orm";
import { pgPolicy, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { userRoleEnum } from "./enums";

export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    role: userRoleEnum("role").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  () => [
    pgPolicy("user_profiles_select_own", {
      for: "select",
      to: "authenticated",
      using: sql`auth.uid() = id`,
    }),
    pgPolicy("user_profiles_select_admin", {
      for: "select",
      to: "authenticated",
      using: sql`public.current_user_role() IN ('admin', 'super_admin')`,
    }),
    pgPolicy("user_profiles_insert_admin", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`public.current_user_role() IN ('admin', 'super_admin')`,
    }),
    pgPolicy("user_profiles_update_admin", {
      for: "update",
      to: "authenticated",
      using: sql`public.current_user_role() IN ('admin', 'super_admin')`,
    }),
    pgPolicy("user_profiles_delete_admin", {
      for: "delete",
      to: "authenticated",
      using: sql`public.current_user_role() IN ('admin', 'super_admin')`,
    }),
  ]
).enableRLS();
