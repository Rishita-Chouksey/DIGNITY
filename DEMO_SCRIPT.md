# Five-minute mentor demo

1. Start Docker, API, and web app as described in README. Visit `/` and state the caution banner.
2. Select guided profile. Enter **19**, Madhya Pradesh, student, post_matric, **180000** income, SC. Open suggestions. Explain that the outcome is a suggestion, never a decision.
3. Search: “I am 55, a farmer in MP and my household income is 2.5 lakh.” Show fallback extraction and the agricultural card. Open its official link.
4. Search: “I am 24, unemployed in MP, income 1 lakh.” Show Mukhyamantri Swarojgar Yojana and its explicit uncertainty markers.
5. Visit `/admin`, enter local token, and use Verify to stamp `last_verified`. Mention that this is a protected demo admin action.
6. Run `pytest` and `python eval/run_eval.py`; open `eval/results.md`. Explain that metrics are fixture-based and honest, not claims about actual eligibility.
