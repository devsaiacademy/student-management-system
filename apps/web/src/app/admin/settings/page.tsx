import { redirect } from "next/navigation";

// Page retired — partial-payment control moved to a per-row Switch on the
// payments table. Delete the /admin/settings directory once confirmed.
export default function SettingsPage() {
  redirect("/admin/all-students");
}
