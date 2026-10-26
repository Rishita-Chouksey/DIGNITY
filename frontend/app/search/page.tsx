'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Search() {
  const [text, setText] = useState(
    'I am 19 years old, a college student in Madhya Pradesh with annual income 1.8 lakh.'
  );
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const r = useRouter();

  async function go() {
    try {
      setError('');
      setLoading(true);
      const response = await fetch(`${API}/api/query/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error();
      const x = await response.json();
      setMissing(x.missing_fields || []);
      sessionStorage.setItem('profile', JSON.stringify(x.profile));
      if (!x.missing_fields?.length) {
        r.push('/recommendations');
      }
    } catch {
      setError('Cannot reach the DIGNITY API. Start the backend at http://localhost:8000 and try again.');
    } finally {
      setLoading(false);
    }
  }

  function viewDirectly() {
    r.push('/recommendations');
  }

  return (
    <main>
      <h1>Describe your situation</h1>
      <p className="lead">
        Tell us about your background, occupation, state, or the kind of assistance you are looking for.
      </p>

      <div className="card">
        <label htmlFor="need-text" className="small" style={{ fontWeight: 600 }}>
          Describe your age, state, study/work status, and household income in plain words:
        </label>
        <textarea
          id="need-text"
          name="need_text"
          autoComplete="off"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. I am 35 years old farmer in Madhya Pradesh looking for crop insurance and enterprise loan."
        />

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button type="button" onClick={go} disabled={loading}>
            {loading ? 'Analyzing details…' : 'Find schemes'}
          </button>
        </div>
      </div>

      {error && <div className="banner alert error">{error}</div>}

      {missing.length > 0 && (
        <div className="banner">
          <b>Information tip:</b> For higher accuracy, you may also specify: {missing.join(', ')}.
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button type="button" onClick={() => r.push('/profile')}>
              Complete profile
            </button>
            <button type="button" className="secondary" onClick={viewDirectly}>
              See suggestions anyway →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
