# Round 2 demo script (about 4 minutes)

Before recording: open the live site, click **Reset demo data** on the login page, and use one browser window.
Password for all accounts: `Demo@1234`. Say the bold parts; the italics are what to click.

## 1. Intro and login (0:00–0:30)
"Hi, I'm Anmol. This is my Round 2 project: a student, group and assignment management app in React, TypeScript and Tailwind. There's no backend, so a mock API on localStorage stores everything."
*Show the login page, then click Sign in empty.* "Validation shows clear errors." *Type a wrong password.* "A wrong password gives one generic message, so it doesn't reveal which emails exist."

## 2. Register (0:30–1:00)
*Click Create an account.* "Registration asks for name, email, password and a role: Student or Professor. Each role gets its own dashboard." *Fill it quickly as a Student, submit.* "I land on an empty student dashboard with a friendly empty state." *Sign out.*

## 3. Student: individual submission (1:00–1:30)
*Use the student demo button: Aarav… or sign in as Isha.* "Students see course cards with progress." *Open Web Development.* "Each assignment shows description, deadline, OneDrive link, type and status. Overdue items are highlighted." *On an individual assignment click "Yes, I have submitted", then Confirm.* "A confirmation step, then the timestamp is stored and a toast appears."

## 4. Group submission — the key flow (1:30–2:45)
"Now a group assignment, Team Portfolio Website. I'm Isha, a **member** of Byte Club." *Show the card.* "I can see my group and who the leader is, but I can't submit. Only the leader can." *Sign out, sign in as Kabir Singh, open Web Development.* "Kabir is the leader." *Click "Yes, our group has submitted" → Confirm.* "Confirmation, then it's acknowledged for the whole group."
*Sign out, sign in as Isha again.* "Isha now sees **Acknowledged by Kabir Singh on** the date and time."

## 5. No group (2:45–3:10)
*Sign in as Rohan Gupta, open Web Development.* "Rohan has no group, so the card says: you are not part of any group, create or join one." *Click the button.* "He can create a group and become its leader, or join an existing one." *Create a group.* "Now he's the leader and the group shows its members."

## 6. Professor tracking (3:10–3:50)
*Sign out, sign in as Prof. Rahul Verma.* "The professor sees course cards." *Open Web Development.* "Each assignment shows how many students, or groups for group work, have submitted, with a progress bar." *Expand Team Portfolio Website.* "I can drill down to see who has and hasn't submitted, including the leader and members. Byte Club now shows as submitted, and the warning lists students not in any group." *Click New assignment.* "Deadline takes a date and a time, plus the OneDrive link and Individual or Group type." *Create one quickly.*

## 7. Wrap-up (3:50–4:15)
*Toggle dark mode, then shrink the window.* "It has dark mode and is fully responsive."
"Under the hood: a simulated JWT stored in localStorage and cleared on logout, protected routes so a student can't open professor pages, and business rules in the data layer with 96 automated tests. Thanks for watching."

## If something goes wrong
Click **Reset demo data** on the login page to restore the starting state, then re-record that section.
