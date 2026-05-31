import { createHmac, timingSafeEqual } from "node:crypto";

import { db } from "@student-management-system/db";
import {
  payments,
  type PaymentMetaData,
} from "@student-management-system/db/schema/payment";
import { razorpayOrders } from "@student-management-system/db/schema/razorpay-order";
import { env } from "@student-management-system/env/server";
import { and, eq, sql } from "drizzle-orm";
import Razorpay from "razorpay";

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
    return;
  }

  // Pull the chunk amount directly from the payment entity. order.amount_paid
  // is cumulative for THAT order; we want this specific chunk's amount.
  const remotePayment = (await razorpay.payments.fetch(razorpayPaymentId)) as {
    amount: number | string;
  };
  const chunkPaise = Number(remotePayment.amount);
  const chunkRupees = Math.floor(chunkPaise / 100);

  await db.transaction(async (tx) => {
    const [localOrder] = await tx
      .update(razorpayOrders)
      .set({ razorpayPaymentId })
      .where(eq(razorpayOrders.razorpayOrderId, razorpayOrderIdStr))
      .returning({ id: razorpayOrders.id });

    if (!localOrder) {
      return;
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
      return;
    }

    const existingLog = current.metaData?.partialPaymentLog ?? [];
    if (existingLog.some((e) => e.razorpayPaymentId === razorpayPaymentId)) {
      // Already credited (replayed webhook or duplicate verify).
      return;
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
  });
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
    return { kind: "invalid_signature" };
  }

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(rawBody) as RazorpayWebhookBody;
  } catch {
    return { kind: "invalid_body" };
  }

  const orderId = extractOrderId(body);
  if (!orderId) {
    return { kind: "ok", processed: false };
  }

  if (body.event === "payment.captured" || body.event === "order.paid") {
    await syncOrderPaymentState(orderId, extractPaymentId(body));
  } else if (body.event === "payment.failed") {
    await markOrderFailed(orderId);
  } else {
    return { kind: "ok", processed: false };
  }

  return { kind: "ok", processed: true };
}
