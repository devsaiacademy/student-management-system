import { env } from "@student-management-system/env/server";

const WHATSAPP_API_VERSION = "v25.0";
// Meta's pre-approved demo template, body has no variables. Used to verify
// access token + phone-number-id end-to-end before a custom template is
// approved. When env.WHATSAPP_OVERDUE_TEMPLATE is set to this name, we omit
// the `components` field — sending parameters with hello_world causes Meta
// to reject the call with error 132012 (parameter count mismatch).
const HELLO_WORLD_TEMPLATE = "hello_world";
const WHATSAPP_GRAPH_HOST = "https://graph.facebook.com";
const COUNTRY_CODE = "+91";
const TEMPLATE_LANGUAGE_CODE = "en_US";
const LATE_FEE_WARNING = "extra charges";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type WhatsAppSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

type SendOverdueArgs = {
  phoneNumber: string;
  emiNumber: number | null;
  description: string | null;
  amount: number;
  course: string;
  dueDate: string;
};

// Builds the 4 body params for the approved overdue template. Slot {{1}}
// must read naturally inside "Your {{1}} payment of {{2}}..." — so we choose
// the noun phrase by what the row actually represents:
//   • EMI row             → "EMI N for {course} course"  (most common)
//   • One-off (no EMI)    → the payment's description string ("Kit", etc.)
//   • Neither (fallback)  → "{course} course"
// {{2}} is the amount with ₹ prefix, {{3}} is days overdue (floored, ≥0),
// {{4}} is a fixed warning string — Meta templates can't accept arbitrary
// copy in approved slots.
function buildOverdueTemplateParams(args: SendOverdueArgs) {
  const daysOverdue = Math.max(
    0,
    Math.floor((Date.now() - new Date(args.dueDate).getTime()) / MS_PER_DAY)
  );
  return [
    { type: "text" as const, text: formatPaymentLabel(args) },
    { type: "text" as const, text: `₹${args.amount}` },
    { type: "text" as const, text: String(daysOverdue) },
    { type: "text" as const, text: LATE_FEE_WARNING },
  ];
}

function formatPaymentLabel(args: SendOverdueArgs): string {
  if (args.emiNumber !== null) {
    return `EMI ${args.emiNumber} for ${args.course} course`;
  }
  if (args.description) {
    return args.description;
  }
  return `${args.course} course`;
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

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        error: `Meta API ${response.status}: ${body.slice(0, 500)}`,
      };
    }

    const data = (await response.json()) as {
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
