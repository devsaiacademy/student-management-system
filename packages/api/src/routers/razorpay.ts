import { createHmac, timingSafeEqual } from "node:crypto";

import { db } from "@student-management-system/db";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import { payments } from "@student-management-system/db/schema/payment";
import { razorpayOrders } from "@student-management-system/db/schema/razorpay-order";
import { students } from "@student-management-system/db/schema/students";
import { env } from "@student-management-system/env/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import Razorpay from "razorpay";
import { z } from "zod";

import { assertStudentAccess, router, studentProcedure } from "../index";
import { syncOrderPaymentState } from "../lib/razorpay-webhook";

const razorpay = new Razorpay({
  key_id: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

const REUSE_WINDOW_MINUTES = 15;

const verifyPaymentInput = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

function hmacHex(message: string) {
  return createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(message)
    .digest("hex");
}

function signatureMatches(expected: string, actual: string) {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(actual, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export const razorpayRouter = router({
  createOrder: studentProcedure
    .input(z.object({ paymentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { paymentId } = input;

      const [row] = await db
        .select({
          paymentId: payments.id,
          amount: payments.amount,
          amountPaid: payments.amountPaid,
          partialPaymentEnabled: payments.partialPaymentEnabled,
          metaData: payments.metaData,
          currency: payments.currency,
          paymentStatus: payments.paymentStatus,
          studentId: payments.studentId,
          enrollmentId: payments.enrollmentId,
          emiNumber: payments.emiNumber,
          existingRazorpayOrderId: payments.razorpayOrderId,
          studentName: students.name,
          studentEmail: students.email,
          studentPhone: students.phoneNumber,
          course: enrollments.course,
        })
        .from(payments)
        .innerJoin(students, eq(payments.studentId, students.id))
        .innerJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      assertStudentAccess(ctx, row.studentId);

      if (row.paymentStatus === "paid") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This installment is already paid",
        });
      }

      // Owed today = base + penalty − chunks already collected. Each Pay
      // click mints a fresh Razorpay order for this remaining amount, so the
      // checkout opens with "Pay ₹{remaining}" instead of asking the customer
      // to choose Part Payment and type the remainder themselves.
      const totalAmount = row.amount + (row.metaData?.penalty ?? 0);
      const remaining = totalAmount - row.amountPaid;
      if (remaining <= 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This installment has no balance remaining",
        });
      }
      const amountInPaise = remaining * 100;

      // Reuse only the initial-click dedupe (no chunks yet, within 15 min,
      // same amount). Once a chunk has landed we always mint a fresh order
      // for the new remaining; reusing would re-present the full balance.
      if (row.existingRazorpayOrderId && row.amountPaid === 0) {
        const reuseCutoff = new Date(
          Date.now() - REUSE_WINDOW_MINUTES * 60 * 1000
        );
        const [existing] = await db
          .select({
            razorpayOrderId: razorpayOrders.razorpayOrderId,
            amount: razorpayOrders.amount,
            currency: razorpayOrders.currency,
            status: razorpayOrders.status,
            createdAt: razorpayOrders.createdAt,
          })
          .from(razorpayOrders)
          .where(eq(razorpayOrders.id, row.existingRazorpayOrderId))
          .limit(1);

        const canReuse =
          existing &&
          existing.status === "created" &&
          existing.createdAt > reuseCutoff &&
          existing.amount === amountInPaise;

        if (canReuse) {
          return {
            razorpayOrderId: existing.razorpayOrderId,
            amount: existing.amount,
            currency: existing.currency,
            keyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            studentName: row.studentName,
            studentEmail: row.studentEmail,
            studentPhone: row.studentPhone,
            description: row.emiNumber
              ? `${row.course} — Installment ${row.emiNumber}`
              : `${row.course} — Full payment`,
          };
        }
      }

      // Per-row admin toggle. When OFF we mint a plain full-amount order
      // (legacy behavior). When ON we add partial_payment + a 10% first-min
      // floor (Razorpay requires integer paise ≥ 100).
      const partialEnabled = row.partialPaymentEnabled;

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: row.currency,
        receipt: `pay_${paymentId}`,
        notes: {
          paymentId: row.paymentId,
          studentId: row.studentId,
          enrollmentId: row.enrollmentId,
          emiNumber: row.emiNumber ?? 0,
        },
        ...(partialEnabled && {
          partial_payment: true,
          first_payment_min_amount: Math.max(
            100,
            Math.floor(amountInPaise / 10)
          ),
        }),
      });

      await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(razorpayOrders)
          .values({
            studentId: row.studentId,
            razorpayOrderId: order.id,
            amount: Number(order.amount),
            currency: order.currency,
            receipt: order.receipt ?? null,
            status: "created",
            notes: order.notes,
          })
          .returning({ id: razorpayOrders.id });

        if (!inserted) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to persist Razorpay order",
          });
        }

        await tx
          .update(payments)
          .set({ razorpayOrderId: inserted.id })
          .where(eq(payments.id, paymentId));
      });

      return {
        razorpayOrderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        keyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        studentName: row.studentName,
        studentEmail: row.studentEmail,
        studentPhone: row.studentPhone,
        description: row.emiNumber
          ? `${row.course} — Installment ${row.emiNumber}`
          : `${row.course} — Full payment`,
      };
    }),

  verifyPayment: studentProcedure
    .input(verifyPaymentInput)
    .mutation(async ({ ctx, input }) => {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        input;

      const expected = hmacHex(`${razorpay_order_id}|${razorpay_payment_id}`);
      if (!signatureMatches(expected, razorpay_signature)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid Razorpay signature",
        });
      }

      const [order] = await db
        .select({ studentId: razorpayOrders.studentId })
        .from(razorpayOrders)
        .where(eq(razorpayOrders.razorpayOrderId, razorpay_order_id))
        .limit(1);

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Razorpay order not found",
        });
      }

      assertStudentAccess(ctx, order.studentId);

      // Stamp the signature for audit, then sync from Razorpay's authoritative
      // order state. The sync handles both partial chunks and full settlement
      // (idempotent across replays + webhook races).
      await db
        .update(razorpayOrders)
        .set({ razorpaySignature: razorpay_signature })
        .where(eq(razorpayOrders.razorpayOrderId, razorpay_order_id));

      await syncOrderPaymentState(razorpay_order_id, razorpay_payment_id);

      return { success: true };
    }),

  // Admin-only per-row toggle. Locked once a chunk has landed because
  // Razorpay won't let us flip partial_payment on an in-flight order.
  setPartialEnabled: studentProcedure
    .input(
      z.object({
        paymentId: z.number().int().positive(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can change this setting",
        });
      }

      const [row] = await db
        .select({
          amountPaid: payments.amountPaid,
          paymentStatus: payments.paymentStatus,
        })
        .from(payments)
        .where(eq(payments.id, input.paymentId))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      if (row.paymentStatus === "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change partial setting on a paid installment",
        });
      }

      // No mid-flow lock — each Pay click mints a fresh Razorpay order, so
      // the next order can pick up the new flag regardless of prior chunks.

      await db
        .update(payments)
        .set({
          partialPaymentEnabled: input.enabled,
          // Drop any cached order so the next Pay click mints a fresh one
          // with the new flag (otherwise the reuse branch returns the old order).
          razorpayOrderId: null,
        })
        .where(eq(payments.id, input.paymentId));

      return { enabled: input.enabled };
    }),
});
