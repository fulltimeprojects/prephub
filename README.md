# PrepHub

A learning platform for senior interview preparation, built with **Next.js 16 (App Router)** for both frontend and backend, and **MySQL** for content and progress.

It contains everything from the two study workbooks:

| Plan | Days | Study notes | Interview questions |
|---|---|---|---|
| Full-stack interview prep (JavaScript, Node.js, React, Next.js, Laravel, system design, senior/behavioural) | 56 | 82 | 193 |
| AI engineering (LLMs, RAG, agents, MCP, evals, AI security, AI in your stack) | 28 | 22 | 39 |

## What you can do

- **Today** page: today's day of each plan (based on your own start date), with linked notes and questions, the hands-on task, and one click to mark the day done and log hours.
- **Day-by-day plan**: weeks fold so only the current one is open; every day with a week strip, status, hours spent and remarks. Change the start date at any time.
- **Study notes**: grouped by technology/module, each with an example and an interview takeaway; mark how well you know it. A **Watch & learn** section links to a YouTube search for the topic and plays the videos you save to that note. **Test yourself** quizzes you on the interview questions the plan pairs with the note, and **Got it — next note** marks it confident and moves on.
- **Interview questions**: read and review (answers hidden until you click), filter by status and level, write your own notes and project examples per question, or **practise with flashcards** (unknown cards first, random order, your rating is saved; Space reveals, 1/2/3 rate).
- **AI and your skills**: how AI strengthens each of your existing skills, with a field for your own next step.
- **Search** across all questions and notes.
- **Accounts**: email + password sign-up; every user has their own progress.

## Requirements

- Node.js **20.12 or newer** (22 or 24 LTS recommended)
- MySQL **8.0 or newer** (MySQL 8.4 LTS recommended). MariaDB 10.6+ should also work.

## Run it locally

```bash
# 1. Install dependencies
npm install

# 2. Start MySQL — either use your own server, or the included Docker setup:
docker compose up -d          # MySQL 8.4, root password "password"

# 3. Configure the connection
cp .env.example .env.local    # then edit DATABASE_URL if needed

# 4. Create the database, tables and content
npm run db:setup

# 5. Start the app
npm run dev                   # http://localhost:3000 → Create account
```

`npm run db:setup` is safe to run again: tables use `IF NOT EXISTS` and content rows are upserted by id, so users and progress are kept. If you prefer the MySQL CLI:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS prephub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root -p prephub < db/schema.sql
mysql -u root -p prephub < db/seed.sql
```

## Production

```bash
npm run build
NODE_ENV=production npm start   # serve behind HTTPS (Nginx, a load balancer, or a platform)
```

- Set `DATABASE_URL` (and optionally `APP_TIMEZONE`, default `Asia/Kolkata`) in the server environment.
- Session cookies are `Secure` when `NODE_ENV=production`, so serve the app over HTTPS.
- Use a dedicated MySQL user with rights only on this database.

## Deploy to Vercel

Vercel runs the app; the database must be a hosted MySQL that Vercel can reach (your local MySQL won't work).

1. **Create a hosted MySQL 8 database**, e.g. TiDB Cloud, Aiven for MySQL, Railway, PlanetScale or AWS RDS. Pick a region close to Mumbai (`ap-south-1`) — `vercel.json` runs the app in Vercel's Mumbai region (`bom1`); change it if your database is elsewhere. Copy its connection details.
2. **Load the content into it from your computer:**
   ```bash
   DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/prephub" npm run db:setup
   ```
   URL-encode special characters in the password (`@` → `%40`). TLS is switched on automatically for hosted databases; if your provider gives you a CA certificate, also set `DATABASE_CA_CERT`.
3. **Put the code on GitHub** (`.env.local` is git-ignored, so your local password stays local), then in Vercel choose **Add New → Project** and import the repository. Vercel detects Next.js; no build settings need changing. (Or deploy from this folder with `npx vercel`.)
4. **Add environment variables** in Vercel → Project → Settings → Environment Variables:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the same URL as step 2 |
   | `APP_TIMEZONE` | `Asia/Kolkata` (optional) |
   | `DATABASE_CA_CERT` | only if your provider requires a CA certificate (paste the PEM) |
   | `DATABASE_POOL_SIZE` | optional, default 3 connections per instance |

5. **Deploy** (or redeploy after adding the variables), open the `*.vercel.app` URL and create your account.

After changing `db/schema.sql` or `db/seed.sql`, run step 2 again against the hosted database.

## How it's built

```
src/
  app/
    page.tsx                         landing page
    (auth)/login, (auth)/register    sign-in / sign-up (Server Actions + useActionState)
    (app)/layout.tsx                 signed-in shell: sidebar with per-section progress
    (app)/dashboard                  Today
    (app)/tracks/[track]             plan overview
    (app)/tracks/[track]/plan        day-by-day plan
    (app)/tracks/[track]/notes       study notes, and /notes/[code] for one note
    (app)/tracks/[track]/questions/[section]   questions (list or ?mode=cards flashcards)
    (app)/tracks/[track]/skills      AI and your skills (AI plan)
    (app)/search                     search
    actions/auth.ts                  register, login, logout
    actions/progress.ts              statuses, notes, day logs, start dates, skill actions
  components/                        UI pieces (client components only where interaction needs them)
  lib/
    db.ts                            mysql2 connection pool + query helpers
    auth.ts                          scrypt password hashing, DB sessions, requireUser()
    data.ts                          all read queries (the data access layer)
    dates.ts, refs.ts, types.ts
  proxy.ts                           redirects signed-out visitors to /login (Next.js 16 proxy)
db/
  schema.sql                         tables
  seed.sql                           all content (generated from the workbooks)
scripts/db-setup.mjs                 applies schema + seed
```

**Data model**

- Content: `tracks`, `sections`, `questions`, `notes`, `plan_days`, `skills`
- People: `users`, `sessions` (only a SHA-256 hash of the session token is stored), `auth_attempts` (rate limiting)
- Progress, one row per user per item: `user_tracks` (start date), `question_progress` (status + your notes), `note_progress`, `note_videos` (YouTube videos you saved to a note), `day_progress` (status, hours, remarks), `skill_actions`

**Security notes**

- Passwords are hashed with Node's built-in scrypt and a random salt.
- Sessions are random 256-bit tokens in an httpOnly, SameSite=Lax cookie; the database stores only their hash, and they expire after 30 days.
- `proxy.ts` only does a fast redirect; every page, layout and Server Action checks the session again with `requireUser()`.
- All SQL uses parameterised queries.
- Sign-in and sign-up are rate limited (`auth_attempts` table): 10 failed sign-ins per email or 30 per IP in 15 minutes, and 5 new accounts per IP per hour.

## Updating the content

All study content lives in `db/seed.sql`. Edit it (or regenerate it) and run `npm run db:setup` again — rows are matched by id, so user progress stays attached.

## Testing status

The schema, seed data and every SQL query in `src/lib/data.ts` and `src/app/actions` were run against a MySQL-compatible server with sample users and progress. The TypeScript was type-checked, and the formatting, date and link logic was tested in Node. The full Next.js build couldn't be run where this was produced (no access to the npm registry), so `npm install && npm run build` on your machine is the first full build — if it reports anything, it should be a small fix.
