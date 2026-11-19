# AI Video Studio — 0.1.0-beta.14

Imports, new version folders and Open in HyperFrames working copies use copy-on-write clones where the disk supports them (APFS on macOS; Btrfs, XFS and bcachefs on Linux), so the same footage is no longer stored again for every version. Other disks keep making ordinary copies, so behavior is identical everywhere. Start the next version with python3 scripts/studio.py new-version. Regenerable frame dumps, mattes and temporary renders go in the version's .scratch/ folder, which HyperFrames history, new versions and editor copies skip. scripts/hf.py render warns when less than 10 GB is free. See docs/TOOLING.md (Disk use).

There is no owner-data migration and nothing is deleted. The numbered GitHub release is authoritative for publication state. Dependency pins and renderer code are unchanged.

## Previous release — 0.1.0-beta.13

The Reference Library opens with a compact heading, optional help and shared searchable filters. Save exact references, techniques, slides and moments in personal collections, and browse installed packs without expanding their exact membership. Creator, Category, Techniques and Collections support multiple choices. Browse filters and collections are separate from the current editing selection and its direction. See docs/COLLECTIONS.md.

Find remaining techniques prepares a chat request for older saved videos and eligible finished projects. Final approval promotes only examples prepared for that exact reviewed version. Existing saved techniques and historical links remain. There is no automatic analysis or owner-data migration. See docs/TECHNIQUE-CATALOGING.md and docs/UPDATING.md.
