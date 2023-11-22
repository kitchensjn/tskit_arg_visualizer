# What is a D3ARG?

![D3ARG](https://github.com/kitchensjn/tskit_arg_visualizer/assets/40303683/1893c4e7-abaa-40cd-8e5b-1a74240a0535)

tskit_arg_visualizer.D3ARG.from_ts(ts=ts) converts a tskit.TreeSequence into a D3ARG object. This object contains much of the same content as a tskit.TreeSequence, but represents the ARG in a slightly different (but very important) way. Below are the two steps for converting the edge and node tables:

- Edges are merged together if they fall into either of the two following categories. These are shown as a single graph edge composed of several intervals (see the "bounds" attribute of a link).
    - The edges have the same child node and parent node.
    - The edges the same child node and the parent nodes are in a recombination node pair (i.e. a pair of corresponding nodes marked with the IS_RE_NODE flag).
- Recombination node pairs are merged into a single node.
    - The ID of the new node is the lesser of the two original node IDs
    - The label is a concatenation of the original node IDs with a "/" in between.
- All parent and child node IDs in the edges table are updated to reflect the new recombination node ID mapping.

# Why change the representation of the ARG from the tskit.TreeSequence?

The ARG representation used by the D3ARG object hosts some distinct advantages over the original tskit.TreeSequence. As recombination node pairs really refer to the same event, it is clearest visually to merge nodes in the ARG. In most cases, the ARG can be represented by a directed graph rather than a directed multigraph ("diamonds" are the only instance when a multigraph is necessary). This reduces the number of edges that are drawn to the screen without any loss of information as an edge now represents a line of inheritance from a parent node and a child node and includes all of the regions inherited along that connection, even if these regions are disjoint. This opens up the possibility for visualizations and interactions that focus on the relative amount of inheritance between two nodes in the ARG, which would not be as straightforward if the visualization used the tskit.TreeSequence edge representation.


# Explanation of Plotting Method

The following information is provided to D3.js in the JSON object. This object includes the following:

## data

This is a dictionary which includes all of the network data to for the ARG including the nodes, links (edges), and breakpoints. This has been created from the D3ARG tables.

### nodes

This is a list of dictionaries, each corresponding to a given node in the graph. Each dictionary contains the following information about the node:

* **id**: unique identifier of each node
* **index**: unique identifier of each node, same as id (one of these should be removed in future update)
* **label**: string for the node label when plotting (matches the id unless the node is a recombination node when it merges the two tskit node ids together)
* **flag**: msprime node flag
* **time**: time of the node, pulled directly from tskit.TreeSequence
* **time_01**: rescaled node time between 0 and 1
* **logtime_01**: rescaled log of node time between 0 and 1
* **rank_01**: rescaled rank of the node between 0 and 1
* **child_of**: list of parents (recombination node IDs have been merged)
* **parent_of**: list of children (recombination node IDs have been merged)
* **fx_01** fixed x position scaled between 0 and 1 (used for sample nodes to specify that they shouldn't move)
* **fx**: fixed x position after rescaled to the width of the plot (used for nodes that have been dragged), these nodes will have vx=0
* **fy**: fixed y position after rescaled to the height of the plot, will match ether scaled_rank, scaled_time, scaled_logtime depending on y_axis_scale parameter, these nodes will have vy=0
* **x**: current x position in plot
* **y**: current y position in plot
* **vx**: current velocity along x-axis
* **vy**: current velocity along y-axis
* **x_pos_reference**: the id of another node that should be used to determine the x position of this node (not yet implemented as it breaks the force simulation)

Some of these attributes are calculated in Python whereas others are calculated in JavaScript. This is an exhaustive list. Not all attributes are always completely necessary, so you may find that some nodes in your graph are missing specific attributes and this is okay.

### links

Links are the edges between the nodes. This is similarly stored as a list of dictionaries. Each dictionary contains the following information about the edge:

* **source**: ancestor node
* **target**: descendent node
* **bounds**: a string with the boundaries of any region that contains this edge (ex. "0-1 5-8 9-10") NOTE: this differs from how edges are stored in the tskit.TreeSequence edge table
* **alt_parent**: if the node has more than one parent, ID of the other parent, used for pathing method
* **alt_child**: if the node has more than one child, ID of the other child, used for pathing method

### breakpoints

Breakpoints mark recombination events along the chromosome, where each section is associated with a different tree. This is used for the tree highlighting; rectangles are positioned at the bottom of the figure. Users can then hover over these rectangles to highlight the corresponding tree within the ARG.

* **start**: start position (left bound) of tree given by tskit
* **stop**: stop position (right bound) of tree
* **x_pos_01**: x position scaled between 0 and 1
* **x_pos**: x position scaled given the width of the figure
* **width_01**: width of the rectangle scaled between 0 and 1
* **width**: width of the rectangle scaled given the width of the figure

### evenly_distributed_positions

List of evenly distributed locations along the x-axis that will be used to position the sample nodes at the start and whenever you click the "Reheat Simulation" or "Space Samples" buttons.




## width

Integer for the approximate width of the main force layout plot in pixels. Note: if y_axis.include_labels="true", the width of the whole SVG will be larger.




## height

Integer for the approximate height of the main force layout plot in pixels. Note: if tree_highlighting="true", the height of the whole SVG will be larger.




## y_axis

This dictionary contains all things relating to the scale and styling of the y-axis for the figure.

### include_labels

Boolean for whether to label the y_axis. If True, the y-axis is added to the left side of the figure. 

### ticks

A list of y-axis tick locations.

### text

A list of corresponding labels for the tick locations.

### max_min

The maximum and minimum tick locations stored as a list of length 2.

### scale

String for the y-axis scale. Options:
* "rank" (default) - equal vertical spacing between nodes
* "time" - vertical spacing is proportional to the time
* "log_time" - proportional to the log of time




## nodes

A dictionary for the styling of the nodes within the ARG.

### size

Sets the size of the node symbols. (defaut=150)

### symbol

Controls the symbol used for each of the non-sample nodes. Symbol options are from [d3.symbol](https://d3js.org/d3-shape/symbol).

### sample_symbol

Controls the symbol used for each of the sample nodes. Symbol options are from [d3.symbol](https://d3js.org/d3-shape/symbol). This can be used to differentiate sample nodes from non-sample nodes.

### subset_nodes

List of nodes that user wants to stand out within the ARG. These nodes and the edges between them will have full opacity; other nodes will be faint (default=None, parameter is ignored and all nodes will have opacity).

### include_labels

Boolean for whether to include labels next to each of the nodes. (default=True)




## edges

A dictionary for the styling of the edges within the ARG.

### type

Pathing type for edges between nodes. Options:
* "line" - simple straight lines between the nodes
* "ortho" - custom pathing (see [pathing.md](pathing.md) for more details, should only be used with full ARGs)

### variable_width

Boolean for whether to scale the stroke width of the edges on the fraction of sequence that the edge is associated with. This can be useful for understanding the "importance" of edges within the ARG. (default=False)

### include_underlink

Boolean for whether to include an underlink alongside each edge. Underlinks are used to stylize edge crosses, giving the appearance of a gap. Currently, these are only implemented when `edge_type="ortho"`.




## tree_highlighting

Boolean for whether to include the tree highlighting based on the breakpoints list.

