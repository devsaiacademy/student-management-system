import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  console.log(data);

  return <div>Welcome, {data.user?.email}</div>;
}
