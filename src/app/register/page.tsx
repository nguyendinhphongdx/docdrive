import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterView } from "@/features/auth";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ path: "/register", title: "Sign up" });

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return <RegisterView />;
}
