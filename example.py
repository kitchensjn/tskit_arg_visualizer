import msprime
import tskit
import random
from visualizer import visualizer

# Generate a random tree sequence with record_full_arg=True so that you get marked recombination nodes
rs = random.randint(0,10000)   
ts = msprime.sim_ancestry(
    samples=2,
    recombination_rate=1e-8,
    sequence_length=3_000,
    population_size=10_000,
    record_full_arg=True,
    random_seed=3598
)

#ts = tskit.load("/Users/jameskitchens/Documents/GitHub/sparg2.0/ARGweaver/msprime/run4/ARGweaver_output/ts/arg.1000.trees")

#print(ts.first().draw_text())


print("random seed:", rs)
#print(ts.draw_text())
visualizer = visualizer.D3ARG(ts=ts)
visualizer.draw(width=1000, height=750)