import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import { EmailLogo } from "./logo";

interface MagicLinkEmailProps {
  actionLink: string;
  code: string;
}

const BRAND_COLOR = "#0769AB";

export function MagicLinkEmail({ actionLink, code }: MagicLinkEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your Otomatiks sign-in code</Preview>
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
            margin: "40px auto",
            padding: "40px 32px",
            maxWidth: "480px",
            borderRadius: "8px",
          }}
        >
          <EmailLogo />

          <Heading
            style={{
              color: "#111",
              fontSize: "22px",
              fontWeight: 600,
              margin: "24px 0 12px",
            }}
          >
            Sign in to your account
          </Heading>

          <Text style={{ color: "#444", fontSize: "15px", lineHeight: "22px" }}>
            Click the button below to finish signing in, or enter the code in
            the app. The link and code expire in 10 minutes and can only be used
            once.
          </Text>

          <Section style={{ margin: "28px 0" }}>
            <Button
              href={actionLink}
              style={{
                backgroundColor: BRAND_COLOR,
                color: "#ffffff",
                borderRadius: "6px",
                fontSize: "15px",
                fontWeight: 600,
                padding: "12px 24px",
                textDecoration: "none",
              }}
            >
              Sign in
            </Button>
          </Section>

          <Text style={{ color: "#444", fontSize: "13px", lineHeight: "20px" }}>
            Or enter this code in the app:
          </Text>
          <Section
            style={{
              backgroundColor: "#f6f8fa",
              borderRadius: "6px",
              padding: "16px",
              textAlign: "center",
              margin: "8px 0 24px",
            }}
          >
            <Text
              style={{
                color: "#111",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "28px",
                fontWeight: 700,
                letterSpacing: "8px",
                margin: 0,
              }}
            >
              {code}
            </Text>
          </Section>

          <Text style={{ color: "#666", fontSize: "13px", lineHeight: "20px" }}>
            Or paste this URL into your browser:
            <br />
            <Link href={actionLink} style={{ color: BRAND_COLOR }}>
              {actionLink}
            </Link>
          </Text>

          <Hr style={{ borderColor: "#eee", margin: "32px 0 16px" }} />

          <Text style={{ color: "#888", fontSize: "12px", lineHeight: "18px" }}>
            If you didn't request this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default MagicLinkEmail;
