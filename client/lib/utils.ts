export function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);

  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(text: string, max = 55) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}
