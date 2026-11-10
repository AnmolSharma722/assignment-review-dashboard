import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { DEMO_PASSWORD } from '../data/seed';
import { STORAGE_KEYS } from '../lib/storage';
import { createToken } from '../lib/token';
import type { Database, Role } from '../types';

export const EMAILS = {
  meera: 'meera.iyer@university.edu',
  rahul: 'rahul.verma@university.edu',
  aarav: 'aarav.mehta@student.edu',
  diya: 'diya.sharma@student.edu',
  kabir: 'kabir.singh@student.edu',
  isha: 'isha.nair@student.edu',
  rohan: 'rohan.gupta@student.edu',
} as const;

/** Renders the whole app (all providers + routes) at a URL. */
export function renderApp(route = '/'): UserEvent {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
  return user;
}

/** Pretends the user already signed in earlier (valid token in localStorage). */
export function seedSession(id: string, role: Role, name: string) {
  localStorage.setItem(STORAGE_KEYS.token, createToken({ id, role, name }));
}

/** Fills in the login form and submits it. */
export async function signIn(user: UserEvent, email: string, password: string = DEMO_PASSWORD) {
  await user.type(await screen.findByLabelText(/^email/i), email);
  await user.type(screen.getByLabelText(/^password/i), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

export async function signOut(user: UserEvent) {
  await user.click(await screen.findByRole('button', { name: 'Sign out' }));
  await screen.findByRole('heading', { name: 'Sign in' });
}

/** Signs in and waits for the dashboard to appear. */
export async function signInAs(user: UserEvent, email: string) {
  await signIn(user, email);
  await screen.findByRole('heading', { name: 'Your courses' });
}

export const savedDb = (): Database => JSON.parse(localStorage.getItem(STORAGE_KEYS.db) as string);
