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

#d3arg.set_breakpoint_fill(colors={1:"red"})

#d3arg.draw_genome_bar(
#    width=1000,
#    windows=[[1000,20000]]
#)

#d3arg.draw(
#    width=1000,
#    height=1000,
#    edge_type="ortho",
#    rotate_tip_labels=True
#)

d3arg.draw_node(
    node=20,
    degree=5,
    rotate_tip_labels=True,
    show_mutations=True,
    condense_mutations=True
)