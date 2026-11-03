# Optional scripting feature — review preview

Unreleased branch work on top of 0.1.0-beta.6. The simplified Script section, idea/reference starter, shared baseline and private writing preferences are ready for isolated UI review. Script now shows the draft and a quiet Saved/Versions/Copy for chat toolbar; context is read-only under Project details, recording readiness stays in chat, and hook alternatives are part of the writing guidance. Development and disposable preview data live in a separate worktree; the production studio is independent. No release or production installation has occurred.

Script and preference writes are guarded and versioned. Personal writing memory starts empty and is excluded from source exports. See docs/SCRIPTING.md for the experience and assistant persistence contract. Keep existing owner projects, media, scripts, briefs, memory, references, settings and feedback during any later source installation.

---

# AI Video Studio — 0.1.0-beta.6

Prepared: 2026-11-01. A small fix on top of the beta.5 Public Launch build. GitHub's actual tag/release is authoritative for publication; local preparation alone is not a published release.

## Changes in beta.6

- A newly registered project now appears first on the Projects home. scripts/register.py previously appended new projects to the end of projects.json, which the home lists in saved order, so new work showed up last. Replacing an existing project with --replace keeps its current position, and reference registrations are unchanged.
- style-library/PROJECT-NAVIGATION.md documents the newest-first order, and a disposable-fixture test covers new, replaced and refused registrations.

Existing projects.json files are not reordered; only projects registered after updating go to the top. There is no interface, dependency, renderer or data-format change. Beta.5's safer-update checks, beta.4's setup fixes and everything in beta.3 remain.

## Preservation and verification

The public package contains reviewed source, docs, templates and empty examples only. Existing projects, original/exported media, catalogs/techniques, settings, feedback, scripts, approvals and local source changes must survive upgrades. No data migration is required from beta.5.

Fresh source-only setup, unit/UI tests, dependency audits, synthetic assembly/render and populated beta.5 Git/ZIP upgrade/rollback are release checks. Actual results and limits are in docs/VALIDATION.md. Independent teammate upgrades, fresh Codex/Claude Code sessions and other-platform media workflows remain beta pilot work; use docs/PILOT.md. The original beta has no Updates UI; docs/UPDATING.md includes a direct prompt.

For future application work read docs/RELEASE.md. For installed upgrades read docs/UPDATING.md. This source release never approves, updates or publishes a creative project, grants account access or sends messages to anyone.
