import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EMAILS, renderApp, savedDb, signInAs, signOut } from './helpers';

async function openCourse(email: string, courseName: string) {
  const user = renderApp('/login');
  await signInAs(user, email);
  await user.click(screen.getByRole('link', { name: courseName }));
  await screen.findByRole('heading', { level: 1, name: courseName });
  return user;
}

const card = (title: RegExp) => screen.getByRole('article', { name: title });

describe('professor dashboard', () => {
  it("shows only the professor's own courses with live numbers", async () => {
    const user = renderApp('/login');
    await signInAs(user, EMAILS.meera);

    expect(screen.getByRole('link', { name: 'Data Structures' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Algorithms' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Web Development' })).not.toBeInTheDocument();
    expect(screen.getByText('5 students enrolled')).toBeInTheDocument();
    expect(screen.getByText('3 students enrolled')).toBeInTheDocument();
  });

  it('opens a course on click', async () => {
    const user = await openCourse(EMAILS.meera, 'Data Structures');
    expect(screen.getByRole('link', { name: /all courses/i })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /all courses/i }));
    expect(await screen.findByRole('heading', { name: 'Your courses' })).toBeInTheDocument();
  });

  it('creates a course (validation, duplicate code, success)', async () => {
    const user = renderApp('/login');
    await signInAs(user, EMAILS.meera);

    await user.click(screen.getByRole('button', { name: /new course/i }));
    const dialog = screen.getByRole('dialog', { name: /create a course/i });
    await user.click(within(dialog).getByRole('button', { name: 'Create course' }));
    expect(within(dialog).getByText(/enter a course code/i)).toBeInTheDocument();
    expect(within(dialog).getByText('Enter a course name.')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/course code/i), 'cs201'); // already taken
    await user.type(within(dialog).getByLabelText(/course name/i), 'Duplicate');
    await user.type(within(dialog).getByLabelText(/^description/i), 'Nope.');
    await user.click(within(dialog).getByRole('button', { name: 'Create course' }));
    expect(within(dialog).getByText(/already exists/i)).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText(/course code/i));
    await user.type(within(dialog).getByLabelText(/course code/i), 'CS999');
    await user.click(within(dialog).getByRole('button', { name: 'Create course' }));

    expect(await screen.findByRole('link', { name: 'Duplicate' })).toBeInTheDocument();
    expect(savedDb().courses.find((c) => c.code === 'CS999')?.professorId).toBe('prof-meera');
  });
});

describe('assignment page and tracking', () => {
  it("shows how many students submitted out of the total, with a progress bar", async () => {
    await openCourse(EMAILS.meera, 'Data Structures');
    const bst = card(/binary trees problem set/i);

    expect(within(bst).getByText('3 of 5 students submitted')).toBeInTheDocument();
    expect(within(bst).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
    expect(within(bst).getByText(/overdue/i)).toBeInTheDocument(); // deadline passed and incomplete
    expect(within(bst).getByRole('link', { name: /open onedrive link/i })).toBeInTheDocument();
  });

  it('drills down into who has and has not submitted', async () => {
    const user = await openCourse(EMAILS.meera, 'Data Structures');
    const bst = card(/binary trees problem set/i);

    await user.click(within(bst).getByRole('button', { name: /view submissions for binary trees/i }));
    expect(within(bst).getAllByRole('listitem')).toHaveLength(5);

    const isha = within(bst).getByText('Isha Nair').closest('li') as HTMLElement;
    expect(within(isha).getByText('Not submitted')).toBeInTheDocument();
    const aarav = within(bst).getByText('Aarav Mehta').closest('li') as HTMLElement;
    expect(within(aarav).getByText('Submitted')).toBeInTheDocument();
    expect(aarav).toHaveTextContent(/acknowledged on/i);

    await user.click(within(bst).getByRole('button', { name: 'Not submitted' }));
    expect(within(bst).getAllByRole('listitem')).toHaveLength(2);
    await user.click(within(bst).getByRole('button', { name: 'Submitted' }));
    expect(within(bst).getAllByRole('listitem')).toHaveLength(3);
  });

  it('tracks group assignments by group, and flags students who have no group', async () => {
    const user = await openCourse(EMAILS.rahul, 'Web Development');
    const portfolio = card(/team portfolio website/i);

    expect(within(portfolio).getByText('1 of 2 groups submitted')).toBeInTheDocument();
    expect(within(portfolio).getByText('Group')).toBeInTheDocument(); // type badge

    await user.click(within(portfolio).getByRole('button', { name: /view submissions for team portfolio/i }));
    const pixel = within(portfolio).getByText('Team Pixel').closest('li') as HTMLElement;
    expect(pixel).toHaveTextContent(/acknowledged by aarav mehta on/i);
    expect(pixel).toHaveTextContent(/members: aarav mehta, diya sharma/i);
    const byte = within(portfolio).getByText('Byte Club').closest('li') as HTMLElement;
    expect(within(byte).getByText('Not submitted')).toBeInTheDocument();
    expect(byte).toHaveTextContent(/waiting for the group leader/i);
    expect(portfolio).toHaveTextContent(/1 student is not in a group yet.*rohan gupta/i);
  });

  it("doesn't let a professor open another professor's course", async () => {
    const user = renderApp('/professor/courses/crs-web'); // Rahul's course
    await user.type(await screen.findByLabelText(/^email/i), EMAILS.meera);
    await user.type(screen.getByLabelText(/^password/i), 'Demo@1234');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    // Redirected to the professor area, where this course isn't hers.
    expect(await screen.findByRole('heading', { name: 'Course not found' })).toBeInTheDocument();
  });

  it("reflects a student's group acknowledgement in the professor's numbers", async () => {
    const user = renderApp('/login');
    await signInAs(user, EMAILS.kabir);
    await user.click(screen.getByRole('link', { name: 'Web Development' }));
    const studentCard = await screen.findByRole('article', { name: /team portfolio website/i });
    await user.click(within(studentCard).getByRole('button', { name: /yes, our group has submitted/i }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /confirm submission/i }));
    await screen.findByText(/acknowledged for byte club/i);

    await signOut(user);
    await signInAs(user, EMAILS.rahul);
    await user.click(screen.getByRole('link', { name: 'Web Development' }));
    const portfolio = await screen.findByRole('article', { name: /team portfolio website/i });
    expect(within(portfolio).getByText('2 of 2 groups submitted')).toBeInTheDocument();
    expect(within(portfolio).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('creating, editing and deleting assignments', () => {
  it('validates, then creates a group assignment with a date AND time', async () => {
    const user = await openCourse(EMAILS.rahul, 'Web Development');
    await user.click(screen.getByRole('button', { name: /new assignment/i }));
    const dialog = screen.getByRole('dialog', { name: /create assignment/i });

    await user.click(within(dialog).getByRole('button', { name: 'Create assignment' }));
    expect(within(dialog).getByText('Enter a title.')).toBeInTheDocument();
    expect(within(dialog).getByText('Choose a deadline date and time.')).toBeInTheDocument();
    expect(within(dialog).getByText(/paste the onedrive link/i)).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/^title/i), 'Sprint Retrospective');
    await user.type(within(dialog).getByLabelText(/^description/i), 'Write up what went well.');
    fireEvent.change(within(dialog).getByLabelText(/^deadline/i), { target: { value: '2099-01-15T14:45' } });
    await user.type(within(dialog).getByLabelText(/onedrive link/i), 'https://onedrive.live.com/?id=retro');
    await user.click(within(dialog).getByRole('radio', { name: /^group/i }));
    await user.click(within(dialog).getByRole('button', { name: 'Create assignment' }));

    const created = await screen.findByRole('article', { name: /sprint retrospective/i });
    expect(within(created).getByText('0 of 2 groups submitted')).toBeInTheDocument();
    expect(within(created).getByText('Group')).toBeInTheDocument();
    expect(within(created).getByText(/2099/)).toBeInTheDocument();
    expect(await screen.findByText('Assignment created.')).toBeInTheDocument();

    const stored = savedDb().assignments.find((a) => a.title === 'Sprint Retrospective');
    expect(stored).toMatchObject({ courseId: 'crs-web', createdBy: 'prof-rahul', submissionType: 'group' });
    // The stored deadline keeps the time of day the professor chose.
    expect(new Date(stored?.deadline ?? '').getHours()).toBe(14);
    expect(new Date(stored?.deadline ?? '').getMinutes()).toBe(45);
  });

  it('edits an assignment', async () => {
    const user = await openCourse(EMAILS.meera, 'Data Structures');
    await user.click(screen.getByRole('button', { name: 'Edit Midterm Revision Notes' }));

    const dialog = screen.getByRole('dialog', { name: /edit assignment/i });
    const title = within(dialog).getByLabelText(/^title/i);
    // The saved deadline is loaded back into the date-time field.
    expect((within(dialog).getByLabelText(/^deadline/i) as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    await user.clear(title);
    await user.type(title, 'Final Revision Notes');
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }));

    expect(await screen.findByRole('heading', { name: 'Final Revision Notes' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Midterm Revision Notes' })).not.toBeInTheDocument();
    expect(await screen.findByText('Assignment updated.')).toBeInTheDocument();
  });

  it('locks the submission type once students have acknowledged', async () => {
    const user = await openCourse(EMAILS.rahul, 'Web Development');
    await user.click(screen.getByRole('button', { name: 'Edit Team Portfolio Website' })); // Team Pixel acknowledged it
    const dialog = screen.getByRole('dialog', { name: /edit assignment/i });
    expect(within(dialog).getByRole('radio', { name: /^individual/i })).toBeDisabled();
    expect(within(dialog).getByRole('radio', { name: /^group/i })).toBeDisabled();
    expect(dialog).toHaveTextContent(/locked/i);
  });

  it('deletes an assignment after confirmation', async () => {
    const user = await openCourse(EMAILS.meera, 'Data Structures');
    await user.click(screen.getByRole('button', { name: 'Delete Binary Trees Problem Set' }));
    await user.click(
      within(screen.getByRole('dialog', { name: /delete assignment\?/i })).getByRole('button', {
        name: /delete assignment/i,
      }),
    );

    expect(screen.queryByRole('heading', { name: 'Binary Trees Problem Set' })).not.toBeInTheDocument();
    const db = savedDb();
    expect(db.assignments.some((a) => a.id === 'asg-bst')).toBe(false);
    expect(db.acknowledgements.some((a) => a.assignmentId === 'asg-bst')).toBe(false);
  });

  it('shows an empty state for a course with no assignments, and filters/searches otherwise', async () => {
    const user = await openCourse(EMAILS.meera, 'Algorithms');
    await user.click(screen.getByRole('button', { name: 'Past deadline' }));
    expect(screen.getByText(/no assignments match/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /clear filters/i }));
    await user.type(screen.getByRole('searchbox'), 'dynamic');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Dynamic Programming Challenge' })).toBeInTheDocument();
  });
});
