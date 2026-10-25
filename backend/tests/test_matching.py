from types import SimpleNamespace
from app.schemas import Profile
from app.matching import hard_filter, score_scheme
def s(**kw):
    values=dict(state='Central',min_age=None,max_age=None,occupation=None,education_level=None,income_limit=None,special_category=None)
    values.update(kw)
    return SimpleNamespace(**values)
def test_hard_filters_exclude_wrong_state_and_age():
    p=Profile(age=19,state='Madhya Pradesh')
    assert not hard_filter(s(state='Delhi'),p); assert not hard_filter(s(min_age=21),p); assert hard_filter(s(state='Central',min_age=18,max_age=20),p)
def test_ineligible_semantic_candidate_cannot_pass_hard_filter():
    p=Profile(age=19,state='Madhya Pradesh',occupation='student')
    similar_but_old=s(min_age=21); eligible=s(min_age=18,occupation='student')
    assert not hard_filter(similar_but_old,p); assert hard_filter(eligible,p)
def test_missing_data_is_uncertain():
    score,details,_=score_scheme(s(occupation='student',income_limit=100000),Profile())
    assert score==0 and {d['status'] for d in details}=={'uncertain'}
def test_explicit_special_category_mismatch_is_not_recommended():
    score,_,mismatch=score_scheme(s(occupation='student',special_category='SC'),Profile(occupation='student',special_category='OBC'))
    assert score==0 and mismatch
