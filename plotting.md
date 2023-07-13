# Explanation of Plotting Method

The following information is provided to D3.js in the JSON object. This object includes the following:

* nodes
* links
* breakpoints
* width
* height
* tree_highlighting
* y_axis
* edge_type
* subset_nodes

Each of these is broken down in detail below.

## nodes

This is a list of dictionaries, each corresponding to a given node in the graph. Each dictionary contains the following information about the node:

* **id**: unique identifier of each node
* **index**: unique identifier of each node, same as id (one of these should be removed in future update)
* **label**: string for the node label when plotting (matches the id unless the node is a recombination node when it merges the two tskit node ids together)
* **flag**: msprime node flag
* **time**: time of the node, pulled directly from tskit.TreeSequence
* **scaled_time**: rescaled node time given the height of the plot
* **scaled_logtime**: rescaled log of node time given the height of the plot
* **scaled_rank**: rescaled rank of the node given the height of the plot
* **fx**: fixed x position in the plot (used for sample nodes or nodes that have been dragged), these nodes will have vx=0
* **fy**: fixed y position in the plot, will match ether scaled_rank, scaled_time, scaled_logtime depending on y_axis_scale parameter, these nodes will have vy=0
* **x**: current x position
* **y**: current y position
* **vx**: current velocity along x-axis
* **vy**: current velocity along y-axis
* **x_pos_reference**: the id of another node that should be used to determine the x position of this node (not yet implemented as it breaks the force simulation)

Some of these attributes are calculated in Python whereas others are calculated in JavaScript. This is an exhaustive list. Not all attributes are always completely necessary, so you may find that some nodes in your graph are missing specific attributes and this is okay.

## links

Links are the edges between the nodes. This is similarly stored as a list of dictionaries. Each dictionary contains the following information about the edge:

* **source**: ancestor node
* **target**: descendent node
* **left**: left bound of edge from the tskit.TreeSequence edge table
* **right**: right bound of edge from the tskit.TreeSequence edge table 
* **alt_parent**: if the node has more than one parent, ID of the other parent, used for pathing method
* **alt_child**: if the node has more than one child, ID of the other child, used for pathing method


## breakpoints

Breakpoints mark recombination events along the chromosome, where each section is associated with a different tree. This is used for the tree highlighting; rectangles are positioned at the bottom of the figure. Users can then hover over these rectangles to highlight the corresponding tree within the ARG.

* **start**: start position (left bound) of tree given by tskit
* **stop**: stop position (right bound) of tree
* **x_pos**: scaled x position given the width of the figure
* **width**: scaled width of the rectangle given the width of the figure

## width

Integer for the width of the main force layout plot in pixels. Note: if y_axis.include_labels="true", the width of the whole SVG will be larger.

## height

Integer for the height of the main force layout plot in pixels. Note: if tree_highlighting="true", the height of the whole SVG will be larger.

## y_axis

* **include_labels**: boolean for whether to label the y_axis
* **ticks**: list of y-axis tick locations
* **text**: list of corresponding labels for the tick locations
* **max_min**: maximum and minimum tick locations (this could be potentially calculated with JavaScript instead of in Python)
* **scale**: string for the y-axis scale. Options: "rank", "time", or "log_time"

## tree_highlighting

Boolean for whether to include the tree highlighting based on the breakpoints list.

## edge_type

Pathing type for edges between nodes. Options:
* "line" (default) - simple straight lines between the nodes
* "ortho" - custom pathing (see pathing.md for more details, should only be used with full ARGs)

## subset_nodes (EXPERIMENTAL)

List of nodes that user wants to stand out within the ARG. These nodes and the edges between them will have full opacity; other nodes will be faint (default=None, parameter is ignored and all nodes will have opacity).