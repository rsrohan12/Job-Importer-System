import Link from "next/link";

export default function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="mt-6 flex items-center justify-between">
      <p className="text-sm text-gray-600">
        Page <span className="font-medium">{page}</span> of{" "}
        <span className="font-medium">{totalPages}</span>
      </p>

      <div className="flex gap-2">
        <Link
          href={`/import-logs?page=${page - 1}`}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            prevDisabled
              ? "pointer-events-none opacity-40"
              : "hover:bg-gray-50"
          }`}
        >
          Prev
        </Link>

        <Link
          href={`/import-logs?page=${page + 1}`}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            nextDisabled
              ? "pointer-events-none opacity-40"
              : "hover:bg-gray-50"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
