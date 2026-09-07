import { cn } from "@/lib/utils";

export function FormMessage({
  type = "error",
  message,
}: {
  type?: "error" | "success";
  message?: string | null;
}) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl px-4 py-3 text-sm",
        type === "error" && "bg-red-50 text-red-700 border border-red-100",
        type === "success" && "bg-green-50 text-green-700 border border-green-100"
      )}
    >
      {message}
    </div>
  );
}
