# NeoSapients Enterprise AI Cognition Assessment

Offline-first Astro application for a portrait touch display. The browser collects answers; the server validates and recalculates the result, then stores the completed response in a local SQLite database. No internet connection or external integration is required.

## Run locally

Requirements: Node.js 22.12 or later and a writable local directory for the database.

```bash
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:4321`. Add `?preview` to review the complete UI without creating a database record.

The layout includes a dedicated portrait-kiosk mode for displays at least 900 × 1200 CSS pixels, including common 1080 × 1920 vertical screens. Coarse-pointer devices receive larger touch targets, tap-safe controls, disabled hover movement, and overscroll containment.

## Local SQLite storage

The default database is `data/assessments.sqlite`. The directory is created automatically. To use another location, set `ASSESSMENT_DB_PATH` to an absolute path on the kiosk computer.

The `assessment_submissions` table stores identity fields, the assessment path, total and pillar scores, priority ranking, individual answers, recommendations, and a complete JSON snapshot. Submission ID is the primary key, so retrying the same save cannot create a duplicate row.

Back up the database regularly. Shut down the app before manually copying the database so its WAL file is fully consolidated.

## Local response dashboard

Open `http://localhost:4321/admin` on the kiosk computer to review responses, search participant and company fields, inspect answers and recommendations, see follow-up requests, or export the complete dataset as CSV.

The dashboard is read-only, is not linked from the participant assessment, and rejects requests that do not originate from localhost. Remote administration is intentionally disabled.

## Offline touch-TV setup

- Run the Astro server and browser on the same TV computer.
- Start the server automatically when the computer logs in.
- Launch Chrome or Edge in kiosk/full-screen mode at `http://localhost:4321`.
- Keep the database directory on a persistent local drive and include it in backups.
- All required fonts, images, scripts, and styles are bundled locally; external links have been removed from the assessment flow.

## Build and deploy

```bash
npm run check
npm run build
npm start
```

The project uses Astro's standalone Node adapter and the `better-sqlite3` driver. Start `dist/server/entry.mjs` on the kiosk computer. The included Dockerfile uses Node 22 and declares `/app/data` as a persistent volume.

The save endpoint is `POST /api/assessment`. It accepts only same-origin JSON, validates the lead and ranking, recalculates every score on the server, and writes the validated record to SQLite.

## Pre-launch checks

- Submit one full scored assessment and confirm one SQLite row is written.
- Submit the “None yet” route and confirm no score is fabricated.
- Retry a submission with the same ID and verify no duplicate row is created.
- Restart the server and confirm existing records remain available in `data/assessments.sqlite`.
- Confirm the inactivity reset clears participant details from the visible browser session.

Astro runs from `src/` and `public/`; obsolete pre-Astro and external-integration reference files are excluded from the repository.
