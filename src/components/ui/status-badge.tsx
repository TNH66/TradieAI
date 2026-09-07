import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  // job statuses
  new: "bg-ink-100 text-ink-700",
  scheduled: "bg-brand-50 text-brand-700",
  in_progress: "bg-amber-50 text-amber-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
  // quote statuses
  draft: "bg-ink-100 text-ink-700",
  sent: "bg-brand-50 text-brand-700",
  viewed: "bg-amber-50 text-amber-700",
  accepted: "bg-green-50 text-green-700",
  declined: "bg-red-50 text-red-700",
  expired: "bg-ink-100 text-ink-500",
  // invoice statuses
  paid: "bg-green-50 text-green-700",
  overdue: "bg-red-50 text-red-700",
};

const LABELS: Record<string, string> = {
  new: "New",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  paid: "Paid",
  overdue: "Overdue",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        STYLES[status] ?? "bg-ink-100 text-ink-700"
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
