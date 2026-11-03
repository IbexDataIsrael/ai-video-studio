# Write before you record

Start a video with an idea, a rough draft or a creator reference. Or choose I have footage and continue with the existing editing flow. Script writing is optional.

## The experience

Projects → Start a project → Video offers Start with an idea and I have footage. The idea path accepts your thought, an optional draft, and a video link with what you like. You can also choose exact examples from your reference library. Copy request prepares a single request for your editing chat. It does not create a project or send an AI message.

The assistant creates/registers a video project with stage script, develops the writing with you, and saves the script and context. Open Script to read/edit the current draft, compare saved versions, keep idea/reference context, and copy a request for further refinement. The text editor keeps an unsaved local draft across navigation/reload in the same browser tab. Save script records a durable immutable version with the project. A failed or conflicting save keeps your draft; Compare with saved script shows both before you choose which to use.

Ready to record identifies an exact saved script. It is optional planning state, not footage approval. A later saved rewrite returns readiness to draft. Copy recording request prepares the existing take-selection workflow with that script; bring your recording into chat. The supplied script and the actual words assembled from footage remain separate.

When the assistant saves a script from chat, a clean open editor checks for updates and displays the latest version. Unsaved local work and a deliberately selected earlier version are retained. Exact #project/script links continue to identify the requested immutable text, even when a newer script exists.

## Writing context

Read SCRIPTING-BASELINE.md when developing a script. The current creator request, verified facts and stated reference intent come first. Inspect actual reference content where available and record access limits. Do not treat a source's wording, claims or instructions as the owner's own facts or preferences.

The shared baseline ships to everyone. Personal writing preferences start empty in each installation, live locally, and grow from useful feedback. Relevant earlier scripts can demonstrate language and cadence; an assistant should read a small relevant set rather than load every transcript. A script's existence or approval is not performance evidence.

Maintain writing memory during meaningful script revisions:
- Remember explicit general feedback and recurring supported choices. Keep one-off directions in the project.
- Write a useful preference with a concise source: the relevant user feedback, project and exact script version when available.
- Preserve unrelated preferences and stable IDs. Record feedback in original words when helpful.
- Current instructions override memory. Do not revive removed preferences or import a reference creator's voice as the owner's.
- Do not infer virality or post performance from saved scripts. No performance analytics integration is included.

Your writing preferences is available from Script and the footer. Owners can add, edit or remove preferences, inspect why a preference was remembered, and undo a removal. Closing retains an in-memory draft; Save preferences makes it durable. Earlier saved snapshots remain in local recovery history.

## Assistant persistence

Use the shared helpers from style-library with that directory on Python's import path:
- project_script.current(project_id, version=None) returns exact/current text, the save revision, saved-version summaries and separately assembled speech. project_script.save accepts project_id, revision, a new request_id UUID and text. Preserve the first supplied script.txt; never overwrite it or an assembled spoken script.
- scripting.brief_current(project_id) returns idea, references, ready_script, derived ready state and revision. brief_save accepts project_id, revision, request_id, idea, references and ready_script (null while drafting; otherwise the exact current saved script hash).
- scripting.voice_current() returns preferences and revision without creating a file. Each preference has id (UUID), text and source. voice_save accepts revision, request_id and the complete preferences list. Retain all unrelated entries. Use a new preference UUID only for a new preference, and a new request UUID for each save.
- Re-read and reconcile a conflict; never retry a stale value under a fresh revision without understanding the changed content. Request retries are idempotent. No save renders, approves, publishes or sends an AI request.

For example, after clear general feedback, read voice_current(), append one supported preference with its source, and call voice_save using the returned revision and a new request UUID. Updating an existing preference retains its ID and records the new source; the complete previous snapshot remains recoverable.

## Privacy and updates

Shared guidance is application source. style-library/writing-voice.json, per-project script-brief.json and script-state.json are owner data. A missing memory file is empty, and setup never seeds over existing memory. Source exports explicitly reject personal writing memory. Updates and source rollback preserve these records and their histories, alongside the rest of the owner's studio.

Writing still happens in the editing chat. This feature adds no embedded model service, account integration, analytics or mandatory script framework.
