<p align="center">
  <img alt="ARG Visualizer Example" src="https://raw.githubusercontent.com/kitchensjn/tskit_arg_visualizer/master/images/tskit_arg_visualizer.png" width="500">
</p>

A method for drawing ancestral recombination graphs from tskit tree sequences in Python using D3.js. ARGs are plotted using a D3's [force layout](https://github.com/d3/d3-force). All nodes have a fixed position on the y-axis set by fy. Sample nodes have a fixed position on the x-axis set by fx; the ordering of the sample nodes comes from the first tree in the tskit tree sequence (this is not always the optimal ordering but is generally a good starting point for plotting). The x positions of other nodes are set by a force simulation where all nodes repel each other countered by a linkage force between connected nodes in the graph.

Users can click and drag the nodes (including the sample) along the x-axis to further clean up the layout of the graph. The simulation does not take into account line crosses, which can often be improved with some fiddling. Once a node has been moved by a user, its position is fixed with regards to the force simulation.

See [tutorial.md](https://github.com/kitchensjn/tskit_arg_visualizer/blob/main/docs/tutorial.md) for a walkthrough of the package.