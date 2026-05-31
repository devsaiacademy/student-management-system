import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  date,
  jsonb,
  boolean,
  foreignKey,
  pgPolicy,
} from "drizzle-orm/pg-core";

import { enrollments } from "./enrollment";
import { paymentStatusEnum, paymentMethodEnum } from "./enums";
import { razorpayOrders } from "./razorpay-order";
import { students } from "./students";

// Audit trail written alongside mark-as-paid / mark-as-unpaid actions. Stored
// as jsonb so the shape can grow without a schema migration.
export type PaymentMetaData = {
  markedPaidBy?: string;
  markedPaidAt?: string;
  markedPaidReason?: string;
  markedUnpaidBy?: string;
  markedUnpaidAt?: string;
  markedUnpaidReason?: string;
  overdueNotifiedAt?: string;
  overdueEmailStatus?: "sent" | "failed";
  overdueWhatsappStatus?: "sent" | "failed" | "skipped";
  overdueWhatsappError?: string;
  overdueNotificationCount?: number;
  penalty?: number;
  penaltyLog?: Array<{ at: string; delta: number }>;
  // Append-only ledger of Razorpay partial-payment chunks received against
  // this installment. razorpayPaymentId dedupes replays (webhook + verify).
  partialPaymentLog?: Array<{
    at: string;
    amount: number;
    razorpayPaymentId?: string;
  }>;
};

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),

    studentId: integer("student_id").notNull(),
    enrollmentId: integer("enrollment_id").notNull(),
    razorpayOrderId: integer("razorpay_order_id"),

    amount: integer("amount").notNull(),
    // Running total of partial chunks collected against this installment.
    // 0 when payment is fully unpaid or fully paid in one shot. When status
    // is "partially_paid", 0 < amount_paid < amount.
    amountPaid: integer("amount_paid").notNull().default(0),
    // Per-row admin toggle. When true, the Razorpay order created for this
    // payment is opened with `partial_payment: true`. Locked once any chunk
    // lands (amount_paid > 0) because Razorpay can't toggle it mid-flight.
    partialPaymentEnabled: boolean("partial_payment_enabled")
      .notNull()
      .default(false),
    description: varchar("description", { length: 255 }),
    currency: varchar("currency", { length: 3 }).default("INR").notNull(),

    // Nullable: a payment row exists from enrollment creation, but the method
    // is only known once the student actually pays. NULL = not yet collected.
    paymentMethod: paymentMethodEnum("payment_method"),
    paymentStatus: paymentStatusEnum("payment_status")
      .default("unpaid")
      .notNull(),

    emiNumber: integer("emi_number"),

    dueDate: date("due_date").notNull(),
    paidDate: date("paid_date"),

    metaData: jsonb("meta_data").$type<PaymentMetaData>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [students.id],
      name: "payments_student_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.enrollmentId],
      foreignColumns: [enrollments.id],
      name: "payments_enrollment_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.razorpayOrderId],
      foreignColumns: [razorpayOrders.id],
      name: "payments_razorpay_order_id_fk",
    }).onDelete("set null"),
    pgPolicy("payments_select_policy_student", {
      for: "select",
      to: "authenticated",
      using: sql`student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()) AND public.current_user_role() = 'student'`,
    }),
    pgPolicy("payments_select_policy_admin", {
      for: "select",
      to: "authenticated",
      using: sql`public.current_user_role() = 'admin'`,
    }),
    pgPolicy("payments_insert_policy", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`public.current_user_role() = 'admin'`,
    }),
    pgPolicy("payments_update_policy", {
      for: "update",
      to: "authenticated",
      using: sql`public.current_user_role() = 'admin'`,
    }),
    pgPolicy("payments_delete_policy", {
      for: "delete",
      to: "authenticated",
      using: sql`public.current_user_role() = 'admin'`,
    }),
  ]
).enableRLS();
