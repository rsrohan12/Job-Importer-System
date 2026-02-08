
# Architecture - Scalable Job Importer

## Goal
Build a scalable job import system that:
- fetches job feeds from multiple external APIs (RSS/XML)
- converts XML → JSON
- processes jobs using a queue + worker model
- stores jobs in MongoDB with upsert logic (no duplicates)
- tracks each import run with history logs
- provides an admin UI to view import history

---

## High-Level Flow

1. **Cron Scheduler (Backend)**
   - Runs every 1 hour
   - Fetches jobs from all configured feed URLs

2. **Feed Fetch + Parsing**
   - Each feed returns XML (RSS)
   - XML is converted into JSON using `xml2js`
   - Jobs are normalized into a common structure

3. **Queue Producer**
   - Jobs are chunked into batches (default: 200)
   - Each batch is pushed into BullMQ queue stored in Redis
   - A MongoDB record is created in `import_logs` for tracking

4. **Worker (Queue Consumer)**
   - Worker runs as a separate Node process
   - It consumes batches from Redis queue
   - Imports jobs into MongoDB using `bulkWrite()` with `upsert: true`
   - Updates the `import_logs` record after each batch

5. **Import Completion**
   - Each import log stores:
     - `totalBatches`
     - `processedBatches`
   - When `processedBatches === totalBatches`, the log is marked as `completed`

6. **Admin UI (Next.js)**
   - Displays import logs in a table
   - Supports pagination
   - Detail page shows failed reasons

---

## Why Queue + Worker?

Importing jobs can become expensive when data grows (100k+ or 1M+ jobs).
Direct insertion inside a single request can:
- block the server
- cause timeouts
- overload MongoDB
- make failure recovery harder

A queue + worker approach provides:
- controlled concurrency
- retry support
- better stability
- ability to scale horizontally (multiple workers)

---

## Data Model

### `jobs` collection
Stores the final normalized job records.

Key points:
- Unique index: `{ sourceUrl, externalId }`
- Uses upsert to avoid duplicates
- Stores `raw` field for original feed data

### `import_logs` collection
Stores one document per feed import run.

Fields include:
- timestamps (startedAt, finishedAt)
- totals (totalFetched, totalImported)
- inserted vs updated (newJobs, updatedJobs)
- failures (failedJobs, failedReasons[])
- progress tracking (totalBatches, processedBatches)

---

## Upsert Strategy (MongoDB)
Worker imports using:

- `bulkWrite()`
- `updateOne`
- `upsert: true`

This is efficient for large imports and avoids inserting duplicates.

Unique identity:
- `externalId` from RSS `guid`
- fallback to `link` if `guid` is missing

---

## Failure Handling
- BullMQ jobs have retry enabled (`attempts: 3`)
- Exponential backoff is used
- If a batch fails, it is counted in the import log and the first errors are stored in `failedReasons`

---

## Scalability Notes
This design supports scale because:
- imports are batched
- worker concurrency is configurable
- queue allows backpressure
- multiple worker processes can be added later

This can be split into microservices easily:
- Feed Fetcher service
- Import Worker service
- Admin API service

---

## Future Improvements (Optional)
- real-time updates using SSE/WebSocket
- feed-level locking (avoid overlapping cron runs)
- distributed worker scaling
- better feed normalization per provider
