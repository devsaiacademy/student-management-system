import { createHmac, timingSafeEqual } from "node:crypto";

import { db } from "@student-management-system/db";
import { payments } from "@student-management-system/db/schema/payment";
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

// Sync the local payments row with Razorpay's authoritative amount_paid on
// the order. Idempotent: re-running with the same data yields the same row.
// Drives both partial and full settlement transitions.
export async function syncOrderPaymentState(
  razorpayOrderIdStr: string,
  razorpayPaymentId: string | null
) {
  const remoteOrder = (await razorpay.orders.fetch(razorpayOrderIdStr)) as {
    amount: number | string;
    amount_paid: number | string;
    status: string;
  };
  const amountPaidPaise = Number(remoteOrder.amount_paid);
  const totalPaise = Number(remoteOrder.amount);
  const amountPaidRupees = Math.floor(amountPaidPaise / 100);
  const isFullyPaid = amountPaidPaise >= totalPaise && totalPaise > 0;

  await db.transaction(async (tx) => {
    const [localOrder] = await tx
      .update(razorpayOrders)
      .set({
        status: isFullyPaid ? "paid" : remoteOrder.status,
        ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
      })
      .where(eq(razorpayOrders.razorpayOrderId, razorpayOrderIdStr))
      .returning({ id: razorpayOrders.id });

    if (!localOrder) {
      return;
    }

    if (isFullyPaid) {
      await tx
        .update(payments)
        .set({
          amountPaid: amountPaidRupees,
          paymentStatus: "paid",
          paymentMethod: "razorpay",
          paidDate: new Date().toISOString().split("T")[0],
        })
        .where(
          and(
            eq(payments.razorpayOrderId, localOrder.id),
            sql`${payments.paymentStatus} <> 'paid'`
          )
        );
    } else if (amountPaidPaise > 0) {
      await tx
        .update(payments)
        .set({
          amountPaid: amountPaidRupees,
          paymentStatus: "partially_paid",
        })
        .where(
          and(
            eq(payments.razorpayOrderId, localOrder.id),
            sql`${payments.paymentStatus} <> 'paid'`
          )
        );
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
