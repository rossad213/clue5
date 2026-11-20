# Clue5 full library quality audit
Audited November 19, 2026.

## Scope and totals
- **2,179** complete mystery records with **10,895** clues (five per mystery)
- Original Daily bank: **730** stored; **578** currently eligible for scheduling
- Additional Daily bank: **517** stored and eligible
- Original Unlimited Practice bank: **682** stored
- Additional Unlimited Practice bank: **250** stored and eligible
- Total Daily records: **1,247**; total Practice records: **932**

## Strict automated validation
- No duplicate full answers, including comparisons that ignore leading articles
- All records have exactly five clues and valid four-field data structures
- No repeated clues within a record or empty/short clues under current minimum
- No new Daily or Practice record leaks its answer or registered alias verbatim
- No new cases blocked by the spoiler filter
- New cases are checked separately by `scripts/audit-expansions.cjs`
- Entire library is checked by `scripts/audit-all.cjs`
- GitHub Actions runs both scripts on changes to question bank files

## Findings requiring editorial treatment
- **283 legacy records remain quarantined** by the existing production spoiler guard; these **are not currently selected for gameplay**. These cases are tracked as a cleanup backlog, not reported as playable.
- Among these, **10** legacy clue-four instances and **275** clue-five instances include an answer or alias. These figures overlap when a case has both.
- **521 editorial heuristic warnings** currently require subjective assessment. A flag may be acceptable (for example, a genuine but identifying historical fact); it does not necessarily mean the clue is incorrect.
- Some older answers are semantically related to newer cases (e.g., a landmark versus an event at that landmark, or a park versus an animal within it). These need human judgment, not automatic string matching.
- A targeted factual check corrected the saiga antelope's conservation designation from a previous, outdated critically threatened description to Near Threatened (IUCN Red List 2023).
- A few categories were made more specific without modifying daily scheduling categories.
- Several fourth clues were rewritten to avoid direct definitions, and weak final clues in legacy files were strengthened.

## Scheduling protection
Original Daily scheduling eligibility and name order were verified unchanged against the preceding production-era version. Published dates remain stable through November 22, 2026. The expansion starts on **November 23, 2026**, subject to successful deployment. A new full-bank regression test prevents the legacy spoiler quarantine count from rising above the audited baseline of 283.

## Quality policy for future submissions
1. Clues 1–2: meaningful but broad
2. Clue 3: guide the player into the correct subject area without a giveaway
3. Clue 4: narrow choices, no answer names, alias leaks, or uniquely decisive definitions
4. Clue 5: a strong distinct fact, but never literally print the answer
5. Use helpful categories; avoid generic Object, Person, Place, or Arts & Entertainment whenever more informative labels are available
6. Check historical and changing facts against reliable sources; a static lint check is not a substitute for factual editorial review

## Limitations
The automated audit checks structural integrity, explicit answer leaks, repetitions, and editorial risk signals; it cannot guarantee that **all 10,895 individual clues** are factually perfect or optimally calibrated. Legacy quarantined cases must be rewritten carefully before reintroduction. Deployment status was not confirmed through the current Vercel connection.
