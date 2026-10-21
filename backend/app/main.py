from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from .database import get_db
from .models import Scheme, Category, SearchQuery
from .schemas import *
from .config import settings
from .extraction import extract_profile
from .matching import recommend
app=FastAPI(title='DIGNITY API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)
def admin(x_admin_token:str|None=Header(None)):
    if x_admin_token!=settings.admin_token: raise HTTPException(401,'Invalid admin token')
def out(s): return {**{k:getattr(s,k) for k in SchemeIn.model_fields},'id':str(s.id),'last_verified':s.last_verified}
def store_embedding(db, scheme_id, description):
    """Embedding writes are only invoked on admin create/update description."""
    from .embeddings import embed
    v='['+','.join(map(str,embed(description)))+']'
    db.execute(text('UPDATE schemes SET description_embedding=CAST(:v AS vector) WHERE id=:id'),{'v':v,'id':scheme_id})
@app.get('/api/health')
def health(): return {'status':'ok','service':'dignity'}
@app.post('/api/query/extract')
def extract(req:ExtractRequest):
    r=extract_profile(req.text); return {'profile':r['profile'].model_dump(),'missing_fields':r['missing_fields'],'extractor':r['extractor']}
@app.post('/api/recommendations')
def recommendations(req:RecommendationRequest,db:Session=Depends(get_db)):
    rows=recommend(db,req.profile,req.top_k); result=[{**out(r['scheme']),**{k:v for k,v in r.items() if k!='scheme'},'disclaimer':'Suggestions only — you may be eligible based on the information provided. Confirm eligibility on the official source.'} for r in rows]
    q=SearchQuery(raw_text=req.profile.need_text or 'guided profile',extracted_profile=req.profile.model_dump(),top_results=[{'id':x['id'],'score':x['relevance_score']} for x in result]); db.add(q); db.commit()
    if req.profile.need_text and db.bind.dialect.name=='postgresql':
        from .embeddings import embed
        v='['+','.join(map(str,embed(req.profile.need_text)))+']'; db.execute(text('UPDATE search_queries SET need_embedding=CAST(:v AS vector) WHERE id=:id'),{'v':v,'id':q.id}); db.commit()
    return {'disclaimer':'Suggestions, not confirmed eligibility. Always verify on the official source.','results':result}
@app.get('/api/schemes')
def schemes(db:Session=Depends(get_db)): return [out(s) for s in db.query(Scheme).all()]
@app.get('/api/schemes/{scheme_id}')
def scheme(scheme_id:str,db:Session=Depends(get_db)):
    s=db.get(Scheme,scheme_id)
    if not s: raise HTTPException(404,'Scheme not found')
    return out(s)
@app.post('/api/admin/schemes',dependencies=[Depends(admin)])
def create(data:SchemeIn,db:Session=Depends(get_db)):
    s=Scheme(**data.model_dump(exclude={'official_url'}),official_url=str(data.official_url)); db.add(s); db.commit(); db.refresh(s); store_embedding(db,s.id,s.description); db.commit(); return out(s)
@app.put('/api/admin/schemes/{scheme_id}',dependencies=[Depends(admin)])
def update(scheme_id:str,data:SchemeIn,db:Session=Depends(get_db)):
    s=db.get(Scheme,scheme_id)
    if not s: raise HTTPException(404,'Scheme not found')
    description_changed=s.description!=data.description
    for k,v in data.model_dump().items(): setattr(s,k,str(v) if k=='official_url' else v)
    db.commit()
    if description_changed: store_embedding(db,s.id,s.description); db.commit()
    return out(s)
@app.delete('/api/admin/schemes/{scheme_id}',dependencies=[Depends(admin)])
def delete(scheme_id:str,db:Session=Depends(get_db)):
    s=db.get(Scheme,scheme_id)
    if not s: raise HTTPException(404,'Scheme not found')
    db.delete(s); db.commit(); return {'deleted':True}
@app.post('/api/admin/schemes/{scheme_id}/verify',dependencies=[Depends(admin)])
def verify(scheme_id:str,db:Session=Depends(get_db)):
    s=db.get(Scheme,scheme_id)
    if not s: raise HTTPException(404,'Scheme not found')
    s.last_verified=datetime.utcnow(); s.verification_status='verified'; db.commit(); return out(s)
