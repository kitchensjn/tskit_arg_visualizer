import sys
sys.path.append("/Users/jameskitchens/Documents/GitHub/tskit_arg_visualizer")
import tskit_arg_visualizer as tsviz
import tskit
import numpy as np
import random


def remove_unattached_nodes(ts):
    """Removes any nodes that are not attached to any other nodes from the tree sequence
    
    Parameters
    ----------
    ts : tskit.TreeSequence

    Returns
    -------
    ts_final : tskitTreeSequence
        A tree sequence with unattached nodes removed
    """

    edge_table = ts.tables.edges
    connected_nodes = np.sort(np.unique(np.concatenate((edge_table.parent,edge_table.child))))
    ts_final = ts.subset(nodes=connected_nodes)
    return ts_final

def simplify_with_recombination(ts, flag_recomb=False, keep_nodes=None):
    """Simplifies a tree sequence while keeping recombination nodes

    Removes unary nodes that are not recombination nodes. Does not remove non-genetic ancestors.
    Edges intervals are not updated. This differs from how tskit's TreeSequence.simplify() works.

    Parameters
    ----------
    ts : tskit.TreeSequence
    flag_recomb (optional) : bool
        Whether to add msprime node flags. Default is False.
    keep_nodes (optional) : list
        List of node IDs that should be kept. Default is None, so empty list.

    Returns
    -------
    ts_sim : tskit.TreeSequence
        Simplified tree sequence
    maps_sim : numpy.ndarray
        Mapping for nodes in the simplified tree sequence versus the original
    """

    if keep_nodes == None:
        keep_nodes = []

    uniq_child_parent = np.unique(np.column_stack((ts.edges_child, ts.edges_parent)), axis=0)
    child_node, parents_count = np.unique(uniq_child_parent[:, 0], return_counts=True) #For each child, count how many parents it has.
    parent_node, children_count = np.unique(uniq_child_parent[:, 1], return_counts=True) #For each child, count how many parents it has.
    multiple_parents = child_node[parents_count > 1] #Find children who have more than 1 parent. 
    recomb_nodes = ts.edges_parent[np.isin(ts.edges_child, multiple_parents)] #Find the parent nodes of the children with multiple parents. 
    
    if flag_recomb:
        ts_tables = ts.dump_tables()
        node_table = ts_tables.nodes
        flags = node_table.flags
        flags[recomb_nodes] = 131072 #msprime.NODE_IS_RE_EVENT
        node_table.flags = flags
        ts_tables.sort() 
        ts = ts_tables.tree_sequence()
    
    keep_nodes = np.unique(np.concatenate((keep_nodes, recomb_nodes)))
    potentially_uninformative = np.intersect1d(child_node[np.where(parents_count!=0)[0]], parent_node[np.where(children_count==1)[0]])
    truly_uninformative = np.delete(potentially_uninformative, np.where(np.isin(potentially_uninformative, keep_nodes)))
    all_nodes = np.array(range(ts.num_nodes-1))
    important = np.delete(all_nodes, np.where(np.isin(all_nodes, truly_uninformative)))
    ts_sim, maps_sim = ts.simplify(samples=important, map_nodes=True, keep_input_roots=False, keep_unary=False, update_sample_flags=False)
    return ts_sim, maps_sim


ts = tskit.load("out.1000.trees")
# FY*O 159174683
samples = []
order = ts.at(159174683).nodes(order="minlex_postorder")
for n in order:
    if ts.node(n).is_sample():
        samples.append(n)
ts = ts.keep_intervals([[159174683-100, 159174683+100]], simplify=False).trim()
ts = remove_unattached_nodes(ts)
ts, mapping = simplify_with_recombination(ts)

ts.at(100).draw_svg(size=(1000,1000), time_scale="rank", path="duffy_100_ts.svg")
exit()

d3arg = tsviz.D3ARG.from_ts(ts)

d3arg.set_node_labels({id:"" for id in d3arg.nodes.id})
labels = {}
for sample in ts.samples():
    labels[sample] = ts.tables.nodes[sample].metadata["name"]
d3arg.set_node_labels(labels)

times = sorted(round(d3arg.nodes.time).unique())
unique_colors = {time:"#"+''.join([random.choice('0123456789ABCDEF') for j in range(6)]) for time in times}
fills = [{"id":row.id, "fill":unique_colors[round(row.time)]} for _,row in d3arg.nodes.iterrows()]
d3arg.set_node_styles(styles=fills)

d3arg.draw(width=3000, height=1500, edge_type="ortho", sample_order=samples)