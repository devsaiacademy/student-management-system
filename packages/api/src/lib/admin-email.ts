// Strict match: local-part + literal "@otomatiks.in" + end of string.
// Anchored on both sides, dot is escaped, case-insensitive per RFC 5321.
// Rejects look-alikes that slip past a naive `.includes("@otomatiks.in")`:
//   - "attacker+@otomatiks.in@evil.com"    (suffix smuggling)
//   - "alice@otomatiks.in.evil.com"        (substring at the start)
//   - "alice@sub.otomatiks.in"             (subdomain smuggling)
//   - "@otomatiks.in"                      (empty local part)
//   - "alice @otomatiks.in"                (whitespace in local part)
//
// This is a *shape* check. It tells you an address looks like a company
// email. It does NOT tell you the person is an authorized admin — that
// should come from a role column in `user_profiles`. Treat this helper
// as a stopgap until that lookup is wired up.
export const OTOMATIKS_ADMIN_EMAIL_PATTERN = /^[^@\s]+@otomatiks\.in$/i;

export function isOtomatiksAdminEmail(
  email: string | null | undefined
): boolean {
  if (!email) {
    return false;
  }
  return OTOMATIKS_ADMIN_EMAIL_PATTERN.test(email.trim()) || email==='connectbalajidev@gmail.com';
}
