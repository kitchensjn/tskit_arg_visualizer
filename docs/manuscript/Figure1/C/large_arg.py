import sys
sys.path.append("/Users/jameskitchens/Documents/GitHub/tskit_arg_visualizer/")
import tskit_arg_visualizer as viz
import json
import datetime

arg_json = json.load(open("/Users/jameskitchens/Documents/GitHub/tskit_arg_visualizer/docs/manuscript/Figure1/C/ARGviz-XA.json", "r"))

#print(arg_json["show_mutations"])
#viz.draw_D3(arg_json)

zero_date = datetime.date(year=2023, month=2, day=21)

d3arg = viz.D3ARG.from_json(arg_json)

d3arg.nodes.loc[d3arg.nodes["id"]==122444, "symbol"] = "d3.symbolStar"
d3arg.nodes.loc[d3arg.nodes["id"]==122444, "fill"] = "gold"
d3arg.nodes.loc[d3arg.nodes["id"]==122444, "stroke_width"] = 4
d3arg.nodes.loc[d3arg.nodes["id"]==122444, "size"] = 400

d3arg.draw(
    width=2000,
    height=3000,
    show_mutations=False,
    y_axis_labels={
        (zero_date - datetime.date(year=2019, month=12, day=1)).days: 'Dec 2019',
        (zero_date - datetime.date(year=2020, month=1, day=1)).days: 'Jan 2020',
        (zero_date - datetime.date(year=2020, month=2, day=1)).days: 'Feb 2020',
        (zero_date - datetime.date(year=2020, month=3, day=1)).days: 'Mar 2020',
        (zero_date - datetime.date(year=2020, month=4, day=1)).days: 'Apr 2020',
        (zero_date - datetime.date(year=2020, month=5, day=1)).days: 'May 2020',
        (zero_date - datetime.date(year=2020, month=6, day=1)).days: 'Jun 2020',
        (zero_date - datetime.date(year=2020, month=7, day=1)).days: 'Jul 2020',
        (zero_date - datetime.date(year=2020, month=8, day=1)).days: 'Aug 2020',
        (zero_date - datetime.date(year=2020, month=9, day=1)).days: 'Sept 2020',
        (zero_date - datetime.date(year=2020, month=10, day=1)).days: 'Oct 2020',
        (zero_date - datetime.date(year=2020, month=11, day=1)).days: 'Nov 2020',
        (zero_date - datetime.date(year=2020, month=12, day=1)).days: 'Dec 2020',
        (zero_date - datetime.date(year=2021, month=1, day=1)).days: 'Jan 2021',
        (zero_date - datetime.date(year=2021, month=2, day=1)).days: 'Feb 2021',
        (zero_date - datetime.date(year=2021, month=3, day=1)).days: 'Mar 2021',
        (zero_date - datetime.date(year=2021, month=4, day=1)).days: 'Apr 2021',
        (zero_date - datetime.date(year=2021, month=5, day=1)).days: 'May 2021',
    }
)