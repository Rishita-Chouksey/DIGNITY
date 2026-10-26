import re
from .schemas import Profile
STATES={'madhya pradesh':'Madhya Pradesh','mp':'Madhya Pradesh','delhi':'Delhi','rajasthan':'Rajasthan','uttar pradesh':'Uttar Pradesh','bihar':'Bihar'}
def fallback_extract(text:str)->tuple[Profile,list[str]]:
    low=text.lower(); p=Profile(need_text=text)
    age=re.search(r'\b(?:age\s*)?(\d{1,3})\s*(?:years?|yrs?)?\b',low)
    if age and 1<=int(age.group(1))<=120: p.age=int(age.group(1))
    for k,v in STATES.items():
        if re.search(r'\b'+re.escape(k)+r'\b',low): p.state=v; break
    inc=re.search(r'(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs)\b',low)
    if inc: p.annual_income=float(inc.group(1))*100000
    else:
        inc=re.search(r'(?:income|earning|earn)\D{0,12}(\d[\d,]{3,})',low)
        if inc: p.annual_income=float(inc.group(1).replace(',',''))
    for value,words in {'student':['student','college','school','study','studying','pupil'],'farmer':['farmer','farming','agriculture','kisan','krishi'],'unemployed':['unemployed','jobless','no job','looking for work','berojgar'],'worker':['labour','labor','worker','mazdoor','majdoor','daily wager']}.items():
        if any(re.search(r'\b'+re.escape(w)+r'\b',low) for w in words): p.occupation=value; break
    for value,words in {'post_matric':['college','undergraduate','graduation','post matric'],'class_9_10':['class 9','class 10'],'school':['school']}.items():
        if any(w in low for w in words): p.education_level=value; break
    for value,words in {'SC':['scheduled caste',' sc '],'ST':['scheduled tribe',' st '],'OBC':['other backward class','obc'],'disability':['disability','disabled','divyang','handicapped'],'EWS':['ews'],'General':['general','unreserved','open category']}.items():
        if any(w in ' '+low+' ' for w in words): p.special_category=value; break
    for value,words in {'female':['female','woman','women','girl','widow','mother'],'male':['male','man','men','boy','father','husband']}.items():
        if any(re.search(r'\b'+re.escape(w)+r'\b',low) for w in words): p.gender=value; break
    missing=[x for x in ['age','state','occupation','annual_income'] if getattr(p,x) is None]
    return p,missing
def extract_profile(text:str)->dict:
    # Deliberately one optional provider call; fallback keeps offline demos reliable.
    from .config import settings
    if settings.llm_provider=='openai' and settings.openai_api_key:
        try:
            from openai import OpenAI
            r=OpenAI(api_key=settings.openai_api_key).chat.completions.create(model='gpt-4o-mini',response_format={'type':'json_object'},messages=[{'role':'system','content':'Extract only known profile fields: age,state,occupation,education_level,annual_income,special_category,gender. Never infer.'},{'role':'user','content':text}])
            import json; p=Profile(**json.loads(r.choices[0].message.content),need_text=text); return {'profile':p,'missing_fields':[x for x in ['age','state','occupation','annual_income'] if getattr(p,x) is None], 'extractor':'llm'}
        except Exception: pass
    p,missing=fallback_extract(text); return {'profile':p,'missing_fields':missing,'extractor':'rule_based_fallback'}
