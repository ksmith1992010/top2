import { PlaceholderPage } from "@/components/placeholder-page";
import { getNavItemByHref } from "@/lib/nav-config";
import { notFound } from "next/navigation";

export default function ProductionPage() {
  const item = getNavItemByHref("/production");
  if (!item) notFound();
  return <PlaceholderPage item={item} />;
}
