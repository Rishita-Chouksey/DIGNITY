'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const [p, setP] = useState<any>({ state: 'Madhya Pradesh', need_text: '' });
  const r = useRouter();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        setP((prev: any) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  const go = () => {
    sessionStorage.setItem('profile', JSON.stringify(p));
    r.push('/recommendations');
  };

  const fields = [
    { key: 'age', label: 'Age', type: 'number', placeholder: 'e.g. 24' },
    { key: 'state', label: 'State', type: 'text', placeholder: 'Madhya Pradesh, Delhi, etc.' },
    {
      key: 'occupation',
      label: 'Occupation',
      type: 'text',
      placeholder: 'student, farmer, worker, unemployed...',
    },
    {
      key: 'education_level',
      label: 'Education level',
      type: 'text',
      placeholder: 'post_matric, class_9_10, school...',
    },
    {
      key: 'annual_income',
      label: 'Annual household income (₹)',
      type: 'number',
      placeholder: 'e.g. 180000',
    },
    {
      key: 'special_category',
      label: 'Special category (if applicable)',
      type: 'text',
      placeholder: 'SC, ST, OBC, disability, EWS, or General',
    },
  ];

  return (
    <main>
      <h1>Tell us about yourself</h1>
      <div className="banner">
        <b>Privacy boundary:</b> Only share general demographic information. Do not enter Aadhaar, PAN,
        or any personal government identity numbers.
      </div>

      <div className="card">
        {fields.map(({ key, label, type, placeholder }) => (
          <label key={key} htmlFor={key}>
            {label}
            <input
              id={key}
              name={key}
              type={type}
              placeholder={placeholder}
              value={p[key] ?? ''}
              onChange={(e) =>
                setP({
                  ...p,
                  [key]:
                    type === 'number'
                      ? e.target.value === ''
                        ? null
                        : Number(e.target.value)
                      : e.target.value,
                })
              }
            />
          </label>
        ))}

        <label htmlFor="gender">
          Gender (optional)
          <select
            id="gender"
            name="gender"
            value={p.gender || ''}
            onChange={(e) => setP({ ...p, gender: e.target.value || null })}
          >
            <option value="">Select gender (optional)</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </label>

        <div style={{ marginTop: 14 }}>
          <button type="button" onClick={go}>
            See scheme suggestions
          </button>
        </div>
      </div>
    </main>
  );
}
