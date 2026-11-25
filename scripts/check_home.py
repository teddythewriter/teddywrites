"""Validate the homepage opening-line hero in a built Hugo site."""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
KEYS = {"line", "title", "url", "form", "date", "lang"}


class HomeParser(HTMLParser):
    """Collects attributes and text of the elements the hero contract names."""

    def __init__(self) -> None:
        super().__init__()
        self.order: list[str] = []  # classes of interest, in document order
        self.ol: dict[str, dict] = {}  # data-ol name -> {"attrs", "text"}
        self.json_text = ""
        self.browse_hrefs: list[str] = []
        self.browse_text = ""
        self.has_tile = False
        self._stack: list[tuple[str, list[str]]] = []  # (tag, capture keys)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {k: v or "" for k, v in attrs}
        classes = values.get("class", "").split()
        if "entry-tile" in classes or "entry-tiles" in classes:
            self.has_tile = True
        for name in ("browse-row", "palette-strip"):
            if name in classes:
                self.order.append(name)
        inherited = list(self._stack[-1][1]) if self._stack else []
        keys = [k for k in inherited]
        if "data-ol" in values:
            self.ol[values["data-ol"]] = {"attrs": values, "text": ""}
            keys.append("ol:" + values["data-ol"])
        if tag == "script" and values.get("id") == "opening-lines":
            keys.append("json")
        if "browse-row" in classes:
            keys.append("browse")
        if tag == "a" and "browse" in keys:
            self.browse_hrefs.append(values.get("href", ""))
        if tag not in VOID:
            self._stack.append((tag, keys))

    def handle_endtag(self, tag: str) -> None:
        while self._stack:
            open_tag, _ = self._stack.pop()
            if open_tag == tag:
                break

    def handle_data(self, data: str) -> None:
        if not self._stack:
            return
        for key in self._stack[-1][1]:
            if key == "json":
                self.json_text += data
            elif key == "browse":
                self.browse_text += data
            elif key.startswith("ol:"):
                self.ol[key[3:]]["text"] += data


def fail(message: str) -> int:
    print(f"check_home: FAIL: {message}")
    return 1


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def main() -> int:
    site_root = Path(sys.argv[1] if len(sys.argv) > 1 else "public")
    page = site_root / "en" / "index.html"
    if not page.is_file():
        return fail(f"{page} not found")
    parser = HomeParser()
    parser.feed(page.read_text(encoding="utf-8"))

    if parser.has_tile:
        return fail("entry tiles are still on the homepage")
    try:
        entries = json.loads(parser.json_text)
    except json.JSONDecodeError as error:
        return fail(f"#opening-lines is not valid JSON: {error}")
    if not isinstance(entries, list) or not entries:
        return fail("#opening-lines is empty")
    for entry in entries:
        if set(entry) != KEYS:
            return fail(f"entry keys {sorted(entry)} != {sorted(KEYS)}")
        if not (entry["line"] and entry["title"] and entry["url"]):
            return fail(f"entry missing line/title/url: {entry}")

    newest = entries[0]
    for name in ("label", "line", "title", "read", "another"):
        if name not in parser.ol:
            return fail(f"[data-ol={name}] missing")
    if norm(parser.ol["line"]["text"]) != norm(newest["line"]):
        return fail(f"default line {parser.ol['line']['text']!r} != newest {newest['line']!r}")
    if parser.ol["line"]["attrs"].get("lang") != newest["lang"]:
        return fail("default line lang does not match newest entry")
    read = parser.ol["read"]
    if read["attrs"].get("href") != newest["url"]:
        return fail(f"read href {read['attrs'].get('href')!r} != {newest['url']!r}")
    if not norm(read["text"]).startswith("Read "):
        return fail(f"read button text {read['text']!r}")
    if "aria-live" in parser.ol["line"]["attrs"]:
        return fail("aria-live must be set by JS after the first pick, not server-rendered")
    if "hidden" not in parser.ol["another"]["attrs"]:
        return fail("'Show me another' must be server-rendered hidden")

    for path in ("/stories/", "/fragments/", "/letters/", "/series/"):
        if not any(href.endswith(path) for href in parser.browse_hrefs):
            return fail(f"browse row has no link to {path}")
    for word in ("stories", "fragments", "letters"):
        if not re.search(rf"\d+ {word}", parser.browse_text):
            return fail(f"browse row has no count for {word}")
    if parser.order[:2] != ["browse-row", "palette-strip"]:
        return fail(f"expected browse-row before palette-strip, got {parser.order}")

    print(f"check_home: OK ({len(entries)} opening lines)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
