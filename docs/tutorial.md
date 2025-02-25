# Tutorial

As the name suggests, the `tskit_arg_visualizer` package is built off of `tskit` and other packages within their broader ecosystem. If you are unfamiliar with `tskit`, their development team has created many helpful [tutorials](https://tskit.dev/tutorials/intro.html) to get you started with the tree sequence format. `tskit_arg_visualizer` utilizes its own format and can be used completely independently from `tskit`, but there are many conceptual similarities between the two and `tskit_arg_visualizer` has been designed to seamlessly integrate into their ecosystem. This tutorial will focus specifically on the visualization of ancestral recombination graphs (ARGs) with `tskit_arg_visualizer` and highlight the functions available to users.


## Installing and Importing `tskit_arg_visualizer`

```
pip install tskit_arg_visualizer
```

This will install the newest stable version of the package uploaded to [PyPI](https://pypi.org/project/tskit-arg-visualizer/). All of the necessary dependencies should be installed alongside the package.


## What is a D3ARG?

*INSERT IMAGE SHOWING THE D3ARG TABLES*

The `D3ARG` object is the heart of the `tskit_arg_visualizer` package and contains all of the information needed to visualize the ARG. It consists of four `pandas.DataFrame`s: a nodes table, an edge table, a mutations table, and a breakpoints table. This object contains much of the same content as a tskit.TreeSequence, but represents the ARG in a slightly different (but very important) way. See for [Why change the representation of the ARG from the tskit.TreeSequence?] if you would like to know more about these changes.

### From a tskit.TreeSequence

```
import tskit

ts = tskit.load("tskit_arg_visualizer.trees")
d3arg = tskit_arg_visualizer.D3ARG.from_ts(ts=ts)
```

### From a JSON object

```
import json

arg_json = json.load(open("tskit_arg_visualizer.json", "r"))
d3arg = tskit_arg_visualizer.D3ARG.from_json(json=arg_json)
```

## Plotting

There are currently three plotting methods: `draw()`, `draw_node()`, and `draw_genome_bar()`.

### `draw()`

If you have a small ARG (meaning relatively few samples and only a couple of trees), you may want to plot the ARG in its entirety. `draw()` displays your ARG as a graph, similar to the classical visualization from [Griffiths (1991)](https://www.jstor.org/stable/4355649). You have two options for the `edge_type` of you ARG - `line` or `ortho`. Both of these options are shown below for the same ARG.

```
d3arg.draw(edge_type="line")
d3arg.draw(edge_type="ortho")
```

The `tree_highlighting` parameter of `draw()` and `draw_node()` (active by default) adds a genome bar to the bottom of your plot. Hovering over the chunks highlights the edges of the ARG that are found within that region. Alternatively, you can hover over an edge in the ARG and it will highlight the chunks in which that edge is present. This is helpful for seeing how the trees along the chromosome weave together to form the ARG.

A quick note about line_type="ortho" (more details can be found within [pathing.md](https://github.com/kitchensjn/tskit_arg_visualizer/blob/main/docs/pathing.md)) - this parameter identifies node types based on msprime flags and applies pathing rules following those types. Because of this, "ortho" should only be used for full ARGs with proper msprime flags and where nodes have a maximum of two parents or children. Other tree sequences, including simplified tree sequences (those without marked recombination nodes marked) should use the "line" edge_type.

`show_mutations=True` will only work when `edge_type="line"`, otherwise it will be ignored. This is because the mutation placement rules have not been wored out for `edge_type="ortho"` (feature coming in the future). Even still with `edge_type="line"`, mutation labels will be incorrectly placed when there is a "diamond".

Below are all of the available parameters for `draw()`:

```
def draw(
    self,
    width=500,
    height=500,
    tree_highlighting=True,
    y_axis_labels=True,
    y_axis_scale="rank",
    edge_type="line",
    variable_edge_width=False,
    include_underlink=True,
    sample_order=None,
    title=None,
    show_mutations=False,
    ignore_mutation_times=True,
    include_mutation_labels=False,
    condense_mutations=False,
    force_notebook=False
):
"""Draws the D3ARG using D3.js by sending a custom JSON object to visualizer.js 

Parameters
----------
width : int
    Width of the force layout graph plot in pixels (default=500)
height : int
    Height of the force layout graph plot in pixels (default=500)
tree_highlighting : bool
    Include the interactive chromosome at the bottom of the figure to
    to let users highlight trees in the ARG (default=True)
y_axis_labels : bool
    Includes labelled y-axis on the left of the figure (default=True)
y_axis_scale : string
    Scale used for the positioning nodes along the y-axis. Options:
        "rank" (default) - equal vertical spacing between nodes
        "time" - vertical spacing is proportional to the time
        "log_time" - proportional to the log of time
edge_type : string
    Pathing type for edges between nodes. Options:
        "line" (default) - simple straight lines between the nodes
        "ortho" - custom pathing (see pathing.md for more details, should only be used with full ARGs)
variable_edge_width : bool
    Scales the stroke width of edges in the visualization will be proportional to the fraction of
    sequence in which that edge is found. (default=False)
include_underlink : bool
    Includes an "underlink" for each edge gives a gap during edge crosses. This is currently only
    implemented for `edge_type="ortho"`. (default=True)
sample_order : list
    Sample nodes IDs in desired order. Must only include sample nodes IDs, but does not
    need to include all sample nodes IDs. (default=None, order is set by first tree in tree sequence)
title : str
    Title to be put at the top of the figure. (default=None, ignored)
show_mutations : bool
    Whether to add mutations to the graph. Only available when `edge_type="line"`. (default=False)
ignore_mutation_times : bool
    Whether to plot mutations evenly on edge (True) or at there specified times (False). (default=True, ignored)
include_mutation_labels : bool
    Whether to add the full label (inherited_state + position + derived_state) for each mutation. (default=False)
condense_mutations : bool
    Whether to merge all mutations along an edge into a single mutation symbol. (default=False)
force_notebook : bool
    Forces the the visualizer to display as a notebook. Possibly necessary for untested environments. (default=False)
"""
```

### `draw_node()`

Visualizing large ARGs can be quite difficult due to the shear number of nodes and edges involved. There is a strong possibility that an ARG cannot be displayed in two dimensions without edge lines crossing over one another, and the more that this occurs, the harder it is the track the relationships between samples. The `draw_node()` function displays the subgraph around a specified node.

```
d3arg.draw_node(
    node=12,
    degree=[2,5]
)
```

This function is very similar to the standard `draw()`, but you need to provide a node ID which will be the center of the subgraph. At the moment, it also doesn't have quite as many optional styling parameters. Below are all of the available parameters for `draw_node()`:

```
def draw_node(
    self,
    node,
    width=500,
    height=500,
    degree=1,
    y_axis_labels=True,
    y_axis_scale="rank",
    tree_highlighting=True,
    title=None,
    show_mutations=False,
    ignore_mutation_times=True,
    include_mutation_labels=False,
    condense_mutations=False,
    return_included_nodes=False,
    force_notebook=False
):
"""Draws a subgraph of the D3ARG using D3.js by sending a custom JSON object to visualizer.js

Parameters
----------
node : int
    Node ID that will be central to the subgraph
width : int
    Width of the force layout graph plot in pixels (default=500)
height : int
    Height of the force layout graph plot in pixels (default=500)
degree : int or list(int, int)
    Number of degrees above (older than) and below (younger than) the central
    node to include in the subgraph (default=1). If this is a list, the
    number of degrees above is taken from the first element and
    the number of degrees below from the last element.
y_axis_labels : bool
    Includes labelled y-axis on the left of the figure (default=True)
y_axis_scale : string
    Scale used for the positioning nodes along the y-axis. Options:
        "rank" (default) - equal vertical spacing between nodes
        "time" - vertical spacing is proportional to the time
        "log_time" - proportional to the log of time
tree_highlighting : bool
    Include the interactive chromosome at the bottom of the figure to
    to let users highlight trees in the ARG (default=True)
title : str
    Title to be put at the top of the figure. (default=None, ignored)
show_mutations : bool
    Whether to add mutations to the graph. (default=False)
ignore_mutation_times : bool
    Whether to plot mutations evenly on edge (True) or at there specified times (False). (default=True, ignored)
include_mutation_labels : bool
    Whether to add the full label (position_index:ancestral:derived) for each mutation. (default=False)
condense_mutations : bool
    Whether to merge all mutations along an edge into a single mutation symbol. (default=False)
return_included_nodes : bool
    Returns a list of nodes plotted in the subgraph. (default=False)
force_notebook : bool
    Forces the the visualizer to display as a notebook. Possibly necessary for untested environments. (default=False)
"""
```

### `draw_genome_bar()`

The genome bar displays the chromosome broken down into chunks according to the ARG's breakpoints. Unlike with `draw()` and `draw_node()`, this visualization is not interactive. Instead, this function is designed to generate static figures showing the blocks and mutations along the genome bar. Additional window frames can be drawn on top of the genome bar to highlight regions of interest. The colors of the blocks can be individually changed with `d3arg.set_breakpoint_fills()`.

```
d3arg.draw_genome_bar(
    windows=[[0,1000]],
    include_mutations=True
)
```

Below are all of the available parameters for `draw_genome_bar()`:

```
def draw_genome_bar(
    self,
    width=500,
    windows=None,
    include_mutations=False,
    force_notebook=False
):
"""Draws a genome bar for the D3ARG using D3.js

Parameters
----------
width : int
    Width of the force layout graph plot in pixels (default=500)
windows : list of lists
    Each list is are the start and end positions of the windows. Multiple windows can be included.
    (Default is None, ignored)
include_mutations : bool
    Whether to add ticks for mutations along the genome bar
force_notebook : bool
    Forces the the visualizer to display as a notebook. Possibly necessary for untested environments. (default=False)
"""
```

### Deeper Styling Options

You can customize your plots in many ways. As previously mentioned, the `D3ARG` object consists of four `pandas.DataFrame`s, two of which represent the nodes and edges your graph. Specific columns in these DataFrames correspond to styling options, and these can be easily edited to change the look of your plot.

```
node_labels = {
    0:"alpha",
    1:""
}
d3arg.set_node_labels(labels=node_labels)
```

Node labels can be changed using the `d3arg.set_node_labels()` function. The example above will change the labels of Nodes 0 and 1 to "alpha" and "", respectively. An empty string is equivalent to removing the label of that specific node. Labels are always converted to strings. You can then redraw `d3arg` with the updated labels.

```
node_styles = [
    {
        "id":0,
        "size":10,
        "symbol":"d3.symbolSquare",
        "fill":"blue",
        "stroke":"purple",
        "stroke_width":5
    },
    {
        "id":1,
        "symbol":"d3.symbolStar"
    }
]
d3arg.set_node_styles(styles=node_styles)

edge_colors = {
    0:"red",
    1:"#000000",
    2:"green"
}
d3arg.set_edge_colors(colors=edge_colors)

block_colors = {
    1:"red",
    2:"#0000FF"
}
d3arg.set_breakpoint_fills(colors=block_colors)
```

You can set the styles all nodes, edges, or genome bar blocks in your plot to the same styles using `d3arg.set_all_node_styles()`, `d3arg.set_all_edge_colors()`, `d3arg.set_all_breakpoint_fills()`, respectively. For `d3arg.set_all_node_styles()`, the styling options are the same as `d3arg.set_node_styles()`: size, symbol, fill, stroke, and stroke_width.

You can also use `pandas` functions if you want to edit the tables more directly. Say for example, you want to change all of the sample nodes to squares to better differentiate them from non-sample nodes (and match the styling used by `tskit`):

```
d3arg.nodes.loc[np.isin(d3arg.nodes["id"], ts.samples()), "symbol"] = "d3.symbolSquare"
```

If you ever want to return to the default stylings, you can run the following commands:

```
d3arg.reset_all_node_labels()
d3arg.reset_all_node_styles()
d3arg.reset_all_edge_strokes()
d3arg.reset_all_breakpoint_fills()
```

## Modifying your ARG

`tskit_arg_visualizer`'s sole purpose is plotting the ARG and other related figures. It does not have a full suite of functions and checks for modifying tree sequences. All editing should be done using `tskit` prior to converting to a `D3ARG` object.

## Saving Figures

The leftmost button in the visualizer's dashboard provides options for downloading the figure in three formats: JSON, SVG, or PNG. Each figure is actually just a JSON object that D3.js interprets and plots to the screen (see [plotting.md](https://github.com/kitchensjn/tskit_arg_visualizer/blob/main/docs/plotting.md) for more information about this object). All files are saved as "tskit_arg_visualizer.*x*", where *x* is the respective file format.

The JSON file includes all of the information needed to replicate the figure in a subsequent simulation using the following code blocks:

```
import json
import tskit_arg_visualizer

arg_json = json.load(open("tskit_arg_visualizer.json", "r"))
tskit_arg_visualizer.draw_D3(arg_json=arg_json)
```

Alternatively, you can pass the JSON into a D3ARG object constructor, which then gives you access to all of the D3ARG object methods, such as drawing and modifying node labels.

```
d3arg = tskit_arg_visualizer.D3ARG.from_json(json=arg_json)
d3arg.draw()
```

Lastly, the PNG and SVG files are static files and directly match the current view of the visualizer but without interactivity. *A small note, opening the SVG in Adobe Illustrator does not properly import all styles (only inline styles). Though all styles can be manually added or changed within Illustrator, this can be tedious. Styles are properly load when opening in a web browser.*


## Reheating A Figure

The energy of the force layout simulation reduces overtime, causing the nodes to lose speed and settle into positions. Additionally, anytime the user moves a node by dragging, its new position becomes fixed and there on out unchanged by the simulation. The "Reheat Simulation" button at the top of each figure unfixes the positions of all nodes except for the sample nodes at the tips, and gives a burst of energy to the simulation to allow the nodes to find new optimal positions. This feature is most useful when the starting sample node positions are not optimal; the user can rearrange them and then reheat the simulation to see if that helps with untangling.


## Space Samples

The "Space Samples" button at the top of each figure evenly spaces the samples apart from one another at the base of the figure. This can help quickly clean up graphs if the sample ordering needed to be rearranged.


## Why change the representation of the ARG from the tskit.TreeSequence?

![D3ARG](https://github.com/kitchensjn/tskit_arg_visualizer/assets/40303683/1893c4e7-abaa-40cd-8e5b-1a74240a0535)

Below are the two steps for converting the edge and node tables:

- Edges are merged together if they fall into either of the two following categories. These are shown as a single graph edge composed of several intervals (see the "bounds" attribute of a link).
    - The edges have the same child node and parent node.
    - The edges the same child node and the parent nodes are in a recombination node pair (i.e. a pair of corresponding nodes marked with the IS_RE_NODE flag).
- Recombination node pairs are merged into a single node.
    - The ID of the new node is the lesser of the two original node IDs
    - The label is a concatenation of the original node IDs with a "/" in between.
- All parent and child node IDs in the edges table are updated to reflect the new recombination node ID mapping.

The ARG representation used by the D3ARG object hosts some distinct advantages over the original tskit.TreeSequence for the purpose of visualization. As recombination node pairs really refer to the same event, it is clearest visually to merge nodes in the ARG. In most cases, the ARG can be represented by a directed graph rather than a directed multigraph ("diamonds" are the only instance when a multigraph is necessary). This reduces the number of edges that are drawn to the screen without any loss of information as an edge now represents a line of inheritance from a parent node and a child node and includes all of the regions inherited along that connection, even if these regions are disjoint. This opens up the possibility for visualizations and interactions that focus on the relative amount of inheritance between two nodes in the ARG, which would not be as straightforward if the visualization used the tskit.TreeSequence edge representation.

## Troubleshooting

The visualizer tries to determine whether the user is in a Jupyter Notebook or not and plots accordingly. A known issue occurs when you are in an environment that has not been fully tested, in these cases the visualizer might not recognize that you are in a notebook. If your plots are not showing up, try adding the `force_notebook=True` parameter to any of your plotting commands. If this solves your issue, please still submit a GitHub issue with details about your environment and I will add it to the list that the visualizer checks against in the future.

## Development

This package is under active development; if you would like to use the absolute latest version, you can install the [GitHub repository](https://github.com/kitchensjn/tskit_arg_visualizer) directly. Note that this is an unstable version of the package, and features may change or not work as expected.

Anyone interested in getting involved with the project should reach out by submitting a [issue](https://github.com/kitchensjn/tskit_arg_visualizer/issues) or [pull request](https://github.com/kitchensjn/tskit_arg_visualizer/pulls) on GitHub!
