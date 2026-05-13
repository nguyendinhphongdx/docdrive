import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginView } from "@/features/auth";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ path: "/login", title: "Sign in" });

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return <LoginView />;
}
