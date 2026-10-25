"""Deterministic rules; embeddings only break ties/relevance after hard filters."""
from sqlalchemy import text
from .schemas import Profile
def hard_filter(s, p:Profile)->bool:
    return (not p.state or s.state in ('Central',p.state)) and (p.age is None or (s.min_age is None or p.age>=s.min_age) and (s.max_age is None or p.age<=s.max_age))
def criterion(label, wanted, actual, income=False):
    if actual is None: return {'label':label,'status':'uncertain'}
    if wanted is None: return {'label':label,'status':'uncertain'}
    ok=actual<=wanted if income else actual.lower()==wanted.lower()
    return {'label':label,'status':'matched' if ok else 'uncertain'}
def score_scheme(s,p:Profile):
    details=[criterion('Occupation',s.occupation,p.occupation),criterion('Education level',s.education_level,p.education_level),criterion('Income limit',s.income_limit,p.annual_income,True),criterion('Special category',s.special_category,p.special_category)]
    applicable=[d for d in details if d['status']!='uncertain' or True]
    # Uncertain gets no positive credit; false/missing are intentionally indistinguishable to avoid eligibility claims.
    eligibility=sum(d['status']=='matched' for d in applicable)/len(applicable)
    return eligibility,details
def recommend(db,p:Profile,top_k=5):
    from .models import Scheme
    schemes=[s for s in db.query(Scheme).all() if hard_filter(s,p)]
    # A single pgvector SQL query computes similarities for all retained candidates. Offline/unit-test fallback is deterministic 0.
    sims={}
    ids=[str(s.id) for s in schemes]
    if ids and p.need_text and db.bind.dialect.name=='postgresql':
        from .embeddings import try_embed
        values=try_embed(p.need_text)
        if values is not None:
            vec='['+','.join(map(str,values))+']'
            rows=db.execute(text('SELECT id::text, 1 - (description_embedding <=> CAST(:v AS vector)) AS similarity FROM schemes WHERE id::text = ANY(:ids)'),{'v':vec,'ids':ids}).all()
            sims={r[0]:float(r[1] or 0) for r in rows}
    out=[]
    for s in schemes:
        es,details=score_scheme(s,p); semantic=sims.get(str(s.id),0.0); final=.7*es+.3*semantic
        out.append({'scheme':s,'eligibility_score':round(es,3),'semantic_similarity':round(semantic,3),'relevance_score':round(final,3),'criteria':details})
    return sorted(out,key=lambda x:x['relevance_score'],reverse=True)[:top_k]
