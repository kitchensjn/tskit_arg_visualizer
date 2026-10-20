"""Writes the root index.html of the Pages site, listing the versions present.

Usage: python docs/pages/build_index.py SITE_DIR
"""
import pathlib
import sys


def build(site_dir):
    site_dir = pathlib.Path(site_dir)
    links = []
    for name in ("stable", "latest"):
        if (site_dir / name).is_dir():
            links.append(name)
    versions = sorted(
        (p.name for p in site_dir.iterdir() if p.is_dir() and p.name[:1].isdigit()),
        reverse=True,
    )
    items = "".join(f'<li><a href="{n}/">{n}</a></li>' for n in links + versions)
    (site_dir / "index.html").write_text(
        "<!DOCTYPE html><html><head><meta charset='utf-8'>"
        "<title>tskit_arg_visualizer</title></head><body>"
        "<h1>tskit_arg_visualizer examples</h1>"
        "<p><b>stable</b> is the most recent release; <b>latest</b> is the main branch.</p>"
        f"<ul>{items}</ul></body></html>",
        encoding="utf-8",
    )


if __name__ == "__main__":
    build(sys.argv[1])
