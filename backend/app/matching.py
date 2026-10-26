"""Deterministic rules; embeddings only break ties/relevance after hard filters."""
import re
from sqlalchemy import text
from .schemas import Profile

def hard_filter(s, p: Profile) -> bool:
    if p.state and s.state not in ('Central', p.state):
        return False
    if p.age is not None:
        if s.min_age is not None and p.age < s.min_age:
            return False
        if s.max_age is not None and p.age > s.max_age:
            return False
    if getattr(s, 'gender', None) and p.gender and s.gender.lower() != p.gender.lower():
        return False
    return True

def criterion(label, wanted, actual, income=False):
    if actual is None: return {'label': label, 'status': 'uncertain'}
    if wanted is None: return {'label': label, 'status': 'uncertain'}
    ok = actual <= wanted if income else actual.lower() == wanted.lower()
    return {'label': label, 'status': 'matched' if ok else 'uncertain'}

def score_scheme(s, p: Profile):
    details = [
        criterion('Occupation', s.occupation, p.occupation),
        criterion('Education level', s.education_level, p.education_level),
        criterion('Income limit', s.income_limit, p.annual_income, True),
        criterion('Special category', s.special_category, p.special_category),
    ]
    if getattr(s, 'gender', None):
        details.append(criterion('Gender', s.gender, p.gender))

    # An explicitly incompatible reserved category or gender is not useful as a suggestion.
    if s.special_category and p.special_category and s.special_category.lower() != p.special_category.lower():
        return 0.0, details, True
    if getattr(s, 'gender', None) and p.gender and s.gender.lower() != p.gender.lower():
        return 0.0, details, True

    # Universal entitlement schemes with no restrictive criteria have a baseline score for eligible state/age.
    is_universal = (s.occupation is None and s.education_level is None and s.income_limit is None and s.special_category is None and not getattr(s, 'gender', None))
    if is_universal:
        return 0.25, details, False

    fields = [
        (0.35, s.occupation, p.occupation, False),
        (0.20, s.education_level, p.education_level, False),
        (0.20, s.income_limit, p.annual_income, True),
        (0.25, s.special_category, p.special_category, False)
    ]
    score = 0.0
    for weight, wanted, actual, income in fields:
        if wanted is None or actual is None: continue
        matched = actual <= wanted if income else actual.lower() == wanted.lower()
        if matched: score += weight
    return score, details, False

def _lexical_similarity(query_text: str, s) -> float:
    if not query_text: return 0.0
    tokens = set(re.findall(r'\w+', query_text.lower()))
    if not tokens: return 0.0
    doc_text = f"{s.scheme_name} {s.description} {getattr(s, 'benefits', '') or ''} {getattr(s, 'category', '') or ''}".lower()
    doc_tokens = set(re.findall(r'\w+', doc_text))
    overlap = tokens & doc_tokens
    return round(len(overlap) / max(len(tokens), 1), 3)

def recommend(db, p: Profile, top_k=5):
    from .models import Scheme
    schemes = [s for s in db.query(Scheme).all() if hard_filter(s, p)]
    sims = {}
    ids = [str(s.id) for s in schemes]
    if ids and p.need_text and db.bind.dialect.name == 'postgresql':
        from .embeddings import try_embed
        values = try_embed(p.need_text)
        if values is not None:
            vec = '[' + ','.join(map(str, values)) + ']'
            rows = db.execute(text('SELECT id::text, 1 - (description_embedding <=> CAST(:v AS vector)) AS similarity FROM schemes WHERE id::text = ANY(:ids)'), {'v': vec, 'ids': ids}).all()
            sims = {r[0]: float(r[1] or 0) for r in rows}

    out = []
    for s in schemes:
        es, details, mismatch = score_scheme(s, p)
        if mismatch: continue
        sem = sims.get(str(s.id))
        if sem is None and p.need_text:
            sem = _lexical_similarity(p.need_text, s)
        semantic = float(sem or 0.0)
        final = (.7 * es + .3 * semantic) if p.need_text else es
        if final > 0:
            out.append({
                'scheme': s,
                'eligibility_score': round(es, 3),
                'semantic_similarity': round(semantic, 3),
                'relevance_score': round(final, 3),
                'criteria': details
            })
    return sorted(out, key=lambda x: x['relevance_score'], reverse=True)[:top_k]
