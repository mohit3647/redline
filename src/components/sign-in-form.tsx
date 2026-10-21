'use client';

import { useActionState } from 'react';
import { sendMagicLink, type SignInState } from '../lib/auth/actions';

const initial: SignInState = { status: 'idle', message: '', email: '' };

export function SignInForm({ linkError }: { linkError: boolean }) {
  const [state, action, pending] = useActionState(sendMagicLink, initial);

  if (state.status === 'sent') {
    return (
      <div role="status">
        <h1 className="auth-title">Check your email.</h1>
        <p className="auth-body">
          We sent a sign-in link to <strong>{state.email}</strong>. Open it on this device. The link works once.
        </p>
      </div>
    );
  }

  const errorText = state.status === 'error' ? state.message : linkError ? 'That link did not work. It may have expired or been used already. Ask for a new one.' : '';

  return (
    <form action={action} noValidate>
      <h1 className="auth-title">Sign in</h1>
      <p className="auth-body">Enter your email and we will send you a link. There is no password.</p>
      <label className="auth-label" htmlFor="email">Email address</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.email}
        className="auth-input"
        aria-invalid={errorText ? true : undefined}
        aria-describedby={errorText ? 'email-error' : undefined}
      />
      {errorText ? <p id="email-error" className="auth-error" role="alert">{errorText}</p> : null}
      <button type="submit" className="auth-button" disabled={pending}>
        {pending ? 'Sending' : 'Email me a link'}
      </button>
    </form>
  );
}
