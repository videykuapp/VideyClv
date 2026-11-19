# OurVidey API

Separate Cloudflare Worker API for OurVidey. This worker is based on the existing upload, playback, and expiry logic but must use its own D1 database and R2 bucket.

## Before deploying
1. Create a new D1 database named `ourvidey-db`.
2. Create a new R2 bucket named `ourvidey-videos`.
3. Apply `schema.sql` to the new D1 database.
4. Replace `REPLACE_WITH_NEW_OURVIDEY_D1_DATABASE_ID` in `wrangler.toml` with the new database ID.
5. Confirm the frontend production origin. The current CORS allowlist in `src/index.js` is `https://ourvidey.vercel.app`; change it if Vercel assigns a different domain.
6. Deploy this Worker and set the frontend Vercel variable `VITE_API_BASE` to its `workers.dev` URL.

Uploads are limited to 100 MB and expire after 30 days. The scheduled cleanup runs every 15 minutes.

Never bind this worker to VIDEYKU's D1 database or R2 bucket.
