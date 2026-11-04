import type { Assignment, Database, Submission, User } from '../types';
import { addDays, toISODate } from '../lib/dates';

export const SEED_USERS: User[] = [
  { id: 'admin-meera', name: 'Prof. Meera Iyer', email: 'meera.iyer@university.edu', role: 'admin' },
  { id: 'admin-rahul', name: 'Prof. Rahul Verma', email: 'rahul.verma@university.edu', role: 'admin' },
  { id: 'stu-aarav', name: 'Aarav Mehta', email: 'aarav.mehta@student.edu', role: 'student' },
  { id: 'stu-diya', name: 'Diya Sharma', email: 'diya.sharma@student.edu', role: 'student' },
  { id: 'stu-kabir', name: 'Kabir Singh', email: 'kabir.singh@student.edu', role: 'student' },
  { id: 'stu-isha', name: 'Isha Nair', email: 'isha.nair@student.edu', role: 'student' },
  { id: 'stu-rohan', name: 'Rohan Gupta', email: 'rohan.gupta@student.edu', role: 'student' },
];

/**
 * Builds the demo data set. Dates are generated relative to `now` so the demo
 * always has a healthy mix of overdue, due-soon and upcoming work, no matter
 * when the app is first opened.
 *
 * The Drive links are placeholders for demonstration.
 */
export function createSeedData(now: Date = new Date()): Database {
  const due = (offsetDays: number) => toISODate(addDays(now, offsetDays));
  const ago = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
  const drive = (slug: string) => `https://drive.google.com/drive/folders/${slug}`;

  const assignments: Assignment[] = [
    {
      id: 'asg-bst',
      title: 'Binary Trees Problem Set',
      description:
        'Solve the eight problems on BST insertion, deletion and traversals. Combine your solutions into a single PDF and upload it to the shared Drive folder.',
      dueDate: due(-3),
      driveLink: drive('ds-binary-trees-problem-set'),
      createdBy: 'admin-meera',
      assignedTo: 'all',
      createdAt: ago(12),
    },
    {
      id: 'asg-graphs',
      title: 'Graph Algorithms Lab Report',
      description:
        'Implement BFS, DFS and Dijkstra on the provided road-network dataset and write up your complexity analysis (max 4 pages).',
      dueDate: due(2),
      driveLink: drive('ds-graph-algorithms-lab'),
      createdBy: 'admin-meera',
      assignedTo: 'all',
      createdAt: ago(8),
    },
    {
      id: 'asg-hash',
      title: 'Hash Tables Mini Project',
      description:
        'Build a hash table with chaining and open addressing, then benchmark both on the supplied word lists. Include a short README.',
      dueDate: due(9),
      driveLink: drive('ds-hash-tables-mini-project'),
      createdBy: 'admin-meera',
      assignedTo: ['stu-aarav', 'stu-diya', 'stu-kabir'],
      createdAt: ago(5),
    },
    {
      id: 'asg-revision',
      title: 'Midterm Revision Notes',
      description:
        'Submit a two-page summary of the topics you find hardest before the midterm. Handwritten scans are fine.',
      dueDate: due(14),
      driveLink: drive('ds-midterm-revision-notes'),
      createdBy: 'admin-meera',
      assignedTo: 'all',
      createdAt: ago(2),
    },
    {
      id: 'asg-sorting',
      title: 'Sorting Benchmarks',
      description:
        'Extension task: compare quicksort, mergesort and timsort on 10^6 integers and plot the results.',
      dueDate: due(20),
      driveLink: drive('ds-sorting-benchmarks'),
      createdBy: 'admin-meera',
      assignedTo: ['stu-isha', 'stu-rohan'],
      createdAt: ago(1),
    },
    {
      id: 'asg-landing',
      title: 'Responsive Landing Page',
      description:
        'Recreate the provided design as a fully responsive landing page using semantic HTML and CSS only. Upload a zip of your project.',
      dueDate: due(-1),
      driveLink: drive('web-responsive-landing-page'),
      createdBy: 'admin-rahul',
      assignedTo: 'all',
      createdAt: ago(9),
    },
    {
      id: 'asg-todo',
      title: 'React Todo App',
      description:
        'Build a todo app with React hooks that persists to localStorage. Share the repository link in the Drive document.',
      dueDate: due(5),
      driveLink: drive('web-react-todo-app'),
      createdBy: 'admin-rahul',
      assignedTo: 'all',
      createdAt: ago(4),
    },
    {
      id: 'asg-a11y',
      title: 'Accessibility Audit',
      description:
        'Audit a website of your choice against WCAG 2.2 AA, list the issues you found and propose fixes. Add screenshots.',
      dueDate: due(12),
      driveLink: drive('web-accessibility-audit'),
      createdBy: 'admin-rahul',
      assignedTo: ['stu-isha', 'stu-rohan', 'stu-diya'],
      createdAt: ago(3),
    },
  ];

  const sub = (assignmentId: string, studentId: string, daysAgo: number): Submission => ({
    assignmentId,
    studentId,
    submittedAt: ago(daysAgo),
  });

  const submissions: Submission[] = [
    sub('asg-bst', 'stu-aarav', 5),
    sub('asg-bst', 'stu-diya', 4),
    sub('asg-bst', 'stu-kabir', 4),
    sub('asg-graphs', 'stu-diya', 1),
    sub('asg-hash', 'stu-kabir', 1),
    sub('asg-landing', 'stu-aarav', 3),
    sub('asg-landing', 'stu-kabir', 2),
    sub('asg-landing', 'stu-isha', 2),
    sub('asg-landing', 'stu-rohan', 2),
    sub('asg-todo', 'stu-aarav', 1),
    sub('asg-todo', 'stu-isha', 0),
  ];

  return { version: 1, users: SEED_USERS, assignments, submissions };
}
