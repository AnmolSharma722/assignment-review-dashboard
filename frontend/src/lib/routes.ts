import type { Role } from '../types';

/** Central place for URLs so links and redirects never drift apart. */
export const paths = {
  login: '/login',
  register: '/register',
  home: (role: Role) => (role === 'professor' ? '/professor' : '/student'),
  course: (role: Role, courseId: string) => `${paths.home(role)}/courses/${courseId}`,
};
