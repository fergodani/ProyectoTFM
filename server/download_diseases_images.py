"""
Download disease images referenced in a JSON and add a `local_image` field
to each disease entry. By default the script updates the source JSON in-place
but it will create a backup at `<src>.bak`.

Usage:
  python download_diseases_images.py --src disease-list-mock.json

This will create `media/diseases/` and add `local_image` entries like
`/media/diseases/123_image.jpg` to each item in the JSON.
"""

import os
import json
import requests
import argparse
import shutil
from pathlib import Path
from urllib.parse import urlparse
from typing import Optional


def ensure_dir(p: str) -> None:
    Path(p).mkdir(parents=True, exist_ok=True)


def filename_from_url(url: str) -> str:
    p = urlparse(url).path
    return os.path.basename(p)


def download(url: str, dest_path: str, timeout: int = 15) -> None:
    r = requests.get(url, timeout=timeout)
    r.raise_for_status()
    with open(dest_path, "wb") as f:
        f.write(r.content)


def main(src_json: str, out_json: Optional[str], media_dir: str, size_field: str = "small_url") -> None:
    # Resolve paths relative to script cwd
    src_json = os.path.abspath(src_json)
    if out_json:
        out_json = os.path.abspath(out_json)
    else:
        out_json = src_json

    media_dir = os.path.abspath(media_dir)
    ensure_dir(media_dir)

    # Backup original if writing in-place
    if out_json == src_json:
        backup_path = src_json + ".bak"
        if not os.path.exists(backup_path):
            shutil.copy(src_json, backup_path)

    with open(src_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Support two shapes:
    # 1) { "data": [ ... ] }
    # 2) [ { ... }, { ... } ]
    entries = None
    if isinstance(data, dict) and "data" in data and isinstance(data["data"], list):
        entries = data["data"]
    elif isinstance(data, list):
        entries = data
    else:
        raise SystemExit("Unsupported JSON structure: expected list or {'data': [...]}.")

    for item in entries:
        # If the item already has a direct `image` field (list file), prefer it
        direct_image = item.get("image")
        chosen = direct_image
        fname = f"{item.get('id')}_{filename_from_url(chosen)}"
        dest = os.path.join(media_dir, fname)
        try:
            if not os.path.exists(dest):
                print(f"Downloading {chosen} to {dest}...")
                download(chosen, dest)
            # Public path served by Django MEDIA_URL (adjust if needed)
            item["local_image"] = f"/media/diseases/{fname}"
        except Exception as e:
            print(f"Error downloading {chosen}: {e}")
            item["local_image"] = None

    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("Finished. Wrote:", out_json)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Download disease images and add local_image to JSON")
    p.add_argument("--src", default="perenual_diseases_list.json", help="Source JSON file")
    p.add_argument("--out", default=None, help="Output JSON file (default: overwrite src)")
    p.add_argument("--media-dir", default="media/diseases", help="Directory to save images")
    p.add_argument("--size-field", default="small_url", help="Image size field to prefer")
    args = p.parse_args()
    main(args.src, args.out, args.media_dir, args.size_field)