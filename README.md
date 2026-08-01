# EDxKa

"One link. Your whole class. Racing the clock."

A live, real-time quiz platform: tutors build a quiz, open a lobby, students
join with just a name and phone number, and everyone races through the same
questions against a countdown. The leaderboard ranks by correct answers
first, then fastest total time.

This is a full working app — Node/Express + Socket.IO backend, plain
HTML/CSS/JS frontend (no build step). It includes tutor sign up/sign in
**and a working "forgot password" flow.**

## Project layout

```
edxka/
  server/           Express + Socket.IO backend, also serves the frontend
    server.js
    db.js           tiny JSON-file data store (server/data.json, auto-created)
    package.json
    .env.example
  public/           the whole frontend (static files, no build step)
    index.html          landing / join-by-code page
    signin.html          tutor sign in (has "Forgot password?")
    signup.html          create a tutor account
    forgot-password.html request a reset link
    reset-password.html  set a new password (the link from the email lands here)
    dashboard.html        tutor's quiz list
    quiz.html              quiz editor + session control + live leaderboard
    join.html               student join → lobby → live quiz → results
    styles.css / api.js
```

## Running it locally

```bash
cd server
npm install
cp .env.example .env      # then edit .env if you want real email delivery
npm start
```

Open **http://localhost:4000**.

That's it — one server serves both the API and the frontend, so there's no
separate frontend dev server or CORS setup to worry about.

## What's new: interactivity, gamification & educational UX

- **Dark mode** — a toggle on every page (🌙/☀️), saved per-browser.
- **Avatars** — students pick an emoji avatar when they join; it follows them
  through the lobby, leaderboard, and results screen.
- **Streaks & badges** — a live "🔥 streak" indicator appears after two
  correct answers in a row. At the end of a session, badges (Perfect score,
  Speed demon, Streak, Comeback kid) are awarded and shown to students and
  on the tutor's leaderboard.
- **Sound + confetti** — small WebAudio-generated tones on correct/incorrect
  answers and quiz start, plus a confetti burst on finish. No external audio
  files or libraries, so nothing extra to install.
- **Richer question types** — multiple choice, true/false, typed
  (fill-in-the-blank, with several accepted answers separated by `|`),
  numeric (with an optional ± margin of error), and ordering/ranking
  questions. Any question can also carry an image URL and a topic tag.
- **Subjects & topics** — quizzes can be tagged with a subject (filterable
  on the dashboard) and individual questions with a topic, which powers the
  analytics below.
- **Solo practice mode** (`/practice.html`) — students can enter a quiz code
  and work through it at their own pace, no lobby or countdown required.
  At the end they get a full review: their answer vs. the correct one for
  every question.
- **Tutor analytics** — a "📊 View analytics" button on the quiz editor
  shows per-question accuracy/response-time bars and a weakest-topics
  breakdown, powered by `GET /api/quizzes/:id/stats`.

## The "forgot password" flow

1. On the sign-in page, click **Forgot password?**
2. Enter the tutor's email → `POST /api/auth/forgot-password`.
3. The server creates a one-hour, single-use reset token and emails a link
   like `/reset-password.html?uid=...&token=...`.
4. That page lets the tutor set a new password → `POST /api/auth/reset-password`.

**Sending real email:** fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS`, `SMTP_FROM` in `server/.env` (Gmail, SendGrid, Mailgun, Resend,
etc. all work over SMTP — see the comments in `.env.example`).

**No SMTP configured (default):** nothing is emailed. Instead the server logs
the reset link to its console, and the forgot-password page shows the link
directly on screen so you can click through and test the whole flow without
setting up an email account. This dev fallback only returns the link when
`NODE_ENV` is not `production` — don't ship that to real users.

The API never reveals whether an email address has an account (it always
replies with "If an account exists for that email, a reset link is on its
way"), so this can't be used to check who has signed up.

## How the live quiz works

- A quiz has a 6-character code (e.g. `RYE23V`) and a shareable link
  `/join.html?code=RYE23V`.
- **Draft** → tutor adds questions (multiple choice, true/false, or typed).
- **Open lobby** → students can join; the tutor's screen and every student's
  screen update live over Socket.IO as people join.
- **Start quiz** → the server pushes the same question to everyone at the
  same time, with its own countdown; it auto-advances to the next question
  when time runs out, all server-driven so nobody can cheat the clock.
- Each answer is scored instantly (correct/incorrect + elapsed time),
  and the leaderboard updates live for the tutor. It's sorted by number
  correct, then by total answer time (fastest wins ties).
- **End**/finish → final leaderboard is shown to the tutor and to students.
- **Run again** resets a finished quiz back to draft (clears participants,
  keeps the questions) so you can reuse it with the next class.

## Notes on the data store

Data lives in `server/data.json`, created automatically on first run. It's a
flat-file store — perfect for a class/small-school scale, easy to read and
back up. If you outgrow it, `server/db.js` is a thin data-access layer with
one function per operation, so swapping in Postgres/Mongo later only means
rewriting that one file.

## Deploying for free (Render)

Netlify and Vercel are built for static sites and short-lived serverless
functions — they can't keep a Socket.IO connection open or write to a local
file, so the live lobby/quiz and the sign-in flow would break there. **Render**
runs your actual Node server continuously and has a genuine free tier, so
that's what this repo is set up for (see `render.yaml`).

1. **Push this project to GitHub** (a public or private repo both work).
2. Go to [render.com](https://render.com) → sign up free (no card needed) →
   **New +** → **Blueprint**, and point it at your repo. Render will read
   `render.yaml` and pre-fill everything (root dir `server`, build command
   `npm install`, start command `npm start`).
   - No `render.yaml`/Blueprint? Choose **New +** → **Web Service** instead,
     select the repo, set **Root Directory** to `server`, **Build Command**
     to `npm install`, **Start Command** to `npm start`, and pick the **Free**
     instance type.
3. Add environment variables when prompted (Render's dashboard → your
   service → **Environment**):
   - `JWT_SECRET` — Render can auto-generate this for you.
   - `FRONTEND_URL` — set this to the `https://your-app.onrender.com` URL
     Render gives you (used to build links inside reset-password emails).
   - `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` —
     optional, only needed if you want real reset-password emails. Leave
     blank to keep using the on-screen dev link.
4. Click **Deploy**. After the build finishes you'll get a live URL like
   `https://edxka.onrender.com` — that's your whole site, frontend and all.

**Free-tier tradeoffs to know about:**
- The service **sleeps after 15 minutes of no traffic** and takes ~30–60
  seconds to wake back up on the next visit. Fine for a class demo; annoying
  if you want it instantly responsive all the time (Render's paid tier
  removes this).
- Free web services have **no persistent disk** — `server/data.json` gets
  wiped on every redeploy or restart, so accounts/quizzes won't survive a
  redeploy. For a real rollout, either add a small paid Render Disk (a few
  dollars/month) and point `db.js`'s `DB_PATH` at it, or swap `db.js` for a
  managed database (Render's free Postgres works well and is a small change
  since every operation already goes through the functions in `db.js`).

## Renaming again / customizing

- Brand name/colors live in `public/styles.css` (`:root` variables) and the
  `EDx<span class="accent">Ka</span>` logo markup at the top of each page.
- `APP_NAME` in `server/server.js` controls the name used in reset emails.
