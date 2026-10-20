import msprime
import pytest

import tskit_arg_visualizer as argviz


@pytest.fixture(scope="module")
def d3arg():
    ts = msprime.sim_ancestry(
        3, sequence_length=1e3, recombination_rate=1e-3, random_seed=1,
        model="dtwf", population_size=10,
    )
    return argviz.D3ARG.from_ts(ts)


def test_to_html_is_standalone_document(d3arg):
    html = d3arg.to_html()
    assert html.startswith("<!DOCTYPE html>")
    assert 'class="d3arg"' in html
    assert "<script>" in html


def test_to_html_passes_draw_kwargs(d3arg):
    assert "min-width:940.0px" in d3arg.to_html(width=800)
    assert "my-style {}" in d3arg.to_html(styles=["my-style {}"])


def test_to_html_rejects_unknown_kwargs(d3arg):
    with pytest.raises(TypeError):
        d3arg.to_html(not_a_parameter=1)


def test_to_html_does_not_open_browser(d3arg, monkeypatch):
    def fail(*args, **kwargs):
        raise AssertionError("browser opened")
    monkeypatch.setattr(argviz.webbrowser, "open", fail)
    d3arg.to_html()


def test_write_html(d3arg, tmp_path):
    path = tmp_path / "out.html"
    d3arg.write_html(path, width=600)
    text = path.read_text(encoding="utf-8")
    assert text.startswith("<!DOCTYPE html>")
    assert "min-width:740.0px" in text


def test_to_html_nodes(d3arg):
    seed = int(d3arg.nodes["id"].iloc[0])
    html = d3arg.to_html_nodes(seed, depth=2, width=800)
    assert html.startswith("<!DOCTYPE html>")
    assert "min-width:940.0px" in html
    with pytest.raises(TypeError):
        d3arg.to_html_nodes(seed, not_a_parameter=1)


def test_write_html_nodes(d3arg, tmp_path):
    path = tmp_path / "node.html"
    seed = int(d3arg.nodes["id"].iloc[0])
    d3arg.write_html_nodes(path, seed)
    assert path.read_text(encoding="utf-8").startswith("<!DOCTYPE html>")
