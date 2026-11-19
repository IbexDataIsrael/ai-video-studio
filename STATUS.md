# AI Video Studio — 0.1.0-beta.15

Techniques are no longer missed when a video is approved in the Studio. The editing chat prepares technique examples for every version it delivers for review, in step-by-step projects and in single requests that edit a supplied video, and reuses unchanged examples on later versions. Approval still publishes only the plan for the exact version chosen. The approval panel says plainly when nothing is prepared, and a finished video with no techniques in the library offers Find its techniques for that video. See docs/TECHNIQUE-CATALOGING.md.

There is no owner-data migration and nothing is deleted. The numbered GitHub release is authoritative for publication state. Dependency pins and renderer code are unchanged.

## Previous release — 0.1.0-beta.14

Imports, new version folders and Open in HyperFrames working copies use copy-on-write clones where the disk supports them (APFS on macOS; Btrfs, XFS and bcachefs on Linux), so the same footage is no longer stored again for every version. Other disks keep making ordinary copies, so behavior is identical everywhere. Start the next version with python3 scripts/studio.py new-version. Regenerable frame dumps, mattes and temporary renders go in the version's .scratch/ folder, which HyperFrames history, new versions and editor copies skip. scripts/hf.py render warns when less than 10 GB is free. See docs/TOOLING.md (Disk use).

There is no owner-data migration and nothing is deleted. The numbered GitHub release is authoritative for publication state. Dependency pins and renderer code are unchanged.
