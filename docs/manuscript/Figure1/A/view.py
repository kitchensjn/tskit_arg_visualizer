import msprime
import sys
sys.path.append("../../../..")
import tskit_arg_visualizer

ts = msprime.sim_ancestry(
    samples=3,
    recombination_rate=1e-8,
    sequence_length=3_000,
    population_size=10_000,
    record_full_arg=True,
    random_seed=5476
)

d3arg = tskit_arg_visualizer.D3ARG.from_ts(ts=ts)

d3arg.draw(
    edge_type="ortho",
    y_axis_labels=False,
    tree_highlighting=False
)