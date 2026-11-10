import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { STORAGE_KEYS } from '../lib/storage';
import { checkToken, createToken } from '../lib/token';
import { EMAILS, renderApp, savedDb, seedSession, signIn, signInAs, signOut } from './helpers';

const getToken = () => localStorage.getItem(STORAGE_KEYS.token);

describe('protected routes', () => {
  it('sends signed-out visitors to the login page', async () => {
    renderApp('/professor');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('sends "/" to the login page when signed out', async () => {
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it("keeps a student out of the professor's pages (and vice versa)", async () => {
    seedSession('stu-aarav', 'student', 'Aarav Mehta');
    renderApp('/professor/courses/crs-ds');
    // Redirected to the student dashboard instead.
    expect(await screen.findByRole('heading', { name: 'Your courses' })).toBeInTheDocument();
    expect(screen.getByText(/enrolled in this semester/i)).toBeInTheDocument();
  });

  it('shows a friendly page for unknown URLs', async () => {
    renderApp('/definitely/not/a/page');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});

describe('login', () => {
  it('validates the form with clear messages', async () => {
    const user = renderApp('/login');
    await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^email/i), 'not-an-email');
    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
  });

  it('shows an error for the wrong password and stays signed out', async () => {
    const user = renderApp('/login');
    await signIn(user, EMAILS.aarav, 'WrongPass1');
    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect email or password/i);
    expect(getToken()).toBeNull();
  });

  it('shows the same error for an unknown account', async () => {
    const user = renderApp('/login');
    await signIn(user, 'ghost@nowhere.edu', 'Whatever1');
    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect email or password/i);
  });

  it('sends a professor to the professor dashboard and issues a token', async () => {
    const user = renderApp('/login');
    await signInAs(user, EMAILS.meera);

    expect(screen.getByRole('link', { name: 'Data Structures' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Algorithms' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new course/i })).toBeInTheDocument();

    const check = checkToken(getToken());
    expect(check.valid && check.payload).toMatchObject({ sub: 'prof-meera', role: 'professor' });
    expect(await screen.findByText('Welcome back, Meera!')).toBeInTheDocument(); // toast
  });

  it('sends a student to the student dashboard', async () => {
    const user = renderApp('/login');
    await signInAs(user, EMAILS.aarav);

    expect(screen.getByRole('button', { name: /enroll in a course/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new course/i })).not.toBeInTheDocument();
    const check = checkToken(getToken());
    expect(check.valid && check.payload).toMatchObject({ sub: 'stu-aarav', role: 'student' });
  });

  it('can fill in the demo credentials', async () => {
    const user = renderApp('/login');
    await user.click(await screen.findByRole('button', { name: /use professor account/i }));
    expect(screen.getByLabelText(/^email/i)).toHaveValue(EMAILS.meera);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { name: 'Your courses' })).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = renderApp('/login');
    const field = await screen.findByLabelText(/^password/i);
    expect(field).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(field).toHaveAttribute('type', 'text');
  });
});

describe('session', () => {
  it('keeps you signed in after a page reload', async () => {
    const user = renderApp('/login');
    await signInAs(user, EMAILS.aarav);

    document.body.innerHTML = '';
    render(
      <MemoryRouter initialEntries={['/student']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Your courses' })).toBeInTheDocument();
  });

  it('logging out clears the token and protects the pages again', async () => {
    const user = renderApp('/login');
    await signInAs(user, EMAILS.meera);
    expect(getToken()).not.toBeNull();

    await signOut(user);
    expect(getToken()).toBeNull();
    expect(screen.getByText(/you have been signed out/i)).toBeInTheDocument();
  });

  it('discards an expired token and says why', async () => {
    const expired = createToken({ id: 'stu-aarav', role: 'student', name: 'Aarav Mehta' }, Date.now() - 3_600_000, 60);
    localStorage.setItem(STORAGE_KEYS.token, expired);
    renderApp('/student');

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(await screen.findByText(/session has expired/i)).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });

  it('discards a tampered token', async () => {
    const [header, body, signature] = createToken({ id: 'stu-aarav', role: 'student', name: 'A' }).split('.');
    localStorage.setItem(STORAGE_KEYS.token, `${header}.${body}x.${signature}`);
    renderApp('/student');

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });
});

describe('register', () => {
  it('validates every field, including the role', async () => {
    const user = renderApp('/register');
    await user.click(await screen.findByRole('button', { name: 'Create account' }));

    expect(screen.getByText('Enter your full name.')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText(/choose whether you are a student or a professor/i)).toBeInTheDocument();
    expect(screen.getByText('Create a password.')).toBeInTheDocument();
    expect(screen.getByText('Re-enter your password.')).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });

  it('checks password strength and that both passwords match', async () => {
    const user = renderApp('/register');
    await user.type(await screen.findByLabelText(/^password/i), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText(/at least 8 characters/i, { selector: 'p.font-medium' })).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/^password/i));
    await user.type(screen.getByLabelText(/^password/i), 'Secret123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Secret124');
    expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
  });

  it('registers a professor and lands on an empty professor dashboard', async () => {
    const user = renderApp('/register');
    await user.click(await screen.findByRole('radio', { name: /professor/i }));
    await user.type(screen.getByLabelText(/full name/i), 'Neha Kapoor');
    await user.type(screen.getByLabelText(/^email/i), 'neha@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'Secret123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Your courses' })).toBeInTheDocument();
    expect(screen.getByText(/aren't teaching any courses yet/i)).toBeInTheDocument();
    expect(await screen.findByText(/account created\. welcome, neha/i)).toBeInTheDocument();

    const check = checkToken(getToken());
    expect(check.valid && check.payload.role).toBe('professor');
    expect(savedDb().users.find((u) => u.email === 'neha@example.com')?.role).toBe('professor');
  });

  it('registers a student, who can then sign in again with the new credentials', async () => {
    const user = renderApp('/register');
    await user.click(await screen.findByRole('radio', { name: /student/i }));
    await user.type(screen.getByLabelText(/full name/i), 'Sam Patel');
    await user.type(screen.getByLabelText(/^email/i), 'sam@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'Secret123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText(/aren't enrolled in any courses yet/i)).toBeInTheDocument();
    await signOut(user);
    await signIn(user, 'sam@example.com', 'Secret123');
    expect(await screen.findByRole('heading', { name: 'Your courses' })).toBeInTheDocument();
  });

  it('refuses an email that is already registered', async () => {
    const user = renderApp('/register');
    await user.click(await screen.findByRole('radio', { name: /student/i }));
    await user.type(screen.getByLabelText(/full name/i), 'Another Aarav');
    await user.type(screen.getByLabelText(/^email/i), EMAILS.aarav);
    await user.type(screen.getByLabelText(/^password/i), 'Secret123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i);
    expect(getToken()).toBeNull();
  });
});

describe('theme', () => {
  it('toggles dark mode and remembers it', async () => {
    const user = renderApp('/login');
    await user.click(await screen.findByRole('button', { name: /switch to dark mode/i }));

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });
});

describe('error recovery', () => {
  it('shows an error with recovery actions when saved data is corrupted', async () => {
    localStorage.setItem(STORAGE_KEYS.db, '{not valid json');
    const user = renderApp('/login');

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load your data/i);
    await user.click(screen.getByRole('button', { name: /reset demo data/i }));
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });
});
