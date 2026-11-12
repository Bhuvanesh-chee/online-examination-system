# ExamSphere — Online Java & DSA Examination Portal

**Project ID:** 2500030116 · **Student:** GAGIREDDY RAMREDDY  
**Department:** B.Tech Computer Science and Engineering

A working online exam system with login, a student dashboard, timed examinations, saved answers, automatic marking, results, retakes, and history. The browser preview runs the **Next.js + PostgreSQL** version; an equivalent **Spring Boot + MySQL** backend is included in `springboot-backend/` for Eclipse/IntelliJ demonstrations.

## Open the website

Open the latest **Preview** URL (`https://…e2b.app`) shown in the project interface. That URL opens the running website; you do not need a ZIP file. A rebuild can change the preview hostname, so sign in again if you open a newer URL.

### If Chrome says registration or the database is unavailable

Open `https://YOUR-WEBSITE-ADDRESS/api/health` on **the same hostname**. A working backend returns `{"ok":true,"database":"ready"}`. If it returns `DB_NOT_CONFIGURED`, that deployment was started without PostgreSQL credentials. Configure `DATABASE_URL` (or `POSTGRES_URL`) **in that deployment's server environment**, configure `AUTH_SECRET`, run `npx drizzle-kit push` and `npx tsx src/db/seed-portal.ts` on a fresh database, and redeploy. These settings cannot be fixed by changing the email in Chrome. Use the newest project Preview URL for a ready-to-use demonstration; an older or unrelated website address may use a different database or have no database at all.

### Lecturer demo login

- **Email:** `GAGIREDDYRAMREDDY@gmail.com`
- **Password:** `123456`
- The login page has a **“Lecturer demo credentials — click to fill”** button.
- The dashboard has Java and DSA exam cards, latest scores, and an explicit Logout button.
- You may also register using your own personal email and password.

### Exams

| Paper | Code | Questions | Marks | Pass | Duration |
| --- | --- | ---: | ---: | ---: | ---: |
| Java Programming Examination | `JAVA-15` | 15 MCQs | 15 | 9 | 20 minutes |
| Data Structures & Algorithms Examination | `DSA-15` | 15 MCQs | 15 | 9 | 20 minutes |

Each question has four options and one correct answer. Answers are saved to PostgreSQL during the exam. Objective answers are graded on the server; result reviews show correct answers and explanations. Results and history persist across sign-out and sign-in.

## Distinctive feature: AI Question Studio

**Admin demo login:** `admin@exam.edu` / `admin123`. Go to **Admin Dashboard → AI Question Studio** (`/admin/generator`).

1. Click the **Java · OOP**, **DSA · Graphs**, or **Frontend · React** one-click sample; or choose a subject and type a topic (e.g. Inheritance, Binary Search Tree, React Hooks).
2. Choose Easy, Medium, or Hard. Generate one topic question or a 5-question mixed-topic pack. The preview includes four choices, the correct answer, explanation, and marks.
3. Expand **Edit & review** to change prompts, options, answer keys, explanations, or marks. Select the questions you want and click **Save selected to bank**.
4. Optionally tick **Also create a draft exam** and enter a title. The exam is saved in PostgreSQL but is hidden from students until an admin reviews and publishes it. Publishing does not change the two original 15-question Java/DSA exams.

**Without an API key**, the tool runs in clearly labelled *Offline demo* mode: vetted, topic-and-difficulty-specific Java, DSA and Frontend sample questions. It never labels curated samples as AI output. To generate brand-new questions for any topic with an AI model, add `OPENAI_API_KEY` to the **server** `.env` and restart. `OPENAI_MODEL` optionally overrides the default `gpt-4.1-mini`. The server uses OpenAI's Responses API with structured JSON; the key is never exposed to the browser. AI output is validated and requires instructor review before saving. When Auto mode cannot reach the provider, it transparently falls back to offline samples. If enabling a paid AI key on a public deployment, change the public demo admin credentials and restrict demo login first.

To check the whole workflow against a running site, use `TEST_BASE_URL=https://YOUR-PREVIEW-URL node scripts/question-studio-smoke.mjs`. The script is idempotent: it seeds a five-question **Frontend Development — Question Studio Sample Exam** as an unpublished draft once. The original two student-visible examinations remain unchanged.

## Run locally — Next.js / PostgreSQL preview

Requirements: Node.js 20+ and PostgreSQL 14+.

1. `npm install`
2. Create a PostgreSQL database and configure `.env`:
   ```env
   DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/YOUR_DATABASE
   AUTH_SECRET=REPLACE_WITH_A_RANDOM_32_BYTE_SECRET
   ```
   Generate the auth secret using `openssl rand -hex 32`. Never commit real credentials or the auth secret.
3. `npx drizzle-kit push`
4. **Load the two-paper demo data**: `npx tsx src/db/seed-portal.ts`  
   This resets exam data, creates `JAVA-15` and `DSA-15`, and keeps registered student accounts. Do not rerun it if you need to preserve attempt history.
5. `npm run dev` and open `http://localhost:3000`. For a production build: `npm run build && npm start`.

**Important:** The older `src/db/execute-seed.ts` and `src/db/execute-seed-java.ts` are historical fixtures for the former multi-exam prototype; use `src/db/seed-portal.ts` for this two-exam demonstration.

### Browser-login regression check

```bash
npx playwright install chromium
npx playwright install-deps chromium   # Linux only, if required
TEST_BASE_URL=http://localhost:3000 node scripts/auth-browser-smoke.mjs
```

The test deliberately strips authentication cookies, then signs in, clicks through the exams, history, results and profile pages, refreshes, signs out, and signs back in. It proves that embedded previews can retain authentication even when third-party cookies are blocked.

## Spring Boot + MySQL deliverable

See **`springboot-backend/README.md`** for full setup, six-table MySQL schema in `database/schema.sql`, 30 sample questions in `database/seed.sql`, REST endpoints, and Eclipse/IntelliJ launch instructions. The Spring app runs separately on port 8080; the hosted preview is the Next.js app.

## Source layout

```text
src/app/login, register          Authentication UI
src/app/student/dashboard        Welcome, email, exam cards, recent scores
src/app/student/exams            Java & DSA catalogue, instructions, live exam
src/app/student/results          Scorecards, correct/incorrect review, retake
src/app/student/history          Previous exam attempts
src/app/admin                    Question banks, exams, monitoring, reports
src/app/admin/generator          AI Question Studio preview/editor/draft builder
src/app/api/admin/generator      Protected generation + persistent save endpoints
src/app/api                      Auth, student and admin REST APIs
src/context/AuthContext.tsx      Client session context and login/logout
src/lib/auth.ts                  HMAC-signed sessions and role lookup
src/lib/question-generator.ts    Vetted offline Java/DSA/Frontend question catalogue
src/lib/ai-question-service.ts   Optional OpenAI Responses API adapter
src/lib/browser-session.ts       Per-tab cookie-blocked-preview fallback
src/db/schema.ts                Drizzle relational schema
src/db/seed-portal.ts           Current two-exam demo seed
springboot-backend/             Java / Spring Boot / MySQL implementation
database/                       MySQL schema and seed SQL
scripts/auth-browser-smoke.mjs  Cookie-blocked navigation regression test
```

## Authentication and security

Passwords are BCrypt-hashed. The normal session is an HTTP-only, signed cookie. Because some embedded previews block third-party cookies, the login endpoint also returns a **12-hour signed access token** stored only in browser `sessionStorage` (or in memory if storage is unavailable). This fallback is sent only to same-origin `/api/` requests in an `Authorization` header, **never in a URL**. The server checks its signature and expiry, then loads the active user and role from PostgreSQL on every request. Logout clears the cookie and the tab-scoped fallback. An `AUTH_SECRET` set to a random value is recommended for production. Browser tab and fullscreen monitoring are deterrents, not guaranteed prevention of cheating.
