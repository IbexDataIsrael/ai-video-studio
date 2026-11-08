# Collections and library filters

A technique family groups related behaviors. An example is a specific, source-backed use of that technique. A collection groups chosen examples and references across families and creators; it does not create a new family or change source ownership.

## Saving and browsing

Open a reference or expand an example, use its options, then **Save to collection**. Choose a personal collection or create one with a name. Selection options also offers **Save selection to collection** for the exact current examples, whole references, slides and moments. Saving keeps the current editing picks and does not include edit-specific borrowing directions.

The Collection selector sits beside Search in Videos, Carousels and Techniques. Source (My work / Other creators / All), Creator, Collection, Category, Tags, Search and Sort persist across tabs and reload. Availability applies only to source formats. Active filter chips can be removed individually. Clear filters keeps editing picks and notes. Empty results retain the chosen filters.

Membership is exact. A collection containing one example in a four-example family shows that example, its poster, count, copy target and + target. The source video appears as context without adding its other examples to the collection. Full-reference membership includes the source in Videos or Carousels but does not silently include every technique from it. Slide and moment memberships retain their positions. Filtered detail panes offer **Show all examples** as an explicit way to browse the wider library. An existing direct link remains available even when outside the current filter.

Library options → **Manage collections** supports names, contents and removal. Removing a member has Undo. Removing a collection keeps its library items and offers Restore, including after reload. Collections are optional; no folder hierarchy or organizational setup is required.

## Installed creator packs

An installed pack is another collection with curated exact memberships. Owners can browse it, save its examples into personal collections, or hide/restore it. Personal collections and edit-specific notes remain separate. Pack membership never changes a source's creator, source collection, approval, or Used in my work status.

This version has no storefront, teaser, purchase link, account gate, billing or media downloader. Only installed packs appear in the selector. A future installer can register membership after it has safely installed the licensed library records and media.

For an already installed pack, run `python3 style-library/saved_collections.py import <manifest.json>`. The manifest has only pack_id, version, name and members. Members use the exact identities below; registration resolves and pins their current source snapshots. It does not import media or catalog entries. Repeated versions are idempotent. A newer version adds distinct memberships while retaining earlier ones, histories and an owner's removed marker. This is a membership integration seam, not a complete pack distribution system.

## Owner records and guards

The optional, private `style-library/collections.json` has schema_version 1, collections and request identities. No first-install seed or upgrade migration creates it. Each collection has a UUID-based ID, name, kind (personal or pack), members and recoverable history. Soft removal adds deleted_at. Members are one of:

- example: technique_id + example_id
- reference: reference_id
- slide: reference_id + one-based slide
- moment: reference_id + numeric source time

Members also pin source version, path, hash when known and original URL; examples pin their ID and window, and slides pin their path. Stable identity deduplicates repeated saves. Earlier source examples remain members of the earlier source instead of switching to a replacement version. Missing or removed library items retain membership and can be removed from the collection without losing other records.

GET /collections is read-only. Explicit POST /collections requires the same-origin action header, a current file revision, a request UUID and valid exact membership. Atomic transactions verify the catalog and owner file revisions before writing only collections.json. Stale source or collection changes reject saves and preserve the draft for review. Pack membership is not editable through personal collection actions. There is no raw collections.json HTTP route.

## Updates and rollback

Preserve collections.json, including all memberships, snapshots, request identities, removed markers and histories, alongside every existing owner project, media, library, technique, setting, script and feedback record. It is ignored by Git and rejected by the release exporter. Empty starter examples must never replace populated registries. Application updates require no collection data rewrite.

Source rollback retains collections.json and newer owner work. Earlier source ignores collections; restoring compatible source makes them available again. Keep the browser filter key ai-video-studio-library-filters-v1. It is independent of editing selections, saved directions and Clear/Undo state.
