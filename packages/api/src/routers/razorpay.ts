import { createHmac, timingSafeEqual } from "node:crypto";

import { db } from "@student-management-system/db";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import { payments } from "@student-management-system/db/schema/payment";
import { razorpayOrders } from "@student-management-system/db/schema/razorpay-order";
import { students } from "@student-management-system/db/schema/students";
import { env } from "@student-management-system/env/server";
import { TRPCError } from "@trpc/server";
import { and, eq, gt, sql } from "drizzle-orm";
import Razorpay from "razorpay";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
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
  createOrder: protectedProcedure
    .input(z.object({ paymentId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const { paymentId } = input;

      const [row] = await db
        .select({
          paymentId: payments.id,
          amount: payments.amount,
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

      if (row.paymentStatus === "paid") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This installment is already paid",
        });
      }

      // Dedupe: if the previous Pay click left an unused order within the 15-min
      // Razorpay TTL, reuse it instead of burning a fresh order on the gateway.
      if (row.existingRazorpayOrderId) {
        const reuseCutoff = new Date(
          Date.now() - REUSE_WINDOW_MINUTES * 60 * 1000
        );
        const [existing] = await db
          .select({
            razorpayOrderId: razorpayOrders.razorpayOrderId,
            amount: razorpayOrders.amount,
            currency: razorpayOrders.currency,
          })
          .from(razorpayOrders)
          .where(
            and(
              eq(razorpayOrders.id, row.existingRazorpayOrderId),
              eq(razorpayOrders.status, "created"),
              gt(razorpayOrders.createdAt, reuseCutoff)
            )
          )
          .limit(1);

        if (existing) {
          return {
            razorpayOrderId: existing.razorpayOrderId,
            amount: existing.amount,
            currency: existing.currency,
            keyId: env.RAZORPAY_KEY_ID,
            studentName: row.studentName,
            studentEmail: row.studentEmail,
            studentPhone: row.studentPhone,
            description: row.emiNumber
              ? `${row.course} — Installment ${row.emiNumber}`
              : `${row.course} — Full payment`,
          };
        }
      }

      const amountInPaise = row.amount * 100;

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
        keyId: env.RAZORPAY_KEY_ID,
        studentName: row.studentName,
        studentEmail: row.studentEmail,
        studentPhone: row.studentPhone,
        description: row.emiNumber
          ? `${row.course} — Installment ${row.emiNumber}`
          : `${row.course} — Full payment`,
      };
    }),

  verifyPayment: protectedProcedure
    .input(verifyPaymentInput)
    .mutation(async ({ input }) => {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        input;

      const expected = hmacHex(`${razorpay_order_id}|${razorpay_payment_id}`);
      if (!signatureMatches(expected, razorpay_signature)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid Razorpay signature",
        });
      }

      const result = await db.transaction(async (tx) => {
        // Idempotent: only the first successful verify flips status to 'paid'.
        // Replays (and a subsequent webhook) see 0 rows and short-circuit.
        const [updatedOrder] = await tx
          .update(razorpayOrders)
          .set({
            status: "paid",
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
          })
          .where(
            and(
              eq(razorpayOrders.razorpayOrderId, razorpay_order_id),
              sql`${razorpayOrders.status} <> 'paid'`
            )
          )
          .returning({ id: razorpayOrders.id });

        if (!updatedOrder) {
          return { alreadyPaid: true } as const;
        }

        await tx
          .update(payments)
          .set({
            paymentStatus: "paid",
            paymentMethod: "razorpay",
            paidDate: new Date().toISOString().split("T")[0],
          })
          .where(
            and(
              eq(payments.razorpayOrderId, updatedOrder.id),
              eq(payments.paymentStatus, "unpaid")
            )
          );

        return { alreadyPaid: false } as const;
      });

      return { success: true, ...result };
    }),
});
