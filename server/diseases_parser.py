import json
import os
import re
from pathlib import Path
from typing import Optional, List, Dict, Any
from bs4 import BeautifulSoup


def extract_background_image_url(style_value: Optional[str]) -> Optional[str]:
    """Given a style string like "background-image:url('https://...')", return the URL.
    Supports single/double quotes and no quotes.
    """
    if not style_value:
        return None
    # Look for url(...) pattern
    m = re.search(r"background-image\s*:\s*url\((['\"]?)(.+?)\1\)", style_value, flags=re.IGNORECASE)
    return m.group(2) if m else None


def parse_diseases(html_path: Path) -> List[Dict[str, Any]]:
    """Parse the perenual diseases HTML and return a list of dict entries with
    href, image, name, solutions_count.
    """
    html_text = html_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html_text, "html.parser")

    items: List[Dict[str, Any]] = []
    # Each card is an <a> with classes: search-container-box shadow relative
    for a in soup.select("a.search-container-box.shadow.relative"):
        href = a.get("href")
        # Try to extract numeric id from href last path segment
        item_id = None
        if href:
            try:
                last_segment = href.rstrip('/').split('/')[-1]
                item_id = int(last_segment)
            except Exception:
                item_id = None

        # Image is in a div.aspect-video.bg-cover.bg-center with style background-image:url(...)
        img_url = None
        img_div = a.select_one("div.aspect-video.bg-cover.bg-center")
        if img_div and img_div.has_attr("style"):
            img_url = extract_background_image_url(img_div.get("style"))

        # Name text element
        name_el = a.select_one(".text-xl.font-bold.line-clamp-2")
        name = name_el.get_text(strip=True) if name_el else None

        # Solutions count from .main-t-c (e.g., "3 Solutions")
        sol_el = a.select_one(".main-t-c")
        sol_text = sol_el.get_text(strip=True) if sol_el else ""
        m = re.search(r"(\d+)", sol_text)
        solutions_count = int(m.group(1)) if m else None

        items.append({
                "id": item_id,
            "href": href,
            "image": img_url,
            "name": name,
            "solutions_count": solutions_count,
        })

    return items


def main():
    base_dir = Path(__file__).parent
    html_path = base_dir / "perenual_diseases.html"
    out_path = base_dir / "perenual_diseases_list.json"

    if not html_path.exists():
        raise FileNotFoundError(f"HTML file not found: {html_path}")

    items = parse_diseases(html_path)

    # Write array JSON
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    print(f"Written {len(items)} entries to {out_path}")


if __name__ == "__main__":
    main()
