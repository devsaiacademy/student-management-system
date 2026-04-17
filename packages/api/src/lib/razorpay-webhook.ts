import { createHmac, timingSafeEqual } from "node:crypto";

import { db } from "@student-management-system/db";
import { payments } from "@student-management-system/db/schema/payment";
import { razorpayOrders } from "@student-management-system/db/schema/razorpay-order";
import { and, eq, sql } from "drizzle-orm";

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

async function markOrderPaid(
  orderId: string,
  razorpayPaymentId: string | null
) {
  await db.transaction(async (tx) => {
    const [updatedOrder] = await tx
      .update(razorpayOrders)
      .set({
        status: "paid",
        ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
      })
      .where(
        and(
          eq(razorpayOrders.razorpayOrderId, orderId),
          sql`${razorpayOrders.status} <> 'paid'`
        )
      )
      .returning({ id: razorpayOrders.id });

    if (!updatedOrder) {
      return;
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
    await markOrderPaid(orderId, extractPaymentId(body));
  } else if (body.event === "payment.failed") {
    await markOrderFailed(orderId);
  } else {
    return { kind: "ok", processed: false };
  }

  return { kind: "ok", processed: true };
}
