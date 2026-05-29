# InfaQRIS

Peta crowdsource lokasi QRIS masjid dan mushola di Indonesia.
A crowdsourced map of QRIS payment locations at mosques and prayer rooms across Indonesia.

**Live preview:** [infaqris.jaluwibowo.id](https://infaqris.jaluwibowo.id)

---

## Tech Stack

| Layer          | Choice                            |
| -------------- | --------------------------------- |
| Framework      | Nuxt.js 4                         |
| Styling        | Tailwind CSS v4                   |
| Icons          | `@nuxt/icon` + Material Symbols   |
| Map            | Leaflet + OpenStreetMap           |
| QR Render      | `qrcode`                          |
| QR Scan        | `html5-qrcode`                    |
| Database       | Google Sheets API v4              |
| Auth           | Google Sign-In (GSI)              |
| Bot protection | Cloudflare Turnstile              |
| Offline        | Workbox (PWA) + IndexedDB (`idb`) |
| Email          | Nodemailer (SMTP)                 |
| Deployment     | Vercel                            |

---

## Local Setup

### Prerequisites

- Node.js 20+
- pnpm 10+
- A Google Cloud project with:
  - Google Sheets API enabled
  - A service account with the JSON key downloaded
  - An OAuth 2.0 client ID (for Google Sign-In)
- A Cloudflare account with a Turnstile site configured (for bot protection on submissions)
- An SMTP account for email notifications (submission alerts + contributor confirmations)

### 1. Clone the repo

```bash
git clone https://github.com/jarooda/infaqris.git
cd infaqris
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable                            | Description                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `GOOGLE_CLIENT_ID`                  | OAuth 2.0 client ID — used for Google Sign-In (GSI) and server-side JWT verification |
| `GOOGLE_SPREADSHEET_ID`             | Google Sheet ID (from the URL: `.../spreadsheets/d/<ID>/...`)                        |
| `GOOGLE_SPREADSHEET_SHEET_ID`       | Sheet tab name or GID for the main locations sheet                                   |
| `GOOGLE_SPREADSHEET_SHEET_ADMIN_ID` | Sheet tab name or GID for the admin emails list                                      |
| `GOOGLE_SERVICE_ACCOUNT_KEY`        | Full service account JSON key as a single-line string                                |
| `TURNSTILE_SITE_KEY`                | Cloudflare Turnstile site key (public — sent to client)                              |
| `TURNSTILE_SECRET_KEY`              | Cloudflare Turnstile secret key (server-side verification only)                      |
| `RECIPIENT_EMAIL`                   | Email address that receives new submission notifications                             |
| `SMTP_HOST`                         | SMTP server hostname                                                                 |
| `SMTP_PORT`                         | SMTP server port (e.g. `587`)                                                        |
| `SMTP_EMAIL`                        | SMTP sender address                                                                  |
| `SMTP_PASSWORD`                     | SMTP sender password                                                                 |
| `GOOGLE_SPREADSHEET_PUBLIC_URL`     | Published Google Sheets URL (public view, email columns excluded) — shown in FAQ     |

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command         | Description                    |
| --------------- | ------------------------------ |
| `pnpm dev`      | Start dev server               |
| `pnpm build`    | Build for production           |
| `pnpm preview`  | Preview production build       |
| `pnpm lint`     | Run ESLint                     |
| `pnpm lint:fix` | Run ESLint with auto-fix       |
| `pnpm format`   | Format all files with Prettier |

---

## Contributing

Found a bug or have a feature idea? Open an issue at [github.com/jarooda/infaqris](https://github.com/jarooda/infaqris).

Commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) spec, enforced via commitlint + husky.
