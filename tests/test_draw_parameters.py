import io
import inspect

import pandas as pd

import tskit_arg_visualizer
from tskit_arg_visualizer import D3ARG, draw_D3


def _minimal_arg_json():
    return {
        "data": {"nodes": [], "edges": [], "mutations": [], "breakpoints": []},
        "width": 100,
        "height": 100,
        "y_axis": {"include_labels": True},
        "edges": {"type": "line"},
        "condense_mutations": False,
        "label_mutations": False,
        "tree_highlighting": True,
        "title": "None",
        "rotate_tip_labels": False,
        "plot_type": "full",
    }


def _minimal_d3arg():
    return D3ARG(
        nodes=pd.DataFrame(columns=["id", "time"]),
        edges=pd.DataFrame(columns=["source", "target", "bounds"]),
        mutations=pd.DataFrame(columns=["position_01"]),
        breakpoints=pd.DataFrame(
            [
                {"start": 0.0, "stop": 1.0, "x_pos_01": 0.0, "width_01": 1.0, "fill": "#053e4e"}
            ]
        ),
        num_samples=0,
        sample_order=[],
        default_node_style={},
        time_units="generations",
    )


class TestDrawParametersD3js:
    def test_draw_D3_default_uses_default_url(self, monkeypatch):
        call_args = None

        def mock_display(*args, **kwargs):
            nonlocal call_args
            call_args = (args, kwargs)

        monkeypatch.setattr(tskit_arg_visualizer, "display", mock_display)
        draw_D3(_minimal_arg_json(), is_notebook=True)
        html = call_args[0][0].data
        assert "https://d3js.org/d3.v7.min" in html

    def test_public_draw_apis_accept_d3js_parameter(self):
        assert "d3js" in inspect.signature(D3ARG.draw).parameters
        assert "d3js" in inspect.signature(D3ARG.draw_node).parameters
        assert "d3js" in inspect.signature(D3ARG.draw_nodes).parameters
        assert "d3js" in inspect.signature(D3ARG.draw_genome_bar).parameters

    def test_draw_D3_uses_url_override(self, monkeypatch):
        custom_url = "https://example.org/custom/d3.min"
        call_args = None

        def mock_display(*args, **kwargs):
            nonlocal call_args
            call_args = (args, kwargs)

        monkeypatch.setattr(tskit_arg_visualizer, "display", mock_display)
        draw_D3(_minimal_arg_json(), is_notebook=True, d3js=custom_url)
        html = call_args[0][0].data
        assert custom_url in html
        assert "https://d3js.org/d3.v7.min" not in html

    def test_draw_D3_inlines_file_like_content(self, monkeypatch):
        inline_js = b"window.d3 = {version: 'inline'};"
        call_args = None

        def mock_display(*args, **kwargs):
            nonlocal call_args
            call_args = (args, kwargs)

        monkeypatch.setattr(tskit_arg_visualizer, "display", mock_display)
        draw_D3(_minimal_arg_json(), is_notebook=True, d3js=io.BytesIO(inline_js))
        html = call_args[0][0].data
        assert "<script>window.d3 = {version: 'inline'};</script>" in html

    def test_draw_genome_bar_uses_d3js_override(self, monkeypatch):
        d3arg = _minimal_d3arg()
        custom_url = "https://example.org/alt/d3.min"
        call_args = None

        def mock_display(*args, **kwargs):
            nonlocal call_args
            call_args = (args, kwargs)

        monkeypatch.setattr(tskit_arg_visualizer, "display", mock_display)
        d3arg.draw_genome_bar(is_notebook=True, d3js=custom_url)
        html = call_args[0][0].data
        assert custom_url in html

    def test_draw_genome_bar_inlines_file_like_content(self, monkeypatch):
        d3arg = _minimal_d3arg()
        call_args = None

        def mock_display(*args, **kwargs):
            nonlocal call_args
            call_args = (args, kwargs)

        monkeypatch.setattr(tskit_arg_visualizer, "display", mock_display)
        d3arg.draw_genome_bar(is_notebook=True, d3js=io.StringIO("window.d3 = {};"))
        html = call_args[0][0].data
        assert "<script>window.d3 = {};</script>" in html

    def test_draw_genome_bar_default_uses_default_url(self, monkeypatch):
        d3arg = _minimal_d3arg()
        call_args = None

        def mock_display(*args, **kwargs):
            nonlocal call_args
            call_args = (args, kwargs)

        monkeypatch.setattr(tskit_arg_visualizer, "display", mock_display)
        d3arg.draw_genome_bar(is_notebook=True)
        html = call_args[0][0].data
        assert "https://d3js.org/d3.v7.min" in html
