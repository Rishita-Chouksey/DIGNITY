from pydantic import BaseModel, Field, HttpUrl
from datetime import date, datetime
from typing import Literal, Any
class Profile(BaseModel):
    age:int|None=None; state:str|None=None; occupation:str|None=None; education_level:str|None=None; annual_income:float|None=None; special_category:str|None=None; gender:str|None=None; need_text:str=''
class ExtractRequest(BaseModel): text:str=Field(min_length=1)
class SchemeIn(BaseModel):
    scheme_name:str; description:str; category:str|None=None; state:str='Central'; min_age:int|None=None; max_age:int|None=None; occupation:str|None=None; education_level:str|None=None; income_limit:float|None=None; gender:str|None=None; special_category:str|None=None; eligibility_conditions:dict[str,Any]={}; required_documents:list[str]=[]; benefits:str|None=None; application_deadline:date|None=None; official_url:HttpUrl; source_name:str|None=None; verification_status:Literal['verified','verification_due']='verification_due'
class SchemeOut(SchemeIn): id:str; last_verified:datetime|None=None
class RecommendationRequest(BaseModel): profile:Profile; top_k:int=5
