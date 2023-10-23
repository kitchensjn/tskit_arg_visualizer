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
    random_seed=5139
)

d3arg = tskit_arg_visualizer.D3ARG(ts=ts)
d3arg.draw(width=500, height=500, edge_type="line", variable_edge_width=True)


# Or draw from a previously saved tree sequence which is stored in a JSON file
#arg_json = json.load(open("example.json", "r"))
#tskit_arg_visualizer.draw_D3(arg_json=arg_json)