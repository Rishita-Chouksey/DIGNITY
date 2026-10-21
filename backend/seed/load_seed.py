import json
from pathlib import Path
from app.database import SessionLocal
from app.models import Scheme, Category
from sqlalchemy import text
def main():
    db=SessionLocal(); items=json.loads((Path(__file__).parent/'schemes_seed.json').read_text())
    for item in items:
        if item['category'] and not db.query(Category).filter_by(name=item['category']).first(): db.add(Category(name=item['category'],description='Seed category'))
        if not db.query(Scheme).filter_by(scheme_name=item['scheme_name']).first(): db.add(Scheme(**item))
    db.flush(); db.commit(); print(f'Seeded {len(items)} curated verification_due records')
    # Seed embeddings once; a failed local model download leaves safe rule-only matching.
    try:
        from app.embeddings import embed
        for s in db.query(Scheme).filter(Scheme.description_embedding.is_(None)):
            v='['+','.join(map(str,embed(s.description)))+']'; db.execute(text('UPDATE schemes SET description_embedding=CAST(:v AS vector) WHERE id=:id'),{'v':v,'id':s.id})
        db.commit()
    except Exception as e: print(f'Embedding seed skipped: {e}')
if __name__=='__main__': main()
