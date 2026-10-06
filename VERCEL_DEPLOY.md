# Deploy DP to Vercel

This folder is prepared for Vercel as a static frontend plus Node.js API functions. Production records and authentication sessions use Postgres through the Neon Vercel Marketplace integration. The local JSON file is excluded from deployment.

## 1. Add persistent storage

In the Vercel dashboard, create a project for this folder, then open **Storage → Create Database** and install the **Neon Postgres** integration. Choose the plan and region you want; Vercel will add the database connection environment variable to the project. Confirm it is named `DATABASE_URL` (Neon’s Vercel integration uses that name).

The API creates its tables on first use. `schema.sql` is included for inspection; you do not need to run it manually.

## 2. Set the first-owner setup code

In the Vercel project’s **Settings → Environment Variables**, add `DAYMARK_SETUP_CODE` for **Production**. Make a random value of at least 32 characters, save it privately, and do not put it in the source tree. The first account-creation page asks for this code. Only one account can be created; subsequent visits use sign-in.

For example, generate a code locally in PowerShell:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Paste the output into Vercel’s environment-variable value field. Do not send it in chat or commit it to a file.

## 3. Deploy

From PowerShell in this folder:

```powershell
npm install
npm test
npx vercel
```

Follow Vercel’s prompts to sign in/link the project. The first command creates a preview deployment. When it loads and the database is connected, run:

```powershell
npx vercel --prod
```

Vercel prints the public `https://…vercel.app` URL. Create your owner account there using the setup code, then sign in on later visits.

## Existing local records

Local JSON data is not uploaded by this project. If you have already recorded anything locally, sign into the local app, use **Settings → Export JSON**, then import that backup in the deployed app after creating your account.

## Data privacy

The production database stores password hashes, hashed session tokens, and the tracker state for the single owner account. The setup code only gates initial registration and is not stored in the database. Never deploy an existing `.env` file or local `data/` directory.
