export type FailedReason = {
  externalId?: string;
  reason?: string;
};

export type ImportLog = {
  _id: string;
  sourceUrl: string;

  status: "running" | "completed" | "failed";

  startedAt: string;
  finishedAt?: string;

  totalFetched: number;
  totalImported: number;

  totalBatches: number;
  processedBatches: number;

  newJobs: number;
  updatedJobs: number;
  failedJobs: number;

  failedReasons: FailedReason[];

  createdAt: string;
  updatedAt: string;
};

export type ImportLogsResponse = {
  items: ImportLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
