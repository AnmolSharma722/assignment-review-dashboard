# Demo video script (target 4 minutes)

Record with Loom (or Google Drive screen recording) and set sharing to **"Anyone with the link"**.
Start on the deployed URL, not localhost.

**0:00 – Intro (20s)**
"This is my Assignment & Review Dashboard: React, TypeScript and Tailwind, no backend, data saved in localStorage."
Show the login screen: 2 professors, 5 students, "Reset demo data".

**0:20 – Student flow (100s)** – log in as **Aarav Mehta**
- Point out the "3 of 6 submitted" progress bar and the overdue count.
- Show a card: title, description, due date, status badge, Drive link.
- Filter by *Not submitted*, search "graph", change sort. Clear filters.
- Click **Yes, I have submitted** on *Graph Algorithms Lab Report* → show the **Final confirmation** dialog → press Cancel once (nothing changes) → repeat and **Confirm**. Progress becomes "4 of 6".
- Refresh the page: still logged in, still 4 of 6 (persistence).
- Toggle dark mode; shrink the window / use device mode to show the mobile layout.

**1:55 – Admin flow (100s)** – Switch user → **Prof. Meera Iyer**
- Only her 5 assignments are visible (mention Prof. Rahul's are not).
- Summary tiles; the overdue card is highlighted; open **View student status** and show per-student status and the completion bar.
- **New assignment**: submit empty to show validation errors, then fill it in, choose *Selected students*, tick two students, create.
- **Edit** it (change the title), then **Delete** another with the confirmation dialog.
- Switch to **Isha Nair**, submit something, switch back to the professor and show the completion bar updated.

**3:35 – Wrap-up (25s)**
Mention: derived statuses, mock API layer in `lib/storage.ts`, accessibility (keyboard + labels), 35 tests, and that you can walk through the code in the interview.
