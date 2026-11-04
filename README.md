# Assignment & Review Dashboard

A responsive dashboard for a student-assignment system with two roles: **Student** and **Admin (Professor)**.
Built with **React 19 + TypeScript + Tailwind CSS v4** (Vite). There is no backend: data lives in `localStorage`
behind a small mock-API layer, so it survives a page refresh.

- **Live demo:** _add your Vercel/Netlify link here_
- **Demo video:** _add your Loom / Drive link here_

## Features

**Login & roles**
- Mock login / role switcher with seeded users: 2 professors and 5 students (no real auth).
- Every user sees only their own data. Students see only assignments assigned to them; admins see only the assignments they created.

**Student**
- Assignment list with title, description, due date, status, professor and Drive link.
- Two-step submission: **"Yes, I have submitted"** → **"Final confirmation"** dialog → status becomes **Submitted**.
- Overall progress indicator ("3 of 6 submitted" + progress bar).

**Admin**
- Create, edit and delete assignments (with a Drive link), assign to **all** students or **selected** students.
- Per assignment: every assigned student's status (Submitted / Not submitted, with date) and a class-completion progress bar.
- Summary tiles: number of assignments, average completion, past-due & incomplete.

**General**
- Fully responsive (mobile → desktop), dark mode, search, status/due filters, sorting, overdue highlighting.
- Loading, empty, "no results" and error states (including recovery from corrupted saved data).
- Accessibility: semantic landmarks, skip link, labelled form controls with inline errors, `aria-live` announcements, focus-trapped dialogs, keyboard operable, status never conveyed by colour alone, `prefers-reduced-motion` respected.
- Small animations (entrance, progress bar, dialog pop-in).
- Tests: 35 unit + integration tests (Vitest + Testing Library).

## Demo accounts

| Role | Name |
| --- | --- |
| Admin | Prof. Meera Iyer, Prof. Rahul Verma |
| Student | Aarav Mehta, Diya Sharma, Kabir Singh, Isha Nair, Rohan Gupta |

Seed due dates are generated relative to "today", so there is always a mix of overdue, due-soon and upcoming work.
Use **Reset demo data** on the login screen to restore the original data.

## Setup

Requires **Node.js 20+**.

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript only |
| `npm test` | Run all tests once (`npm run test:watch` to watch) |

## Deploy

**Vercel:** push to GitHub → *Add New → Project* → import the repo. Framework preset **Vite**, build command `npm run build`, output directory `dist`. Deploy.

**Netlify:** *Add new site → Import from Git*. Build command `npm run build`, publish directory `dist`.

The app is a single page with no client-side router, so no rewrite rules are needed.

## Folder structure

```
src/
├── main.tsx                  # entry point
├── App.tsx                   # providers + <Shell/> (loading → error → login → role dashboard)
├── index.css                 # Tailwind import, dark-mode variant, animations, focus ring
├── types.ts                  # User, Assignment, Submission, Database, ...
├── constants.ts              # filter / sort option lists
├── data/
│   └── seed.ts               # demo users, assignments, submissions (dates relative to today)
├── lib/                      # framework-free logic (easy to unit test)
│   ├── domain.ts             # visibility rules, status, progress, search/filter/sort
│   ├── dates.ts              # local-time due-date helpers and labels
│   ├── validation.ts         # assignment form validation
│   ├── storage.ts            # mock API over localStorage (+ session)
│   ├── ids.ts, cn.ts
├── context/
│   ├── DataContext.tsx       # loads/saves the database, exposes mutations
│   ├── AuthContext.tsx       # mock login/logout, current user
│   └── ThemeContext.tsx      # light/dark
├── hooks/
│   ├── useNow.ts             # ticking "now" so overdue labels stay correct
│   └── useNotice.ts          # transient toast message
├── components/
│   ├── ui/                   # generic primitives: Button, Modal, ConfirmDialog, ProgressBar,
│   │                         #   StatusBadge, EmptyState, ErrorState, Spinner, Notice, Field
│   ├── layout/               # AppLayout, AppHeader, ThemeToggle, Avatar
│   └── assignments/          # shared by both roles: FilterBar, DueDate, DriveLink
├── features/
│   ├── auth/LoginPage.tsx
│   ├── student/              # StudentDashboard, AssignmentCard
│   └── admin/                # AdminDashboard, AdminAssignmentCard, AssignmentForm, StudentStatusList
└── test/                     # test setup + integration tests (lib/*.test.ts sit next to their code)
```

## Component architecture

```
<ThemeProvider>
  <DataProvider>            ← database state + mutations, persisted to localStorage
    <AuthProvider>          ← who is logged in
      <Shell>
        loading  → <Spinner/>
        error    → <ErrorState/> (Try again / Reset demo data)
        no user  → <LoginPage/>
        admin    → <AppLayout><AdminDashboard/></AppLayout>
        student  → <AppLayout><StudentDashboard/></AppLayout>
```

- **Student:** `StudentDashboard` (progress card, `FilterBar`, list, `ConfirmDialog`) → `AssignmentCard`.
- **Admin:** `AdminDashboard` (summary tiles, `FilterBar`, list, form `Modal`, delete `ConfirmDialog`) → `AdminAssignmentCard` → `StudentStatusList`; the form is `AssignmentForm`.
- **Data flow:** one-way. Dashboards read `db` from `useReadyData()`, derive what they need with pure functions from `lib/domain.ts`, and call context actions (`submitAssignment`, `createAssignment`, ...) to change it. A single `useEffect` in `DataProvider` writes every change to `localStorage`.

## Key design decisions

1. **Statuses are derived, not stored.** The only stored fact is a `Submission` record (assignment + student + timestamp). *Submitted / Pending / Overdue* is computed from that and the due date, so it can never go stale, and "overdue" updates itself as time passes (`useNow`).
2. **Normalised data model.** `users`, `assignments`, `submissions` are separate arrays; assignments store `assignedTo: 'all' | string[]`. Class completion and per-student status come from joining them, and deleting an assignment also removes its submissions.
3. **Mock API boundary.** Components never touch `localStorage`; only `lib/storage.ts` does. `loadDatabase()` is async with a small artificial delay so real loading/error states exist, and replacing it with `fetch` calls is a one-file change.
4. **Authorization lives in the data layer.** The UI only shows permitted actions, but `updateAssignment` / `deleteAssignment` / `submitAssignment` re-check ownership and audience themselves.
5. **Pure logic separated from UI.** Everything in `lib/` has no React in it and is unit-tested directly; integration tests then exercise whole user flows.
6. **Context API, no state library.** The state is one small document and a handful of actions; Context + hooks is sufficient and keeps the dependency list short.
7. **Dates are calendar days in local time** (`YYYY-MM-DD`), avoiding the UTC off-by-one bug. An assignment is overdue from the day *after* its due date.
8. **Accessible by construction.** A single `Modal` primitive handles focus trapping/restoration, Escape, scroll lock and labelling, and is reused for every dialog. Forms validate on submit, then live, and move focus to the first invalid field.
9. **Tailwind v4 with class-based dark mode** (`dark` class on `<html>`, set before first paint to avoid a flash).
10. **Cross-tab sync** via the `storage` event, so a student's submission shows up in a professor's open tab.

## Assumptions & limitations

- Drive links in the seed data are placeholders. The app records the student's *confirmation* of submission; it does not verify the upload.
- "Mock login" has no passwords by design; it is not a security boundary.
- Data is per-browser (localStorage). Removing students from an assignment keeps their old submission records, so re-adding them restores their status.
