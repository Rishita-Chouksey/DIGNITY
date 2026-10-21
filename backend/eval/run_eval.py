"""Run after seeding: python eval/run_eval.py. Labels are conservative mentor-review fixtures."""
from app.database import SessionLocal
from app.schemas import Profile
from app.matching import recommend
from pathlib import Path
CASES=[(Profile(age=19,state='Madhya Pradesh',occupation='student',education_level='post_matric',annual_income=180000),{'Post Metric Scholarship - Madhya Pradesh'}),(Profile(age=55,state='Madhya Pradesh',occupation='farmer',annual_income=250000),{'Dr. Bhimrao Ambedkar Kamdhenu Yojana'}),(Profile(age=24,state='Madhya Pradesh',occupation='unemployed',annual_income=100000),{'Mukhyamantri Swarojgar Yojana'}),(Profile(age=30,state='Madhya Pradesh',occupation='worker'),{'Mukhyamantri Majadoor Suraksha Yojana'}),(Profile(age=35,state='Madhya Pradesh',occupation='farmer'),{'Pradhan Mantri Kisan Maandhan Yojana','Dr. Bhimrao Ambedkar Kamdhenu Yojana'}),(Profile(age=16,state='Madhya Pradesh',occupation='student',education_level='class_9_10',special_category='ST'),{'State Government ST Scholarship (Class 9 to 10)'}),(Profile(age=21,state='Madhya Pradesh',occupation='student',education_level='post_matric',gender='female'),{'Gaon Ki Beti'}),(Profile(age=60,state='Delhi'),{'Pradhan Mantri Garib Kalyan Anna Yojana'})]
def main():
 db=SessionLocal(); k=5; rows=[]; all_hits=all_ret=all_pred=0
 for p,expected in CASES:
  got={x['scheme'].scheme_name for x in recommend(db,p,k)}; hit=len(got&expected); all_hits+=hit; all_ret+=len(expected); all_pred+=len(got); rows.append((p.age,p.occupation,hit/len(got) if got else 0,hit/len(expected),bool(hit),len(got-expected)))
 precision=all_hits/all_pred if all_pred else 0; recall=all_hits/all_ret; acc=sum(r[4] for r in rows)/len(rows); incorrect=(all_pred-all_hits)/all_pred if all_pred else 0
 md='# DIGNITY evaluation\n\n|Age|Occupation|Precision@5|Recall@5|Top-K hit|Incorrect|\n|-|-|-|-|-|-|\n'+''.join(f'|{a}|{o}|{pr:.2f}|{re:.2f}|{hit}|{bad}|\n' for a,o,pr,re,hit,bad in rows)+f'\nOverall: precision@5 **{precision:.2f}**, recall@5 **{recall:.2f}**, top-K accuracy **{acc:.2f}**, incorrect-recommendation rate **{incorrect:.2f}**.\n\nThese metrics are fixture-based and do not establish real-world eligibility.\n'
 Path('eval/results.md').write_text(md); print(md)
if __name__=='__main__': main()
