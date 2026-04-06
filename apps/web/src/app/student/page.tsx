import { BillingPage } from "@/components/student/billing-page";
import { createTRPCServerCaller } from "@/utils/trpc-server";

export default async function StudentBillingPage() {
  const trpc = await createTRPCServerCaller();
  const billing = await trpc.billing.getStudentBilling();

  return (
    <BillingPage
      enrollments={billing.enrollments}
      payments={billing.payments}
      student={billing.student}
    />
  );
}
