import msprime
import tskit_arg_visualizer as viz

ts = msprime.sim_ancestry(
    3, gene_conversion_rate=0.02, gene_conversion_tract_length=1,
    sequence_length=10, random_seed=3)

viz.D3ARG(ts=ts).draw()