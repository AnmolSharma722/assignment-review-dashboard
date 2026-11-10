import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EMAILS, renderApp, savedDb, signInAs, signOut } from './helpers';

/** Signs in as a student and opens a course from the dashboard. */
async function openCourse(email: string, courseName: string) {
  const user = renderApp('/login');
  await signInAs(user, email);
  await user.click(screen.getByRole('link', { name: courseName }));
  await screen.findByRole('heading', { level: 1, name: courseName });
  return user;
}

const card = (title: RegExp) => screen.getByRole('article', { name: title });

describe('student dashboard', () => {
  it('shows only the courses the student is enrolled in, with progress', async () => {
    const user = renderApp('/login');
    await signInAs(user, EMAILS.aarav);

    expect(screen.getByRole('link', { name: 'Data Structures' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Algorithms' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Web Development' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /human–computer interaction/i })).not.toBeInTheDocument();

    // Per-course progress (Aarav: DS 1 of 2, Algorithms 0 of 2, Web 3 of 3 incl. his group's submission).
    expect(screen.getByText('1 of 2 submitted')).toBeInTheDocument();
    expect(screen.getByText('0 of 2 submitted')).toBeInTheDocument();
    expect(screen.getByText('3 of 3 submitted')).toBeInTheDocument();
  });

  it('lets a student enroll in another course', async () => {
    const user = renderApp('/login');
    await signInAs(user, EMAILS.isha);
    expect(screen.queryByRole('link', { name: 'Algorithms' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /enroll in a course/i }));
    const dialog = screen.getByRole('dialog', { name: /enroll in a course/i });
    await user.click(within(dialog).getByRole('button', { name: 'Enroll in Algorithms' }));
    await user.click(within(dialog).getByRole('button', { name: 'Done' }));

    expect(await screen.findByRole('link', { name: 'Algorithms' })).toBeInTheDocument();
    expect(savedDb().courses.find((c) => c.id === 'crs-algo')?.enrolledStudentIds).toContain('stu-isha');
  });

  it("doesn't open a course the student isn't enrolled in", async () => {
    const user = renderApp('/student/courses/crs-hci'); // Aarav isn't in HCI
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^email/i), EMAILS.aarav);
    await user.type(screen.getByLabelText(/^password/i), 'Demo@1234');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { name: 'Course not found' })).toBeInTheDocument();
  });
});

describe('course assignments page', () => {
  it('shows name, description, deadline, OneDrive link, type and status', async () => {
    await openCourse(EMAILS.aarav, 'Algorithms');

    const graphs = card(/graph algorithms lab report/i);
    expect(within(graphs).getByText(/implement bfs, dfs and dijkstra/i)).toBeInTheDocument();
    expect(within(graphs).getByText(/deadline:/i)).toBeInTheDocument();
    expect(within(graphs).getByText(/due in 2 days/i)).toBeInTheDocument();
    expect(within(graphs).getByText(/submission type/i).parentElement).toHaveTextContent('Individual');
    expect(within(graphs).getByText('Pending')).toBeInTheDocument();
    expect(within(graphs).getByRole('link', { name: /open onedrive link/i })).toHaveAttribute(
      'href',
      expect.stringContaining('onedrive.live.com'),
    );
  });

  it('highlights overdue work', async () => {
    await openCourse(EMAILS.diya, 'Web Development');
    const landing = card(/responsive landing page/i);
    expect(within(landing).getByText('Overdue')).toBeInTheDocument();
    expect(within(landing).getByText(/1 day overdue/i)).toBeInTheDocument();
  });

  it('filters by status and searches', async () => {
    const user = await openCourse(EMAILS.diya, 'Web Development');
    expect(screen.getAllByRole('article')).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: 'Submitted' }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Team Portfolio Website' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Overdue' }));
    expect(screen.getByRole('heading', { name: 'Responsive Landing Page' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'All' }));
    await user.type(screen.getByRole('searchbox', { name: /search assignments/i }), 'zzzz');
    expect(screen.getByText(/no assignments match/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });
});

describe('individual acknowledgement', () => {
  it('needs a two-step confirmation, then records the status and a timestamp', async () => {
    const user = await openCourse(EMAILS.aarav, 'Algorithms');
    expect(screen.getByText('0 of 2 submitted', { selector: 'p' })).toBeInTheDocument();

    const graphs = card(/graph algorithms lab report/i);
    // Step 1: opens a dialog, nothing changes yet.
    await user.click(within(graphs).getByRole('button', { name: /yes, i have submitted/i }));
    const dialog = screen.getByRole('dialog', { name: /final confirmation/i });
    expect(within(graphs).getByText('Pending')).toBeInTheDocument();

    // Cancelling changes nothing.
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(graphs).getByText('Pending')).toBeInTheDocument();

    // Step 2: confirm.
    await user.click(within(graphs).getByRole('button', { name: /yes, i have submitted/i }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /confirm submission/i }));

    expect(await screen.findByText(/marked as submitted/i)).toBeInTheDocument(); // toast
    expect(within(graphs).getByText('Submitted')).toBeInTheDocument();
    expect(within(graphs).getByText(/^Acknowledged on /)).toBeInTheDocument();
    expect(within(graphs).queryByRole('button', { name: /yes, i have submitted/i })).not.toBeInTheDocument();
    expect(screen.getByText('1 of 2 submitted', { selector: 'p' })).toBeInTheDocument();

    const stored = savedDb().acknowledgements.find((a) => a.assignmentId === 'asg-graphs' && a.subjectId === 'stu-aarav');
    expect(stored).toMatchObject({ subjectType: 'student', acknowledgedBy: 'stu-aarav' });
    expect(Number.isNaN(Date.parse(stored?.acknowledgedAt ?? ''))).toBe(false);
  });
});

describe('group acknowledgement', () => {
  it('only the leader sees the button; the other members are told who they are waiting for', async () => {
    await openCourse(EMAILS.isha, 'Web Development'); // Isha is a member of Byte Club (leader: Kabir)
    const portfolio = card(/team portfolio website/i);

    expect(within(portfolio).getByText('Group: Byte Club')).toBeInTheDocument();
    expect(within(portfolio).getByText(/waiting for/i)).toHaveTextContent('Kabir Singh');
    expect(within(portfolio).queryByRole('button', { name: /yes, our group has submitted/i })).not.toBeInTheDocument();
  });

  it('the leader acknowledges for the whole group and every member then sees who and when', async () => {
    const user = await openCourse(EMAILS.kabir, 'Web Development');
    const portfolio = card(/team portfolio website/i);

    // Kabir is the leader of Byte Club.
    expect(screen.getByText(/leader:/i, { selector: 'p' })).toHaveTextContent('Kabir Singh');
    await user.click(within(portfolio).getByRole('button', { name: /yes, our group has submitted/i }));
    const dialog = screen.getByRole('dialog', { name: /final confirmation/i });
    expect(dialog).toHaveTextContent(/byte club has submitted/i);
    expect(dialog).toHaveTextContent(/every member of your group will see/i);
    await user.click(within(dialog).getByRole('button', { name: /confirm submission/i }));

    expect(await screen.findByText(/acknowledged for byte club/i)).toBeInTheDocument(); // toast
    expect(within(portfolio).getByText(/^Acknowledged by Kabir Singh on /)).toBeInTheDocument();
    expect(within(portfolio).getByText('Submitted')).toBeInTheDocument();

    const stored = savedDb().acknowledgements.find((a) => a.assignmentId === 'asg-portfolio' && a.subjectId === 'grp-byte');
    expect(stored).toMatchObject({ subjectType: 'group', acknowledgedBy: 'stu-kabir' });

    // Now a different member of the group signs in.
    await signOut(user);
    await signInAs(user, EMAILS.isha);
    await user.click(screen.getByRole('link', { name: 'Web Development' }));
    const asIsha = card(/team portfolio website/i);
    expect(within(asIsha).getByText(/^Acknowledged by Kabir Singh on /)).toBeInTheDocument();
    expect(within(asIsha).getByText('Submitted')).toBeInTheDocument();
  });

  it('shows an already-acknowledged group assignment to its members', async () => {
    await openCourse(EMAILS.diya, 'Web Development'); // Team Pixel (leader: Aarav) already acknowledged
    const portfolio = card(/team portfolio website/i);
    expect(within(portfolio).getByText(/^Acknowledged by Aarav Mehta on /)).toBeInTheDocument();
  });

  it('shows the group, its members and its leader', async () => {
    await openCourse(EMAILS.aarav, 'Web Development');
    const panel = screen.getByRole('region', { name: /your group/i });
    expect(within(panel).getByText('Team Pixel')).toBeInTheDocument();
    expect(panel).toHaveTextContent(/leader: aarav mehta \(you\)/i);
    const members = within(within(panel).getByRole('list', { name: /group members/i })).getAllByRole('listitem');
    expect(members.map((m) => m.textContent)).toEqual([
      expect.stringContaining('Aarav Mehta'),
      expect.stringContaining('Diya Sharma'),
    ]);
    expect(members[0]).toHaveTextContent(/leader/i);
  });
});

describe('students without a group', () => {
  it('see the message and a button, and can create a group to become its leader', async () => {
    const user = await openCourse(EMAILS.rohan, 'Web Development');
    const portfolio = card(/team portfolio website/i);

    expect(
      within(portfolio).getByText('You are not part of any group. Create or join one to submit this assignment.'),
    ).toBeInTheDocument();
    expect(within(portfolio).queryByRole('button', { name: /yes, our group has submitted/i })).not.toBeInTheDocument();

    await user.click(within(portfolio).getByRole('button', { name: /create or join a group/i }));
    const dialog = screen.getByRole('dialog', { name: /create or join a group/i });

    // Validation first.
    await user.click(within(dialog).getByRole('button', { name: 'Create group' }));
    expect(within(dialog).getByText('Enter a group name.')).toBeInTheDocument();
    // A name that is taken.
    await user.type(within(dialog).getByLabelText(/group name/i), 'Team Pixel');
    await user.click(within(dialog).getByRole('button', { name: 'Create group' }));
    expect(within(dialog).getByText(/already exists/i)).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText(/group name/i));
    await user.type(within(dialog).getByLabelText(/group name/i), 'Rocket Squad');
    await user.click(within(dialog).getByRole('button', { name: 'Create group' }));

    expect(await screen.findByText(/group “rocket squad” created/i)).toBeInTheDocument();
    const panel = screen.getByRole('region', { name: /your group/i });
    expect(panel).toHaveTextContent('Rocket Squad');
    expect(panel).toHaveTextContent(/leader: rohan gupta \(you\)/i);
    // As the new leader, Rohan can now acknowledge the group assignment.
    expect(within(portfolio).getByRole('button', { name: /yes, our group has submitted/i })).toBeInTheDocument();
    expect(savedDb().groups.find((g) => g.name === 'Rocket Squad')).toMatchObject({
      leaderId: 'stu-rohan',
      memberIds: ['stu-rohan'],
    });
  });

  it('can join an existing group (as a regular member, not the leader)', async () => {
    const user = await openCourse(EMAILS.rohan, 'Web Development');
    await user.click(
      within(screen.getByRole('region', { name: /your group/i })).getByRole('button', { name: /create or join a group/i }),
    );

    const dialog = screen.getByRole('dialog', { name: /create or join a group/i });
    expect(dialog).toHaveTextContent('Byte Club');
    expect(dialog).toHaveTextContent(/leader: kabir singh/i);
    await user.click(within(dialog).getByRole('button', { name: 'Join Byte Club' }));

    expect(await screen.findByText(/you joined byte club/i)).toBeInTheDocument();
    const portfolio = card(/team portfolio website/i);
    expect(within(portfolio).getByText(/waiting for/i)).toHaveTextContent('Kabir Singh');
    expect(within(portfolio).queryByRole('button', { name: /yes, our group has submitted/i })).not.toBeInTheDocument();
    expect(savedDb().groups.find((g) => g.id === 'grp-byte')?.memberIds).toContain('stu-rohan');
  });
});
