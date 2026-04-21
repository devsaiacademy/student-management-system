import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import { EmailLogo } from "./logo";

interface PaymentOverdueEmailProps {
  studentName: string;
  amount: number;
  dueDate: string;
  course?: string;
  emiNumber?: number;
  isOverdue?: boolean;
}

const BRAND_COLOR = "#0769AB";
const ALERT_COLOR = "#B3261E";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function PaymentOverdueEmail({
  studentName,
  amount,
  dueDate,
  course,
  emiNumber,
  isOverdue = true,
}: PaymentOverdueEmailProps) {
  const installmentLabel = emiNumber ? `EMI ${emiNumber}` : "Payment";
  const courseLabel = course ? ` for ${course}` : "";
  const heading = isOverdue ? "Your payment is overdue" : "Payment reminder";
  const preview = isOverdue
    ? "Your payment is overdue"
    : "A reminder about your upcoming payment";
  const bodyCopy = isOverdue
    ? `Hi ${studentName}, your ${installmentLabel}${courseLabel} was due on ${dueDate} and has not yet been received.`
    : `Hi ${studentName}, this is a reminder that your ${installmentLabel}${courseLabel} is due on ${dueDate}.`;
  const headingColor = isOverdue ? ALERT_COLOR : BRAND_COLOR;
  const detailBackground = isOverdue ? "#FBEAEA" : "#EAF2F8";

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f6f8fa",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            margin: "40px auto",
            maxWidth: "480px",
            padding: "40px 32px",
          }}
        >
          <EmailLogo />

          <Heading
            style={{
              color: headingColor,
              fontSize: "22px",
              fontWeight: 600,
              margin: "24px 0 12px",
            }}
          >
            {heading}
          </Heading>

          <Text style={{ color: "#444", fontSize: "15px", lineHeight: "22px" }}>
            {bodyCopy}
          </Text>

          <Section
            style={{
              backgroundColor: detailBackground,
              borderRadius: "6px",
              margin: "24px 0",
              padding: "16px 20px",
            }}
          >
            <Text
              style={{
                color: "#111",
                fontSize: "14px",
                lineHeight: "20px",
                margin: 0,
              }}
            >
              Amount due: <strong>{currencyFormatter.format(amount)}</strong>
            </Text>
            <Text
              style={{
                color: "#111",
                fontSize: "14px",
                lineHeight: "20px",
                margin: "4px 0 0",
              }}
            >
              Due date: <strong>{dueDate}</strong>
            </Text>
          </Section>

          <Text style={{ color: "#444", fontSize: "15px", lineHeight: "22px" }}>
            Please sign in to your student dashboard to settle this payment at
            your earliest convenience. If you've already paid, you can ignore
            this email.
          </Text>

          <Hr style={{ borderColor: "#eee", margin: "32px 0 16px" }} />

          <Text style={{ color: "#888", fontSize: "12px", lineHeight: "18px" }}>
            Questions? Reply to this email and our team will help.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PaymentOverdueEmail;
