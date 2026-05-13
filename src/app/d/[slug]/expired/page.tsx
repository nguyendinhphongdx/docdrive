import { ExpiredView } from "./ExpiredView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  path: "/s/expired",
  title: "Expired",
});

export default function ExpiredPage() {
  return <ExpiredView />;
}
