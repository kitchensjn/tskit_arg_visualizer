import msprime
import random
import json
import tskit_arg_visualizer


# Generate a random tree sequence with record_full_arg=True so that you get marked recombination nodes
ts_rs = random.randint(0,10000)   
ts = msprime.sim_ancestry(
    samples=5,
    recombination_rate=1e-8,
    sequence_length=3_000,
    population_size=10_000,
    record_full_arg=True,
    random_seed=1938#7830#ts_rs #6963#
)

print(ts_rs)

d3arg = tskit_arg_visualizer.D3ARG.from_ts(ts=ts)

d3arg.draw_node(29, degree=6)

#d3arg.draw(width=750, height=750, y_axis_labels=True, tree_highlighting=True, edge_type="ortho")
