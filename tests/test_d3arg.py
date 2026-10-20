import pytest
import tskit

import tskit_arg_visualizer as argviz


def _balanced_ts_with_mutation():
    tables = tskit.Tree.generate_balanced(4).tree_sequence.dump_tables()
    tables.sites.add_row(position=0.5, ancestral_state="A")
    tables.mutations.add_row(site=0, node=0, derived_state="T")
    return tables.tree_sequence()


def _draw_json(d3arg, monkeypatch, **draw_kwargs):
    """Draw with default settings and return the JSON that is sent to the UI."""
    captured = {}

    def fake_draw_D3(arg_json, **_kwargs):
        captured.update(arg_json)
        return argviz.DrawInfo(0, 0, "", False, argviz.IncludedObjects())

    monkeypatch.setattr(argviz, "draw_D3", fake_draw_D3)
    d3arg.draw(**draw_kwargs)
    return captured


@pytest.mark.parametrize("y_axis_labels,left_edge", [(True, 150), (False, 50)])
def test_roundtrip_edges(monkeypatch, y_axis_labels, left_edge):
    # Nodes dragged to the leftmost/rightmost allowed x in the UI must map
    # back to exactly 0 and 1, with or without the y-axis label space.
    # from_json must account for the y-axis label space (cf. extract_x_positions_from_json)
    d3arg = argviz.D3ARG.from_ts(_balanced_ts_with_mutation())
    ids = d3arg.nodes["id"].tolist()
    d3arg.set_node_x_positions({i: float(n % 2) for n, i in enumerate(ids)})
    arg = _draw_json(d3arg, monkeypatch, y_axis_labels=y_axis_labels, show_mutations=True)
    right_edge = arg["width"] - 50
    for node in arg["data"]["nodes"]:  # mimic the JS clamping in ticked()
        node["x"] = max(left_edge, min(right_edge, node["fx"]))
    assert min(n["x"] for n in arg["data"]["nodes"]) == left_edge
    pos = argviz.extract_x_positions_from_json(arg)
    for n, i in enumerate(ids):
        assert pos[i] == pytest.approx(float(n % 2))
    # from_json must agree with extract_x_positions_from_json
    reloaded = argviz.D3ARG.from_json(arg)
    for n, i in enumerate(ids):
        val = reloaded.nodes.loc[reloaded.nodes["id"] == i, "x_pos_01"].iloc[0]
        assert val == pytest.approx(float(n % 2))


def test_from_json_without_mutations(monkeypatch):
    # an empty mutation list must still give a table with the standard columns
    d3arg = argviz.D3ARG.from_ts(tskit.Tree.generate_balanced(4).tree_sequence)
    arg = _draw_json(d3arg, monkeypatch)
    for node in arg["data"]["nodes"]:  # the UI adds x when saving
        node["x"] = node.get("fx", 150)
    reloaded = argviz.D3ARG.from_json(arg)
    assert len(reloaded.mutations) == 0
    assert list(reloaded.mutations.columns) == list(d3arg.mutations.columns)


def test_nan_x_position_is_not_passed_to_force_layout(monkeypatch):
    d3arg = argviz.D3ARG.from_ts(_balanced_ts_with_mutation())
    d3arg.nodes["x_pos_01"] = 0.5
    nan_node_id = d3arg.nodes["id"].iloc[0]
    d3arg.nodes.loc[d3arg.nodes["id"] == nan_node_id, "x_pos_01"] = float("nan")

    arg = _draw_json(d3arg, monkeypatch)
    nan_node = next(node for node in arg["data"]["nodes"] if node["id"] == nan_node_id)

    assert "fx" not in nan_node
