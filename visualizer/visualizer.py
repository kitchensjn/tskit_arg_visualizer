import numpy as np
import random
from string import Template
from IPython.display import HTML, display
import webbrowser
import tempfile
import os


def running_in_notebook():
    """
    Function adapted from https://stackoverflow.com/questions/15411967/how-can-i-check-if-code-is-executed-in-the-ipython-notebook
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


class D3ARG:

    def __init__(self, ts):
        rcnm = np.where(ts.tables.nodes.flags == 131072)[0][1::2]
        self.nodes = self.convert_nodes_table(ts=ts, recombination_nodes_to_merge=rcnm)
        self.edges = self.convert_edges_table(ts=ts, recombination_nodes_to_merge=rcnm)
        self.breakpoints = self.identify_breakpoints(ts=ts)

    def convert_nodes_table(self, ts, recombination_nodes_to_merge):
        """
        Builds the nodes json. A "reference" is the id of another node that is used to determine a property in the
        graph. Example: recombination nodes should have the same x position as their child, unless their child is
        also a recombination node. This isn't yet implemented automatically in the layout as it breaks the force
        layout.
        """

        # Parameters for the dimensions of the D3 plot. Eventually want to handle this entirely in JS
        w_spacing = 1 / (ts.num_samples - 1)
        h_spacing = 1 / (ts.num_nodes - ts.num_samples - np.count_nonzero(ts.tables.nodes.flags == 131072)/2)
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
                "fy": 1-(unique_times.index(node.time)*h_spacing) #fixed y position, property of force layout
            }
            label = ID
            if node.flags == 1:
                info["fx"] = ordered_nodes.index(ID)*w_spacing #sample nodes have a fixed x position
            elif node.flags == 131072:
                if ID in recombination_nodes_to_merge:
                    continue
                label = str(ID)+"/"+str(ID+1)
                info["x_pos_reference"] = ts.tables.edges[np.where(ts.tables.edges.parent == ID)[0]].child[0]
            elif node.flags == 262144:
                info["x_pos_reference"] = ts.tables.edges[np.where(ts.tables.edges.parent == ID)[0]].child[0]
            info["label"] = label #label which is either the node ID or two node IDs for recombination nodes
            nodes.append(info)
        
        return nodes

    def convert_edges_table(self, ts, recombination_nodes_to_merge):
        """
        Builds the edges json. For recombination nodes, replaces the larger number with the smaller. The direction
        that the edge should go relates to the positions of not just the nodes connected by that edge, but also the
        other edges connected to the child. See the JS for all of the different scenarios; still working through
        that.
        """
        links = []
        for edge in ts.tables.edges:
            child = edge.child
            alternative_child = ""
            alternative_parent = ""
            if edge.parent not in recombination_nodes_to_merge:
                left = edge.left
                right = edge.right
                if ts.tables.nodes.flags[edge.parent] != 131072:
                    children = ts.tables.edges[np.where(ts.tables.edges.parent == edge.parent)[0]].child
                    alternative_child = children[np.where(children != edge.child)][0]
                    #if len(possible_child) > 0:
                    #    alternative_child = possible_child[0]
                    if alternative_child in recombination_nodes_to_merge:
                        alternative_child -= 1
                else:
                    alt_edge = ts.tables.edges[np.where(ts.tables.edges.parent == edge.parent + 1)[0]]
                    if left > alt_edge.left[0]:
                        left = alt_edge.left[0]
                    if right < alt_edge.right[0]:
                        right = alt_edge.right[0]
                if ts.tables.nodes.flags[edge.child] == 131072:
                    if edge.child in recombination_nodes_to_merge:
                        alt_id = edge.child - 1
                    else:
                        alt_id = edge.child + 1
                    alternative_parent = ts.tables.edges[np.where(ts.tables.edges.child == alt_id)[0]].parent[0]
                if edge.child in recombination_nodes_to_merge:
                    child = edge.child - 1
                links.append({
                    "source": edge.parent,
                    "target": child,
                    "left": left,
                    "right": right,
                    "alt_parent": alternative_parent, #recombination nodes have an alternative parent
                    "alt_child": alternative_child
                })
        return links
    
    def identify_breakpoints(self, ts):
        """
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
    
    def draw(self, width=500, height=500, tree_highlighting=True):
        """
        """
        
        transformed_nodes = []
        for node in self.nodes:
            if node.get("fx", -1) != -1:
                node["fx"] = node["fx"] * (width-100) + 50
            node["fy"] = node["fy"] * (height-100) + 50
            transformed_nodes.append(node)
        if tree_highlighting:
            height += 100
        transformed_bps = []
        for bp in self.breakpoints:
            bp["x_pos"] = bp["x_pos"] * width
            bp["width"] = bp["width"] * width
            transformed_bps.append(bp)
        arg = {
            "arg":{
                "nodes":transformed_nodes,
                "links":self.edges,
                "breakpoints": transformed_bps
            },
            "width":width,
            "height":height,
            "tree_highlighting":str(tree_highlighting).lower()
        }
        arg['divnum'] = str(random.randint(0,9999999999))
        JS_text = Template("<div id='arg_" + arg['divnum'] + "'></div><script>$main_text</script>")
        main_text_template = Template( open(os.path.dirname(__file__) + "/visualizer.js","r").read() )
        main_text = main_text_template.safe_substitute(arg)
        html = JS_text.safe_substitute({'main_text': main_text})
        if running_in_notebook():
            display(HTML("<script src='https://d3js.org/d3.v4.min.js'></script>" + html))
        else:
            with tempfile.NamedTemporaryFile("w", delete=False, suffix=".html") as f:
                url = "file://" + f.name
                f.write("<script src='https://d3js.org/d3.v4.min.js'></script>" + html)
            webbrowser.open(url, new=2)
    