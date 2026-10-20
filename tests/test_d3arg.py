import tskit

import tskit_arg_visualizer as argviz


def _draw_json(d3arg, monkeypatch, **draw_kwargs):
    """Draw with default settings and return the JSON that is sent to the UI."""
    captured = {}

    def fake_draw_D3(arg_json, **_kwargs):
        captured.update(arg_json)
        return argviz.DrawInfo(0, 0, "", False, argviz.IncludedObjects())

    monkeypatch.setattr(argviz, "draw_D3", fake_draw_D3)
    d3arg.draw(**draw_kwargs)
    return captured


def test_from_json_without_mutations(monkeypatch):
    # an empty mutation list must still give a table with the standard columns
    d3arg = argviz.D3ARG.from_ts(tskit.Tree.generate_balanced(4).tree_sequence)
    arg = _draw_json(d3arg, monkeypatch)
    for node in arg["data"]["nodes"]:  # the UI adds x when saving
        node["x"] = node.get("fx", 150)
    reloaded = argviz.D3ARG.from_json(arg)
    assert len(reloaded.mutations) == 0
    assert list(reloaded.mutations.columns) == list(d3arg.mutations.columns)
