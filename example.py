import msprime
import random
import json
import tskit_arg_visualizer

# Generate a random tree sequence with record_full_arg=True so that you get marked recombination nodes
ts_rs = random.randint(0,10000)   
ts = msprime.sim_ancestry(
    samples=2,
    recombination_rate=1e-8,
    sequence_length=3_000,
    population_size=10_000,
    record_full_arg=True,
    random_seed=ts_rs
)

d3arg = tskit_arg_visualizer.D3ARG.from_ts(ts=ts)

d3arg.draw(width=500, height=500, y_axis_labels=True, y_axis_scale="rank", tree_highlighting=True, edge_type="ortho")