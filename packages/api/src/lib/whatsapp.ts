import { env } from "@student-management-system/env/server";

const WHATSAPP_API_VERSION = "v25.0";
// Meta's pre-approved demo template, body has no variables. Used to verify
// access token + phone-number-id end-to-end before a custom template is
// approved. When a configured template name is this, we omit the
// `components` field — sending parameters with hello_world causes Meta
// to reject the call with error 132012 (parameter count mismatch).
const HELLO_WORLD_TEMPLATE = "hello_world";
const WHATSAPP_GRAPH_HOST = "https://graph.facebook.com";
// Meta's examples send `to` as digits only (country code + number, no "+").
const COUNTRY_CODE = "91";
// Must match the approved template's language exactly: "English" is "en"
// ("English (US)" would be "en_US").
const TEMPLATE_LANGUAGE_CODE = "en";
const FALLBACK_INSTALLMENT_LABEL = "Payment";

export type WhatsAppSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

type TextParam = { type: "text"; text: string };

type InstallmentRef = {
  emiNumber: number | null;
  description: string | null;
};

type SendOverdueArgs = InstallmentRef & {
  phoneNumber: string;
  studentName: string;
  amount: number;
  course: string;
};

type SendPaymentReceivedArgs = InstallmentRef & {
  phoneNumber: string;
  studentName: string;
  course: string;
  amountPaid: number;
  balanceDue: number;
  razorpayPaymentId: string;
  // Razorpay payment.method: "upi" | "card" | "netbanking" | "wallet" | ...
  method: string | null;
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net Banking",
  wallet: "Wallet",
  emi: "EMI",
  cardless_emi: "Cardless EMI",
  paylater: "Pay Later",
  bank_transfer: "Bank Transfer",
};
const FALLBACK_PAYMENT_METHOD_LABEL = "Online";

function formatPaymentMethod(method: string | null): string {
  if (!method) {
    return FALLBACK_PAYMENT_METHOD_LABEL;
  }
  return PAYMENT_METHOD_LABELS[method] ?? FALLBACK_PAYMENT_METHOD_LABEL;
}

function textParam(text: string): TextParam {
  return { type: "text", text };
}

// Builds the 4 body params for the approved reminder template:
//   "Reminder: {{1}}'s {{2}} fee, {{3}}, of {{4}} is due."
// {{1}} student name, {{2}} course, {{3}} installment label, {{4}} amount
// in Indian format ("₹7,500"). Meta rejects empty params, so every slot
// always has a value.
function buildOverdueTemplateParams(args: SendOverdueArgs): TextParam[] {
  return [
    textParam(args.studentName),
    textParam(args.course),
    textParam(formatInstallmentLabel(args)),
    textParam(formatRupees(args.amount)),
  ];
}

// Builds the 7 body params for the approved `payment_received` utility
// template:
//   Header: "Payment Received Successfully" (static, no params)
//   Body:   "Hi {{1}}, we have received your payment of {{2}} towards the
//            {{3}} fee ({{4}}). Balance due: {{5}}.
//            Paid via: {{6}}
//            Payment ID: {{7}}
//            Please keep this message for your records."
//   Footer: "Thank you." (static)
// Meta rejects a body that ends on a variable, hence the closing line.
// {{1}} student name, {{2}} amount of this payment, {{3}} course,
// {{4}} installment label, {{5}} remaining balance ("₹0" when fully paid),
// {{6}} payment method ("UPI", "Card", ...), {{7}} Razorpay payment id
// ("pay_...").
function buildPaymentReceivedTemplateParams(
  args: SendPaymentReceivedArgs
): TextParam[] {
  return [
    textParam(args.studentName),
    textParam(formatRupees(args.amountPaid)),
    textParam(args.course),
    textParam(formatInstallmentLabel(args)),
    textParam(formatRupees(args.balanceDue)),
    textParam(formatPaymentMethod(args.method)),
    textParam(args.razorpayPaymentId),
  ];
}

//   • EMI row             → "Installment N"  (most common)
//   • One-off (no EMI)    → the payment's description string ("Kit", etc.)
//   • Neither (fallback)  → "Payment"
function formatInstallmentLabel(args: InstallmentRef): string {
  if (args.emiNumber !== null) {
    return `Installment ${args.emiNumber}`;
  }
  return args.description || FALLBACK_INSTALLMENT_LABEL;
}

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// Sends one template message via Meta Cloud API. Never throws — callers
// record the result in payment metadata and continue.
async function sendTemplate(
  phoneNumber: string,
  templateName: string,
  bodyParams: TextParam[]
): Promise<WhatsAppSendResult> {
  const to = `${COUNTRY_CODE}${phoneNumber}`;
  const url = `${WHATSAPP_GRAPH_HOST}/${WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: TEMPLATE_LANGUAGE_CODE },
          ...(templateName === HELLO_WORLD_TEMPLATE
            ? {}
            : { components: [{ type: "body", parameters: bodyParams }] }),
        },
      }),
    });

    const body = await response.text();

    if (!response.ok) {
      return {
        ok: false,
        error: `Meta API ${response.status}: ${body.slice(0, 500)}`,
      };
    }

    const data = JSON.parse(body) as {
      messages?: Array<{ id: string }>;
    };
    const messageId = data.messages?.[0]?.id;
    if (!messageId) {
      return { ok: false, error: "Meta API response missing message id" };
    }
    return { ok: true, messageId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Sends the approved overdue reminder template to a student's WhatsApp.
export function sendOverdueWhatsApp(
  args: SendOverdueArgs
): Promise<WhatsAppSendResult> {
  return sendTemplate(
    args.phoneNumber,
    env.WHATSAPP_OVERDUE_TEMPLATE,
    buildOverdueTemplateParams(args)
  );
}

// Sends the approved "payment received" receipt template after a Razorpay
// payment is credited.
export function sendPaymentReceivedWhatsApp(
  args: SendPaymentReceivedArgs
): Promise<WhatsAppSendResult> {
  return sendTemplate(
    args.phoneNumber,
    env.WHATSAPP_PAYMENT_RECEIVED_TEMPLATE,
    buildPaymentReceivedTemplateParams(args)
  );
}
