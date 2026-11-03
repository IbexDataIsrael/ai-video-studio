# Script writing in AI Video Studio

Feature branch specification · November 3, 2026. Implementation is in progress; this is not a published release.

## Experience

Video projects can start with an idea, an existing script, a creator reference or recorded footage. Script is an optional project section before Spoken cut. Existing footage-first projects keep their current flow. Writing remains a conversation in the editing chat; the local website saves context and versions, and explicitly prepares requests to copy into that chat.

The Script section should emphasize a readable, editable script with recoverable versions, optional project context and a clear next action. References express what the creator wants to borrow. Marking a script ready to record is a planning choice, not footage approval or a prerequisite for editing.

## Shared guidance and private voice

Read SCRIPTING-BASELINE.md when developing a script. Use the current creator request and exact reference intent first. Read relevant saved scripts as examples, without treating them as evidence of performance.

Each installation starts with an empty writing memory. The assistant remembers explicit general feedback and recurring supported preferences, keeps one-off choices in the project, and records where each lasting preference came from. Owners can inspect, edit and remove preferences. Saving a script alone never proves a preference or performance result. Personal memory is local owner data and is excluded from source control and releases.

## Implementation scope

- Idea/footage starting choices with the existing retained starter draft and one explicit chat handoff.
- Optional Script section in video projects, reusing immutable script versions and exact saved-version links.
- Project-local idea/reference context and readiness, separate from footage, selected spoken scripts and approval.
- A small private writing-preferences record with guarded, recoverable saves and owner controls.
- Shared assistant instructions for reading guidance and maintaining useful writing memory across chats.

No embedded model service, account integration, performance analytics or mandatory script framework is included.

## Verification

Use disposable fixtures for all writes. Cover idea-first and footage-first requests, exact saved versions, conflicting edits, draft retention, creator-memory changes, first-install emptiness, source exclusion and populated upgrade preservation. Inspect the actual Script/starter/preferences UI on wide and narrow screens. Keep the production installation and its running server independent of this branch preview.
