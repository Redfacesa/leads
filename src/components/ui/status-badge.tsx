import { cn } from "@/lib/utils";
import { LEAD_STATUS_LABELS } from "@/lib/utils";

const statusColors: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-300",
  verified: "bg-cyan-500/15 text-cyan-300",
  qualified: "bg-emerald-500/15 text-emerald-300",
  matched: "bg-violet-500/15 text-violet-300",
  delivered: "bg-indigo-500/15 text-indigo-300",
  contacted: "bg-amber-500/15 text-amber-300",
  in_progress: "bg-orange-500/15 text-orange-300",
  converted: "bg-green-500/15 text-green-300",
  rejected: "bg-red-500/15 text-red-300",
  duplicate: "bg-zinc-500/15 text-zinc-300",
  invalid: "bg-red-500/15 text-red-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", statusColors[status] ?? "bg-zinc-500/15 text-zinc-300")}>
      {LEAD_STATUS_LABELS[status] ?? status}
    </span>
  );
}
