# Browser-Assisted Instagram Highlight Backup Tool

A local Python + Playwright utility for backing up Instagram highlights from accounts you control or have permission to archive.

The tool launches a dedicated Chrome profile, lets the user sign in manually, uses the Instagram profile page already open in the browser, detects available highlights, and saves selected highlights into organized folders with files numbered in story order.

This is positioned as a responsible personal archival/browser automation project, not as a scraping, republishing, or mass-download tool.

## Features

- Dedicated Chrome profile for the backup workflow
- Manual login flow; the script does not ask for or store passwords
- Uses the currently opened Instagram profile page by default
- Optional `--profile` argument for opening a specific profile URL or username
- Alerts the user and waits if the current page is not an Instagram profile
- Detects highlight links on the current profile
- Supports full-highlight backup mode
- Supports selected-story/range mode with `--story-mode ask`
- Names output folders after highlight titles
- Numbers files in the original story order
- Validates MP4 downloads to avoid keeping broken stream fragments
- CLI workflow for repeatable personal archival

## Requirements

- Python 3.10+
- Google Chrome
- Playwright

## Installation

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m playwright install chromium
```

On macOS/Linux, activate the virtual environment with:

```bash
source .venv/bin/activate
```

## Usage

Run the tool:

```bash
python ig_highlight_downloader.py
```

The program will:

1. Launch or connect to a dedicated Chrome profile.
2. Open Instagram if Chrome is not already there.
3. Ask you to log in manually.
4. Ask you to navigate to the Instagram profile you want to archive.
5. Detect highlights on the currently opened profile page.
6. Let you choose all highlights, specific highlights, or manual highlight mode.
7. Save media into organized folders under `downloads/`.

Choose individual stories instead of full highlights:

```bash
python ig_highlight_downloader.py --story-mode ask
```

Use a specific output folder:

```bash
python ig_highlight_downloader.py --out my_backup
```

Open a specific profile instead of using the current browser page:

```bash
python ig_highlight_downloader.py --profile username
```

## Dedicated Chrome profile

By default, the tool uses a dedicated Chrome profile folder so the workflow does not interfere with your normal browser profile.

On Windows, the default folder is based on `LOCALAPPDATA` and named `ChromeIGDebug`.

You can override it:

```bash
python ig_highlight_downloader.py --chrome-user-data-dir .ig_playwright_profile
```

Do not commit browser profile folders, downloads, cookies, cache files, or exported media to GitHub.

## Responsible use

This project is intended for personal archival of content you own or have permission to save. It is not affiliated with Instagram or Meta. Do not use this tool to scrape, republish, mass-download, or archive other people’s content without permission. Instagram may restrict automated access or collection under its Terms of Use. Use at your own risk.

Instagram’s official data export is the safest official route for downloading your own account data. This project exists as a local browser automation experiment for personal backup workflows.

## Notes

- The app uses manual authentication in Chrome rather than collecting credentials.
- Output is local to your machine.
- Downloaded media and browser session files are intentionally ignored by `.gitignore`.
- Dynamic websites change often, so the tool may need maintenance if Instagram changes its page or response structure.

## Project status

Prototype / personal tooling project.
