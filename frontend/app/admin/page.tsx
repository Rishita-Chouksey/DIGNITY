'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Step {
  step: number;
  title: string;
  detail: string;
}

interface DocItem {
  name: string;
  where_to_get?: string | null;
  note?: string | null;
}

interface SchemeForm {
  scheme_name: string;
  description: string;
  category: string;
  state: string;
  occupation: string;
  education_level: string;
  income_limit: string | number;
  gender: string;
  special_category: string;
  min_age: string | number;
  max_age: string | number;
  benefits: string;
  official_url: string;
  apply_url: string;
  procedure_source_url: string;
  application_mode: 'online' | 'offline' | 'both' | '';
  helpline: string;
  offline_office: string;
  application_steps: Step[];
  required_documents: DocItem[];
  verification_status: 'verified' | 'verification_due';
}

const emptyForm: SchemeForm = {
  scheme_name: '',
  description: '',
  category: '',
  state: 'Central',
  occupation: '',
  education_level: '',
  income_limit: '',
  gender: '',
  special_category: '',
  min_age: '',
  max_age: '',
  benefits: '',
  official_url: 'https://www.myscheme.gov.in/',
  apply_url: '',
  procedure_source_url: '',
  application_mode: '',
  helpline: '',
  offline_office: '',
  application_steps: [],
  required_documents: [],
  verification_status: 'verification_due',
};

export default function Admin() {
  const [token, setToken] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<SchemeForm>(emptyForm);
  const [raw, setRaw] = useState(JSON.stringify(emptyForm, null, 2));
  const [editId, setEditId] = useState<string | null>(null);
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const headers = () => ({
    'Content-Type': 'application/json',
    'X-Admin-Token': token,
  });

  async function load() {
    try {
      setError('');
      const r = await fetch(`${API}/api/schemes`);
      if (!r.ok) throw new Error();
      setItems(await r.json());
    } catch {
      setError(`Cannot reach the DIGNITY API at ${API}. Start the backend before managing schemes.`);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function populateForm(scheme: any) {
    const next: SchemeForm = {
      scheme_name: scheme.scheme_name || '',
      description: scheme.description || '',
      category: scheme.category || '',
      state: scheme.state || 'Central',
      occupation: scheme.occupation || '',
      education_level: scheme.education_level || '',
      income_limit: scheme.income_limit ?? '',
      gender: scheme.gender || '',
      special_category: scheme.special_category || '',
      min_age: scheme.min_age ?? '',
      max_age: scheme.max_age ?? '',
      benefits: scheme.benefits || '',
      official_url: scheme.official_url || '',
      apply_url: scheme.apply_url || '',
      procedure_source_url: scheme.procedure_source_url || '',
      application_mode: scheme.application_mode || '',
      helpline: scheme.helpline || '',
      offline_office: scheme.offline_office || '',
      application_steps: Array.isArray(scheme.application_steps)
        ? [...scheme.application_steps].sort((a, b) => a.step - b.step)
        : [],
      required_documents: Array.isArray(scheme.required_documents)
        ? scheme.required_documents.map((d: any) =>
            typeof d === 'string' ? { name: d, where_to_get: null, note: null } : d
          )
        : [],
      verification_status: scheme.verification_status || 'verification_due',
    };
    setForm(next);
    setRaw(JSON.stringify(next, null, 2));
    setEditId(scheme.id);
  }

  function resetForm() {
    setForm(emptyForm);
    setRaw(JSON.stringify(emptyForm, null, 2));
    setEditId(null);
  }

  // Steps Editor handlers
  function addStep() {
    const nextStepNum = form.application_steps.length + 1;
    const nextSteps = [...form.application_steps, { step: nextStepNum, title: '', detail: '' }];
    updateForm({ application_steps: nextSteps });
  }

  function removeStep(index: number) {
    const filtered = form.application_steps.filter((_, i) => i !== index);
    const reindexed = filtered.map((st, i) => ({ ...st, step: i + 1 }));
    updateForm({ application_steps: reindexed });
  }

  function moveStep(index: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= form.application_steps.length) return;
    const copy = [...form.application_steps];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    const reindexed = copy.map((st, i) => ({ ...st, step: i + 1 }));
    updateForm({ application_steps: reindexed });
  }

  function updateStep(index: number, field: 'title' | 'detail', val: string) {
    const copy = [...form.application_steps];
    copy[index] = { ...copy[index], [field]: val };
    updateForm({ application_steps: copy });
  }

  // Documents Editor handlers
  function addDoc() {
    const nextDocs = [...form.required_documents, { name: '', where_to_get: '', note: '' }];
    updateForm({ required_documents: nextDocs });
  }

  function removeDoc(index: number) {
    const filtered = form.required_documents.filter((_, i) => i !== index);
    updateForm({ required_documents: filtered });
  }

  function updateDoc(index: number, field: keyof DocItem, val: string) {
    const copy = [...form.required_documents];
    copy[index] = { ...copy[index], [field]: val || null };
    updateForm({ required_documents: copy });
  }

  function updateForm(patch: Partial<SchemeForm>) {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      setRaw(JSON.stringify(next, null, 2));
      return next;
    });
  }

  async function save() {
    setError('');
    setNotice('');
    try {
      let payload: any;
      if (mode === 'json') {
        payload = JSON.parse(raw);
      } else {
        payload = {
          ...form,
          min_age: form.min_age !== '' ? Number(form.min_age) : null,
          max_age: form.max_age !== '' ? Number(form.max_age) : null,
          income_limit: form.income_limit !== '' ? Number(form.income_limit) : null,
          category: form.category || null,
          occupation: form.occupation || null,
          education_level: form.education_level || null,
          gender: form.gender || null,
          special_category: form.special_category || null,
          benefits: form.benefits || null,
          apply_url: form.apply_url || null,
          procedure_source_url: form.procedure_source_url || null,
          application_mode: form.application_mode || null,
          helpline: form.helpline || null,
          offline_office: form.offline_office || null,
          required_documents: form.required_documents.filter((d) => d.name && d.name.trim()),
          application_steps: form.application_steps.map((s, i) => ({
            step: i + 1,
            title: s.title || `Step ${i + 1}`,
            detail: s.detail || '',
          })),
        };
      }

      // Truthfulness / Verification gate check
      if (payload.verification_status === 'verified') {
        if (!payload.apply_url || !payload.procedure_source_url) {
          setError('Cannot mark as verified: verified schemes require both apply_url and procedure_source_url from official sources.');
          return;
        }
      }

      const url = `${API}/api/admin/schemes${editId ? `/${editId}` : ''}`;
      const r = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const text = await r.text();
        throw new Error(text);
      }

      setNotice(editId ? 'Scheme updated successfully.' : 'Scheme created successfully.');
      resetForm();
      await load();
    } catch (e: any) {
      setError(
        e instanceof SyntaxError
          ? 'The scheme JSON is not valid.'
          : `Could not save: ${e instanceof Error ? e.message : 'check the API and admin token.'}`
      );
    }
  }

  async function verify(scheme: any) {
    setError('');
    setNotice('');
    if (!scheme.apply_url || !scheme.procedure_source_url) {
      setError(`Cannot verify "${scheme.scheme_name}": add both apply_url and procedure_source_url from official sources first.`);
      return;
    }
    try {
      const r = await fetch(`${API}/api/admin/schemes/${scheme.id}/verify`, {
        method: 'POST',
        headers: headers(),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(txt);
      }
      setNotice(`Verification timestamp updated for "${scheme.scheme_name}".`);
      await load();
    } catch (e: any) {
      setError(`Could not verify: ${e.message || 'check API connection and admin token.'}`);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this scheme?')) return;
    setError('');
    setNotice('');
    try {
      const r = await fetch(`${API}/api/admin/schemes/${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (!r.ok) throw new Error();
      setNotice('Scheme deleted.');
      if (editId === id) resetForm();
      await load();
    } catch {
      setError('Could not delete. Check the API connection and admin token.');
    }
  }

  const missingLinksForVerification = !form.apply_url || !form.procedure_source_url;

  return (
    <main>
      <p className="eyebrow">ADMINISTRATION</p>
      <h1>Scheme catalogue</h1>
      <p className="lead">Create, review, and verify the local discovery catalogue.</p>

      <div className="banner">
        <b>Protected area.</b> Enter the local <code>ADMIN_TOKEN</code>. Verification stamps the current
        time; it does not independently validate facts. Verified status strictly requires both an official{' '}
        <code>apply_url</code> and <code>procedure_source_url</code>.
      </div>

      {error && (
        <div className="alert error">
          <b>Action notice</b>
          <br />
          {error}
        </div>
      )}
      {notice && <div className="alert success">{notice}</div>}

      <section className="admin-grid">
        <div className="card admin-form">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2>{editId ? 'Edit scheme' : 'Add scheme'}</h2>
            <button
              type="button"
              className="text-button"
              onClick={() => setMode(mode === 'form' ? 'json' : 'form')}
            >
              {mode === 'form' ? 'Switch to JSON' : 'Switch to Form'}
            </button>
          </div>

          <label>
            Admin token
            <input
              type="password"
              placeholder="Enter ADMIN_TOKEN"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>

          {mode === 'json' ? (
            <label>
              Scheme data (JSON)
              <textarea
                rows={18}
                value={raw}
                onChange={(e) => {
                  setRaw(e.target.value);
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setForm((prev) => ({ ...prev, ...parsed }));
                  } catch {}
                }}
              />
            </label>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label>
                Scheme name *
                <input
                  type="text"
                  value={form.scheme_name}
                  onChange={(e) => updateForm({ scheme_name: e.target.value })}
                  placeholder="e.g. Mukhyamantri Medhavi Vidyarthi Yojana"
                />
              </label>

              <label>
                Description *
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  placeholder="Official summary of benefits and target group"
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label>
                  Category
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => updateForm({ category: e.target.value })}
                    placeholder="Scholarships, Agriculture..."
                  />
                </label>
                <label>
                  State
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => updateForm({ state: e.target.value })}
                    placeholder="Central or State name"
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label>
                  Occupation
                  <input
                    type="text"
                    value={form.occupation}
                    onChange={(e) => updateForm({ occupation: e.target.value })}
                    placeholder="student, farmer, worker..."
                  />
                </label>
                <label>
                  Education level
                  <input
                    type="text"
                    value={form.education_level}
                    onChange={(e) => updateForm({ education_level: e.target.value })}
                    placeholder="post_matric, class_9_10..."
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <label>
                  Income limit (₹)
                  <input
                    type="number"
                    value={form.income_limit}
                    onChange={(e) => updateForm({ income_limit: e.target.value })}
                    placeholder="e.g. 600000"
                  />
                </label>
                <label>
                  Min age
                  <input
                    type="number"
                    value={form.min_age}
                    onChange={(e) => updateForm({ min_age: e.target.value })}
                    placeholder="18"
                  />
                </label>
                <label>
                  Max age
                  <input
                    type="number"
                    value={form.max_age}
                    onChange={(e) => updateForm({ max_age: e.target.value })}
                    placeholder="59"
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label>
                  Special category
                  <input
                    type="text"
                    value={form.special_category}
                    onChange={(e) => updateForm({ special_category: e.target.value })}
                    placeholder="SC, ST, OBC, disability..."
                  />
                </label>
                <label>
                  Gender
                  <select
                    value={form.gender}
                    onChange={(e) => updateForm({ gender: e.target.value })}
                  >
                    <option value="">Any / All</option>
                    <option value="female">Female only</option>
                    <option value="male">Male only</option>
                  </select>
                </label>
              </div>

              <label>
                Benefits
                <input
                  type="text"
                  value={form.benefits}
                  onChange={(e) => updateForm({ benefits: e.target.value })}
                  placeholder="Key entitlement or monthly assistance"
                />
              </label>

              {/* Official Procedure URLs */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px', color: 'var(--navy)' }}>Official Links & Procedure</h4>

                <label>
                  Official Scheme Info URL *
                  <input
                    type="url"
                    value={form.official_url}
                    onChange={(e) => updateForm({ official_url: e.target.value })}
                    placeholder="https://www.myscheme.gov.in/schemes/..."
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label>
                    Direct Apply URL
                    <input
                      type="url"
                      value={form.apply_url}
                      onChange={(e) => updateForm({ apply_url: e.target.value })}
                      placeholder="https://portal.gov.in/apply"
                    />
                  </label>
                  <label>
                    Procedure Source URL
                    <input
                      type="url"
                      value={form.procedure_source_url}
                      onChange={(e) => updateForm({ procedure_source_url: e.target.value })}
                      placeholder="https://portal.gov.in/how-to-apply"
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label>
                    Application mode
                    <select
                      value={form.application_mode}
                      onChange={(e) => updateForm({ application_mode: e.target.value as any })}
                    >
                      <option value="">Not specified</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="both">Both</option>
                    </select>
                  </label>
                  <label>
                    Helpline
                    <input
                      type="text"
                      value={form.helpline}
                      onChange={(e) => updateForm({ helpline: e.target.value })}
                      placeholder="e.g. 1800-xxx-xxxx"
                    />
                  </label>
                </div>

                <label>
                  Offline office (where to visit)
                  <input
                    type="text"
                    value={form.offline_office}
                    onChange={(e) => updateForm({ offline_office: e.target.value })}
                    placeholder="e.g. District Social Welfare Office or Block Development Office"
                  />
                </label>
              </div>

              {/* Steps Editor */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, color: 'var(--navy)' }}>
                    Application Steps ({form.application_steps.length})
                  </h4>
                  <button type="button" className="text-button" onClick={addStep}>
                    + Add Step
                  </button>
                </div>
                {form.application_steps.length === 0 ? (
                  <p className="small" style={{ margin: 0 }}>
                    No steps added yet. Add verified steps directly from the official portal.
                  </p>
                ) : (
                  form.application_steps.map((st, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 10,
                        background: '#fff',
                        borderRadius: 6,
                        border: '1px solid #dce5ed',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <b>Step {idx + 1}</b>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            className="text-button"
                            disabled={idx === 0}
                            onClick={() => moveStep(idx, 'up')}
                            title="Move step up"
                          >
                            ↑ Up
                          </button>
                          <button
                            type="button"
                            className="text-button"
                            disabled={idx === form.application_steps.length - 1}
                            onClick={() => moveStep(idx, 'down')}
                            title="Move step down"
                          >
                            ↓ Down
                          </button>
                          <button
                            type="button"
                            className="text-button danger"
                            onClick={() => removeStep(idx)}
                            title="Remove step"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Step title (e.g. Register on Portal)"
                        value={st.title}
                        onChange={(e) => updateStep(idx, 'title', e.target.value)}
                        style={{ margin: '4px 0 6px', padding: 7 }}
                      />
                      <textarea
                        rows={2}
                        placeholder="Detail instruction as stated on official page"
                        value={st.detail}
                        onChange={(e) => updateStep(idx, 'detail', e.target.value)}
                        style={{ margin: 0, padding: 7 }}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Documents Checklist Editor */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, color: 'var(--navy)' }}>
                    Required Documents ({form.required_documents.length})
                  </h4>
                  <button type="button" className="text-button" onClick={addDoc}>
                    + Add Document
                  </button>
                </div>
                {form.required_documents.length === 0 ? (
                  <p className="small" style={{ margin: 0 }}>
                    No documents listed.
                  </p>
                ) : (
                  form.required_documents.map((doc, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 10,
                        background: '#fff',
                        borderRadius: 6,
                        border: '1px solid #dce5ed',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Document #{idx + 1}</span>
                        <button
                          type="button"
                          className="text-button danger"
                          onClick={() => removeDoc(idx)}
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Document name (e.g. Caste certificate) *"
                        value={doc.name}
                        onChange={(e) => updateDoc(idx, 'name', e.target.value)}
                        style={{ margin: '4px 0 6px', padding: 7 }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <input
                          type="text"
                          placeholder="Where to get it (optional)"
                          value={doc.where_to_get || ''}
                          onChange={(e) => updateDoc(idx, 'where_to_get', e.target.value)}
                          style={{ margin: 0, padding: 7 }}
                        />
                        <input
                          type="text"
                          placeholder="Note or condition (optional)"
                          value={doc.note || ''}
                          onChange={(e) => updateDoc(idx, 'note', e.target.value)}
                          style={{ margin: 0, padding: 7 }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Verification Gate Control */}
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: missingLinksForVerification ? '1px dashed var(--gold)' : '1px solid #2e9364',
                  background: missingLinksForVerification ? '#fffcf0' : '#f4fcf7',
                }}
              >
                <label style={{ display: 'block', margin: 0, fontWeight: 600 }}>
                  Verification status
                  <select
                    value={form.verification_status}
                    onChange={(e) => updateForm({ verification_status: e.target.value as any })}
                    style={{ margin: '6px 0 0' }}
                  >
                    <option value="verification_due">verification_due (unverified draft)</option>
                    <option
                      value="verified"
                      disabled={missingLinksForVerification}
                    >
                      verified {missingLinksForVerification ? '(BLOCKED: requires apply_url & procedure_source_url)' : ''}
                    </option>
                  </select>
                </label>
                {missingLinksForVerification && (
                  <p className="small" style={{ margin: '6px 0 0', color: '#855e09' }}>
                    ⚠️ Setting status to &apos;verified&apos; is blocked until both <b>Apply URL</b> and <b>Procedure Source URL</b> are filled from official sources.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="actions" style={{ marginTop: 16 }}>
            <button type="button" onClick={() => void save()}>
              {editId ? 'Save changes' : 'Create scheme'}
            </button>
            {editId && (
              <button type="button" className="secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Scheme Catalogue List */}
        <div>
          <h2>
            Catalogue <span className="count">{items.length}</span>
          </h2>
          {items.length === 0 && !error && <div className="card">No schemes loaded yet.</div>}
          {items.map((s) => {
            const hasVerifyLinks = Boolean(s.apply_url && s.procedure_source_url);
            return (
              <article className="card compact" key={s.id}>
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`badge ${s.verification_status === 'verified' ? '' : 'due'}`}>
                      {s.verification_status === 'verified' ? 'Verified' : 'Verification due'}
                    </span>
                    {s.application_mode && (
                      <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                        {s.application_mode[0].toUpperCase() + s.application_mode.slice(1)}
                      </span>
                    )}
                  </div>
                  <h3>{s.scheme_name}</h3>
                  <p className="small">
                    {s.state} · {s.category || 'Uncategorised'}
                    {s.application_steps?.length > 0 ? ` · ${s.application_steps.length} steps` : ''}
                  </p>
                </div>
                <div className="row-actions">
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      populateForm(s);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    disabled={s.verification_status === 'verified'}
                    title={
                      !hasVerifyLinks
                        ? 'Verification blocked: requires both apply_url and procedure_source_url'
                        : 'Stamp verification time'
                    }
                    onClick={() => void verify(s)}
                  >
                    {s.verification_status === 'verified' ? 'Verified' : 'Verify'}
                  </button>
                  <button
                    type="button"
                    className="danger text-button"
                    onClick={() => void remove(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
