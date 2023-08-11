import msprime
import demes
from visualizer import visualizer

def whatis_example():
    demes_yml = """\
        description:
          Asymmetric migration between two extant demes.
        time_units: generations
        defaults:
          epoch:
            start_size: 5000
        demes:
          - name: Ancestral_population
            epochs:
              - end_time: 1000
          - name: A
            ancestors: [Ancestral_population]
          - name: B
            ancestors: [Ancestral_population]
            epochs:
              - start_size: 2000
                end_time: 500
              - start_size: 400
                end_size: 10000
        migrations:
          - source: A
            dest: B
            rate: 1e-4
        """
    graph = demes.loads(demes_yml)
    demography = msprime.Demography.from_demes(graph)
    # Choose seed so num_trees=3, tips are in same order,
    # first 2 trees are topologically different, and all trees have the same root
    seed = 12581
    return msprime.sim_ancestry(
        samples={"A": 2, "B": 3},
        demography=demography,
        recombination_rate=1e-8,
        sequence_length=1000,
        random_seed=seed)

ts = whatis_example()
d3arg = visualizer.D3ARG(ts=ts, use_graphviz_positions=True)
d3arg.draw(
  width=500,
  height=300,
  y_axis_labels=True,
  y_axis_scale="rank",
  tree_highlighting=True,
  edge_type="ortho",
)