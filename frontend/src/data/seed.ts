import { hashPassword } from '../lib/token';
import type { Acknowledgement, Assignment, Course, Database, Group, User } from '../types';

/** Every seeded account uses this password (shown on the login screen). */
export const DEMO_PASSWORD = 'Demo@1234';

export const DEMO_ACCOUNTS = {
  professor: { name: 'Prof. Meera Iyer', email: 'meera.iyer@university.edu' },
  student: { name: 'Aarav Mehta', email: 'aarav.mehta@student.edu' },
} as const;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function makeUser(id: string, name: string, email: string, role: User['role'], createdAt: string): User {
  return { id, name, email, role, passwordHash: hashPassword(email, DEMO_PASSWORD), createdAt };
}

/**
 * Builds the demo data set. Times are generated relative to `now` so the demo
 * always has a healthy mix of overdue, due-soon and upcoming work, whenever the
 * app is first opened.
 *
 * Highlights for demos:
 *  - WD101 "Team Portfolio Website" is a GROUP assignment. Team Pixel (leader
 *    Aarav) has acknowledged it; Byte Club (leader Kabir) has not; Rohan has no group.
 *  - UX210 "Accessibility Audit" is also a group assignment; Diya has no group there.
 */
export function createSeedData(now: Date = new Date()): Database {
  const t = now.getTime();
  const at = (offsetMs: number) => new Date(t + offsetMs).toISOString();
  const created = at(-30 * DAY);
  const onedrive = (slug: string) => `https://onedrive.live.com/?id=${slug}`;

  const users: User[] = [
    makeUser('prof-meera', 'Prof. Meera Iyer', 'meera.iyer@university.edu', 'professor', created),
    makeUser('prof-rahul', 'Prof. Rahul Verma', 'rahul.verma@university.edu', 'professor', created),
    makeUser('stu-aarav', 'Aarav Mehta', 'aarav.mehta@student.edu', 'student', created),
    makeUser('stu-diya', 'Diya Sharma', 'diya.sharma@student.edu', 'student', created),
    makeUser('stu-kabir', 'Kabir Singh', 'kabir.singh@student.edu', 'student', created),
    makeUser('stu-isha', 'Isha Nair', 'isha.nair@student.edu', 'student', created),
    makeUser('stu-rohan', 'Rohan Gupta', 'rohan.gupta@student.edu', 'student', created),
  ];

  const allStudents = ['stu-aarav', 'stu-diya', 'stu-kabir', 'stu-isha', 'stu-rohan'];

  const courses: Course[] = [
    {
      id: 'crs-ds',
      code: 'CS201',
      name: 'Data Structures',
      description: 'Arrays, trees, heaps, hash tables and the trade-offs between them.',
      professorId: 'prof-meera',
      accent: 'indigo',
      enrolledStudentIds: allStudents,
      createdAt: created,
    },
    {
      id: 'crs-algo',
      code: 'CS305',
      name: 'Algorithms',
      description: 'Graph algorithms, dynamic programming and complexity analysis.',
      professorId: 'prof-meera',
      accent: 'violet',
      enrolledStudentIds: ['stu-aarav', 'stu-diya', 'stu-kabir'],
      createdAt: created,
    },
    {
      id: 'crs-web',
      code: 'WD101',
      name: 'Web Development',
      description: 'Semantic HTML, responsive CSS and building interfaces with React.',
      professorId: 'prof-rahul',
      accent: 'emerald',
      enrolledStudentIds: allStudents,
      createdAt: created,
    },
    {
      id: 'crs-hci',
      code: 'UX210',
      name: 'Human–Computer Interaction',
      description: 'User research, usability, accessibility and interface evaluation.',
      professorId: 'prof-rahul',
      accent: 'rose',
      enrolledStudentIds: ['stu-diya', 'stu-isha', 'stu-rohan'],
      createdAt: created,
    },
  ];

  const assignments: Assignment[] = [
    {
      id: 'asg-bst',
      courseId: 'crs-ds',
      title: 'Binary Trees Problem Set',
      description:
        'Solve the eight problems on BST insertion, deletion and traversals. Combine your solutions into one PDF and upload it to the shared OneDrive folder.',
      deadline: at(-3 * DAY),
      oneDriveLink: onedrive('ds-binary-trees-problem-set'),
      submissionType: 'individual',
      createdBy: 'prof-meera',
      createdAt: at(-12 * DAY),
    },
    {
      id: 'asg-revision',
      courseId: 'crs-ds',
      title: 'Midterm Revision Notes',
      description:
        'Submit a two-page summary of the topics you find hardest before the midterm. Handwritten scans are fine.',
      deadline: at(10 * DAY + 3 * HOUR),
      oneDriveLink: onedrive('ds-midterm-revision-notes'),
      submissionType: 'individual',
      createdBy: 'prof-meera',
      createdAt: at(-2 * DAY),
    },
    {
      id: 'asg-graphs',
      courseId: 'crs-algo',
      title: 'Graph Algorithms Lab Report',
      description:
        'Implement BFS, DFS and Dijkstra on the provided road-network dataset and write up your complexity analysis (max 4 pages).',
      deadline: at(2 * DAY + 5 * HOUR),
      oneDriveLink: onedrive('algo-graph-lab-report'),
      submissionType: 'individual',
      createdBy: 'prof-meera',
      createdAt: at(-8 * DAY),
    },
    {
      id: 'asg-dp',
      courseId: 'crs-algo',
      title: 'Dynamic Programming Challenge',
      description:
        'Solve the knapsack and longest-common-subsequence problems and explain your recurrence relations.',
      deadline: at(5 * HOUR),
      oneDriveLink: onedrive('algo-dp-challenge'),
      submissionType: 'individual',
      createdBy: 'prof-meera',
      createdAt: at(-6 * DAY),
    },
    {
      id: 'asg-landing',
      courseId: 'crs-web',
      title: 'Responsive Landing Page',
      description:
        'Recreate the provided design as a fully responsive landing page using semantic HTML and CSS only. Upload a zip of your project.',
      deadline: at(-1 * DAY),
      oneDriveLink: onedrive('web-responsive-landing-page'),
      submissionType: 'individual',
      createdBy: 'prof-rahul',
      createdAt: at(-9 * DAY),
    },
    {
      id: 'asg-portfolio',
      courseId: 'crs-web',
      title: 'Team Portfolio Website',
      description:
        'As a group, design and build a portfolio site for a fictional studio. Your group leader acknowledges once everything is uploaded to OneDrive.',
      deadline: at(4 * DAY + 2 * HOUR),
      oneDriveLink: onedrive('web-team-portfolio-website'),
      submissionType: 'group',
      createdBy: 'prof-rahul',
      createdAt: at(-5 * DAY),
    },
    {
      id: 'asg-todo',
      courseId: 'crs-web',
      title: 'React Todo App',
      description:
        'Build a todo app with React hooks that persists to localStorage. Share the repository link in the OneDrive document.',
      deadline: at(5 * DAY),
      oneDriveLink: onedrive('web-react-todo-app'),
      submissionType: 'individual',
      createdBy: 'prof-rahul',
      createdAt: at(-4 * DAY),
    },
    {
      id: 'asg-a11y',
      courseId: 'crs-hci',
      title: 'Accessibility Audit',
      description:
        'In your group, audit a website against WCAG 2.2 AA, list the issues you found and propose fixes. Include screenshots.',
      deadline: at(8 * DAY),
      oneDriveLink: onedrive('hci-accessibility-audit'),
      submissionType: 'group',
      createdBy: 'prof-rahul',
      createdAt: at(-3 * DAY),
    },
    {
      id: 'asg-interviews',
      courseId: 'crs-hci',
      title: 'User Research Interviews',
      description:
        'Conduct three short interviews with potential users and upload your notes and a one-page synthesis.',
      deadline: at(-6 * HOUR),
      oneDriveLink: onedrive('hci-user-research-interviews'),
      submissionType: 'individual',
      createdBy: 'prof-rahul',
      createdAt: at(-7 * DAY),
    },
  ];

  const groups: Group[] = [
    {
      id: 'grp-pixel',
      courseId: 'crs-web',
      name: 'Team Pixel',
      leaderId: 'stu-aarav',
      memberIds: ['stu-aarav', 'stu-diya'],
      createdAt: at(-6 * DAY),
    },
    {
      id: 'grp-byte',
      courseId: 'crs-web',
      name: 'Byte Club',
      leaderId: 'stu-kabir',
      memberIds: ['stu-kabir', 'stu-isha'],
      createdAt: at(-6 * DAY),
    },
    {
      id: 'grp-allies',
      courseId: 'crs-hci',
      name: 'Access Allies',
      leaderId: 'stu-isha',
      memberIds: ['stu-isha', 'stu-rohan'],
      createdAt: at(-3 * DAY),
    },
  ];

  const solo = (assignmentId: string, studentId: string, hoursAgo: number): Acknowledgement => ({
    assignmentId,
    subjectType: 'student',
    subjectId: studentId,
    acknowledgedBy: studentId,
    acknowledgedAt: at(-hoursAgo * HOUR),
  });

  const acknowledgements: Acknowledgement[] = [
    solo('asg-bst', 'stu-aarav', 120),
    solo('asg-bst', 'stu-diya', 100),
    solo('asg-bst', 'stu-kabir', 98),
    solo('asg-graphs', 'stu-diya', 20),
    solo('asg-landing', 'stu-aarav', 52),
    solo('asg-landing', 'stu-kabir', 40),
    solo('asg-landing', 'stu-isha', 30),
    solo('asg-landing', 'stu-rohan', 27),
    solo('asg-todo', 'stu-aarav', 18),
    solo('asg-todo', 'stu-isha', 4),
    solo('asg-interviews', 'stu-diya', 30),
    solo('asg-interviews', 'stu-isha', 12),
    {
      assignmentId: 'asg-portfolio',
      subjectType: 'group',
      subjectId: 'grp-pixel',
      acknowledgedBy: 'stu-aarav',
      acknowledgedAt: at(-3 * HOUR),
    },
  ];

  return { version: 2, users, courses, assignments, groups, acknowledgements };
}
