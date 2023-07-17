import numpy as np
import random
import math
from string import Template
from IPython.display import HTML, display
import webbrowser
import tempfile
import os


def running_in_notebook():
    """Checks whether the code is being executed within a Jupyter Notebook.
    
    Adapted from https://stackoverflow.com/questions/15411967/how-can-i-check-if-code-is-executed-in-the-ipython-notebook

    Returns
    -------
    bool
        True if being executed within a Jupyter Notebook, False otherwise
    """

    try:
        shell = get_ipython().__class__.__name__
        if shell == 'ZMQInteractiveShell':
            return True   # Jupyter notebook or qtconsole
        elif shell == 'TerminalInteractiveShell':
            return False  # Terminal running IPython
        else:
            return False  # Other type (?)
    except NameError:
        return False      # Probably standard Python interpreter

def draw_D3(arg_json):
    arg_json["source"] = arg_json.copy()
    arg_json["divnum"] = str(random.randint(0,9999999999))
    JS_text = Template("<div id='arg_" + arg_json['divnum'] + "'></div><script>$main_text</script>")
    main_text_template = Template(open(os.path.dirname(__file__) + "/visualizer.js", "r").read())
    main_text = main_text_template.safe_substitute(arg_json)
    html = JS_text.safe_substitute({'main_text': main_text})
    styles = open(os.path.dirname(__file__) + "/visualizer.css", "r").read()
    if running_in_notebook():
        display(HTML("<style>"+styles+"</style><script src='https://d3js.org/d3.v4.min.js'></script>" + html))
    else:
        with tempfile.NamedTemporaryFile("w", delete=False, suffix=".html") as f:
            url = "file://" + f.name
            f.write("<style>"+styles+"</style><script src='https://d3js.org/d3.v4.min.js'></script>" + html)
        webbrowser.open(url, new=2)


class D3ARG:
    """Stores the ARG in a D3.js friendly format ready for plotting

    Attributes
    ----------
    nodes : list
        List of node dicts that contain info about the nodes
    edges : list
        List of edge dicts that contain info about the edges
    breakpoints : list
        List of breakpoint dicts that contain info about the breakpoints

    Methods
    -------
    draw(
        width=500,
        height=500,
        tree_highlighting=True,
        y_axis_labels=True,
        y_axis_scale="rank",
        line_type="ortho",
        subset_nodes=[]
    )
        Draws the ARG using D3.js

    """

    def __init__(self, ts):
        """Converts a tskit tree sequence into the D3ARG object
        
        Parameters
        ----------
        ts : tskit.TreeSequence
            tree sequence must have marked recombination nodes, such as using
            msprime.sim_ancestry(...,record_full_arg=True)
        """
        rcnm = np.where(ts.tables.nodes.flags == 131072)[0][1::2]
        self.nodes = self._convert_nodes_table(ts=ts, recombination_nodes_to_merge=rcnm)
        self.edges = self._convert_edges_table(ts=ts, recombination_nodes_to_merge=rcnm)
        self.breakpoints = self._identify_breakpoints(ts=ts)

    def _convert_nodes_table(self, ts, recombination_nodes_to_merge):
        """Creates nodes JSON from the tskit.TreeSequence nodes table
        
        A "reference" is the id of another node that is used to determine a property in the
        graph. Example: recombination nodes should have the same x position as their child, unless their child is
        also a recombination node. This isn't yet implemented automatically in the layout as it breaks the force
        layout.

        Parameters
        ----------
        ts : tskit.TreeSequence
            tree sequence must have marked recombination nodes, such as using
            msprime.sim_ancestry(...,record_full_arg=True)
        recombination_nodes_to_merge : list or numpy.Array
            IDs of recombination nodes that need to be converted to their alternate ID

        Returns
        -------
        nodes : list
            List of dictionaries containing information about a given node
        """

        # Parameters for the dimensions of the D3 plot. Eventually want to handle this entirely in JS
        w_spacing = 1 / (ts.num_samples - 1)
        h_spacing = 1 / (len(np.unique(ts.tables.nodes.time))-1) #(ts.num_nodes - ts.num_samples - np.count_nonzero(ts.tables.nodes.flags == 131072)/2)
        ordered_nodes = [] # Ordering of sample nodes is the same as the first tree in the sequence
        for node in ts.first().nodes(order="minlex_postorder"):
            if node < ts.num_samples:
                ordered_nodes.append(node)
        unique_times = list(np.unique(ts.tables.nodes.time)) # Determines the rank (y position) of each time point 
        nodes = []
        for ID, node in enumerate(ts.tables.nodes):
            info = {
                "id": ID,
                "flag": node.flags,
                "time": node.time,
                "scaled_time":1-node.time/ts.max_root_time,
                "scaled_logtime":1-math.log(node.time+1)/math.log(ts.max_root_time),
                "scaled_rank": 1-(unique_times.index(node.time)*h_spacing) #fixed y position, property of force layout
            }
            label = ID
            if node.flags == 131072:
                if ID in recombination_nodes_to_merge:
                    continue
                label = str(ID)+"/"+str(ID+1)
                parent_of = ts.tables.edges[np.where(ts.tables.edges.parent == ID)[0]]
                if len(parent_of) > 0:
                    info["x_pos_reference"] = parent_of.child[0]
            elif node.flags == 262144:
                info["x_pos_reference"] = ts.tables.edges[np.where(ts.tables.edges.parent == ID)[0]].child[0]
            info["label"] = label #label which is either the node ID or two node IDs for recombination nodes
            if node.flags == 1:
                info["fx"] = ordered_nodes.index(ID)*w_spacing #sample nodes have a fixed x position
            nodes.append(info)
        return nodes

    def _convert_edges_table(self, ts, recombination_nodes_to_merge):
        """Creates edges JSON from the tskit.TreeSequence edges table

        Merges the recombination nodes, identified by the smaller of the two IDs. The direction
        that the edge should go relates to the positions of not just the nodes connected by that edge, but also the
        other edges connected to the child. See the JS for all of the different scenarios; still working through
        that.

        Parameters
        ----------
        ts : tskit.TreeSequence
            tree sequence must have marked recombination nodes, such as using
            msprime.sim_ancestry(...,record_full_arg=True)
        recombination_nodes_to_merge : list or numpy.Array
            IDs of recombination nodes that need to be converted to their alternate ID

        Returns
        -------
        links : list
            List of dictionaries containing information about a given link
        """
        links = []
        for edge in ts.tables.edges:
            parent = edge.parent
            child = edge.child
            alternative_child = ""
            alternative_parent = ""
            left = edge.left
            right = edge.right
            if ts.tables.nodes.flags[edge.parent] != 131072:
                children = np.unique(ts.tables.edges[np.where(ts.tables.edges.parent == edge.parent)[0]].child)
                if len(children) > 2:
                    print(children[np.where(children != edge.child)])
                    alternative_child = children[np.where(children != edge.child)][0]
                elif len(children) > 1:
                    alternative_child = children[np.where(children != edge.child)][0]
                else:
                    alternative_child = -1 # this occurs when converting from SLiM simulations, needs to have better handling
                if alternative_child in recombination_nodes_to_merge:
                    alternative_child -= 1
            elif edge.parent in recombination_nodes_to_merge:
                parent = edge.parent - 1
            if ts.tables.nodes.flags[edge.child] == 131072:
                if edge.child in recombination_nodes_to_merge:
                    alt_id = edge.child - 1
                else:
                    alt_id = edge.child + 1
                alternative_parent = ts.tables.edges[np.where(ts.tables.edges.child == alt_id)[0]].parent[0]
            if edge.child in recombination_nodes_to_merge:
                child = edge.child - 1
            links.append({
                "source": parent,
                "target": child,
                "left": left,
                "right": right,
                "alt_parent": alternative_parent, #recombination nodes have an alternative parent
                "alt_child": alternative_child
            })
        return links
    
    def _identify_breakpoints(self, ts):
        """Creates breakpoints JSON from the tskit.TreeSequence

        Parameters
        ----------
        ts : tskit.TreeSequence
            tree sequence must have marked recombination nodes, such as using
            msprime.sim_ancestry(...,record_full_arg=True)
        
        Returns
        -------
        breakpoints : list
            List of dictionaries containing information about breakpoints
        """
        
        breakpoints = []
        start = 0
        for bp in ts.breakpoints():
            if bp != 0:
                breakpoints.append({
                    "start": start,
                    "stop": bp,
                    "x_pos":(start/ts.sequence_length),
                    "width":((bp - start)/ts.sequence_length)
                })
                start = bp
        return breakpoints
    
    def draw(
            self,
            width=500,
            height=500,
            tree_highlighting=True,
            y_axis_labels=True,
            y_axis_scale="rank",
            edge_type="line",
            subset_nodes=None
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
        subset_nodes : list (EXPERIMENTAL)
            List of nodes that user wants to stand out within the ARG. These nodes and the edges between them
            will have full opacity; other nodes will be faint (default=None, parameter is ignored and all
            nodes will have opacity)
        """
        
        y_axis_ticks = []
        y_axis_text = []
        transformed_nodes = []
        for node in self.nodes:
            if node.get("fx", -1) != -1:
                if y_axis_labels:
                    node["fx"] = node["fx"] * (width-100) + 100
                else:
                    node["fx"] = node["fx"] * (width-100) + 50
            if node.get("x", -1) != -1:
                if y_axis_labels:
                    node["x"] = node["x"] * (width-100) + 100
                else:
                    node["x"] = node["x"] * (width-100) + 50
            if y_axis_scale == "time":
                node["fy"] = node["scaled_time"] * (height-100) + 50
                y_axis_ticks.append(node["scaled_time"] * (height-100) + 50)
            elif y_axis_scale == "log_time":
                node["fy"] = node["scaled_logtime"] * (height-100) + 50
                y_axis_ticks.append(node["scaled_logtime"] * (height-100) + 50)
            else:
                node["fy"] = node["scaled_rank"] * (height-100) + 50
                y_axis_ticks.append(node["scaled_rank"] * (height-100) + 50)
            node["y"] = node["fy"]
            y_axis_text.append(node["time"])
            transformed_nodes.append(node)
        y_axis_text = [round(t) for t in set(y_axis_text)]
        if tree_highlighting:
            height += 100
        transformed_bps = []
        for bp in self.breakpoints:
            if y_axis_labels:
                bp["x_pos"] = bp["x_pos"] * width + 50
            else:
                bp["x_pos"] = bp["x_pos"] * width
            bp["width"] = bp["width"] * width
            transformed_bps.append(bp)
        if y_axis_labels:
            width += 50
        if not subset_nodes:
            subset_nodes = [node["id"] for node in self.nodes]
        arg = {
            "arg":{
                "nodes":transformed_nodes,
                "links":self.edges,
                "breakpoints": transformed_bps
            },
            "width":width,
            "height":height,
            "y_axis":{
                "include_labels":str(y_axis_labels).lower(),
                "ticks":sorted(list(set(y_axis_ticks)), reverse=True),
                "text":sorted(list(y_axis_text)),
                "max_min":[max(y_axis_ticks),min(y_axis_ticks)],
                "scale":y_axis_scale,
            },
            "tree_highlighting":str(tree_highlighting).lower(),
            "edge_type": edge_type,
            "subset_nodes": subset_nodes
        }
        draw_D3(arg_json=arg)
    