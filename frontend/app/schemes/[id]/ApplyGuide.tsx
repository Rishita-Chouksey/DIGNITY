'use client';

import { useState } from 'react';

type DocumentItem = {
  name: string;
  where_to_get?: string | null;
  note?: string | null;
};

export default function ApplyGuide({ scheme }: { scheme: any }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const documents: DocumentItem[] = Array.isArray(scheme.required_documents)
    ? scheme.required_documents
    : [];
  const steps = Array.isArray(scheme.application_steps)
    ? [...scheme.application_steps].sort((a: any, b: any) => a.step - b.step)
    : [];

  const hasProcedure = Boolean(
    scheme.apply_url || scheme.procedure_source_url || steps.length > 0
  );

  const modeBadge = scheme.application_mode
    ? scheme.application_mode === 'both'
      ? 'Online & Offline'
      : scheme.application_mode[0].toUpperCase() + scheme.application_mode.slice(1)
    : null;

  const verifiedDate = scheme.last_verified
    ? new Date(scheme.last_verified).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'not yet verified';

  return (
    <section className="card apply-guide">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GUIDANCE ONLY — NO LOGINS / NO ID STORAGE</p>
          <h2>How to apply</h2>
        </div>
        {modeBadge && <span className="badge">{modeBadge}</span>}
      </div>

      {!hasProcedure ? (
        <div className="alert">
          <b>Procedure not yet verified</b>
          <p>
            Please follow the official page before applying. DIGNITY does not submit applications or
            store personal ID documents.
          </p>
          <a
            className="button"
            target="_blank"
            rel="noopener noreferrer"
            href={scheme.official_url}
          >
            Open official scheme page
          </a>
        </div>
      ) : (
        <>
          {steps.length > 0 ? (
            <ol className="steps">
              {steps.map((step: any) => (
                <li key={step.step}>
                  <b>{step.title}</b>
                  <p>{step.detail}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="small">Procedure not yet verified — please follow the official page.</p>
          )}

          {scheme.offline_office && (
            <p style={{ marginTop: 12 }}>
              <b>Where to visit:</b> {scheme.offline_office}
            </p>
          )}

          {scheme.helpline && (
            <p>
              <b>Helpline:</b>{' '}
              <a href={`tel:${scheme.helpline.replace(/\s/g, '')}`}>{scheme.helpline}</a>
            </p>
          )}

          {scheme.apply_url && (
            <div style={{ margin: '18px 0' }}>
              <a
                className="button gold"
                target="_blank"
                rel="noopener noreferrer"
                href={scheme.apply_url}
                style={{ display: 'inline-block', fontSize: '1rem', padding: '12px 20px' }}
              >
                ↗ Open official application page
              </a>
            </div>
          )}
        </>
      )}

      <h3 style={{ marginTop: 24 }}>Documents checklist</h3>
      <p className="small" style={{ color: 'var(--muted)', marginTop: -6 }}>
        Interactive browser-only checklist. No account required; nothing is saved to servers.
      </p>

      {documents.length > 0 ? (
        <ul className="checklist">
          {documents.map((doc, i) => (
            <li key={`${doc.name}-${i}`}>
              <label>
                <input
                  id={`doc-${i}`}
                  name={`doc-${i}`}
                  type="checkbox"
                  checked={Boolean(checked[String(i)])}
                  onChange={(e) => setChecked({ ...checked, [String(i)]: e.target.checked })}
                />
                <span>
                  <b style={{ textDecoration: checked[String(i)] ? 'line-through' : 'none' }}>
                    {doc.name}
                  </b>
                  {doc.where_to_get && (
                    <small>Where to get it: {doc.where_to_get}</small>
                  )}
                  {doc.note && <small>Note: {doc.note}</small>}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="small">Document details not yet verified — please follow the official page.</p>
      )}

      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          className="secondary no-print"
          onClick={() => window.print()}
          style={{ cursor: 'pointer' }}
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      <footer className="source-footer">
        Steps summarised from the official source on {verifiedDate}. Portals change — confirm on the official page before applying.
      </footer>
    </section>
  );
}
