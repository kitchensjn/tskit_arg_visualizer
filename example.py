import msprime
import random
import json
import tskit_arg_visualizer

# Generate a random tree sequence with record_full_arg=True so that you get marked recombination nodes
"""
ts_rs = random.randint(0,10000)   
ts = msprime.sim_ancestry(
    samples=5,
    recombination_rate=1e-8,
    sequence_length=3_000,
    population_size=10_000,
    record_full_arg=True,
    random_seed=ts_rs
)

d3arg = tskit_arg_visualizer.D3ARG.from_ts(ts=ts)

d3arg.draw(width=1000, height=500, edge_type="ortho", sample_order=[0,1,2,3,4])
"""


# Or draw from a previously saved tree sequence which is stored in a JSON file
arg_json = json.load(open("example.json", "r"))
#print(arg_json)
d3arg = tskit_arg_visualizer.D3ARG.from_json(json=arg_json)

d3arg.set_node_labels({9:"chicken"})

d3arg.draw(width=1000, height=500, edge_type="ortho")
#tskit_arg_visualizer.draw_D3(arg_json=arg_json)