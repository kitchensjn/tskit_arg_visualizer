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

### `draw_node()`

Visualizing large ARGs can be quite difficult due to the shear number of nodes and edges involved. There is a strong possibility that an ARG cannot be displayed in two dimensions without edge lines crossing over one another, and the more that this occurs, the harder it is the track the relationships between samples. The `draw_node()` function displays the subgraph around a specified node.

```
d3arg.draw_node(node=12)
```

### `draw_genome_bar()`

The genome bar displays the chromosome broken down into chunks according to the ARG's breakpoints. Unlike with `draw()` and `draw_node()`, this visualization is not interactive. Instead, this function is designed to generate static figures showing the blocks and mutations along the genome bar. Additional window frames can be drawn on top of the genome bar to highlight regions of interest. The colors of the blocks can be individually changed with `d3arg.set_breakpoint_fills()`.

```
d3arg.draw_genome_bar(
    windows=[[0,1000]],
    include_mutations=True
)
```

### Deeper Styling Options

You can customize your plots in many ways. As previously mentioned, the `D3ARG` object consists of four `pandas.DataFrame`s, two of which represent the nodes and edges your graph. Specific columns in these DataFrames correspond to styling options, and these can be easily edited to change the look of your plot.

```
node_labels = {
    0:"alpha",
    1:"bravo"
}
d3arg.set_node_labels(labels=node_labels)

node_styles = [
    {
        id:0,
        size:10,
        symbol:"d3.symbolSquare",
        fill:"blue",
        stroke:"purple",
        stroke_width:5
    },
    {
        id:1,
        symbol:"d3.symbolStar"
        include_label:False
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
    2:"#0000FF
}
d3arg.set_breakpoint_fills(colors=block_colors)
```

You can set the styles all nodes, edges, or genome bar blocks in your plot to the same styles using `d3arg.set_all_node_styles()`, `d3arg.set_all_edge_colors()`, `d3arg.set_all_breakpoint_fills()`, respectively. For `d3arg.set_all_node_styles()`, the styling options are the same as `d3arg.set_node_styles()`: size, symbol, fill, stroke, stroke_width, and include_label.

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

## Development

This package is under active development; if you would like to use the absolute latest version, you can install the [GitHub repository](https://github.com/kitchensjn/tskit_arg_visualizer) directly. Note that this is an unstable version of the package, and features may change or not work as expected.

Anyone interested in getting involved with the project should reach out by submitting a [issue](https://github.com/kitchensjn/tskit_arg_visualizer/issues) or [pull request](https://github.com/kitchensjn/tskit_arg_visualizer/pulls) on GitHub!