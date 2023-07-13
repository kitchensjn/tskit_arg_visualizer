# Explanation of Plotting Method

The following information is provided to D3.js in the JSON object. This object includes the following:

    * nodes
    * links
    * breakpoints
    * width
    * height
    * tree_highlighting
    * y_axis
        * include_labels
        * ticks
        * text
        * max_min
        * scale
    * edge_type
    * subset_nodes

Each of these is explained in detail below.

## nodes

    {
        "id":0,
        "flag":1,
        "time":0,
        "scaled_time":1,
        "scaled_logtime":1,
        "scaled_rank":1,
        "fx":100,
        "label":0,
        "fy":450,
        "index":0,
        "x":100,
        "y":450,
        "vy":0,
        "vx":0
    }

## links

    {
        "source": 4,
        "target": 0,
        "left": 0.0,
        "right": 3000.0,
        "alt_parent": "",
        "alt_child": 3
    }

## breakpoints

    {
        "start": 0,
        "stop": 427.0,
        "x_pos": 50.0, 
        "width": 71.16666666666667
    }

## width

    "width": 550

## height

    "height": 600

## y_axis

## tree_highlighting

    "tree_highlighting": "true"

## edge_type

## subset_nodes



    
    
    
    {
        "include_labels": "true",
        "ticks": [450.0, 439.37461136295576, 418.819128584906, 318.6563312821811, 304.11609294669233, 285.11507839468084, 258.7822719203812, 168.5117462427648, 83.91576817972265, 50.0],
        "text": [0, 766, 2247, 9465, 10513, 11882, 13780, 20285, 26381, 28825],
        "max_min": [450.0, 50.0],
        "scale": "time",
    }

    "line_type": "ortho"



- **Nodes**
  - **id**: unique identifier of each node
  - **label**: the node label when plotting (matches the id unless the node is a recombination node when it merges the two tskit node ids together)
  - **flag**: msprime node flag
  - **time**: time of the node from tskit
  - **fy**: fixed y position in the plot relating to their age
  - *optional*
    - **fx**: fixed x position in the plot (used for sample nodes)
    - **x_pos_reference**: the id of another node that should be used to determine the x position of this node (not yet implemented as it breaks the force simulation)

- **Links**
  - **source**: parent node
  - **target**: child node
  - *optional*
    - **direction_reference**: the id of the alternative parent for recombination nodes

- **Breakpoints**

ARGs are plotted using a D3's [force layout](https://github.com/d3/d3-force). All nodes have a fixed position on the y-axis set by fy. Sample nodes have a fixed position on the x-axis set by fx; the ordering of the sample nodes comes from the first tree in the tskit tree sequence (this is not always the optimal ordering but is generally a good starting point for plotting). The x positions of other nodes are set by a force simulation where all nodes repel each other countered by a linkage force between connected nodes in the graph.

Users can click and drag the nodes (including the sample) along the x-axis to further clean up the layout of the graph. The simulation does not take into account line crosses, which can often be improved with some fiddling. Once a node has been moved by a user, its position is fixed with regards to the force simulation.