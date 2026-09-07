# TradieAI

AI-powered quoting and job management for Australian tradies. V1 targets plumbers, with the
architecture built to extend to other trades later.

**Status: All 8 build phases complete.** Project setup, auth, database, onboarding, dashboard,
Customers, Jobs, manual + AI quote creation, quote PDF, public quote page with accept/decline,
invoice conversion with its own PDF, and now a mobile/error-handling/security pass across the
whole app. This is a complete V1 per the spec's success criteria (section 36) - see section 9
below for what's explicitly out of scope for V1.

> ⚠️ This code was written in an offline environment with no package registry access, so it has
> **not** been run through `npm install`, `next build`, or `next dev` yet. Please run it locally
> and fix anything that surfaces — the code follows current Next.js 14 App Router / Supabase SSR
> conventions, but treat this as "ready to test," not "verified working."

---

## 1. Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js Server Actions & Route Handlers
- **Database & Auth:** Supabase (PostgreSQL, Supabase Auth, Row Level Security)
- **AI:** Anthropic Claude API, called only from a server-side Route Handler
- **PDF:** [pdf-lib](https://pdf-lib.js.org/) (pure JS, no native binaries - works on Vercel
  serverless without special configuration, unlike headless-Chrome approaches)
- **Deployment:** Vercel-compatible

## 2. Project structure

```
tradieai/
├── src/
│   ├── app/
│   │   ├── (auth)/          # login, signup, forgot/reset password (public)
│   │   ├── (app)/           # dashboard, jobs, quotes, customers, invoices, settings (protected)
│   │   ├── onboarding/      # business setup, shown once after signup
│   │   ├── auth/            # callback + signout route handlers
│   │   ├── api/ai/generate-quote/  # server-only Claude API call
│   │   ├── quote/[publicId]/       # PUBLIC quote page + accept/decline + PDF (no auth)
│   │   ├── layout.tsx       # root layout
│   │   └── page.tsx         # redirects to /login, /onboarding or /dashboard
│   ├── components/
│   │   ├── ui/              # Button, Input, Select, Card, FormMessage, StatusBadge
│   │   └── nav/             # mobile bottom nav, desktop sidebar nav
│   ├── lib/
│   │   ├── supabase/        # browser client, server client (+ service-role client), middleware
│   │   ├── ai/              # Claude prompt builder + response schema/validator
│   │   ├── pdf/             # quote + invoice PDF generation (pdf-lib) + shared data fetchers
│   │   ├── quote-calc.ts    # deterministic, decimal-safe GST/total calculations
│   │   ├── sequence.ts      # job number generator
│   │   ├── types.ts         # shared domain types matching the DB schema
│   │   └── utils.ts         # cn() classname helper
│   └── middleware.ts        # route protection + session refresh
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql            # full V1 schema, RLS policies, triggers
│       ├── 0002_quote_numbering.sql # atomic quote-number generator
│       ├── 0003_quote_public_response.sql # responded_at column for accept/decline
│       └── 0004_invoice_numbering.sql # atomic invoice-number generator
├── .env.example
└── package.json
```

## 3. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier is fine)
- An [Anthropic API key](https://console.anthropic.com/settings/keys)

## 4. Local setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your keys
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API (**server-only, never expose**) |
| `ANTHROPIC_API_KEY` | Anthropic Console → Settings → API Keys |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally, your deployed URL in production |

## 5. Anthropic setup

1. Get an API key from the [Anthropic Console](https://console.anthropic.com/settings/keys).
2. Add it to `.env.local` as `ANTHROPIC_API_KEY`.
3. The model used is `claude-sonnet-5` (set in `src/app/api/ai/generate-quote/route.ts`) — model
   names change over time, so if this call starts failing, check
   [docs.claude.com](https://docs.claude.com/en/docs/about-claude/models/overview) for the
   current model list and update the string there.
4. No other configuration needed — the endpoint is a server-only Next.js Route Handler
   (`POST /api/ai/generate-quote`); the browser never sees the API key. If the key is missing,
   the endpoint returns a friendly error rather than crashing, and the UI's "enter manually"
   fallback still works.

## 6. Supabase setup

1. Create a new Supabase project.
2. Open the SQL Editor and run each file in `supabase/migrations/` **in order**
   (`0001_init.sql`, `0002_quote_numbering.sql`, `0003_quote_public_response.sql`,
   `0004_invoice_numbering.sql`) — or, if you use the Supabase CLI: `supabase db push`.
3. Go to **Authentication → URL Configuration** and set:
   - Site URL: `http://localhost:3000` (or your production URL)
   - Redirect URLs: add `http://localhost:3000/auth/callback` (and the production equivalent)
4. Go to **Authentication → Email Templates** and confirm the "Confirm signup" and "Reset
   password" templates point at `/auth/callback` and `/reset-password` respectively (Supabase
   does this by default when Site URL is set correctly).
5. (Optional, needed from Phase 25 onward) Create a Supabase Storage bucket named `job-photos`
   for job photo uploads.

The migrations create every V1 table, enable Row Level Security on all of them, scope access so a
signed-in user can only ever see rows belonging to their own business, and add an atomic
`next_quote_number()` function so concurrent quote creation can't collide on the same number. They
also create a `public_quote_view` for the future public quote page — server code should query that
view with the service-role client (see `src/lib/supabase/server.ts`), never grant the anon key
direct table access to `quotes`.

## 7. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`. You should be redirected to `/login`. From there:

1. **Sign up** → creates an `auth.users` row, which triggers `handle_new_user()` to create a
   matching `profiles` row.
2. You're redirected to **/onboarding** → fill in business details, trade, and GST settings →
   creates a `businesses` row.
3. You're redirected to **/dashboard**.
4. Add a customer, create a job, then hit **+ Create Quote** and describe a job in plain English
   (or tap the mic to dictate it) to see the AI turn it into line items — or skip straight to
   manual entry.

If email confirmation is enabled on your Supabase project (default for new projects), you'll need
to confirm the signup email before you can log in — check the Supabase Auth logs if a test email
doesn't arrive, or disable email confirmation under **Authentication → Providers → Email** while
developing locally.

## 8. What's implemented

### Phase 1 — Foundations
- Sign up / log in / log out / forgot password / reset password, all via Supabase Auth and Next.js
  Server Actions
- Middleware-based session refresh and route protection (`src/middleware.ts`)
- Business onboarding: business details, trade selection, GST registration + inclusive/exclusive
  pricing, default labour rate & call-out fee
- Full V1 database schema with Row Level Security
- Responsive nav shell: bottom nav on mobile, sidebar on desktop
- Clean, mobile-first UI primitives (Button, Input, Select, Card)

### Phase 2 — Dashboard, Customers, Jobs
- Real dashboard stats (Open Jobs, Pending Quotes, Accepted Quotes, Outstanding Invoices), recent
  jobs and recent quotes, and the three quick actions
- Customers: list, add/edit, detail page with linked jobs/quotes/invoices and totals
- Jobs: list, create/edit (customer picker, scheduled date & time), auto-generated job numbers
  (`J-0001`, ...), detail page with Create Quote / Edit Job / Mark Complete
- Job photo upload deliberately deferred (needs its own Storage bucket + policies)

### Phase 3 — Manual quote creation & calculations
- Dynamic line items (add/remove rows) with a live subtotal/GST/total preview
- **`src/lib/quote-calc.ts`**: the deterministic, decimal-safe calculation engine. Totals are
  always recomputed server-side from raw line items on save, never trusted from the client
- GST handling that respects the business's registered/inclusive-exclusive settings
- Atomic quote numbering via `next_quote_number()` (row-locks the business record)
- Quote editor (shared by create/edit) with a status badge, manual status dropdown, and a
  "Send Quote" shortcut

### Phase 4 — AI quote generation
- **`POST /api/ai/generate-quote`** (`src/app/api/ai/generate-quote/route.ts`): the only place
  that calls the Claude API. It looks up the signed-in user's own business defaults server-side
  (never trusts a client-supplied default), calls Claude with a strict system prompt, and
  validates the JSON response before returning it.
- **`src/lib/ai/prompt.ts`**: builds the system prompt, which explicitly tells the model to (a)
  use the business's configured labour rate / call-out fee as a fallback when unstated, flagging
  that as an assumption, and (b) never invent a price for materials/parts — leave it blank
  (`unit_price: null`) and flag it instead.
- **`src/lib/ai/quote-schema.ts`**: a strict validator for the AI's JSON. Anything that doesn't
  match the expected shape is rejected outright rather than partially trusted.
- **UI**: `/quotes/new` leads with "Tell us about the job…" (large textarea, a mic button using
  the browser's built-in Speech Recognition API, and a disabled camera button noting photos are
  coming soon). Generating a quote hands its line items straight into the same quote editor built
  in Phase 3 — so calculations still happen exactly the same way. An amber banner lists every
  assumption the AI made, and **any line item missing a price blocks saving** until the user fills
  it in, so nothing the AI didn't actually know becomes a real number without a person looking at
  it. "Skip - enter the quote manually instead" is always one tap away.

Notes for whoever builds Phase 5+ on top of this:

- Voice input uses the (non-standard, but broadly supported) `webkitSpeechRecognition` /
  `SpeechRecognition` browser API directly — no server-side speech-to-text. It fails gracefully
  (mic button disabled) in unsupported browsers.
- The AI endpoint doesn't yet accept photos or a linked job's existing description as extra
  context — it only sees the free-text description typed or dictated in the box. Worth revisiting
  once job photo upload exists.
- Editing an already-`sent` quote doesn't lock or warn — V1 keeps this simple since there's no
  customer-facing acceptance flow yet (that's Phase 6).
- `updateQuote` replaces the full line-item set on every save (delete + reinsert) rather than
  diffing rows. Fine at this scale; would need to change for concurrent multi-editor scenarios.
- A few list queries (e.g. jobs joined with customers) are typed as `any` at the query boundary —
  consider running `supabase gen types typescript` once your schema stabilises.

### Phase 5 — Quote PDF
- **`GET /quotes/[id]/pdf`** (`src/app/(app)/quotes/[id]/pdf/route.ts`): generates the PDF on
  demand from the quote's current data (never a cached/stale copy) and streams it back
  `inline` so it opens in the browser, with an actual filename of `<quote_number>.pdf`
- **`src/lib/pdf/quote-pdf.ts`**: lays out an A4 page by hand with pdf-lib - business header,
  QUOTE title + number/date/valid-until, customer block, job title, a wrapped/paginated line
  items table, subtotal/GST/total, notes, and a payment-terms footer. Overflows onto additional
  pages automatically if there are many line items or a long notes field.
- The quote detail page's "View / Download PDF" button links straight to this route
- Access is protected the same way everything else is: the route reads the quote via the
  regular (RLS-scoped) Supabase client, so a quote ID belonging to someone else's business
  simply won't be found — no separate authorization check needed

Notes for whoever builds Phase 6+ on top of this:

- No logo is drawn yet — `businesses.logo_url` exists in the schema but there's still no logo
  upload UI (that's a Storage-bucket unit of work, same category as job photos). The PDF falls
  back to just the business name as a text header; swap in an embedded image once uploads exist
  (pdf-lib supports `pdfDoc.embedPng`/`embedJpg` directly from fetched bytes).

### Phase 6 — Public quote page, accept/decline
- **`/quote/[publicId]`** (`src/app/quote/[publicId]/page.tsx`): a public, unauthenticated page
  showing business details, quote number, customer name, job title, line items, subtotal/GST/total,
  notes, and a link to the same PDF from Phase 5 — reachable only via its `public_id` (a random
  UUID, not the internal sequential quote ID), matching spec section 22's "don't expose internal
  IDs" guidance
- **Accept / Decline**: records `status` + a new `responded_at` timestamp
  (`0003_quote_public_response.sql`). No e-signature — just a plain acceptance record, as the spec
  calls for in V1. Declining asks for confirmation first so a mis-tap can't accidentally lose a job.
- **Auto status transitions**: opening the page for the first time flips `sent` → `viewed`; past
  `valid_until` flips `draft`/`sent`/`viewed` → `expired`. Both run as narrowly-scoped, idempotent
  updates guarded by `public_id`, safe to run on every page load.
- **Security model**: every query on this page uses the **service-role client** (RLS is bypassed
  entirely for anonymous visitors), so correctness depends entirely on scoping every read/write by
  `public_id` — never by the internal sequential `id`. All the mutations in
  `src/app/quote/[publicId]/actions.ts` follow this pattern; keep it that way if you extend this
  page.
- **Tradie side**: the quote detail page now has a "Customer link" card with a copy-to-clipboard
  button, so sending a quote is "Send Quote → copy link → text/email it yourself" — there's no
  built-in email/SMS sending in V1 (that's explicitly a future feature per the spec).
- The PDF fetch logic was factored out into `src/lib/pdf/fetch-quote-pdf-data.ts` so both the
  authenticated route (Phase 5) and this public route share the exact same code path.

Notes for whoever builds Phase 7+ on top of this:

- There's no rate limiting on the accept/decline actions or the public page itself. Low risk for
  V1 (the worst case is someone spamming a single guessed-or-leaked link), but worth adding if
  this becomes a target for abuse.
- The public page doesn't yet notify the tradie when a customer responds (no email/push/in-app
  notification) — they'd need to check the dashboard or quotes list to see a status change.
  Consider this for Phase 7 or a dedicated notifications pass.

### Phase 7 — Invoice conversion, invoice PDF
- **"Convert to Invoice"** button on the quote detail page (`src/app/(app)/quotes/[id]/`):
  copies the customer, job link, line items, and totals from the quote into a brand-new invoice
  with its own auto-generated number, and sets a due date from the business's configured payment
  terms. The quote itself is left exactly as it was (still shows `accepted`, etc.) — the invoice
  is a separate record, and the quote detail page remembers it was already converted so you can't
  accidentally create two invoices from the same quote.
- **Atomic invoice numbering** (`supabase/migrations/0004_invoice_numbering.sql`):
  `next_invoice_number()`, the same row-locking pattern as quote numbering from Phase 3.
- **Invoices list + detail page**: status badge, a manual status dropdown
  (Draft/Sent/Paid/Overdue/Cancelled), quick "Mark as Sent" / "Mark as Paid" buttons (paid also
  stamps `paid_at`), and a "View / Download PDF" link.
- **Invoice PDF** (`src/lib/pdf/invoice-pdf.ts`): the same visual language as the quote PDF, with
  invoice-specific touches — "BILL TO" instead of "QUOTE FOR", a due date instead of a validity
  date, and the header/total labels switch to "PAID" / "TOTAL PAID" in green once the invoice is
  marked paid. The shared low-level drawing code (`src/lib/pdf/shared.ts`) was extracted during
  this phase so quote and invoice PDFs don't duplicate page geometry, colors, or text-wrapping.

Notes for whoever builds Phase 8 on top of this:

- There's no public invoice page (no `/invoice/[public_id]` equivalent to the quote one) — the
  spec's V1 feature list only calls for a public *quote* page with accept/decline; invoices are
  tradie-facing only, downloaded/shared manually as a PDF the same way quotes are.
- No online payment collection exists yet (Stripe is explicitly a future feature per the spec) —
  "Mark as Paid" is a manual action the tradie takes themselves after being paid by whatever
  means (cash, bank transfer, etc.).
- Invoice items are a point-in-time copy of the quote's items at conversion — editing the quote
  afterwards does not retroactively change an already-created invoice, which is the correct
  behaviour for a document that's meant to be a fixed record of what was billed.

### Phase 8 — Mobile polish, error handling, security review

**Error handling** (spec section 27 — never show a raw error):
- `src/app/error.tsx` and `src/app/(app)/error.tsx`: friendly fallback UI instead of a stack
  trace if a page throws. The `(app)` version offers a way back to the dashboard; the root one
  is the last-resort catch-all.
- `src/app/quote/error.tsx` and `src/app/quote/not-found.tsx`: separate, public-appropriate
  versions for the customer-facing quote page — no "go to dashboard" language aimed at someone
  who may not have an account.
- `src/app/not-found.tsx`: a friendly 404 for any unmatched authenticated route.
- `src/app/(app)/loading.tsx`: a skeleton shown during route transitions, so navigation doesn't
  feel like it's hung on a slow connection.
- Every server action and route handler already returned plain-English error strings from
  earlier phases; this phase's audit didn't find anywhere still leaking raw Postgres/Anthropic
  error text to the browser.

**Security review** (spec section 22):
- **Security headers** added in `next.config.js`: `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY` (prevents this app being framed for clickjacking),
  `Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy` that only grants
  microphone access (needed for Phase 4's voice input) to this app's own origin.
- **Rate limiting** (`src/lib/rate-limit.ts`): a best-effort in-memory limiter, applied to the
  AI quote-generation endpoint (20 calls/hour per user — each call costs real money) and to the
  public accept/decline actions (10/minute per quote, keyed by `public_id` since there's no user
  identity there). **This is explicitly not production-grade** — the state lives in a single
  serverless function instance's memory, so it won't hold up against a determined attacker
  spreading requests across cold starts. For a real guarantee, swap in a shared store like
  Vercel KV or Upstash Redis; the function signature (`checkRateLimit(key, limit, windowMs)`)
  is designed to make that a drop-in replacement.
- Re-verified every table has RLS enabled and every policy scopes by the caller's own business
  (or, for the public quote page, by the unguessable `public_id` via the service-role client) —
  no changes needed, this was correct from Phase 1 onward.
- Re-verified the service-role key is only ever imported in server-only files
  (`src/lib/supabase/server.ts`, server actions, route handlers) and never reaches a Client
  Component.

**Mobile polish** (spec section 26):
- Fixed a touch-target problem: the "remove line item" button in the quote editor was a 24px
  circle — too small for a reliable tap. It's now a proper 44px hit area.
- Added a sticky bottom save bar to the quote editor specifically (the one form that can get
  genuinely long with many line items), correctly offset above the fixed mobile bottom nav so
  the two don't overlap. Shorter forms (customer, job) didn't need this.
- Removed `maximumScale: 1` from the viewport config. Disabling pinch-zoom is bad accessibility
  practice and wasn't needed here — the actual reason apps do this (stopping iOS's
  auto-zoom-on-input-focus) only happens when an input's font is under 16px, and every input in
  this app already uses `text-base` (16px).

Notes for anyone continuing past V1:

- The rate limiter and any other per-instance in-memory state won't survive a restart or scale
  event on Vercel — fine for launch, worth revisiting alongside real usage/abuse monitoring.
- A full accessibility pass (screen reader labels beyond the `aria-label`s already present,
  focus management, colour contrast audit) wasn't in scope for this phase and would be a good
  next investment.

## 9. What's deliberately not built yet

Everything in the spec's core V1 feature list (section 2) and build order (section 31) is now
built. What's intentionally absent, per the spec's own "do not build yet" list (section 35):

- AI receptionist, automatic SMS/email follow-ups
- Stripe subscription billing / any online payment collection
- Xero, MYOB, QuickBooks integrations
- Recurring invoices, employee management, advanced scheduling, calendar integration
- Inventory, supplier pricing, material databases
- AI photo analysis, AI job summaries, compliance document generation
- A dedicated voice-first assistant beyond the dictation-into-a-text-box already built
- A customer portal (customers only ever see the single public quote page, never a login)
- Analytics, multi-business accounts
- Job photo uploads and a business logo upload (both need their own Supabase Storage bucket +
  policies — flagged throughout this README as a natural next unit of work, not forgotten)
- A public invoice page (only quotes have a public accept/decline page per the spec)

## 10. Things to configure manually before launch

- [ ] Create the Supabase project and run **all four** migrations, in order
- [ ] Set Supabase Auth URL configuration (Site URL + redirect URLs)
- [ ] Decide whether to require email confirmation in dev (recommend disabling it locally)
- [ ] Add your Anthropic API key and confirm `claude-sonnet-5` is still a valid model name
- [ ] Run `npm install` and `npm run dev`, then walk through the full loop: signup → onboarding →
      dashboard → add a customer → create a job → generate an AI quote → Send Quote → accept it
      via the public link → Convert to Invoice → Mark as Paid → download the invoice PDF and
      confirm it shows "PAID" in green
- [ ] Run `npm run typecheck` and `npm run lint` and fix anything that surfaces — this code has
      not been compiled in this environment
- [ ] If you expect real traffic, replace the in-memory rate limiter with a shared store
      (Vercel KV / Upstash) before relying on it
- [ ] Do a pass through the app on an actual iPhone/Android device, not just a resized desktop
      browser, before pointing real customers at it

## 11. Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add the same environment variables from `.env.local` in Vercel's Project Settings →
   Environment Variables (use your production `NEXT_PUBLIC_APP_URL`).
4. Update Supabase Auth URL Configuration to include your production domain.
5. Deploy.
