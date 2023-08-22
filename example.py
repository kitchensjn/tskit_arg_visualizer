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
    random_seed=1
)
print(ts_rs)

#mts_rs = random.randint(1,10000)
#mts = msprime.sim_mutations(
#    tree_sequence=ts, 
#    rate=2.5e-8,
#    random_seed=mts_rs
#)

#print("ts random seed:", ts_rs)
#print("mts random seed:", mts_rs)

#print(mts.tables.mutations)

#print(mts.first().draw_text())


#ts = tskit.load("/Users/jameskitchens/Documents/GitHub/sparg2.0/ARGweaver/slim/condensed.trees")

d3arg = tskit_arg_visualizer.D3ARG(ts=ts)
d3arg.draw(width=500, height=500, y_axis_labels=True, y_axis_scale="rank", tree_highlighting=True, edge_type="ortho")


# Or draw from a previously saved tree sequence which is stored in a JSON file
#arg_json = json.load(open("example3.json", "r"))
#tskit_arg_visualizer.draw_D3(arg_json=arg_json)