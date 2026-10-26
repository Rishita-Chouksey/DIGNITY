"""Validate official seed links without scraping or changing scheme data."""
import json
from pathlib import Path
import httpx

ROOT=Path(__file__).resolve().parents[1]
SEED=ROOT/'seed'/'schemes_seed.json'
REPORT=Path(__file__).parent/'link_report.md'

def check(url:str|None):
    if not url: return 'not provided','—'
    try:
        with httpx.Client(follow_redirects=True,timeout=15,headers={'User-Agent':'DIGNITY-link-check/1.0'}) as client:
            response=client.get(url)
        target=str(response.url)
        redirect='yes' if target.rstrip('/')!=url.rstrip('/') else 'no'
        return str(response.status_code),f'{redirect} → {target}' if redirect=='yes' else 'no'
    except httpx.HTTPError as error:
        return 'FAILED',str(error).replace('|','\\|')

def main():
    rows=[]
    for item in json.loads(SEED.read_text(encoding='utf-8')):
        for label,url in [('official_url',item.get('official_url')),('apply_url',item.get('apply_url'))]:
            status,detail=check(url)
            rows.append((item['scheme_name'],label,status,detail))
    table=['# DIGNITY official-link report','','This is a live HTTP check only; it does not scrape or change source data.','','| Scheme | Link | Status | Redirect / detail |','|---|---|---:|---|']
    table += [f'| {name} | {kind} | {status} | {detail} |' for name,kind,status,detail in rows]
    content = '\n'.join(table) + '\n'
    REPORT.write_text(content, encoding='utf-8')
    root_eval = ROOT.parent / 'eval'
    root_eval.mkdir(parents=True, exist_ok=True)
    (root_eval / 'link_report.md').write_text(content, encoding='utf-8')
    print('Wrote link_report.md successfully')

if __name__=='__main__': main()
