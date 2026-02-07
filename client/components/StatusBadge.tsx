export default function StatusBadge({
  status,
}: {
  status: "running" | "completed" | "failed";
}) {
  const styles =
    status === "completed"
      ? "bg-green-50 text-green-700 ring-green-200"
      : status === "running"
      ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
      : "bg-red-50 text-red-700 ring-red-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${styles}`}
    >
      {status}
    </span>
  );
}
