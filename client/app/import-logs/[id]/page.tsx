import Link from "next/link";

import Container from "@/components/Container";
import StatusBadge from "@/components/StatusBadge";
import { getImportLogById } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default async function ImportLogDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const log = await getImportLogById(id);

  return (
    <Container>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/import-logs"
            className="text-sm font-medium text-gray-600 hover:underline"
          >
            ← Back to Import History
          </Link>

          <h1 className="mt-3 text-xl font-semibold text-gray-900">
            Import Log Details
          </h1>

          <p className="mt-1 break-all text-sm text-gray-600">
            {log.sourceUrl}
          </p>
        </div>

        <StatusBadge status={log.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Started</p>
          <p className="mt-1 font-medium text-gray-900">
            {formatDate(log.startedAt)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Finished</p>
          <p className="mt-1 font-medium text-gray-900">
            {formatDate(log.finishedAt)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Imported</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {log.totalImported}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Fetched</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {log.totalFetched}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">New</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {log.newJobs}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Updated</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {log.updatedJobs}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {log.failedJobs}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Batch Progress</p>
          <p className="mt-1 font-medium text-gray-900">
            {log.processedBatches} / {log.totalBatches}
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Failed Reasons
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            (Showing first {log.failedReasons?.length || 0} errors)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">External ID</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {log.failedReasons?.length ? (
                log.failedReasons.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-800">
                      {r.externalId || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.reason || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No failures 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Container>
  );
}
