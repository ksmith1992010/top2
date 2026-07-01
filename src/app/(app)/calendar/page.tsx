import { PlaceholderPage } from "@/components/placeholder-page";
import { getNavItemByHref } from "@/lib/nav-config";
import { notFound } from "next/navigation";

export default function CalendarPage() {
  const item = getNavItemByHref("/calendar");
  if (!item) notFound();
  return <PlaceholderPage item={item} />;
}
