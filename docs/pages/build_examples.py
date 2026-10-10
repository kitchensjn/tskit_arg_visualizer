"""Builds the live example pages published to GitHub Pages.

Usage: python docs/pages/build_examples.py OUTPUT_DIR [VERSION_LABEL]
"""
import html
import pathlib
import sys

import msprime

import tskit_arg_visualizer as argviz


def example_arg():
    ts = msprime.sim_ancestry(
        samples=5,
        recombination_rate=1e-8,
        sequence_length=3_000,
        population_size=10_000,
        record_full_arg=True,
        random_seed=1234,
    )
    ts = msprime.sim_mutations(ts, rate=1e-7, random_seed=4321)
    return argviz.D3ARG.from_ts(ts)


def build(out_dir, label):
    out_dir = pathlib.Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    d3arg = example_arg()
    pages = {
        "full-arg.html": ("Full ARG", d3arg.to_html(show_mutations=True)),
        "subgraph.html": (
            "Subgraph around nodes",
            d3arg.to_html_nodes(seed_nodes=[0, 1], depth=3, rotate_tip_labels=True),
        ),
    }
    items = []
    for filename, (title, page) in pages.items():
        (out_dir / filename).write_text(page, encoding="utf-8")
        items.append(f'<li><a href="{filename}">{html.escape(title)}</a></li>')
    (out_dir / "index.html").write_text(
        "<!DOCTYPE html><html><head><meta charset='utf-8'>"
        f"<title>tskit_arg_visualizer examples ({html.escape(label)})</title></head><body>"
        f"<h1>tskit_arg_visualizer examples: {html.escape(label)}</h1>"
        f"<ul>{''.join(items)}</ul></body></html>",
        encoding="utf-8",
    )


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "latest")
