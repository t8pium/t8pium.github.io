"""Browser-assisted Instagram highlight backup tool.

This program is intended for local personal archival workflows for accounts
that the user controls or has permission to archive. It uses a dedicated
Chrome profile and manual login rather than collecting credentials.
"""

from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse
import argparse
import os
import re
import subprocess
import time
import urllib.request

from playwright.sync_api import (
    sync_playwright,
    Error,
    TimeoutError as PlaywrightTimeoutError,
)


IG_MEDIA_HOST_RE = re.compile(
    r"(cdninstagram\.com|fbcdn\.net|instagram\.f[a-z0-9-]+\.fbcdn\.net)",
    re.IGNORECASE,
)

HIGHLIGHT_ID_RE = re.compile(r"/stories/highlights/(\d+)")


def find_chrome_exe():
    """Return a likely Chrome executable path on Windows, or an empty string."""
    candidates = [
        Path(os.environ.get("PROGRAMFILES", "")) / "Google/Chrome/Application/chrome.exe",
        Path(os.environ.get("PROGRAMFILES(X86)", "")) / "Google/Chrome/Application/chrome.exe",
        Path(os.environ.get("LOCALAPPDATA", "")) / "Google/Chrome/Application/chrome.exe",
    ]

    for path in candidates:
        if path.exists():
            return str(path)

    return ""


def cdp_is_alive(port: int) -> bool:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=1.5) as response:
            return response.status == 200
    except Exception:
        return False


def wait_for_cdp(port: int, timeout_seconds: int = 25) -> bool:
    start = time.time()

    while time.time() - start < timeout_seconds:
        if cdp_is_alive(port):
            return True
        time.sleep(0.35)

    return False


def launch_debug_chrome(chrome_path: str, user_data_dir: Path, port: int):
    user_data_dir.mkdir(parents=True, exist_ok=True)

    args = [
        chrome_path,
        "--remote-debugging-address=127.0.0.1",
        f"--remote-debugging-port={port}",
        f"--user-data-dir={str(user_data_dir)}",
        "--no-first-run",
        "--no-default-browser-check",
        "https://www.instagram.com/",
    ]

    subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def safe_name(text: str) -> str:
    text = str(text or "").strip()
    text = re.sub(r'[<>:"/\\|?*]', "_", text)
    text = re.sub(r"\s+", "_", text)
    text = text.strip(" ._")
    return text[:90] or "highlight"


def find_highlight_id(page_url: str):
    match = HIGHLIGHT_ID_RE.search(page_url or "")
    return match.group(1) if match else None


def is_instagram_profile_url(url: str) -> bool:
    """Return True for normal Instagram profile URLs."""
    if not url:
        return False

    parsed = urlparse(url)
    host = parsed.netloc.lower().replace("www.", "")
    path = parsed.path.strip("/")

    if host != "instagram.com" or not path:
        return False

    blocked = {
        "accounts",
        "explore",
        "reels",
        "stories",
        "direct",
        "p",
        "reel",
        "tv",
        "about",
        "developer",
    }

    parts = path.split("/")
    first = parts[0].lower()

    if first in blocked:
        return False

    return len(parts) == 1


def normalize_profile_input(raw: str) -> str:
    raw = (raw or "").strip()

    if not raw:
        return ""

    if raw.startswith("@"):
        raw = raw[1:]

    if raw.startswith("http://") or raw.startswith("https://"):
        return raw

    raw = raw.strip("/")
    return f"https://www.instagram.com/{raw}/"


def extension_from_content_type(content_type: str, url: str) -> str:
    content_type = (content_type or "").lower()
    lower_url = url.lower()

    if "video" in content_type or ".mp4" in lower_url:
        return ".mp4"
    if "jpeg" in content_type or "jpg" in content_type:
        return ".jpg"
    if "png" in content_type:
        return ".png"
    if "webp" in content_type:
        return ".webp"

    path = urlparse(url).path.lower()

    for ext in [".mp4", ".jpg", ".jpeg", ".png", ".webp"]:
        if ext in path:
            return ".jpg" if ext == ".jpeg" else ext

    return ".bin"


def get_cookie_value(context, name: str):
    try:
        cookies = context.cookies(["https://www.instagram.com"])

        for cookie in cookies:
            if cookie.get("name") == name:
                return cookie.get("value")

    except Exception:
        pass

    return ""


def image_urls_from_item(item: dict):
    urls = []
    image_versions = item.get("image_versions2") or {}
    candidates = image_versions.get("candidates") or []

    for candidate in candidates:
        url = candidate.get("url")
        if url:
            urls.append(url)

    for key in ["display_url", "thumbnail_url", "image_url"]:
        url = item.get(key)
        if url:
            urls.append(url)

    return urls


def video_urls_from_item(item: dict):
    versions = []

    for version in item.get("video_versions") or []:
        url = version.get("url")
        if url:
            versions.append(
                {
                    "url": url,
                    "width": version.get("width") or 0,
                    "height": version.get("height") or 0,
                }
            )

    for resource in item.get("video_resources") or []:
        url = resource.get("src") or resource.get("url")
        if url:
            versions.append(
                {
                    "url": url,
                    "width": resource.get("config_width") or resource.get("width") or 0,
                    "height": resource.get("config_height") or resource.get("height") or 0,
                }
            )

    versions.sort(key=lambda x: x["width"] * x["height"], reverse=True)
    return [x["url"] for x in versions]


def best_media_url_from_item(item: dict):
    videos = video_urls_from_item(item)

    if videos:
        return videos[0], "video"

    images = image_urls_from_item(item)

    if images:
        return images[0], "image"

    return None, None


def looks_like_story_item(obj):
    if not isinstance(obj, dict):
        return False

    return (
        "image_versions2" in obj
        or "video_versions" in obj
        or "video_resources" in obj
    )


def dedupe_items(items):
    unique = []
    seen = set()

    for item in items:
        url, _ = best_media_url_from_item(item)
        key = str(item.get("id") or item.get("pk") or item.get("taken_at") or url or id(item))

        if key in seen:
            continue

        seen.add(key)
        unique.append(item)

    return unique


def extract_highlight_data_from_json(data):
    candidates = []

    def walk(obj):
        if isinstance(obj, dict):
            items = obj.get("items")

            if isinstance(items, list):
                story_items = [x for x in items if looks_like_story_item(x)]

                if story_items:
                    title = ""

                    for key in ["title", "name"]:
                        value = obj.get(key)

                        if isinstance(value, str) and value.strip():
                            title = value.strip()
                            break

                    candidates.append(
                        {
                            "title": title,
                            "items": story_items,
                        }
                    )

            for value in obj.values():
                walk(value)

        elif isinstance(obj, list):
            for value in obj:
                walk(value)

    walk(data)

    if not candidates:
        return "", []

    candidates.sort(key=lambda x: len(x["items"]), reverse=True)
    title = candidates[0]["title"]
    items = dedupe_items(candidates[0]["items"])

    return title, items


def fetch_highlight_data(context, page, highlight_id: str):
    if not highlight_id:
        return "", []

    csrf = get_cookie_value(context, "csrftoken")

    headers = {
        "accept": "application/json",
        "referer": page.url or "https://www.instagram.com/",
        "x-ig-app-id": "936619743392459",
        "x-requested-with": "XMLHttpRequest",
    }

    if csrf:
        headers["x-csrftoken"] = csrf

    urls = [
        f"https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=highlight%3A{highlight_id}",
        f"https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=highlight:{highlight_id}",
    ]

    best_title = ""
    best_items = []

    for api_url in urls:
        try:
            response = context.request.get(api_url, headers=headers, timeout=30_000)

            if not response.ok:
                continue

            title, items = extract_highlight_data_from_json(response.json())

            if items and len(items) > len(best_items):
                best_title = title
                best_items = items

        except Exception:
            pass

    return best_title, best_items


def extract_highlight_links_from_profile(page):
    script = r"""
    () => {
        const anchors = Array.from(document.querySelectorAll('a[href*="/stories/highlights/"]'));
        const out = [];

        for (const a of anchors) {
            const href = a.href || "";
            const text = (a.innerText || "").trim();
            const aria = (a.getAttribute("aria-label") || "").trim();
            const title = (a.getAttribute("title") || "").trim();

            const match = href.match(/\/stories\/highlights\/(\d+)/);
            if (!match) continue;

            out.push({
                id: match[1],
                href,
                label: text || aria || title || match[1]
            });
        }

        const seen = new Set();

        return out.filter(x => {
            if (seen.has(x.id)) return false;
            seen.add(x.id);
            return true;
        });
    }
    """

    try:
        return page.evaluate(script)
    except Error:
        return []


def wait_for_page_ready(page):
    try:
        page.wait_for_load_state("domcontentloaded", timeout=5000)
    except PlaywrightTimeoutError:
        pass

    page.wait_for_timeout(1500)

    try:
        page.evaluate(
            """
            () => {
                document.querySelectorAll("video").forEach(v => {
                    try { v.pause(); } catch(e) {}
                });
            }
            """
        )
    except Error:
        pass


def scan_profile_highlights(page):
    print("\nScanning current profile for highlights...")
    links = []

    for _ in range(8):
        links = extract_highlight_links_from_profile(page)

        if links:
            break

        page.wait_for_timeout(1000)

    return links


def parse_selection(selection: str, max_number: int):
    selection = selection.strip().lower()

    if selection in {"all", "*"}:
        return list(range(1, max_number + 1))

    selected = set()
    parts = [x.strip() for x in selection.split(",") if x.strip()]

    for part in parts:
        if "-" in part:
            left, right = part.split("-", 1)

            if not left.strip().isdigit() or not right.strip().isdigit():
                raise ValueError(f"Invalid range: {part}")

            start = int(left)
            end = int(right)

            if start > end:
                start, end = end, start

            for number in range(start, end + 1):
                selected.add(number)

        else:
            if not part.isdigit():
                raise ValueError(f"Invalid number: {part}")

            selected.add(int(part))

    selected = sorted(selected)

    for number in selected:
        if number < 1 or number > max_number:
            raise ValueError(f"Number {number} is outside 1-{max_number}.")

    return selected


def choose_highlights(links):
    if not links:
        return []

    print(f"\nDetected {len(links)} highlight(s):")

    for i, link in enumerate(links, start=1):
        label = link.get("label") or link.get("id")
        print(f"{i:02d}. {label} | id={link.get('id')}")

    while True:
        raw = input(
            "\nWhich highlights do you want to back up?\n"
            "Examples: all | 1 | 1,3,5 | 2-4 | manual | q\n> "
        ).strip().lower()

        if raw in {"q", "quit", "exit"}:
            return None

        if raw in {"manual", "m"}:
            return []

        try:
            numbers = parse_selection(raw, len(links))
            return [links[n - 1] for n in numbers]

        except ValueError as exc:
            print(f"Invalid selection: {exc}")


def parse_content_range(value: str):
    if not value:
        return None

    match = re.search(r"bytes\s+(\d+)-(\d+)/(\d+|\*)", value)

    if not match:
        return None

    start = int(match.group(1))
    end = int(match.group(2))
    total = match.group(3)

    if total == "*":
        return None

    return start, end, int(total)


def range_download(context, url: str, path: Path, headers: dict, total: int, chunk_size=4 * 1024 * 1024):
    with path.open("wb") as file:
        for start in range(0, total, chunk_size):
            end = min(start + chunk_size - 1, total - 1)
            chunk_headers = dict(headers)
            chunk_headers["Range"] = f"bytes={start}-{end}"
            response = context.request.get(url, headers=chunk_headers, timeout=60_000)

            if response.status not in (200, 206):
                raise RuntimeError(f"Range download failed: HTTP {response.status}")

            body = response.body()

            if response.status == 200 and start == 0:
                file.write(body)
                return

            file.write(body)


def validate_file(path: Path):
    data = path.read_bytes()[:256]

    if len(data) < 16:
        raise RuntimeError("Downloaded file is too small to be valid.")

    if path.suffix.lower() == ".mp4":
        if b"ftyp" not in data[:64]:
            try:
                path.unlink()
            except Exception:
                pass

            raise RuntimeError(
                "Instagram returned a broken MP4 stream fragment instead of the full video. "
                "No corrupt file was kept."
            )


def download_full_media(context, page, url: str, out_dir: Path, filename_base: str, content_type_hint: str = "") -> Path:
    headers = {
        "accept": "*/*",
        "referer": page.url or "https://www.instagram.com/",
    }

    response = context.request.get(url, headers=headers, timeout=60_000)

    if response.status not in (200, 206):
        raise RuntimeError(f"Download failed: HTTP {response.status}")

    content_type = response.headers.get("content-type", content_type_hint)
    ext = extension_from_content_type(content_type, url)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{filename_base}{ext}"
    counter = 2

    while path.exists():
        path = out_dir / f"{filename_base}_{counter}{ext}"
        counter += 1

    parsed_range = parse_content_range(response.headers.get("content-range", ""))

    if response.status == 206 and parsed_range:
        _, _, total = parsed_range
        range_download(context, url, path, headers, total)
    else:
        path.write_bytes(response.body())

    validate_file(path)
    return path


def get_story_date(item: dict):
    taken_at = item.get("taken_at") or item.get("taken_at_timestamp")

    if not taken_at:
        return ""

    try:
        return datetime.fromtimestamp(int(taken_at)).strftime("%Y-%m-%d_%H-%M-%S")
    except Exception:
        return str(taken_at)


def item_summary(item: dict, number: int):
    _, kind = best_media_url_from_item(item)
    story_id = item.get("id") or item.get("pk") or ""
    date = get_story_date(item)

    if kind == "video":
        versions = item.get("video_versions") or []

        if versions:
            width = versions[0].get("width") or "?"
            height = versions[0].get("height") or "?"
        else:
            width = height = "?"

    else:
        candidates = ((item.get("image_versions2") or {}).get("candidates") or [])

        if candidates:
            width = candidates[0].get("width") or "?"
            height = candidates[0].get("height") or "?"
        else:
            width = height = "?"

    return f"{number:02d}. {kind or 'unknown'} | {width}x{height} | {date} | id={story_id}"


def download_selected_stories(context, page, out_root: Path, highlight_id: str, highlight_title: str, items: list, story_numbers: list):
    folder_name = safe_name(highlight_title) if highlight_title else f"highlight_{highlight_id}"
    highlight_folder = out_root / folder_name
    number_width = max(2, len(str(len(items))))

    print(f"\nBacking up {len(story_numbers)} story/stories from: {highlight_title or highlight_id}")
    print(f"Folder: {highlight_folder.resolve()}")

    failed = []

    for number in story_numbers:
        item = items[number - 1]
        media_url, media_kind = best_media_url_from_item(item)

        if not media_url:
            failed.append((number, "No media URL found"))
            print(f"[FAILED] Story {number}: No media URL found")
            continue

        ordered_number = str(number).zfill(number_width)
        story_id = str(item.get("id") or item.get("pk") or number)
        date = get_story_date(item) or datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename_base = safe_name(f"{ordered_number}_{date}_{story_id}")

        try:
            saved_path = download_full_media(
                context=context,
                page=page,
                url=media_url,
                out_dir=highlight_folder,
                filename_base=filename_base,
                content_type_hint="video/mp4" if media_kind == "video" else "image/jpeg",
            )

            size_mb = saved_path.stat().st_size / (1024 * 1024)
            print(f"[OK] {ordered_number}: {saved_path.name} ({size_mb:.2f} MB)")

        except Exception as exc:
            failed.append((number, str(exc)))
            print(f"[FAILED] Story {number}: {exc}")

    if failed:
        print("\nFailed:")
        for number, reason in failed:
            print(f"- Story {number}: {reason}")


def login_step(page):
    print("\nChrome is open with a dedicated Instagram backup profile.")
    print("Log into Instagram in the Chrome window if you are not already logged in.")
    print("After you can see Instagram normally, come back here.")
    input("\nPress ENTER after login is done... ")


def wait_for_user_to_be_on_profile(page, profile_arg: str = ""):
    if profile_arg:
        profile_url = normalize_profile_input(profile_arg)
        print(f"\nOpening provided profile: {profile_url}")
        page.goto(profile_url, wait_until="domcontentloaded")
        wait_for_page_ready(page)
        return profile_url

    while True:
        wait_for_page_ready(page)
        current_url = page.url

        if is_instagram_profile_url(current_url):
            print("\nUsing current Instagram profile:")
            print(current_url)
            return current_url

        print("\nYou are not on an Instagram profile page yet.")
        print("Go to the profile you want in Chrome.")
        print("Example: https://www.instagram.com/username/")
        print("\nDo not open a highlight yet. Stay on the main profile page.")
        input("\nPress ENTER after you are on the correct profile page... ")


def process_highlight_link(context, page, out_root: Path, link: dict, story_mode: str, debug=False):
    href = link["href"]
    page.goto(href, wait_until="domcontentloaded")
    wait_for_page_ready(page)

    highlight_id = find_highlight_id(page.url) or link.get("id")
    title, items = fetch_highlight_data(context, page, highlight_id)

    if debug:
        print("\n--- DEBUG HIGHLIGHT ---")
        print("URL:", page.url)
        print("ID:", highlight_id)
        print("Title:", title)
        print("Items:", len(items))

    if not items:
        print(f"\n[SKIP] Could not detect stories for highlight {highlight_id}")
        return

    print(f"\nHighlight: {title or link.get('label') or highlight_id}")
    print(f"Detected stories: {len(items)}")

    if story_mode == "all":
        story_numbers = list(range(1, len(items) + 1))
    else:
        print("\nStories:")

        for i, item in enumerate(items, start=1):
            print(item_summary(item, i))

        while True:
            raw = input("\nWhich stories? Examples: all | 1-5 | 2,4,9 | skip\n> ").strip().lower()

            if raw in {"skip", "s", ""}:
                print("Skipped.")
                return

            try:
                story_numbers = parse_selection(raw, len(items))
                break
            except ValueError as exc:
                print(f"Invalid selection: {exc}")

    download_selected_stories(
        context=context,
        page=page,
        out_root=out_root,
        highlight_id=highlight_id,
        highlight_title=title or link.get("label") or "",
        items=items,
        story_numbers=story_numbers,
    )


def manual_highlight_loop(context, page, out_root: Path, story_mode: str, debug=False):
    print("\nManual highlight mode.")
    print("Open any highlight in Chrome, then press ENTER here.")
    print("Type q when finished.")

    while True:
        raw = input("\nOpen a highlight, then press ENTER. q = quit manual mode.\n> ").strip().lower()

        if raw in {"q", "quit", "exit"}:
            return

        wait_for_page_ready(page)
        highlight_id = find_highlight_id(page.url)

        if not highlight_id:
            print("You are not on a highlight URL. Open a highlight first.")
            continue

        link = {
            "href": page.url,
            "id": highlight_id,
            "label": highlight_id,
        }

        process_highlight_link(
            context=context,
            page=page,
            out_root=out_root,
            link=link,
            story_mode=story_mode,
            debug=debug,
        )


def main():
    parser = argparse.ArgumentParser(
        description="Browser-assisted Instagram highlight backup for personal archival workflows."
    )

    parser.add_argument(
        "--profile",
        default="",
        help="Optional profile username/URL. Leave blank to use the current Chrome profile page.",
    )
    parser.add_argument("--out", default="downloads", help="Output folder.")
    parser.add_argument("--port", type=int, default=9222, help="Chrome remote debugging port.")
    parser.add_argument("--chrome-path", default="", help="Optional path to chrome.exe.")
    parser.add_argument(
        "--chrome-user-data-dir",
        default=str(Path(os.environ.get("LOCALAPPDATA", ".")) / "ChromeIGDebug"),
        help="Dedicated Chrome profile folder for this backup workflow.",
    )
    parser.add_argument(
        "--story-mode",
        choices=["all", "ask"],
        default="all",
        help="all = back up entire selected highlights. ask = choose story numbers per highlight.",
    )
    parser.add_argument("--debug", action="store_true", help="Print debug information.")

    args = parser.parse_args()
    chrome_path = args.chrome_path or find_chrome_exe()

    if not chrome_path:
        print("Could not find Google Chrome.")
        print("Use --chrome-path to point to chrome.exe.")
        return

    out_root = Path(args.out)
    user_data_dir = Path(args.chrome_user_data_dir)

    if not cdp_is_alive(args.port):
        print("\nStarting dedicated Chrome for Instagram backup...")
        print(f"Chrome profile folder: {user_data_dir}")
        launch_debug_chrome(chrome_path, user_data_dir, args.port)

    if not wait_for_cdp(args.port):
        print("\nChrome started, but the debug port did not open.")
        print("Try a different port: python ig_highlight_downloader.py --port 9223")
        return

    with sync_playwright() as playwright:
        browser = playwright.chromium.connect_over_cdp(f"http://127.0.0.1:{args.port}")

        if not browser.contexts:
            print("Connected to Chrome, but no browser context was found.")
            return

        context = browser.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()

        current_url = page.url or ""
        if "instagram.com" not in current_url:
            page.goto("https://www.instagram.com/", wait_until="domcontentloaded")

        wait_for_page_ready(page)
        login_step(page)
        wait_for_user_to_be_on_profile(page, args.profile)
        links = scan_profile_highlights(page)

        if not links:
            print("\nNo highlights were automatically detected on this profile.")
            print("You can use manual mode instead.")
            manual_highlight_loop(
                context=context,
                page=page,
                out_root=out_root,
                story_mode=args.story_mode,
                debug=args.debug,
            )
            print("\nFinished.")
            return

        selected_links = choose_highlights(links)

        if selected_links is None:
            print("\nFinished.")
            return

        if not selected_links:
            manual_highlight_loop(
                context=context,
                page=page,
                out_root=out_root,
                story_mode=args.story_mode,
                debug=args.debug,
            )
            print("\nFinished.")
            return

        print(f"\nSelected {len(selected_links)} highlight(s).")
        print(f"Story mode: {args.story_mode}")

        for index, link in enumerate(selected_links, start=1):
            print("\n==============================")
            print(f"Highlight {index}/{len(selected_links)}")
            print("==============================")

            try:
                process_highlight_link(
                    context=context,
                    page=page,
                    out_root=out_root,
                    link=link,
                    story_mode=args.story_mode,
                    debug=args.debug,
                )
            except KeyboardInterrupt:
                print("\nStopped by user.")
                break
            except Exception as exc:
                print(f"\n[ERROR] Highlight failed: {exc}")

    print("\nFinished.")
    print("Chrome stays open. You can close it manually.")


if __name__ == "__main__":
    main()
