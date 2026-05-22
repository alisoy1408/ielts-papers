# ielts-papers.com — Full SaaS

Modern IELTS practice platform with admin panel, user accounts, and progress tracking.

## Tech stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- Supabase (database + authentication)

## Deployment

### Environment variables (Vercel)

Add these in Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

### Deploy

1. Push to GitHub
2. Vercel auto-deploys on push
3. Site live on your domain

## Features

- ✅ Public test list (homepage)
- ✅ IELTS Reading test interface (timer, highlighting, fonts, split screen)
- ✅ User signup/login (email + password)
- ✅ Personal dashboard (test history, scores, band tracking)
- ✅ Admin panel at /admin (list, create, edit, delete tests)
- ✅ Auto-save test attempts to database
- ✅ Row-level security on all data

## Pages

- `/` — Homepage with all tests
- `/tests/[slug]` — Individual test page
- `/login` — Login
- `/signup` — Sign up
- `/dashboard` — User dashboard (login required)
- `/admin` — Admin home (admin only)
- `/admin/tests` — Manage tests
- `/admin/tests/new` — Create new test
- `/admin/tests/edit/[id]` — Edit existing test
- `/about`, `/contact`, `/privacy`, `/terms` — Static pages

## Adding tests

Two ways:

**1. Through admin panel (recommended):**
- Log in as admin
- Go to /admin/tests/new
- Fill in form, paste passage and questions
- Click "Create test"

**2. Through Supabase SQL Editor:**
- Use INSERT statements (advanced)
