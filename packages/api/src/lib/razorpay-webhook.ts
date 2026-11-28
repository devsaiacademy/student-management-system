import { createHmac, timingSafeEqual } from "node:crypto";

import { db } from "@student-management-system/db";
import { enrollments } from "@student-management-system/db/schema/enrollment";
import {
  payments,
  type PaymentMetaData,
} from "@student-management-system/db/schema/payment";
import { razorpayOrders } from "@student-management-system/db/schema/razorpay-order";
import { students } from "@student-management-system/db/schema/students";
import { env } from "@student-management-system/env/server";
import { and, eq, sql } from "drizzle-orm";
import Razorpay from "razorpay";

import { logger } from "./logger";
import { sendPaymentReceivedWhatsApp } from "./whatsapp";

type RazorpayEntity = {
  id?: string;
  order_id?: string;
};

type RazorpayWebhookBody = {
  event: string;
  payload?: {
    payment?: { entity?: RazorpayEntity };
    order?: { entity?: RazorpayEntity };
  };
};

export type WebhookResult =
  | { kind: "ok"; processed: boolean }
  | { kind: "invalid_signature" }
  | { kind: "invalid_body" };

const razorpay = new Razorpay({
  key_id: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

function constantTimeEquals(a: string, b: string) {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

function extractOrderId(body: RazorpayWebhookBody): string | null {
  return (
    body.payload?.payment?.entity?.order_id ??
    body.payload?.order?.entity?.id ??
    null
  );
}

function extractPaymentId(body: RazorpayWebhookBody): string | null {
  return body.payload?.payment?.entity?.id ?? null;
}

// Credit a single Razorpay payment (chunk) against the local payments row.
// Idempotent: dedupe by razorpayPaymentId via metaData.partialPaymentLog.
// Each Pay click mints a fresh order for the *remaining* amount, so we ADD
// each chunk to payments.amountPaid rather than overwriting with one order's
// cumulative figure.
export async function syncOrderPaymentState(
  razorpayOrderIdStr: string,
  razorpayPaymentId: string | null
) {
  // No specific chunk to credit (e.g. order.paid event w/o a payment id) →
  // just refresh the order's status and return.
  if (!razorpayPaymentId) {
    const remoteOrder = (await razorpay.orders.fetch(razorpayOrderIdStr)) as {
      status: string;
    };
    await db
      .update(razorpayOrders)
      .set({ status: remoteOrder.status })
      .where(eq(razorpayOrders.razorpayOrderId, razorpayOrderIdStr));
    logger.info("razorpay sync: order status refreshed", {
      razorpayOrderId: razorpayOrderIdStr,
      status: remoteOrder.status,
    });
    return;
  }

  // Pull the chunk amount directly from the payment entity. order.amount_paid
  // is cumulative for THAT order; we want this specific chunk's amount.
  const remotePayment = (await razorpay.payments.fetch(razorpayPaymentId)) as {
    amount: number | string;
    method?: string;
  };
  const chunkPaise = Number(remotePayment.amount);
  const chunkRupees = Math.floor(chunkPaise / 100);

  const credited = await db.transaction(async (tx) => {
    const [localOrder] = await tx
      .update(razorpayOrders)
      .set({ razorpayPaymentId })
      .where(eq(razorpayOrders.razorpayOrderId, razorpayOrderIdStr))
      .returning({ id: razorpayOrders.id });

    if (!localOrder) {
      logger.warn("razorpay sync: no local order for razorpay order id", {
        razorpayOrderId: razorpayOrderIdStr,
        razorpayPaymentId,
      });
      return null;
    }

    // FOR UPDATE serializes concurrent chunks for the same row: a parallel
    // verifyPayment + payment.captured (or two webhooks racing) would
    // otherwise both read the same amountPaid and last-writer-wins, silently
    // dropping one chunk's amount. The lock holds for the rest of the tx.
    const [current] = await tx
      .select({
        id: payments.id,
        amount: payments.amount,
        amountPaid: payments.amountPaid,
        paymentStatus: payments.paymentStatus,
        metaData: payments.metaData,
      })
      .from(payments)
      .where(eq(payments.razorpayOrderId, localOrder.id))
      .for("update")
      .limit(1);

    if (!current) {
      logger.warn("razorpay sync: no payment row linked to local order", {
        razorpayOrderId: razorpayOrderIdStr,
        localOrderId: localOrder.id,
        razorpayPaymentId,
      });
      return null;
    }

    const existingLog = current.metaData?.partialPaymentLog ?? [];
    if (existingLog.some((e) => e.razorpayPaymentId === razorpayPaymentId)) {
      // Already credited (replayed webhook or duplicate verify).
      logger.info("razorpay sync: chunk already credited, skipping", {
        paymentId: current.id,
        razorpayPaymentId,
      });
      return null;
    }

    const nextLog = [
      ...existingLog,
      {
        at: new Date().toISOString(),
        amount: chunkRupees,
        razorpayPaymentId,
      },
    ];

    const penalty = current.metaData?.penalty ?? 0;
    const totalDue = current.amount + penalty;
    // Cap at totalDue so a late-arriving chunk (e.g. chunk A landing after
    // chunk B already flipped the row to paid) can't overshoot. The audit
    // log still gets the entry so the chunk isn't silently lost.
    const newAmountPaid = Math.min(current.amountPaid + chunkRupees, totalDue);
    const wasAlreadyPaid = current.paymentStatus === "paid";
    const isFullyPaid = wasAlreadyPaid || newAmountPaid >= totalDue;

    const nextMetaData: PaymentMetaData = {
      ...(current.metaData ?? {}),
      partialPaymentLog: nextLog,
    };

    if (isFullyPaid) {
      await tx
        .update(payments)
        .set({
          amountPaid: newAmountPaid,
          paymentStatus: "paid",
          paymentMethod: "razorpay",
          // Don't reset paidDate on late-arriving chunks against an
          // already-paid row.
          ...(wasAlreadyPaid
            ? {}
            : { paidDate: new Date().toISOString().split("T")[0] }),
          metaData: nextMetaData,
        })
        .where(eq(payments.id, current.id));

      await tx
        .update(razorpayOrders)
        .set({ status: "paid" })
        .where(eq(razorpayOrders.id, localOrder.id));
    } else {
      await tx
        .update(payments)
        .set({
          amountPaid: newAmountPaid,
          paymentStatus: "partially_paid",
          paymentMethod: "razorpay",
          metaData: nextMetaData,
        })
        .where(eq(payments.id, current.id));
    }

    return {
      paymentId: current.id,
      amountPaid: chunkRupees,
      balanceDue: Math.max(totalDue - newAmountPaid, 0),
      razorpayPaymentId,
      method: remotePayment.method ?? null,
    };
  });

  // Only the caller that actually credited this chunk sends the receipt, so
  // the webhook + verifyPayment race can't produce two messages.
  if (credited) {
    logger.info("razorpay sync: chunk credited", {
      paymentId: credited.paymentId,
      razorpayOrderId: razorpayOrderIdStr,
      razorpayPaymentId,
      amountPaid: credited.amountPaid,
      balanceDue: credited.balanceDue,
    });
    try {
      await sendPaymentReceipt(credited);
    } catch (err) {
      // Payment is already committed; a receipt failure must not surface as
      // a failed payment to the student or a failed webhook to Razorpay.
      logger.error("razorpay sync: payment receipt failed", {
        paymentId: credited.paymentId,
        error: err,
      });
    }
  }
}

type CreditedChunk = {
  paymentId: number;
  amountPaid: number;
  balanceDue: number;
  razorpayPaymentId: string;
  method: string | null;
};

// Best-effort WhatsApp receipt after the payment tx commits. Meta failures
// are recorded in payment metadata; DB errors propagate to the caller's
// try/catch so they never fail the webhook or verifyPayment.
async function sendPaymentReceipt(chunk: CreditedChunk): Promise<void> {
  const [row] = await db
    .select({
      emiNumber: payments.emiNumber,
      description: payments.description,
      studentName: students.name,
      phoneNumber: students.phoneNumber,
      course: enrollments.course,
    })
    .from(payments)
    .innerJoin(students, eq(payments.studentId, students.id))
    .innerJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
    .where(eq(payments.id, chunk.paymentId))
    .limit(1);

  if (!row) {
    logger.warn("payment receipt: payment row not found", {
      paymentId: chunk.paymentId,
    });
    return;
  }

  const result = await sendPaymentReceivedWhatsApp({
    ...row,
    amountPaid: chunk.amountPaid,
    balanceDue: chunk.balanceDue,
    razorpayPaymentId: chunk.razorpayPaymentId,
    method: chunk.method,
  });

  if (!result.ok) {
    logger.warn("payment receipt: WhatsApp send failed", {
      paymentId: chunk.paymentId,
      error: result.error.slice(0, 200),
    });
  }

  const patch: PaymentMetaData = result.ok
    ? { receiptWhatsappStatus: "sent" }
    : {
        receiptWhatsappStatus: "failed",
        receiptWhatsappError: result.error.slice(0, 500),
      };

  // Merge into existing jsonb instead of overwriting sibling audit fields.
  await db
    .update(payments)
    .set({
      metaData: sql`(COALESCE(${payments.metaData}, '{}'::jsonb) - 'receiptWhatsappError') || ${JSON.stringify(patch)}::jsonb`,
    })
    .where(eq(payments.id, chunk.paymentId));
}

async function markOrderFailed(orderId: string) {
  await db
    .update(razorpayOrders)
    .set({ status: "failed" })
    .where(
      and(
        eq(razorpayOrders.razorpayOrderId, orderId),
        sql`${razorpayOrders.status} <> 'paid'`
      )
    );
}

export async function handleRazorpayWebhook(
  rawBody: string,
  signature: string,
  secret: string
): Promise<WebhookResult> {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!constantTimeEquals(expected, signature)) {
    logger.warn("razorpay webhook: invalid signature", {
      hasSignature: signature.length > 0,
    });
    return { kind: "invalid_signature" };
  }

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(rawBody) as RazorpayWebhookBody;
  } catch (error) {
    logger.warn("razorpay webhook: body is not valid JSON", { error });
    return { kind: "invalid_body" };
  }

  const { event } = body;
  const orderId = extractOrderId(body);
  const paymentId = extractPaymentId(body);
  if (!orderId) {
    logger.info("razorpay webhook: no order id, ignoring", { event });
    return { kind: "ok", processed: false };
  }

  logger.info("razorpay webhook: received", {
    event,
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
  });

  try {
    if (event === "payment.captured" || event === "order.paid") {
      await syncOrderPaymentState(orderId, paymentId);
    } else if (event === "payment.failed") {
      await markOrderFailed(orderId);
    } else {
      logger.info("razorpay webhook: unhandled event, ignoring", { event });
      return { kind: "ok", processed: false };
    }
  } catch (error) {
    // Rethrown so Razorpay sees a 5xx and retries the delivery.
    logger.error("razorpay webhook: processing failed", {
      event,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      error,
    });
    throw error;
  }

  return { kind: "ok", processed: true };
}
