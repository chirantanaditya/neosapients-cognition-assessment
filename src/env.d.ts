/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />
/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ASSETS: Fetcher;
    RESEND_API_KEY: string;
    RESEND_FROM_EMAIL?: string;
    ZAPIER_WEBHOOK_URL: string;
    GOOGLE_SHEETS_WEBHOOK_URL: string;
    INTEGRATION_TIMEOUT_MS?: string;
    ADMIN_PASSWORD: string;
  }
}
