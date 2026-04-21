import { Img } from "@react-email/components";

export const EMAIL_LOGO_SVG_URL =
  "https://www.otomatiks.com/assets/logo-C4Uek5Wt.svg";

// SVG only — Gmail's HTML sanitizer strips MSO conditional comments, which
// caused the PNG fallback to render as a download box alongside the SVG.
// Trade-off: Outlook desktop shows alt text instead of the logo. Acceptable
// for this audience (students primarily on Gmail / Apple Mail).
export function EmailLogo() {
  return (
    <Img
      alt="Otomatiks"
      height={141}
      src={EMAIL_LOGO_SVG_URL}
      style={{ display: "block", margin: "0 auto" }}
      width={200}
    />
  );
}
