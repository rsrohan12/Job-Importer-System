import type { ImportLog, ImportLogsResponse } from "@/types/importLog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is missing in .env.local");
}

export async function getImportLogs(page = 1, limit = 10) {
  const res = await fetch(
    `${API_BASE}/api/import-logs?page=${page}&limit=${limit}`,
    { cache: "no-store" }
  );

  if (!res.ok) throw new Error("Failed to fetch import logs");

  const data = (await res.json()) as ImportLogsResponse;
  return data;
}

export async function getImportLogById(id: string) {
  const res = await fetch(`${API_BASE}/api/import-logs/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch import log");

  const data = (await res.json()) as ImportLog;
  return data;
}
