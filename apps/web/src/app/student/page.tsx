import { logger } from "@student-management-system/api/lib/logger";
import { notFound, redirect } from "next/navigation";

import { createTRPCServerCaller } from "@/utils/trpc-server";

// Parents land here from the sidebar "Billing" link. Resolve the signed-in
// user to their student row and forward to `/student/<id>`, which is the
// real billing page. If they have no matching student record, treat as 404
// rather than looping.
export default async function StudentBillingRedirect() {
  const trpc = await createTRPCServerCaller();
  const user = await trpc.auth.getUser();
  const matches = await trpc.auth.isStudentEmail({ email: user.email });
  const studentId = Array.isArray(matches) ? matches[0]?.id : undefined;
  if (!studentId) {
    logger.warn("student billing: no student matches session email", {
      userId: user.id,
    });
    notFound();
  }
  redirect(`/student/${studentId}`);
}
