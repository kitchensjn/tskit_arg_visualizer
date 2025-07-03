import msprime
import random
import tskit_arg_visualizer

# Generate a random tree sequence with record_full_arg=True so that you get marked recombination nodes
ts_rs = random.randint(0,10000) 
print(ts_rs)  
ts = msprime.sim_ancestry(
    samples=5,
    recombination_rate=1e-8,
    sequence_length=3_000,
    population_size=10_000,
    record_full_arg=True,
    random_seed=ts_rs
)

ts = msprime.sim_mutations(ts, rate=1e-7, random_seed=4321)

print(ts)
#print(ts.tables.mutations)

d3arg = tskit_arg_visualizer.D3ARG.from_ts(ts=ts, progress=True)

print(d3arg.draw_node(
    seed_nodes=20,
    depth=5,
    rotate_tip_labels=True,
    show_mutations=True,
    condense_mutations=False,
    return_included_nodes=True
))