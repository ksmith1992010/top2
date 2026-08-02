import Link from "next/link";
import { cn } from "@/lib/cn";

type JobsViewToggleProps = {
  active: "list" | "board";
};

export function JobsViewToggle({ active }: JobsViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-top-border p-0.5 text-sm">
      <Link
        href="/jobs"
        className={cn(
          "rounded-md px-3 py-1.5",
          active === "list"
            ? "bg-top-surface-raised font-medium text-top-text"
            : "text-top-muted hover:text-top-text",
        )}
        aria-current={active === "list" ? "page" : undefined}
      >
        List
      </Link>
      <Link
        href="/jobs/board"
        className={cn(
          "rounded-md px-3 py-1.5",
          active === "board"
            ? "bg-top-surface-raised font-medium text-top-text"
            : "text-top-muted hover:text-top-text",
        )}
        aria-current={active === "board" ? "page" : undefined}
      >
        Board
      </Link>
    </div>
  );
}
