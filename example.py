import msprime
import random
from visualizer import visualizer

# Generate a random tree sequence with record_full_arg=True so that you get marked recombination nodes
#rs = random.randint(0,10000)   
#ts = msprime.sim_ancestry(
#    samples=2,
#    recombination_rate=1e-8,
#    sequence_length=3_000,
#    population_size=10_000,
#    record_full_arg=True,
#    random_seed=rs
#)

ts = msprime.sim_ancestry(8, sequence_length=1e4, population_size=1e4, record_full_arg=True, random_seed=12, recombination_rate=1e-8)

for edge in ts.edges():
    if 72 in [edge.parent, edge.child] or 73 in [edge.parent, edge.child]:
        print(edge)

#print("random seed:", rs)
d3arg = visualizer.D3ARG(ts=ts)
d3arg.draw(width=1000, height=1000, y_axis_labels=True, y_axis_scale="rank", tree_highlighting=True, line_type="ortho")