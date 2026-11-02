# One prompt to get started

Open Codex or Claude Code on your computer and paste:

```text
Set up AI Video Studio from https://github.com/mattp68/ai-video-studio using the newest published release, including beta releases, in a new local folder. Check the GitHub Releases page to identify the correct version rather than using an older hardcoded tag or unreleased changes from the main branch. Read SETUP.md and AGENTS.md from that release first. Check prerequisites and guide me through any missing system tools with my authorization. Install project-local dependencies and configure local transcription if supported, or explain available alternatives. Run the tests and full synthetic smoke workflow, report available and unavailable capabilities, and open my local studio. Preserve existing files. Use my own footage, references and accounts; ask before paid services or system-wide changes. Do not publish my work.
```

This prompt always installs the newest published release (betas included), so it never needs editing when a new version ships. The assistant should get the files, read the included guide and run the checks. You may need to authorize prerequisite installation or sign in to a reference website in its connected browser. A missing optional feature should produce an explanation and an alternative, not invented analysis.

Already have the files? Open the extracted/cloned folder and ask the assistant to read SETUP.md and AGENTS.md and complete setup. Keep future chats in that folder so saved decisions remain available. See [the pilot checks](docs/PILOT.md).
