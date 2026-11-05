# AI Video Studio — 0.1.0-beta.8

Prepared: 2026-11-05. Library registration now records creation dates and stores exact project-to-reference links in either registration order. Final approval can recover one missing link when project ID, current version and video path match one active library entry. Ambiguous, removed, archived, foreign and mismatched sources remain blocked. A recorded source hash must match the approved video.

Registration commits the library entry and matching project link together with guarded writes and recovery history. Existing creation dates and project links survive descriptor replacements; undated legacy entries are not assigned today's date. Sorting remains Newest added, using original saved dates rather than approval time.

There is no renderer, dependency or media change. Upgrades apply source only and preserve owner projects, media, libraries, techniques, scripts, settings, feedback, approvals, memory and local customizations. See docs/VALIDATION.md for checks and limits, docs/UPDATING.md for updates and docs/RELEASE.md for publication. The numbered GitHub release is authoritative for publication state.
