import msprime
import tskit
import random
import json
import tskit_arg_visualizer as viz

# Generate a random tree sequence with record_full_arg=True so that you get marked recombination nodes
ts_rs = random.randint(0,10000)   
ts = msprime.sim_ancestry(
    samples=5,
    recombination_rate=1e-8,
    sequence_length=2_000,
    population_size=10_000,
    record_full_arg=True,
    random_seed=3905#606
)

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


x_positions = viz.calc_graphviz_x_positions(ts=ts)
d3arg = viz.D3ARG(ts=ts, fixed_x_positions=x_positions)
d3arg.draw(width=1000, height=750, y_axis_labels=True, y_axis_scale="rank", tree_highlighting=True, edge_type="line")


# Or draw from a previously saved tree sequence which is stored in a JSON file
#arg_json = json.load(open("test.json", "r"))
#visualizer.draw_D3(arg_json=arg_json)