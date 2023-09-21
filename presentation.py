import msprime
import tskit_arg_visualizer

ts = msprime.sim_ancestry(
    samples=2,
    recombination_rate=1e-8,
    sequence_length=3_000,
    population_size=10_000,
    record_full_arg=True,
    random_seed=2523
)

d3arg = tskit_arg_visualizer.D3ARG(ts=ts)
d3arg.draw(edge_type="ortho")