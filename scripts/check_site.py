"""Validate internal links and essential metadata in a built Hugo site."""

from __future__ import annotations

import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []
        self.description = ""
        self.canonical = ""
        self.robots = ""
        self.is_redirect = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag in {"a", "link"} and values.get("href"):
            self.links.append(values["href"] or "")
        if tag in {"img", "script", "source"} and values.get("src"):
            self.links.append(values["src"] or "")
        if tag == "meta" and values.get("name", "").lower() == "description":
            self.description = (values.get("content") or "").strip()
        if tag == "meta" and values.get("name", "").lower() == "robots":
            self.robots = (values.get("content") or "").strip().lower()
        if tag == "meta" and values.get("property", "").lower() == "og:image":
            self.links.append(values.get("content") or "")
        if tag == "meta" and values.get("name", "").lower() == "twitter:image":
            self.links.append(values.get("content") or "")
        if tag == "meta" and values.get("http-equiv", "").lower() == "refresh":
            self.is_redirect = True
        if tag == "link" and "canonical" in (values.get("rel") or "").split():
            self.canonical = (values.get("href") or "").strip()


def local_target(site_root: Path, page: Path, value: str) -> Path | None:
    parsed = urlparse(value)
    if value.startswith(("#", "mailto:", "tel:", "data:")):
        return None
    if (parsed.scheme or parsed.netloc) and parsed.netloc != "teddythewriter.github.io":
        return None

    path = unquote(parsed.path)
    if path.startswith("/teddywrites/"):
        target = site_root / path.removeprefix("/teddywrites/")
    elif path.startswith("/"):
        target = site_root / path.lstrip("/")
    else:
        target = page.parent / path

    if path.endswith("/") or target.is_dir():
        target = target / "index.html"
    return target.resolve()


def main() -> int:
    site_root = Path(sys.argv[1] if len(sys.argv) > 1 else "public").resolve()
    if not site_root.is_dir():
        print(f"Build directory not found: {site_root}")
        return 1

    issues: list[str] = []
    forbidden = ("contact@example.com", "https://www.example.com", "Berlin, Germany", "My Site")

    manifest = site_root / "site.webmanifest"
    if not manifest.is_file():
        issues.append("site.webmanifest: file is missing")

    for page in site_root.rglob("*.html"):
        text = page.read_text(encoding="utf-8")
        parser = PageParser()
        parser.feed(text)
        relative = page.relative_to(site_root)

        if not parser.description and not parser.is_redirect:
            issues.append(f"{relative}: missing meta description")
        if not parser.canonical and not parser.is_redirect:
            issues.append(f"{relative}: missing canonical URL")
        if page.name == "404.html" and "noindex" not in parser.robots:
            issues.append(f"{relative}: 404 page must be noindex")
        for marker in forbidden:
            if marker in text:
                issues.append(f"{relative}: contains placeholder text {marker!r}")

        for link in parser.links:
            target = local_target(site_root, page, link)
            if target is not None and not target.exists():
                issues.append(f"{relative}: missing target for {link!r}")

    if issues:
        print("Site validation failed:")
        for issue in sorted(set(issues)):
            print(f"- {issue}")
        return 1

    print("Site validation passed: links, assets, and metadata are present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
