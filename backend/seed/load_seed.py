import json
from pathlib import Path
from app.database import SessionLocal
from app.models import Scheme, Category
from sqlalchemy import text
def main():
    db=SessionLocal(); items=json.loads((Path(__file__).parent/'schemes_seed.json').read_text())
    known_categories={name for (name,) in db.query(Category.name).all()}
    for item in items:
        # Backward-compatible seed input; database/API always store document objects.
        item['required_documents']=[d if isinstance(d,dict) else {'name':d,'where_to_get':None,'note':None} for d in item.get('required_documents',[])]
        if item['category'] and item['category'] not in known_categories:
            db.add(Category(name=item['category'],description='Seed category'))
            known_categories.add(item['category'])
        if not db.query(Scheme).filter_by(scheme_name=item['scheme_name']).first(): db.add(Scheme(**item))
    db.flush(); db.commit(); print(f'Seeded {len(items)} curated verification_due records')
    # Seed embeddings once; a failed local model download leaves safe rule-only matching.
    try:
        from app.embeddings import try_embed
        for s in db.query(Scheme).filter(Scheme.description_embedding.is_(None)):
            values=try_embed(s.description)
            if values is not None:
                v='['+','.join(map(str,values))+']'; db.execute(text('UPDATE schemes SET description_embedding=CAST(:v AS vector) WHERE id=:id'),{'v':v,'id':s.id})
        db.commit()
    except Exception as e: print(f'Embedding seed skipped: {e}')
if __name__=='__main__': main()
