import { env } from "@student-management-system/env/server";

const WHATSAPP_API_VERSION = "v25.0";
// Meta's pre-approved demo template, body has no variables. Used to verify
// access token + phone-number-id end-to-end before a custom template is
// approved. When env.WHATSAPP_OVERDUE_TEMPLATE is set to this name, we omit
// the `components` field — sending parameters with hello_world causes Meta
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

type SendOverdueArgs = {
  phoneNumber: string;
  studentName: string;
  emiNumber: number | null;
  description: string | null;
  amount: number;
  course: string;
};

// Builds the 4 body params for the approved reminder template:
//   "Reminder: {{1}}'s {{2}} fee, {{3}}, of {{4}} is due."
// {{1}} student name, {{2}} course, {{3}} installment label, {{4}} amount
// in Indian format ("₹7,500"). Meta rejects empty params, so every slot
// always has a value.
function buildOverdueTemplateParams(args: SendOverdueArgs) {
  return [
    { type: "text" as const, text: args.studentName },
    { type: "text" as const, text: args.course },
    { type: "text" as const, text: formatInstallmentLabel(args) },
    { type: "text" as const, text: formatRupees(args.amount) },
  ];
}

//   • EMI row             → "Installment N"  (most common)
//   • One-off (no EMI)    → the payment's description string ("Kit", etc.)
//   • Neither (fallback)  → "Payment"
function formatInstallmentLabel(args: SendOverdueArgs): string {
  if (args.emiNumber !== null) {
    return `Installment ${args.emiNumber}`;
  }
  return args.description || FALLBACK_INSTALLMENT_LABEL;
}

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// Sends the approved `payment_overdue` template to a student's WhatsApp via
// Meta Cloud API. Never throws — caller records the result in payment metadata
// and continues.
export async function sendOverdueWhatsApp(
  args: SendOverdueArgs
): Promise<WhatsAppSendResult> {
  const to = `${COUNTRY_CODE}${args.phoneNumber}`;
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
          name: env.WHATSAPP_OVERDUE_TEMPLATE,
          language: { code: TEMPLATE_LANGUAGE_CODE },
          ...(env.WHATSAPP_OVERDUE_TEMPLATE === HELLO_WORLD_TEMPLATE
            ? {}
            : {
                components: [
                  {
                    type: "body",
                    parameters: buildOverdueTemplateParams(args),
                  },
                ],
              }),
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
