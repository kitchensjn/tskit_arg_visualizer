import sys
sys.path.append("../../../tskit_arg_visualizer")

import tskit
import msprime
import numpy as np
import tskit_arg_visualizer



tables = tskit.TableCollection(sequence_length=1e3)
node_table = tables.nodes  # set up an alias, for efficiency
node_table.add_row(flags=tskit.NODE_IS_SAMPLE)  # Node 0
node_table.add_row(flags=tskit.NODE_IS_SAMPLE)  # Node 1
node_table.add_row(time=2, flags=msprime.NODE_IS_RE_EVENT)  # Node 2
node_table.add_row(time=2, flags=msprime.NODE_IS_RE_EVENT)  # Node 3
node_table.add_row(time=3)  # Node 4
node_table.add_row(time=5)  # Node 5

edge_table = tables.edges
edge_table.set_columns(
    left=np.array([0, 500, 0, 500, 0, 0]),
    right=np.array([500, 1e3, 1e3, 1e3, 500, 500]),
    parent=np.array([2, 3, 4, 4, 5, 5], dtype=np.int32),  # References IDs in the node table
    child=np.array([0, 0, 1, 3, 2, 4], dtype=np.int32),  # References IDs in the node table
)

tables.sort()  # make sure the edges & sites are in the right order
ts = tables.tree_sequence()


d3arg = tskit_arg_visualizer.D3ARG.from_ts(ts=ts)

d3arg.nodes.loc[0, "symbol"] = "d3.symbolSquare"
d3arg.nodes.loc[1, "symbol"] = "d3.symbolSquare"
d3arg.nodes.loc[2, "fill"] = "pink"

d3arg.draw(edge_type="ortho", height=200, tree_highlighting=False, y_axis_labels=False)