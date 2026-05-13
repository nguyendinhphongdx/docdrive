import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardView } from "@/features/document";
import { createMetadata } from "@/lib/seo";
import { DashboardHeader } from "./DashboardHeader";

export const metadata = createMetadata({
  path: "/dashboard",
  title: "My documents",
});

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?next=/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader
        user={{ email: session.user.email, name: session.user.name }}
      />
      <DashboardView />
    </div>
  );
}
