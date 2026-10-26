'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Recommendations() {
  const [data, setData] = useState<any>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');
    fetch(`${API}/api/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, top_k: 5 }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        return response.json();
      })
      .then(setData)
      .catch(() =>
        setError(
          `Cannot reach the DIGNITY API at ${API}. Start the FastAPI backend, then refresh this page.`
        )
      );
  }, []);

  return (
    <main>
      <h1>Scheme suggestions</h1>
      <p className="lead">
        Based on your profile and query, ranked by criteria match and semantic relevance.
      </p>

      <div className="banner">
        <b>DIGNITY disclaimer:</b> Suggestions only — not confirmed eligibility. You may be eligible based
        on the information provided. Always confirm conditions and procedures on the official government
        portal before acting.
      </div>

      {error && (
        <div className="card">
          <h2>Backend not connected</h2>
          <p>{error}</p>
          <p className="small">
            From the repository root: <code>cd backend</code>, then run{' '}
            <code>uvicorn app.main:app --reload</code>.
          </p>
        </div>
      )}

      {!data && !error && <p>Finding and ranking relevant schemes…</p>}

      {data?.results?.length === 0 && (
        <div className="card">
          <h2>No suggestions found</h2>
          <p>
            No schemes in the catalogue matched your specified state or criteria. You can try adjusting
            your details or exploring Central schemes.
          </p>
          <Link className="button" href="/search">
            ← Try another search
          </Link>
        </div>
      )}

      {data?.results?.map((s: any) => {
        const modeBadge = s.application_mode
          ? s.application_mode === 'both'
            ? 'Online & Offline'
            : s.application_mode[0].toUpperCase() + s.application_mode.slice(1)
          : null;

        return (
          <article className="card" key={s.id}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                Relevance {Math.round(s.relevance_score * 100)}%
              </span>
              {modeBadge && (
                <span className="badge" style={{ background: '#ede9fe', color: '#5b21b6' }}>
                  {modeBadge}
                </span>
              )}
              <span className={`badge ${s.verification_status === 'verified' ? '' : 'due'}`}>
                {s.verification_status === 'verified' ? 'Verified' : 'Verification due'}
              </span>
            </div>

            <h2>{s.scheme_name}</h2>
            <p>{s.description}</p>

            <div style={{ margin: '14px 0' }}>
              <b>Eligibility criteria breakdown:</b>
              <ul style={{ paddingLeft: 20 }}>
                {s.criteria.map((c: any) => (
                  <li key={c.label}>
                    {c.status === 'matched' ? '✅' : '⚠️'} {c.label}:{' '}
                    {c.status === 'matched'
                      ? 'matches information provided'
                      : 'not confirmed / more information needed'}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
              <Link className="button" href={`/schemes/${s.id}`}>
                View &apos;How to Apply&apos; details →
              </Link>
              <a
                className="button secondary"
                target="_blank"
                rel="noopener noreferrer"
                href={s.official_url}
              >
                Official info page ↗
              </a>
            </div>
          </article>
        );
      })}
    </main>
  );
}
