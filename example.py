import msprime
import random
import tskit_arg_visualizer

# Generate a random tree sequence with record_full_arg=True so that you get marked recombination nodes
ts_rs = random.randint(0,10000) 
print(ts_rs)  
ts = msprime.sim_ancestry(
    samples=10,
    recombination_rate=1e-8,
    sequence_length=3_000,
    population_size=10_000,
    record_full_arg=True,
    random_seed=4127
)

ts = msprime.sim_mutations(ts, rate=1e-7, random_seed=4321)

#print(ts.tables.sites)
#print(ts.tables.mutations)

d3arg = tskit_arg_visualizer.D3ARG.from_ts(ts=ts)

#d3arg.draw(
#    width=1000,
#    height=1000,
#    edge_type="line"
#)

d3arg.draw_node(
    node=40
)