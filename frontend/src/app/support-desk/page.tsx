'use client';

import { FormEvent, useState } from 'react';
import apiClient from '@/lib/api-client';

type AccountStatus = {
  found: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  lastLogin?: string | null;
};

export default function SupportDeskPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<AccountStatus | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await apiClient.get('/support/accounts', { params: { email } });
      setResult(response.data?.data || response.data);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : '';
      setError(message || 'Unable to look up that account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2D82D8]">Career Track</p>
      <h1 className="mt-2 text-3xl font-bold text-[#1e2e3f]">Support desk</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Look up a candidate account to troubleshoot sign-in and status. This view does not change candidate data.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <label className="block text-sm font-medium text-[#1e2e3f]" htmlFor="support-email">
          Candidate email
        </label>
        <input
          id="support-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="name@email.com"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#2D82D8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Looking up…' : 'Look up account'}
        </button>
      </form>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {result ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          {result.found ? (
            <dl className="space-y-2">
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="font-medium">{[result.firstName, result.lastName].filter(Boolean).join(' ') || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium">{result.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Role</dt>
                <dd className="font-medium capitalize">{result.role}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium">{result.isActive ? 'Active' : 'Inactive'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email verified</dt>
                <dd className="font-medium">{result.isEmailVerified ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Last login</dt>
                <dd className="font-medium">{result.lastLogin ? new Date(result.lastLogin).toLocaleString() : 'None recorded'}</dd>
              </div>
            </dl>
          ) : (
            <p>No Career Track account uses that email.</p>
          )}
        </div>
      ) : null}
    </main>
  );
}
