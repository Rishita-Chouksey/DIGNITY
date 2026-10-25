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
      .catch(() => setError(`Cannot reach the DIGNITY API at ${API}. Start the FastAPI backend, then refresh this page.`));
  }, []);

  return <main>
    <h1>Recommendations</h1>
    <div className="banner">Suggestions, not confirmed eligibility. You may be eligible based on the information provided; confirm on the official source.</div>
    {error && <div className="card"><h2>Backend not connected</h2><p>{error}</p><p className="small">From the repository root: <code>cd backend</code>, then run <code>uvicorn app.main:app --reload</code>.</p></div>}
    {!data && !error && <p>Finding relevant schemes…</p>}
    {data?.results?.length === 0 && <div className="card"><h2>No suggestions found yet</h2><p>The API is connected, but the local scheme catalogue is empty or no seeded scheme matches this profile.</p><p className="small">Run <code>python -m seed.load_seed</code> from the active backend virtual environment, then try again.</p></div>}
    {data?.results?.map((s: any) => <article className="card" key={s.id}>
      <span className="badge">Relevance {Math.round(s.relevance_score * 100)}%</span> <span className="badge due">{s.verification_status === 'verified' ? 'Verified' : 'Verification due'}</span>
      <h2>{s.scheme_name}</h2><p>{s.description}</p>
      <ul>{s.criteria.map((c: any) => <li key={c.label}>{c.status === 'matched' ? '✅' : '⚠️'} {c.label}: {c.status === 'matched' ? 'matches information provided' : 'not confirmed / more information needed'}</li>)}</ul>
      <Link className="button" href={`/schemes/${s.id}`}>View details</Link>
    </article>)}
  </main>;
}
