# Project summary

**Title:** Browser-Assisted Instagram Highlight Backup Tool

**Positioning:** Responsible personal archival/browser automation tool for backing up Instagram highlights from accounts the user controls or has permission to archive.

**Tech stack:** Python, Playwright, Chrome DevTools Protocol, browser automation, HTTP media handling, filesystem automation, CLI design.

**Portfolio description:**

Built a local Python automation tool that helps users back up Instagram highlights from accounts they control. The app launches a dedicated Chrome profile, lets the user authenticate manually, detects highlights from the currently opened Instagram profile, and saves selected or full highlights into organized folders with ordered filenames.

**Key features:**

- Dedicated Chrome profile with manual login flow
- Uses the currently opened Instagram profile instead of hardcoded accounts
- Highlight detection and full-highlight backup mode
- Optional selected-story/range backup mode
- Output folders named after highlight titles
- Ordered filenames preserving story sequence
- MP4 validation to avoid saving broken stream fragments
- CLI workflow for repeatable personal archival
