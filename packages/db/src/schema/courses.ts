import { sql } from "drizzle-orm";
import {
  pgPolicy,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const courses = pgTable(
  "courses",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  () => [
    pgPolicy("courses_select_policy", {
      for: "select",
      to: "authenticated",
      using: sql`true`,
    }),
    pgPolicy("courses_insert_policy", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`public.current_user_role() IN ('admin', 'super_admin', 'staff')`,
    }),
    pgPolicy("courses_update_policy", {
      for: "update",
      to: "authenticated",
      using: sql`public.current_user_role() IN ('admin', 'super_admin', 'staff')`,
    }),
    pgPolicy("courses_delete_policy", {
      for: "delete",
      to: "authenticated",
      using: sql`public.current_user_role() IN ('admin', 'super_admin')`,
    }),
  ]
).enableRLS();
