import collections
import pandas as pd
import networkx as nx
import tskit
import msprime

def arg2ts(file_path):
    infile = open(file_path, "r")
    start, end = next(infile).strip().split()
    assert start.startswith("start=")
    start = int(start[len("start=") :])
    assert end.startswith("end=")
    end = int(end[len("end=") :])
    # the "name" field can be a string. Force it to be so, in case it is just numbers
    df = pd.read_csv(infile, header=0, sep="\t", dtype={"name": str, "parents": str})
    #df = df.sort_values("age")

    name_to_record = {}
    for _, row in df.iterrows():
        row = dict(row)
        name_to_record[row["name"]] = row
    # We could use nx to do this, but we want to be sure the order is correct.
    parent_map = collections.defaultdict(list)

    # Make an nx DiGraph so we can do a topological sort.
    G = nx.DiGraph()
    time_map = {} # argweaver times to allocated time
    for row in name_to_record.values():
        child = row["name"]
        parents = row["parents"]
        time_map[row["age"]] = row["age"]
        G.add_node(child)
        if isinstance(parents, str):
            for parent in row["parents"].split(","):
                G.add_edge(child, parent)
                parent_map[child].append(parent)
    tables = tskit.TableCollection(sequence_length=end)
    tables.nodes.metadata_schema = tskit.MetadataSchema.permissive_json()
    node_id_convert = {}
    counter = 0
    for node in nx.lexicographical_topological_sort(G):
        record = name_to_record[node]
        if record["event"] == "gene":
            tables.nodes.add_row(flags=tskit.NODE_IS_SAMPLE, time=record["age"], metadata={"name": record["name"]})
        elif record["event"] == "recomb":
            tables.nodes.add_row(flags=msprime.NODE_IS_RE_EVENT, time=record["age"]+counter/(1e6), metadata={"name": record["name"]})
            tables.nodes.add_row(flags=msprime.NODE_IS_RE_EVENT, time=record["age"]+counter/(1e6), metadata={"name": record["name"]})
        else:
            tables.nodes.add_row(flags=0, time=record["age"]+counter/(1e6), metadata={"name": record["name"]})
        node_id_convert[record["name"]] = {"id":counter, "pos": record["pos"]}
        if record["event"] == "recomb":
            counter += 1
        counter += 1
    for _, node in df.iterrows():
        tskit_child = node_id_convert[node["name"]]
        parents = str(node["parents"]).split(",")
        positions = [0, tskit_child["pos"], end]
        if positions[1] == 0:
            positions[1] = end
        up_node = 0
        for parent in parents:
            if parent != "nan":
                tskit_parent = node_id_convert[parent]    
                if tables.nodes[tskit_parent["id"]].flags == msprime.NODE_IS_RE_EVENT:
                    tables.edges.add_row(left=positions[up_node], right=tskit_parent["pos"], parent=tskit_parent["id"], child=tskit_child["id"]+up_node)
                    tables.edges.add_row(left=tskit_parent["pos"], right=positions[up_node+1], parent=tskit_parent["id"]+1, child=tskit_child["id"]+up_node)
                else:
                    tables.edges.add_row(left=positions[up_node], right=positions[up_node+1], parent=tskit_parent["id"], child=tskit_child["id"]+up_node)
            up_node += 1
    for edge in tables.edges:
        if tables.nodes[edge.parent].time - tables.nodes[edge.child].time <= 0:
            print(edge, tables.nodes[edge.parent].time, tables.nodes[edge.child].time)
    
    tables.sort()
    ts = tables.tree_sequence()
    return ts.simplify(keep_unary=True)


ts = arg2ts(file_path="out.1000.arg")
print(ts)
ts.dump("out.1000.trees")