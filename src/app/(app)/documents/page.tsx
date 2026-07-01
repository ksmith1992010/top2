import { PlaceholderPage } from "@/components/placeholder-page";
import { getNavItemByHref } from "@/lib/nav-config";
import { notFound } from "next/navigation";

export default function DocumentsPage() {
  const item = getNavItemByHref("/documents");
  if (!item) notFound();
  return <PlaceholderPage item={item} />;
}
