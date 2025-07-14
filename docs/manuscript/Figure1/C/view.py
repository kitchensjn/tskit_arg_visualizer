import tszip
import tskit_arg_visualizer as argviz

ts = tszip.load("v1-beta1_2023-02-21.pp.md.bpshift.ts.dated.il.tsz")

d3arg = argviz.D3ARG.from_ts(ts, progress=True)
print(f"Loaded {ts.num_nodes} nodes, with {ts.num_samples} samples")

import tskit
import numpy as np
NODE_IS_RECOMBINANT = 8388608  # from sc2ts

print("Setting node symbols", )
d3arg_node_is_sample = d3arg.nodes.ts_flags & tskit.NODE_IS_SAMPLE != 0
d3arg.nodes.loc[d3arg_node_is_sample, "symbol"] = "d3.symbolSquare"  # Mark the "sample" nodes as squares


print("Setting node labels")
labels = {nd.id: nd.metadata.get("Viridian_pangolin", "") for nd in ts.nodes()}
df = d3arg.nodes.set_index("id")
df.loc[list(labels.keys()), 'label'] = list(labels.values())
d3arg.nodes["label"] = df.label

print("Setting node colours")
unknown = {k: v for k, v in labels.items() if v == ""}
xa = {k: v for k, v in labels.items() if v == "XA"}
print(f"Found {len([_ for u in xa if ts.node(u).is_sample()])} XA samples")
df.loc[list(unknown.keys()), 'fill'] = "silver"
df.loc[list(xa.keys()), 'fill'] = "magenta"
d3arg.nodes["fill"] = df.fill
# overwrite recombination nodes
d3arg_node_is_re = d3arg.nodes.ts_flags & NODE_IS_RECOMBINANT != 0
d3arg.nodes.loc[d3arg_node_is_re, "fill"] = "black"  # Mark the recombination nodes in black

print("Setting spike mutation colours")
spike = [21563, 25384]
d3arg_mut_not_in_spike = np.logical_or(
    d3arg.mutations.position < spike[0],
    d3arg.mutations.position > spike[1]
)
d3arg.mutations.loc[d3arg_mut_not_in_spike, "fill"] = "lightgrey"

import datetime
print("Checking which dates correspond to integer times")
print(ts.node(122443).time, "=", ts.node(122443).metadata["date"])

XA_origin = 122444

# Requires a version of tskit_arg_visualizer that includes https://github.com/kitchensjn/tskit_arg_visualizer/pull/168

d3arg.draw_nodes(
    [XA_origin, 151710, 122443, 1596164, 184569, 193356, 190315, 1610266, 1626214],
    degree=(2,0),
    show_mutations=True,
    label_mutations=True,
    width=400, height=650,
    y_axis_labels={
        750+31+31+30+31: 'Oct 2020',
        750+31+31+30: 'Nov 2020',
        750+31+31: 'Dec 2020',
        750+31: 'Jan 2021',
        750: 'Feb 2021',
        750-28: 'Mar 2021',
        750-28-31: 'Apr 2021',
    },
    styles = [".sites text {text-anchor: end; transform: rotate(90deg); transform-origin: 0 -10px;}"]
)
