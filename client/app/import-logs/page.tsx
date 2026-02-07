import Link from "next/link";

import Container from "@/components/Container";
import Pagination from "@/components/Pagination";
import StatusBadge from "@/components/StatusBadge";
import { getImportLogs } from "@/lib/api";
import { formatDate, truncate } from "@/lib/utils";

export default async function ImportLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;

  const currentPage = Number(page || 1);
  const limit = 10;

  const data = await getImportLogs(currentPage, limit);

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Import History
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Track each feed import run (URL = filename).
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">FileName (URL)</th>
                <th className="px-4 py-3">Import Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">New</th>
                <th className="px-4 py-3 text-right">Updated</th>
                <th className="px-4 py-3 text-right">Failed</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {data.items.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/import-logs/${log._id}`}
                      className="font-medium text-gray-900 hover:underline"
                      title={log.sourceUrl}
                    >
                      {truncate(log.sourceUrl, 70)}
                    </Link>
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {formatDate(log.startedAt)}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={log.status} />
                  </td>

                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {log.totalImported}
                  </td>

                  <td className="px-4 py-3 text-right text-gray-800">
                    {log.newJobs}
                  </td>

                  <td className="px-4 py-3 text-right text-gray-800">
                    {log.updatedJobs}
                  </td>

                  <td className="px-4 py-3 text-right text-gray-800">
                    {log.failedJobs}
                  </td>
                </tr>
              ))}

              {data.items.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-gray-500"
                    colSpan={7}
                  >
                    No import logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={data.page} totalPages={data.totalPages} />
    </Container>
  );
}
