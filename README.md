# Daymark — Daily Routine & 1-Year Discipline Tracker

Daymark is a local, full-stack tracker for the fixed one-year plan **30 September 2026 through 30 September 2027 inclusive**. That interval contains **366 dates**; day numbering follows actual calendar dates (1–366).

## Run locally

Requires Node.js 20 or later. No package installation or external service is required.

```sh
npm start
```

Open http://localhost:3000. The first account created on a local instance becomes its account. Sign-in uses a salted scrypt password hash and an HttpOnly, SameSite cookie. Data is stored in `data/tracker.json` beside the server; keep a backup of that file as well as using the in-app export.

The server tries port 3000 first, then the next available port, and prints the exact local URL. Keep its terminal window open while using Daymark. On Windows, double-click `Run Daymark.bat` to start the server and open it in your default desktop browser. The Codex in-app browser is isolated from local server ports; use a desktop browser for this local app.

Set `PORT` to use another local port. There is no `.env` file or third-party AI key in this build. The app intentionally keeps journal and account data on the machine running the server.

## Data & calculations

- Task definitions are fixed in the app; daily records are separate, date-scoped entries. The UI rejects dates beyond the plan endpoints.
- The normal learning schedule is 7.5 hours: 7 hours of study plus 30 minutes of Current Affairs. Fitness adds a separate hour. Gain is recorded learning time above 7.5 hours after confirmed recovery hours are satisfied.
- A missed task creates visible pending recovery at 1× duration (normal) or 2× (strict). Recovery is manually confirmed and is not automatically scheduled. Excuse entries reject spending beyond available gain.
- Sleep tracks bedtime, wake time, and duration against a 10 PM bedtime and 6-hour duration target.
- Journal, task, sleep, recovery, settings, and ledger data persist on the local server. JSON backup includes all app data; CSV exports task records. Restore previews date/task/status validity and explains matching task replacement before confirmation.
- AI Insights currently uses a local, deterministic fallback. No external AI provider is wired in; no AI claim implies that notes were sent to a service.
- Reminder controls record preferences and request browser notification permission. Browser notifications require an open tab, granted permission and device support; this local build does not provide guaranteed alarm delivery.

## Verify

```sh
npm test
```

The tests cover inclusive range endpoints and day numbers, the 366-date count, gain/recovery ordering, recovery multipliers, and excuse balance arithmetic.

## Storage and deployment

Local runs use `data/tracker.json`. The Vercel build uses the included Node.js API functions and Neon Postgres, with hashed database-backed sessions and a one-time owner setup code. Review [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) before deploying. Keep local data and environment secrets out of the uploaded project; `.vercelignore` excludes both.

The public deployment is intentionally single-owner: the setup code allows the first owner account to be created once, then registration closes. A public URL does not make anyone's routine or journal visible without signing in.
