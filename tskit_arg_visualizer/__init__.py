import random
import math
import itertools
import operator
from string import Template
import webbrowser
import tempfile
import os
import msprime
import numpy as np
import pandas as pd
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
        elif shell == "Shell":
            return True   # Google Colab
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
        display(HTML("<style>"+styles+"</style><script src='https://cdn.rawgit.com/eligrey/canvas-toBlob.js/f1a01896135ab378aa5c0118eadd81da55e698d8/canvas-toBlob.js'></script><script src='https://cdn.rawgit.com/eligrey/FileSaver.js/e9d941381475b5df8b7d7691013401e171014e89/FileSaver.min.js'></script><script src='https://d3js.org/d3.v7.min.js'></script>" + html))
    else:
        with tempfile.NamedTemporaryFile("w", delete=False, suffix=".html") as f:
            url = "file://" + f.name
            f.write("<!DOCTYPE html><html><head><style>"+styles+"</style><script src='https://cdn.rawgit.com/eligrey/canvas-toBlob.js/f1a01896135ab378aa5c0118eadd81da55e698d8/canvas-toBlob.js'></script><script src='https://cdn.rawgit.com/eligrey/FileSaver.js/e9d941381475b5df8b7d7691013401e171014e89/FileSaver.min.js'></script><script src='https://d3js.org/d3.v7.min.js'></script></head><body>" + html + "</body></html>")
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
        nodes : pandas.DataFrame
            Contains info about the nodes
        edges : pandas.DataFrame
            Contains info about the edges
        breakpoints : pandas.DataFrame
            Contains info about the breakpoints
        num_samples : int
            Number of samples in the ARG. Useful for various calculations when plotting
        sample_order : list or np.array
            Order of the sample ID from left to right when plotting
        """

        self.nodes = nodes
        self.edges = edges
        self.breakpoints = breakpoints
        self.num_samples = num_samples
        self.sample_order = sample_order

    def __str__(self):
        """Prints attributes of D3ARG object"""
        return f"Nodes:\n{self.nodes}\n\nEdges:\n{self.edges}\n\nBreakpoints:\n{self.breakpoints}\n\nNumber of Samples: {self.num_samples}\nSample Order: {self.sample_order}"
        
    @classmethod
    def from_ts(cls, ts, ignore_unattached_nodes=False):
        """Converts a tskit tree sequence into a D3ARG object
        
        Parameters
        ----------
        ts : tskit.TreeSequence
            Note: if tree sequence marks recombination nodes, it must use 2-RE format similar to that
            used by msprime.sim_ancestry(...,record_full_arg=True).
        ignore_unattached_nodes : bool
            Whether to include all nodes or ignore nodes that are completely
            unattached. Default is False.
        
        Returns
        -------
        D3ARG : a corresponding D3ARG object ready to be plotted
        """

        in_edges = np.unique(np.append(ts.edges_parent, ts.edges_child))
        samples = []
        order = ts.first().nodes(order="minlex_postorder")
        for n in order:
            if ts.node(n).is_sample():
                if ignore_unattached_nodes and n not in in_edges:
                    continue
                samples.append(n)
        rcnm = np.where(ts.nodes_flags == 131072)[0][1::2]  # NB should probably be (ts.nodes_flags & msprime.NODE_IS_RE_EVENT) != 0
        return cls(
            nodes=cls._convert_nodes_table(ts=ts, recombination_nodes_to_merge=rcnm, ignore_unattached_nodes=ignore_unattached_nodes),
            edges=cls._convert_edges_table(ts=ts, recombination_nodes_to_merge=rcnm),
            breakpoints=cls._identify_breakpoints(ts=ts),
            num_samples=len(samples),
            sample_order=samples
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

        width = json["width"]
        x_shift = 50
        if json["y_axis"]["include_labels"]:
            x_shift = 100
            width -= 50
        nodes = pd.DataFrame(json["data"]["nodes"])
        nodes["x_pos_01"] = (nodes["x"] - x_shift) / (width-100)
        samples = nodes.loc[nodes["flag"]==1,["id", "fx"]]
        return cls(
            nodes=nodes,
            edges=pd.DataFrame(json["data"]["links"]),
            breakpoints=pd.DataFrame(json["data"]["breakpoints"]),
            num_samples=samples.shape[0],
            sample_order=[sample for _, sample in sorted(zip(samples["fx"], samples["id"]))]
        )

    def _convert_nodes_table(ts, recombination_nodes_to_merge, ignore_unattached_nodes):
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
        ignore_unattached_nodes : bool
            Whether to include all nodes or ignore nodes that are completely
            unattached

        Returns
        -------
        nodes : list
            List of dictionaries containing information about a given node
        """
        node_lookup = np.arange(ts.num_nodes)  # maps original node IDs to the plotted node ID
        merge_with_prev_node = np.zeros(ts.num_nodes, dtype=bool)
        merge_with_prev_node[recombination_nodes_to_merge] = True
        merge_with_prev_node = np.logical_and(merge_with_prev_node, ts.nodes_flags & msprime.NODE_IS_RE_EVENT != 0)
        node_lookup[merge_with_prev_node] = node_lookup[merge_with_prev_node] - 1  # plotted ID is ID of prev node

        if ignore_unattached_nodes:
            omit_nodes = np.ones(ts.num_nodes, dtype=bool)
            omit_nodes[ts.edges_parent] = False
            omit_nodes[ts.edges_child] = False

        nodes = {
            u: {
                "id": u,
                "flag": flags,
                "time": time,
                "child_of": set(),  # will later convert to list
                "parent_of": set(),  # will later convert to list
                "size": 150,
                "symbol": "d3.symbolCircle",
                "fill": "#1eebb1",
                "stroke": "#053e4e",
                "stroke_width": 4,
                "include_label": "true",
                "x_pos_reference": -1,
            }
            for u, (flags, time) in enumerate(zip(ts.nodes_flags, ts.nodes_time))
            if not (ignore_unattached_nodes and omit_nodes[u]) and not merge_with_prev_node[u]
        }
        
        for edge in ts.edges():
            nodes[node_lookup[edge.child]]['child_of'].add(node_lookup[edge.parent])
            nodes[node_lookup[edge.parent]]['parent_of'].add(node_lookup[edge.child])

        for u in nodes.keys():
            info = nodes[u]
            info['child_of'] = sorted(info['child_of'])
            info['parent_of'] = unique_parent_of = sorted(info['parent_of'])

            if info["flag"] == 131072:
                info["label"] = str(u)+"/"+str(u+1)
                if (len(unique_parent_of) == 1) and not (ts.nodes_flags[unique_parent_of[0]] & msprime.NODE_IS_RE_EVENT != 0):
                    info["x_pos_reference"] = unique_parent_of[0]
            else:
                info["label"] = str(u)
                if (len(unique_parent_of) == 1) and (len(info['child_of']) > 0):
                    # ignores roots as that is necessary to avoid stacking
                    info["x_pos_reference"] = unique_parent_of[0]
        return pd.DataFrame(nodes.values())

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
        ID = 0
        links = []  # a list of parent_links (will be flattened and returned as a pandas array)
        # iterate over unique parent/child combos. Take advantage of the fact that edges
        # in a tree sequence are always ordered by parent ID.
        for parent, edges in itertools.groupby(ts.edges(), operator.attrgetter("parent")):
            parent_links = []  # all links for this parent
            if parent in recombination_nodes_to_merge:
                parent -= 1
                ID = links[-1][0]["id"]  # to account for prev parent_links being overwritten
            else:
                edges_for_child = {}  # This is a new parent: make a new array
            for edge in edges:
                if edge.child not in edges_for_child:
                    edges_for_child[edge.child] = [edge]
                else:
                    edges_for_child[edge.child].append(edge)
            for child, equivalent_edges in edges_for_child.items():
                region_size = 0
                bounds = ""
                for edge in equivalent_edges:
                    bounds += f"{edge.left}-{edge.right} "
                    region_size += edge.right - edge.left
                alternative_child = ""
                alternative_parent = ""
                if (ts.nodes_flags[parent] & msprime.NODE_IS_RE_EVENT) == 0:
                    children = np.array(list(edges_for_child.keys()))
                    if len(children) > 2:
                        alternative_child = children[np.where(children != child)][0]
                    elif len(children) > 1:
                        alternative_child = children[np.where(children != child)][0]
                    else:
                        alternative_child = -1 # this occurs when converting from SLiM simulations, needs to have better handling
                    if alternative_child in recombination_nodes_to_merge:
                        alternative_child -= 1
                if (ts.nodes_flags[child] & msprime.NODE_IS_RE_EVENT) != 0:
                    if child in recombination_nodes_to_merge:
                        alt_id = child - 1
                    else:
                        alt_id = child + 1
                    alt_id_parents = ts.edges_parent[ts.edges_child == alt_id]
                    if len(alt_id_parents):
                        alternative_parent = alt_id_parents[0]
                    else:
                        alternative_parent = ""
                if child in recombination_nodes_to_merge:
                    child = child - 1
                parent_links.append({
                    "id": ID,
                    "source": parent,
                    "target": child,
                    "bounds": bounds[:-1],
                    "alt_parent": alternative_parent, #recombination nodes have an alternative parent
                    "alt_child": alternative_child,
                    "region_fraction": region_size / ts.sequence_length,
                    "color": "#053e4e"
                })
                ID += 1
            if edge.parent in recombination_nodes_to_merge:
                # We must replace the previous parent_links array with all the details from this one,
                # which will contain all edges for both recombination parents
                links[-1] = parent_links
            else:
                links.append(parent_links)
        return pd.DataFrame(l for parent_links in links for l in parent_links) 
   
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
        return pd.DataFrame(breakpoints)
    
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
        df_id_index = self.nodes.set_index("id")
        try:
            keys = np.fromiter(labels.keys(), dtype=int)
        except ValueError as e:
            raise ValueError("Keys in labels must be integers.") from e
        try:
            df_id_index.loc[keys, 'label'] = [str(v) for v in labels.values()]
        except KeyError as e:
            raise ValueError("Node IDs in labels must be IDs of nodes in the graph.") from e
        self.nodes['label'] = df_id_index['label'].values

    def reset_node_labels(self):
        """Resets node labels to default (based on msprime IDs)"""

        for node in self.nodes:
            if node["flag"] == 131072:
                node["label"] = str(node["id"]) + "/" + str(node["id"]+1)
            else:
                node["label"] = str(node["id"])

    def reset_all_node_styles(self):
        """Resets node styles to default (same as when assigned using D3ARG.from_ts)
        
        WARNING: This might not match the initial styles if using D3ARG.from_json
        """

        self.nodes["size"] = 150
        self.nodes["symbol"] = "d3.symbolCircle"
        self.nodes["fill"] = "#1eebb1"
        self.nodes["stroke"] = "#053e4e"
        self.nodes["stroke_width"] = 4
        self.nodes["include_label"] = "true"

    def set_all_node_styles(self, size="", symbol="", fill="", stroke="", stroke_width="", include_label=""):
        """Sets the styling of all of the nodes at once for a specific option.

        If optional parameter not provided, that styling option will be ignored and unchanged.

        Parameters
        ----------
        size : int
            Size in pixels of the node
        symbol : string
            D3 symbol (see https://d3js.org/d3-shape/symbol)
        fill : string
            Color of the node, "#XXXXXX" form
        stroke : string
            Color of the stroke around the node, "#XXXXXX" form
        stroke_width : int
            Pixel width for the stroke around the node
        include_labels : string
            "true" or "false" (will need to update this to bool eventually)
        """

        if size != "":
            self.nodes["size"] = size
        if symbol != "":
            self.nodes["symbol"] = symbol
        if fill != "":
            self.nodes["fill"] = fill
        if stroke != "":
            self.nodes["stroke"] = stroke
        if stroke_width != "":
            self.nodes["stroke_width"] = stroke_width
        if include_label != "":
            self.nodes["include_label"] = include_label
        
    def set_node_styles(self, styles):
        """Individually control the styling of each node.

        Parameters
        ----------
        styles : list
            List of dicts, one per node, with the styling keys: id, size, symbol, fill, stroke_width,
            include_label. "id" is the only mandatory key. Only nodes that need styles updated need to
            be provided.
        """

        for node in styles:
            for key in node.keys():
                if key in ["size", "symbol", "fill", "stroke", "stroke_width", "include_label"]:
                    self.nodes.loc[self.nodes["id"]==node["id"], key] = node[key]
        
    def set_edge_colors(self, colors):
        """Set the color of each edge in the ARG

        Parameters
        ----------
        colors : dict
            ID of the edge and its new color
        """

        for id in colors:
            if id in self.edges["id"]:
                self.edges.loc[self.edges["id"]==id, "color"] = colors[id]
            else:
                raise ValueError(f"Edge '{id}' not in the graph. Cannot update the edge color. Make sure all IDs are integers.")
        
    def reset_edge_colors(self):
        """Resets the edge colors to the default (#053e4e)"""

        self.edges["color"] = "#053e4e"

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

        for node in nodes:
            found = list(self.nodes.loc[self.nodes["id"] == int(node)]["flag"])
            if len(found) > 0:
                if len(found) == 1:
                    if found[0] != 1:
                        return False, node
                else:
                    ValueError(f"Multiple entries for Node '{node}' in the graph.")
            else:
                raise ValueError(f"Node '{node}' not in the graph.")
        return True, None

    def _calculate_sample_order(self, order=None):
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

        if order == None:
            order = []
        check_samples = self._check_all_nodes_are_samples(nodes=order)
        if not check_samples[0]:
            raise ValueError(f"Node '{check_samples[1]}' not a sample and cannot be included in sample order.")
        for node in self.sample_order:
            found = self.nodes.loc[self.nodes["id"] == int(node)].iloc[0]
            if found["flag"] == 1 and found["id"] not in order:
                order.append(found["id"])
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
            include_underlink=True,
            sample_order=None
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
        """
        
        y_axis_ticks = []
        y_axis_text = []
        transformed_nodes = []
        
        x_shift = 50
        if y_axis_labels:
            x_shift = 100
        sample_positions = calculate_evenly_distributed_positions(num_elements=self.num_samples, start=x_shift, end=(width-100)+x_shift)
        sample_order = self._calculate_sample_order(order=sample_order)
        max_time = max(self.nodes["time"])
        h_spacing = 1 / (len(np.unique(self.nodes["time"]))-1)
        unique_times = list(np.unique(self.nodes["time"])) # Determines the rank (y position) of each time point 

        for index, node in self.nodes.iterrows():
            if "x_pos_01" in node:
                node["fx"] = node["x_pos_01"] * (width-100) + x_shift
            elif node["flag"] == 1:
                node["fx"] = sample_positions[sample_order.index(node["id"])]
            else:
                node["x"] = 0.5 * (width-100) + x_shift
            if y_axis_scale == "time":
                fy = (1-node["time"]/max_time) * (height-100) + 50
            elif y_axis_scale == "log_time":
                fy = (1-math.log(node["time"]+1)/math.log(max_time)) * (height-100) + 50
            else:
                fy = (1-unique_times.index(node["time"])*h_spacing) * (height-100) + 50
                y_axis_text.append(node["time"])
                y_axis_ticks.append(fy)
            
            node["fy"] = fy
            node["y"] = node["fy"]
            transformed_nodes.append(node.to_dict())
        if tree_highlighting:
            height += 75

        if y_axis_scale == "time":
            y_axis_text = np.array(calculate_evenly_distributed_positions(10, start=0, end=max_time))
            y_axis_ticks = (1-y_axis_text/max_time) * (height-100) + 50
        elif y_axis_scale == "log_time":
            digits = int(math.log10(max_time))+1
            if (max_time - 10**(digits-1) < 10**(digits-1)): # this just removes the tick mark if its likely there is overlap
                digits -= 1
            y_axis_text = [0] + [10**i for i in range(1, digits)] + [max_time]
            y_axis_ticks = []
            for time in y_axis_text:
                y_axis_ticks.append((1-math.log(time+1)/math.log(max_time)) * (height-100) + 50)

        y_axis_text = [round(t) for t in set(y_axis_text)]
        
        transformed_bps = self.breakpoints.loc[:,:]
        if y_axis_labels:
            transformed_bps["x_pos"] = transformed_bps["x_pos_01"] * width + 50
        else:
            transformed_bps["x_pos"] = transformed_bps["x_pos_01"] * width
        transformed_bps["width"] = transformed_bps["width_01"] * width
        transformed_bps = transformed_bps.to_dict("records")

        if y_axis_labels:
            width += 50
        arg = {
            "data":{
                "nodes":transformed_nodes,
                "links":self.edges.to_dict("records"),
                "breakpoints": transformed_bps,
                "evenly_distributed_positions":sample_positions
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
            "edges":{
                "type":edge_type,
                "variable_width":str(variable_edge_width).lower(),
                "include_underlink":str(include_underlink).lower()
            },
            "tree_highlighting":str(tree_highlighting).lower()
        }
        draw_D3(arg_json=arg)

    def draw_node(
            self,
            node,
            width=500,
            height=500,
            degree=1,
            y_axis_labels=True,
            y_axis_scale="rank"
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
        """
        
        nodes = [node]
        above = [node]
        below = [node]
        #included_edges = pd.DataFrame(columns=self.edges.columns)
        first = True
        try:
            older_degree = degree[0]
            younger_degree = degree[-1]
        except TypeError:
            older_degree = younger_degree = degree
        for _ in range(older_degree):
            new_above = []
            for n in above:
                to_add = self.edges.loc[self.edges["target"] == n, :]
                if first:
                    included_edges = to_add
                    first = False
                else:
                    included_edges = pd.concat([included_edges, to_add], ignore_index=True)
                new_above.extend(list(to_add["source"]))
            above = new_above
            nodes.extend(new_above)
        for _ in range(younger_degree):
            new_below = []
            for n in below:
                to_add = self.edges.loc[self.edges["source"] == n, :]
                if first:
                    included_edges = to_add
                    first = False
                else:
                    included_edges = pd.concat([included_edges, to_add], ignore_index=True)
                new_below.extend(list(to_add["target"]))
            below = new_below
            nodes.extend(new_below)
        included_edges = included_edges.drop_duplicates()
        included_nodes = self.nodes.loc[self.nodes["id"].isin(list(set(nodes))), :]

        ni_child, ni_parent = [], []
        for n in included_nodes["id"]:
            all_nodes_parents = self.edges[((self.edges["target"] == n) | (self.edges["source"] == n))]
            included_nodes_parents = included_edges[((included_edges["target"] == n) | (included_edges["source"] == n))]
            not_included = pd.merge(all_nodes_parents, included_nodes_parents, indicator=True, how='outer').query('_merge=="left_only"').drop('_merge', axis=1)
            ni_child.append(sum(not_included["source"] == n))
            ni_parent.append(sum(not_included["target"] == n))
        included_nodes = included_nodes.assign(not_included_children=ni_child, not_included_parents=ni_parent)

        y_axis_ticks = []
        y_axis_text = []
        transformed_nodes = []
        
        x_shift = 50
        if y_axis_labels:
            x_shift = 100
        max_time = max(included_nodes["time"])
        h_spacing = 1 / (len(np.unique(included_nodes["time"]))-1)
        unique_times = list(np.unique(included_nodes["time"])) # Determines the rank (y position) of each time point 

        for index, n in included_nodes.iterrows():
            if "x_pos_01" in n:
                n["fx"] = n["x_pos_01"] * (width-100) + x_shift
            elif n["id"] == node:
                n["fx"] = 0.5 * (width-100) + x_shift
            else:
                n["x"] = 0.5 * (width-100) + x_shift
            if y_axis_scale == "time":
                fy = (1-n["time"]/max_time) * (height-100) + 50
            elif y_axis_scale == "log_time":
                fy = (1-math.log(n["time"]+1)/math.log(max_time)) * (height-100) + 50
            else:
                fy = (1-unique_times.index(n["time"])*h_spacing) * (height-100) + 50
                y_axis_text.append(n["time"])
                y_axis_ticks.append(fy)
            
            n["fy"] = fy
            n["y"] = n["fy"]
            transformed_nodes.append(n.to_dict())

        if y_axis_scale == "time":
            y_axis_text = np.array(calculate_evenly_distributed_positions(10, start=0, end=max_time))
            y_axis_ticks = (1-y_axis_text/max_time) * (height-100) + 50
        elif y_axis_scale == "log_time":
            digits = int(math.log10(max_time))+1
            if (max_time - 10**(digits-1) < 10**(digits-1)): # this just removes the tick mark if its likely there is overlap
                digits -= 1
            y_axis_text = [0] + [10**i for i in range(1, digits)] + [max_time]
            y_axis_ticks = []
            for time in y_axis_text:
                y_axis_ticks.append((1-math.log(time+1)/math.log(max_time)) * (height-100) + 50)

        y_axis_text = [round(t) for t in set(y_axis_text)]
        
        transformed_bps = self.breakpoints.loc[:,:]
        if y_axis_labels:
            transformed_bps["x_pos"] = transformed_bps["x_pos_01"] * width + 50
        else:
            transformed_bps["x_pos"] = transformed_bps["x_pos_01"] * width
        transformed_bps["width"] = transformed_bps["width_01"] * width
        transformed_bps = transformed_bps.to_dict("records")

        if y_axis_labels:
            width += 50
        arg = {
            "data":{
                "nodes":transformed_nodes,
                "links":included_edges.to_dict("records"),
                "breakpoints": transformed_bps,
                "evenly_distributed_positions":[]
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
            "edges":{
                "type":"line",
                "variable_width":"false",
                "include_underlink":"false"
            },
            "tree_highlighting":"false"
        }
        draw_D3(arg_json=arg)