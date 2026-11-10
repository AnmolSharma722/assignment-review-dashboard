import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { STORAGE_KEYS } from '../lib/storage';
import type { Database } from '../types';

const savedDb = (): Database => JSON.parse(localStorage.getItem(STORAGE_KEYS.db) as string);

async function loginAs(name: RegExp) {
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('button', { name }));
  return user;
}

describe('login', () => {
  it('shows seeded admins and students, then signs in and out', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('heading', { name: /assignment & review dashboard/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /prof\. meera iyer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /prof\. rahul verma/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aarav mehta/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /aarav mehta/i }));
    expect(await screen.findByRole('heading', { name: /welcome back, aarav/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /switch user/i }));
    expect(await screen.findByRole('button', { name: /diya sharma/i })).toBeInTheDocument();
  });
});

describe('student view', () => {
  it('shows only their own assignments with an overall progress indicator', async () => {
    await loginAs(/aarav mehta/i);

    expect(await screen.findByText('3 of 6 submitted')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /overall assignment progress/i })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    // Assigned to Aarav
    expect(screen.getByRole('heading', { name: 'Hash Tables Mini Project' })).toBeInTheDocument();
    // Assigned only to other students
    expect(screen.queryByText('Sorting Benchmarks')).not.toBeInTheDocument();
    expect(screen.queryByText('Accessibility Audit')).not.toBeInTheDocument();
  });

  it('requires a two-step confirmation, then marks the assignment submitted and persists it', async () => {
    const user = await loginAs(/aarav mehta/i);
    await screen.findByText('3 of 6 submitted');

    const card = screen.getByRole('article', { name: /graph algorithms lab report/i });
    expect(within(card).getByText('Pending')).toBeInTheDocument();

    // Step 1: "Yes, I have submitted" only opens a dialog; nothing changes yet.
    await user.click(within(card).getByRole('button', { name: /yes, i have submitted/i }));
    const dialog = screen.getByRole('dialog', { name: /final confirmation/i });
    expect(screen.getByText('3 of 6 submitted')).toBeInTheDocument();

    // Cancelling leaves the status untouched.
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(card).getByText('Pending')).toBeInTheDocument();

    // Step 2: confirm.
    await user.click(within(card).getByRole('button', { name: /yes, i have submitted/i }));
    await user.click(
      within(screen.getByRole('dialog', { name: /final confirmation/i })).getByRole('button', {
        name: /confirm submission/i,
      }),
    );

    expect(await screen.findByText('4 of 6 submitted')).toBeInTheDocument();
    expect(within(card).getByText('Submitted')).toBeInTheDocument();
    expect(
      within(card).queryByRole('button', { name: /yes, i have submitted/i }),
    ).not.toBeInTheDocument();

    // It was written to localStorage, so it survives a refresh.
    expect(
      savedDb().submissions.some((s) => s.assignmentId === 'asg-graphs' && s.studentId === 'stu-aarav'),
    ).toBe(true);
  });

  it('keeps the session and data after a page reload', async () => {
    const user = await loginAs(/aarav mehta/i);
    await screen.findByText('3 of 6 submitted');
    const card = screen.getByRole('article', { name: /graph algorithms lab report/i });
    await user.click(within(card).getByRole('button', { name: /yes, i have submitted/i }));
    await user.click(screen.getByRole('button', { name: /confirm submission/i }));
    await screen.findByText('4 of 6 submitted');

    // "Reload": unmount and mount a fresh app against the same localStorage.
    document.body.innerHTML = '';
    render(<App />);
    expect(await screen.findByText('4 of 6 submitted')).toBeInTheDocument();
  });

  it('filters by status and searches', async () => {
    const user = await loginAs(/aarav mehta/i);
    await screen.findByText('3 of 6 submitted');

    await user.click(screen.getByRole('button', { name: 'Submitted' }));
    expect(screen.getAllByRole('article')).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: 'Overdue' }));
    expect(screen.getByText(/no assignments match/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear filters/i }));
    await user.type(screen.getByRole('searchbox', { name: /search assignments/i }), 'react');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'React Todo App' })).toBeInTheDocument();
  });

  it('highlights overdue work', async () => {
    await loginAs(/diya sharma/i);
    // Diya never submitted the (overdue) landing page.
    const card = await screen.findByRole('article', { name: /responsive landing page/i });
    expect(within(card).getByText('Overdue')).toBeInTheDocument(); // status badge
    expect(within(card).getByText('1 day overdue')).toBeInTheDocument(); // relative due label
  });
});

describe('admin view', () => {
  it("only shows the signed-in admin's own assignments, with class completion", async () => {
    await loginAs(/prof\. meera iyer/i);

    const bst = await screen.findByRole('article', { name: /binary trees problem set/i });
    expect(within(bst).getByText('3 of 5 submitted')).toBeInTheDocument();
    expect(within(bst).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
    // Prof. Rahul's assignments are not visible to Prof. Meera.
    expect(screen.queryByText('Responsive Landing Page')).not.toBeInTheDocument();
    expect(screen.queryByText('React Todo App')).not.toBeInTheDocument();
  });

  it("lists every assigned student's status", async () => {
    const user = await loginAs(/prof\. meera iyer/i);
    const sorting = await screen.findByRole('article', { name: /sorting benchmarks/i });

    await user.click(within(sorting).getByRole('button', { name: /view student status/i }));
    expect(within(sorting).getByText('Isha Nair')).toBeInTheDocument();
    expect(within(sorting).getByText('Rohan Gupta')).toBeInTheDocument();
    expect(within(sorting).queryByText('Aarav Mehta')).not.toBeInTheDocument();
    expect(within(sorting).getAllByText('Not submitted')).toHaveLength(2);
  });

  it('validates, then creates an assignment for selected students', async () => {
    const user = await loginAs(/prof\. meera iyer/i);
    await screen.findByRole('heading', { name: /your assignments/i });

    await user.click(screen.getByRole('button', { name: /new assignment/i }));
    const dialog = screen.getByRole('dialog', { name: /create assignment/i });

    // Empty submit shows errors and does not create anything.
    await user.click(within(dialog).getByRole('button', { name: /create assignment/i }));
    expect(within(dialog).getByText('Enter a title.')).toBeInTheDocument();
    expect(within(dialog).getByText('Choose a due date.')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/^title/i), 'Recursion Worksheet');
    await user.type(within(dialog).getByLabelText(/^description/i), 'Ten recursion exercises.');
    fireEvent.change(within(dialog).getByLabelText(/^due date/i), { target: { value: '2099-01-15' } });
    await user.type(
      within(dialog).getByLabelText(/google drive link/i),
      'https://drive.google.com/drive/folders/recursion',
    );

    await user.click(within(dialog).getByRole('radio', { name: /selected students/i }));
    await user.click(within(dialog).getByRole('button', { name: /create assignment/i }));
    expect(within(dialog).getByText('Select at least one student.')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('checkbox', { name: 'Diya Sharma' }));
    await user.click(within(dialog).getByRole('checkbox', { name: 'Kabir Singh' }));
    await user.click(within(dialog).getByRole('button', { name: /create assignment/i }));

    const card = await screen.findByRole('article', { name: /recursion worksheet/i });
    expect(within(card).getByText('0 of 2 submitted')).toBeInTheDocument();
    expect(within(card).getByText('2 selected students')).toBeInTheDocument();

    const created = savedDb().assignments.find((a) => a.title === 'Recursion Worksheet');
    expect(created?.createdBy).toBe('admin-meera');
    expect(created?.assignedTo).toEqual(['stu-diya', 'stu-kabir']);
  });

  it('edits an assignment', async () => {
    const user = await loginAs(/prof\. meera iyer/i);
    await user.click(await screen.findByRole('button', { name: 'Edit Midterm Revision Notes' }));

    const dialog = screen.getByRole('dialog', { name: /edit assignment/i });
    const title = within(dialog).getByLabelText(/^title/i);
    await user.clear(title);
    await user.type(title, 'Final Revision Notes');
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }));

    expect(await screen.findByRole('heading', { name: 'Final Revision Notes' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Midterm Revision Notes' })).not.toBeInTheDocument();
  });

  it('deletes an assignment after confirmation', async () => {
    const user = await loginAs(/prof\. meera iyer/i);
    await user.click(await screen.findByRole('button', { name: 'Delete Binary Trees Problem Set' }));

    const dialog = screen.getByRole('dialog', { name: /delete assignment\?/i });
    await user.click(within(dialog).getByRole('button', { name: /delete assignment/i }));

    expect(screen.queryByRole('heading', { name: 'Binary Trees Problem Set' })).not.toBeInTheDocument();
    const db = savedDb();
    expect(db.assignments.some((a) => a.id === 'asg-bst')).toBe(false);
    expect(db.submissions.some((s) => s.assignmentId === 'asg-bst')).toBe(false);
  });

  it("reflects students' submissions in the admin's completion view", async () => {
    // A student submits...
    const studentUser = await loginAs(/isha nair/i);
    const card = await screen.findByRole('article', { name: /graph algorithms lab report/i });
    await studentUser.click(within(card).getByRole('button', { name: /yes, i have submitted/i }));
    await studentUser.click(screen.getByRole('button', { name: /confirm submission/i }));
    await screen.findByText(/marked as submitted/i);

    // ...then the professor sees the class completion go from 1/5 to 2/5.
    await studentUser.click(screen.getByRole('button', { name: /switch user/i }));
    await studentUser.click(await screen.findByRole('button', { name: /prof\. meera iyer/i }));
    const graphs = await screen.findByRole('article', { name: /graph algorithms lab report/i });
    expect(within(graphs).getByText('2 of 5 submitted')).toBeInTheDocument();
  });
});

describe('error and recovery states', () => {
  it('shows an error with recovery actions when saved data is corrupted', async () => {
    localStorage.setItem(STORAGE_KEYS.db, '{not valid json');
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load your data/i);
    await user.click(screen.getByRole('button', { name: /reset demo data/i }));
    expect(await screen.findByRole('button', { name: /aarav mehta/i })).toBeInTheDocument();
  });
});

describe('theme', () => {
  it('toggles dark mode and remembers it', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /switch to dark mode/i }));

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });
});
