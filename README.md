# Scalable Job Importer System

A production-ready job import system that fetches jobs from external RSS/XML feeds, processes them using a Redis-backed queue (BullMQ), and stores them in MongoDB with intelligent upsert logic. Includes an admin UI for monitoring import history and system health.

---

## Tech Stack

* **Frontend:** Next.js (App Router) + TailwindCSS
* **Backend:** Node.js + Express
* **Database:** MongoDB + Mongoose
* **Queue:** BullMQ
* **Queue Store:** Redis

---

## Repository Structure

```
.
├── client/          # Next.js admin UI
├── server/          # Express API + cron + worker
└── docs/            # Architecture notes
```

---

## Prerequisites

Make sure you have:

* **Node.js** (v18+ recommended)
* **MongoDB** (local installation or MongoDB Atlas)
* **Redis** (local, Docker, or Redis Cloud)

---

## Setup & Installation

### 1. Backend Setup

#### Install Dependencies

```bash
cd server
npm install
```

#### Configure Environment Variables

Create `server/.env`:

```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/job-importer
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
WORKER_CONCURRENCY=5
```

#### Run Backend Server

```bash
npm run dev
```

**Backend will run at:** `http://localhost:5000`

---

### 2. Worker Setup

The worker is a **separate process** that consumes Redis queue jobs and imports them into MongoDB.

Open a **new terminal** and run:

```bash
cd server
npm run worker
```

---

### 3. Redis Setup (Docker)

If you want to run Redis quickly using Docker:

```bash
docker run -d --name redis-job-importer -p 6379:6379 redis:7
```

---

### 4. Frontend Setup

#### Install Dependencies

```bash
cd client
npm install
```

#### Configure Environment Variables

Create `client/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

#### Run Frontend

```bash
npm run dev
```

**Frontend will run at:** `http://localhost:3000`

The app redirects `/` to `/import-logs`.

---

## How Imports Work

### Automated Import Flow

1. **Cron Trigger:** The backend server runs a cron job every hour
2. **Feed Processing:** For each feed URL:
   * Fetches XML content
   * Converts XML to JSON
   * Extracts job listings
   * Pushes jobs to BullMQ queue in batches
   * Creates an import log record in MongoDB
3. **Worker Processing:** The worker consumes queued batches and:
   * Upserts jobs into MongoDB using `bulkWrite()`
   * Updates import logs (new/updated/failed counts)
   * Marks the import log as completed when all batches finish

---

## API Endpoints

### Trigger Import Manually

**`POST /api/import/run`**

Manually trigger an import (useful for testing).

**Request Body (optional):**
```json
{
  "batchSize": 200
}
```

### Get Import Logs (Pagination)

**`GET /api/import-logs?page=1&limit=10`**

### Get Single Import Log

**`GET /api/import-logs/:id`**

Retrieve detailed information about a specific import.

---

## Notes/Assumptions

- Jobs are uniquely identified using the feed URL + job guid (or link if guid is missing).
- Imports are processed in batches for better performance and scalability.
- If a feed returns HTML instead of XML, it is skipped and logged with `totalFetched = 0`.

