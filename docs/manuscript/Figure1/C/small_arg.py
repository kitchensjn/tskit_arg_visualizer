import sys
sys.path.append("/Users/jameskitchens/Documents/GitHub/tskit_arg_visualizer/")
import tskit_arg_visualizer as viz
import json
import datetime

arg_json = json.load(open("/Users/jameskitchens/Documents/GitHub/tskit_arg_visualizer/docs/manuscript/Figure1/C/ARGviz-XA.json", "r"))

zero_date = datetime.date(year=2023, month=2, day=21)

d3arg = viz.D3ARG.from_json(arg_json)

d3arg.nodes.loc[d3arg.nodes["id"]==122444, "symbol"] = "d3.symbolStar"
d3arg.nodes.loc[d3arg.nodes["id"]==122444, "fill"] = "gold"
d3arg.nodes.loc[d3arg.nodes["id"]==122444, "stroke_width"] = 4
d3arg.nodes.loc[d3arg.nodes["id"]==122444, "size"] = 400

d3arg.draw_node(
    122444,
    depth=(1,100),
    show_mutations=True,
    label_mutations=True,
    width=400, height=650,
    rotate_tip_labels=True,
    y_axis_labels={
        (zero_date - datetime.date(year=2020, month=12, day=1)).days: 'Dec 2020',
        (zero_date - datetime.date(year=2021, month=1, day=1)).days: 'Jan 2021',
        (zero_date - datetime.date(year=2021, month=2, day=1)).days: 'Feb 2021',
        (zero_date - datetime.date(year=2021, month=3, day=1)).days: 'Mar 2021',
        (zero_date - datetime.date(year=2021, month=4, day=1)).days: 'Apr 2021',
        (zero_date - datetime.date(year=2021, month=5, day=1)).days: 'May 2021',
    },
    styles = [".sites text {text-anchor: end; transform: rotate(90deg); transform-origin: 0 -10px;}"]
)