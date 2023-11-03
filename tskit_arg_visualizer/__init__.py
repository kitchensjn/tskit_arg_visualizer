import numpy as np
import random
import math
from string import Template
import webbrowser
import tempfile
import os
from IPython.display import HTML, display


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
    
def calculate_evenly_distributed_positions(num_elements, start=0, end=1):
    """Returns a list of `num_elements` evenly distributed positions on a given `length`

    Parameters
    ----------
    num_elements : int
        Number of positions to be returned
    length : int or float
        Range of positions

    Returns
    -------
    List of float positions
    """

    if num_elements > 1:
        w_spacing = (end-start) / (num_elements - 1)
        return [i * w_spacing + start for i in range(num_elements)]
    else:
        return [0.5 * (end-start) + start]

def draw_D3(arg_json):
    arg_json["source"] = arg_json.copy()
    arg_json["divnum"] = str(random.randint(0,9999999999))
    JS_text = Template("<div id='arg_" + arg_json['divnum'] + "'class='d3arg' style='min-width:" + str(arg_json["width"]+40) + "px; min-height:" + str(arg_json["height"]+80) + "px;'></div><script>$main_text</script>")
    visualizerjs = open(os.path.dirname(__file__) + "/visualizer.js", "r")
    main_text_template = Template(visualizerjs.read())
    visualizerjs.close()
    main_text = main_text_template.safe_substitute(arg_json)
    html = JS_text.safe_substitute({'main_text': main_text})
    css = open(os.path.dirname(__file__) + "/visualizer.css", "r")
    styles = css.read()
    css.close()
    if running_in_notebook():
        display(HTML("<style>"+styles+"</style><script src='https://d3js.org/d3.v7.min.js'></script>" + html))
    else:
        with tempfile.NamedTemporaryFile("w", delete=False, suffix=".html") as f:
            url = "file://" + f.name
            f.write("<!DOCTYPE html><html><head><style>"+styles+"</style><script src='https://d3js.org/d3.v7.min.js'></script></head><body>" + html + "</body></html>")
        webbrowser.open(url, new=2)


class D3ARG:
    """Stores the ARG in a D3.js friendly format ready for plotting

    See 'Alternative Constructors' for common ways of creating this object

    Attributes
    ----------
    nodes : list
        List of node dicts that contain info about the nodes
    edges : list
        List of edge dicts that contain info about the edges
    breakpoints : list
        List of breakpoint dicts that contain info about the breakpoints
    num_samples : int
        The number of samples in the ARG (with flag=1)
    sample_order : list
        Ordered list of sample IDs

    Alternative Constructors
    ------------------------
    from_ts(ts)
        Creates a D3ARG from a tskit.TreeSequence
    
    from_json(json)
        Creates a D3ARG from a saved custom JSON

    Methods
    -------
    draw(
        width=500,
        height=500,
        tree_highlighting=True,
        y_axis_labels=True,
        y_axis_scale="rank",
        line_type="ortho",
        subset_nodes=[],
        include_node_labels=True
    )
        Draws the ARG using D3.js

    set_node_labels(labels={})
        Customizes node labels in visualization

    reset_node_labels()
        Sets the node labels back to default values

    """

    def __init__(self, nodes, edges, breakpoints, num_samples, sample_order):
        """Initializes a D3ARG object

        This is the generalized function for initializing a D3ARG object. It is most
        often called by another method, such as from_ts() or from_json(), though it
        can be used separately if the parameters are in the correct format.

        Parameters
        ----------
        nodes : list
            List of node dicts that contain info about the nodes
        edges : list
            List of edge dicts that contain info about the edges
        breakpoints : list
            List of breakpoint dicts that contain info about the breakpoints
        num_samples : int
        sample_order : list or np.array
        """

        self.nodes = nodes
        self.edges = edges
        self.breakpoints = breakpoints
        self.num_samples = num_samples
        self.sample_order = sample_order
        
    @classmethod
    def from_ts(cls, ts):
        """Converts a tskit tree sequence into a D3ARG object
        
        Parameters
        ----------
        ts : tskit.TreeSequence
            tree sequence must have marked recombination nodes, such as using
            msprime.sim_ancestry(...,record_full_arg=True)
        
        Returns
        -------
        D3ARG : a corresponding D3ARG object ready to be plotted
        """

        rcnm = np.where(ts.tables.nodes.flags == 131072)[0][1::2]
        return cls(
            nodes=cls._convert_nodes_table(ts=ts, recombination_nodes_to_merge=rcnm),
            edges=cls._convert_edges_table(ts=ts, recombination_nodes_to_merge=rcnm),
            breakpoints=cls._identify_breakpoints(ts=ts),
            num_samples=ts.num_samples,
            sample_order=ts.first().nodes(order="minlex_postorder")
        )
    
    @classmethod
    def from_json(cls, json):
        """Converts a saved custom JSON into the D3ARG object
        
        Parameters
        ----------
        json : list of dictionaries
            the custom output of that is copied to clipboard within the visualizer.
            See plotting.md for more details on the format of the json structure

        Returns
        -------
        D3ARG : a corresponding D3ARG object ready to be plotted
        """

        samples = []
        samples_x_pos = []
        nodes = json["arg"]["nodes"]
        width = json["width"]
        x_shift = 50
        if json["y_axis"]["include_labels"]:
            x_shift = 100
            width -= 50
        for i,node in enumerate(nodes):
            if node["flag"] == 1:
                samples.append(node["id"])
                samples_x_pos.append(node["fx"])
            nodes[i]["x_pos_01"] = (node["x"] - x_shift) / (width-100)
        return cls(
            nodes=nodes,
            edges=json["arg"]["links"],
            breakpoints=json["arg"]["breakpoints"],
            num_samples=len(samples),
            sample_order=[sample for _, sample in sorted(zip(samples_x_pos, samples))]
        )

    def _convert_nodes_table(ts, recombination_nodes_to_merge):
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
        h_spacing = 1 / (len(np.unique(ts.tables.nodes.time))-1) #(ts.num_nodes - ts.num_samples - np.count_nonzero(ts.tables.nodes.flags == 131072)/2)
        ordered_nodes = [] # Ordering of sample nodes is the same as the first tree in the sequence
        for node in ts.first().nodes(order="minlex_postorder"):
            if node < ts.num_samples:
                ordered_nodes.append(node)
        unique_times = list(np.unique(ts.tables.nodes.time)) # Determines the rank (y position) of each time point 
        nodes = []
        for ID, node in enumerate(ts.tables.nodes):
            child_of = list(np.unique(ts.tables.edges[np.where(ts.tables.edges.child == ID)[0]].parent))
            for i,child in enumerate(child_of):
                if child in recombination_nodes_to_merge:
                    child_of[i] -= 1
            parent_of = list(np.unique(ts.tables.edges[np.where(ts.tables.edges.parent == ID)[0]].child))
            for i,parent in enumerate(parent_of):
                if parent in recombination_nodes_to_merge:
                    parent_of[i] -= 1
            info = {
                "id": ID,
                "flag": node.flags,
                "time": node.time,
                "time_01":1-node.time/ts.max_root_time,
                "logtime_01":1-math.log(node.time+1)/math.log(ts.max_root_time),
                "rank_01": 1-(unique_times.index(node.time)*h_spacing), #fixed y position, property of force layout
                "child_of": list(np.unique(child_of)),
                "parent_of": list(np.unique(parent_of))
            }
            label = ID
            if node.flags == 131072:
                if ID in recombination_nodes_to_merge:
                    continue
                label = str(ID)+"/"+str(ID+1)
                if len(parent_of) > 0:
                    info["x_pos_reference"] = parent_of[0]
            elif node.flags == 262144:
                if len(parent_of) > 0:
                    info["x_pos_reference"] = parent_of[0]
            info["label"] = str(label) #label which is either the node ID or two node IDs for recombination nodes
            nodes.append(info)
        return nodes

    def _convert_edges_table(ts, recombination_nodes_to_merge):
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

        parents = list(ts.edges_parent)
        for i,parent in enumerate(parents):
            if parent in recombination_nodes_to_merge:
                parents[i] -= 1

        uniq_child_parent = np.unique(np.column_stack((ts.edges_child, parents)), axis=0) #Find unique parent-child pairs.
        links = []
        for combo in uniq_child_parent:
            child = combo[0]
            parent = combo[1]
            equivalent_edges = ts.tables.edges[np.where((ts.edges_child == child) & (parents == parent))[0]]
            region_size = 0
            bounds = ""
            for edge in equivalent_edges:
                bounds += f"{edge.left}-{edge.right} "
                region_size += edge.right - edge.left
            alternative_child = ""
            alternative_parent = ""
            if ts.tables.nodes.flags[parent] != 131072:
                children = np.unique(ts.tables.edges[np.where(parents == parent)[0]].child)
                if len(children) > 2:
                    alternative_child = children[np.where(children != child)][0]
                elif len(children) > 1:
                    alternative_child = children[np.where(children != child)][0]
                else:
                    alternative_child = -1 # this occurs when converting from SLiM simulations, needs to have better handling
                if alternative_child in recombination_nodes_to_merge:
                    alternative_child -= 1
            elif parent in recombination_nodes_to_merge:
                parent = edge.parent - 1
            if ts.tables.nodes.flags[child] == 131072:
                if child in recombination_nodes_to_merge:
                    alt_id = child - 1
                else:
                    alt_id = child + 1
                alt_id_parents = ts.tables.edges[np.where(ts.tables.edges.child == alt_id)[0]].parent
                if len(alt_id_parents):
                    alternative_parent = alt_id_parents[0]
                else:
                    alternative_parent = ""
            if child in recombination_nodes_to_merge:
                child = child - 1
            links.append({
                    "source": parent,
                    "target": child,
                    "bounds": bounds[:-1],
                    "alt_parent": alternative_parent, #recombination nodes have an alternative parent
                    "alt_child": alternative_child,
                    "region_fraction": region_size / ts.sequence_length
                })
        return links
    
    def _identify_breakpoints(ts):
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
                    "x_pos_01":(start/ts.sequence_length),
                    "width_01":((bp - start)/ts.sequence_length)
                })
                start = bp
        return breakpoints
    
    def set_node_labels(self, labels):
        """Sets custom node labels

        Updates node labels based on the D3ARG node "id" using the labels dictionary.
        Final labels will always be strings. Do not rely on the ordering of the
        labels dictionary.

        Parameters
        ----------
        labels : dict
            ID of the node and its new label
        """

        id_map = {n["id"]: i for i,n in enumerate(self.nodes)}
        for label in labels:
            if label not in id_map:
                raise ValueError(f"Node '{label}' not in the graph. Cannot update the node label.")
            self.nodes[id_map[label]]["label"] = str(labels[label])

    def reset_node_labels(self):
        """Resets node labels to default (based on msprime IDs)"""

        for node in self.nodes:
            if node["flag"] == 131072:
                node["label"] = str(node["id"]) + "/" + str(node["id"]+1)
            else:
                node["label"] = str(node["id"])
    
    def _check_all_nodes_are_samples(self, nodes):
        """Checks whether the list of nodes includes only samples

        Returns False
        
        Parameter
        ---------
        nodes : list
            List of potential sample nodes

        Returns
        -------
        tuple :
            bool : whether all nodes in list are samples
            int/None : the ID of the first node that is not a sample
        """

        id_map = {n["id"]: i for i,n in enumerate(self.nodes)}
        for node in nodes:
            if id_map.get(node,-1) != -1:
                if self.nodes[id_map[node]]["flag"] != 1:
                    return False, node
            else:
                raise ValueError(f"Node '{node}' not in the graph.")
        return True, None

    def _calculate_sample_order(self, order=[]):
        """Sets the ordering of the sample nodes (tips) within the ARG
    
        Sample nodes in order list will come first, then any samples nodes not provided will be included
        in minlex_postorder. Checks that only sample nodes are provided in order.

        Parameter
        ---------
        order : list
            Sample nodes in desired order. Must only include sample nodes, but does not
            need to include all sample nodes.

        Returns
        -------
        order : list
            Sample nodes in desired order, including those not originally provided
        """

        check_samples = self._check_all_nodes_are_samples(nodes=order)
        if not check_samples[0]:
            raise ValueError(f"Node '{check_samples[1]}' not a sample and cannot be included in sample order.")
        for node in self.nodes:
            if node["flag"] == 1 and node["id"] not in order:
                order.append(node["id"])
        return order

    def draw(
            self,
            width=500,
            height=500,
            tree_highlighting=True,
            y_axis_labels=True,
            y_axis_scale="rank",
            edge_type="line",
            variable_edge_width=False,
            subset_nodes=None,
            include_node_labels=True,
            sample_order=[]
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
        subset_nodes : list (EXPERIMENTAL)
            List of nodes that user wants to stand out within the ARG. These nodes and the edges between them
            will have full opacity; other nodes will be faint (default=None, parameter is ignored and all
            nodes will have opacity)
        include_node_labels : bool
            Includes the node labels for each node in the ARG (default=True)
        sample_order : list
            Sample nodes IDs in desired order. Must only include sample nodes IDs, but does not
            need to include all sample nodes IDs. (default=[], order is set by first tree in tree sequence)
        """
        
        y_axis_ticks = []
        y_axis_text = []
        transformed_nodes = []
        
        x_shift = 50
        if y_axis_labels:
            x_shift = 100
        sample_positions = calculate_evenly_distributed_positions(num_elements=self.num_samples, start=x_shift, end=(width-100)+x_shift)
        sample_order = self._calculate_sample_order(order=sample_order)
        
        for node in self.nodes:
            if node.get("x_pos_01", -1) != -1:
                node["fx"] = node["x_pos_01"] * (width-100) + x_shift
            elif node["flag"] == 1:
                node["fx"] = sample_positions[sample_order.index(node["id"])]
            else:
                node["x"] = 0.5 * (width-100) + x_shift
            if y_axis_scale == "time":
                node["fy"] = node["time_01"] * (height-100) + 50
                y_axis_ticks.append(node["time_01"] * (height-100) + 50)
            elif y_axis_scale == "log_time":
                node["fy"] = node["logtime_01"] * (height-100) + 50
                y_axis_ticks.append(node["logtime_01"] * (height-100) + 50)
            else:
                node["fy"] = node["rank_01"] * (height-100) + 50
                y_axis_ticks.append(node["rank_01"] * (height-100) + 50)
            node["y"] = node["fy"]
            y_axis_text.append(node["time"])
            transformed_nodes.append(node)
        y_axis_text = [round(t) for t in set(y_axis_text)]
        if tree_highlighting:
            height += 75
        transformed_bps = []
        for bp in self.breakpoints:
            if y_axis_labels:
                bp["x_pos"] = bp["x_pos_01"] * width + 50
            else:
                bp["x_pos"] = bp["x_pos_01"] * width
            bp["width"] = bp["width_01"] * width
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
            "variable_edge_width": str(variable_edge_width).lower(),
            "subset_nodes": subset_nodes,
            "include_node_labels": str(include_node_labels).lower(),
            "evenly_distributed_positions": sample_positions
        }
        draw_D3(arg_json=arg)
    