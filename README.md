# NeoSapients Enterprise AI Cognition Assessment

Online Astro application for the Enterprise AI Cognition assessment. The server validates and recalculates every submission, stores it in SQLite, and independently fans the result out to Resend, Zapier, and an optional Google Sheets webhook.

The standalone offline Android TV build lives on the `cognition-offline` branch.

## Run locally

Requirements: Node.js 22.12 or later and a writable local directory for SQLite.

```bash
npm ci
copy .env.example .env
npm run dev
```

Open `http://localhost:4321`. Add `?preview` to review the UI without saving a response or calling integrations.

## Online integration configuration

```dotenv
RESEND_API_KEY=
RESEND_FROM_EMAIL=NeoSapients Cognition <cognition@neosapients.ai>
ZAPIER_WEBHOOK_URL=
GOOGLE_SHEETS_WEBHOOK_URL=
INTEGRATION_TIMEOUT_MS=8000
```

- Resend sends the participant a transactional HTML and text result email when they provide an email address. It uses `assessment-result/<submission-id>` as the idempotency key.
- Zapier receives `assessment.completed` and `assessment.callback.updated` JSON events.
- Google Sheets receives the same webhook events. It is optional and reports `skipped` until its URL is configured.
- Provider calls run concurrently. One unavailable integration does not block the other providers or discard the locally saved assessment.
- `RESEND_FROM_EMAIL` must use a domain verified in the Resend account.

Sensitive values belong in local `.env` files or deployment secrets; `.env` is ignored by Git.

## Webhook contract

Assessment events have this shape:

```json
{
  "event": "assessment.completed",
  "eventId": "assessment.completed/<submission-id>",
  "version": 1,
  "occurredAt": "ISO-8601 timestamp",
  "assessment": {}
}
```

Callback events contain `submissionId` and a boolean `requested` value. Zapier and the Google Sheets receiver should deduplicate using `eventId`.

## Local persistence and dashboard

The default database is `data/assessments.sqlite`; override it with `ASSESSMENT_DB_PATH`. Submission IDs are primary keys, so saving the same assessment twice cannot create two local rows.

Set `ADMIN_PASSWORD`, then open `/admin` from localhost and sign in to review responses, search participants, inspect recommendations, and export CSV. The dashboard and export are restricted to localhost and an HTTP-only eight-hour admin session.

## Build and deploy

```bash
npm run check
npm test
npm run build
npm start
```

This branch currently uses Astro's standalone Node adapter and `better-sqlite3`, so it needs a Node host with persistent storage. A full Cloudflare Workers deployment requires replacing SQLite with a Workers-compatible store such as D1 and switching to the Cloudflare adapter; merely adding secrets in Cloudflare does not make the Node bundle Workers-compatible.
