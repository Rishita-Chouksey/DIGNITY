import json
from pathlib import Path
import pytest
from fastapi import HTTPException
from app.main import validate_verified_procedure
from app.schemas import SchemeIn, SchemeOut

def payload(**overrides):
    value={
        'scheme_name':'Example Scheme','description':'Example','state':'Central',
        'official_url':'https://www.myscheme.gov.in/',
        'required_documents':[{'name':'Income certificate','where_to_get':None,'note':None}],
        'verification_status':'verification_due'
    }
    value.update(overrides); return value

def test_migration_converts_document_strings_to_objects():
    sql=(Path(__file__).parents[1]/'migrations'/'002_apply_guide.sql').read_text()
    assert 'jsonb_build_object' in sql and "'where_to_get', NULL" in sql

def test_verified_scheme_requires_official_procedure_links():
    with pytest.raises(HTTPException) as exc:
        validate_verified_procedure(SchemeIn(**payload(verification_status='verified')))
    assert exc.value.status_code==422
    valid=SchemeIn(**payload(verification_status='verified',apply_url='https://www.myscheme.gov.in/',procedure_source_url='https://www.myscheme.gov.in/'))
    validate_verified_procedure(valid)

def test_api_scheme_shape_includes_apply_guide_fields():
    response=SchemeOut(id='00000000-0000-0000-0000-000000000001',**payload(application_mode='online',application_steps=[{'step':1,'title':'Open the portal','detail':'Use the official application page.'}],helpline='12345'))
    body=response.model_dump(mode='json')
    assert body['required_documents'][0]['name']=='Income certificate'
    assert body['application_steps'][0]['step']==1 and body['application_mode']=='online'

def test_application_mode_allows_only_valid_modes():
    valid=SchemeIn(**payload(application_mode='both'))
    assert valid.application_mode=='both'
    with pytest.raises(Exception):
        SchemeIn(**payload(application_mode='invalid_mode'))
