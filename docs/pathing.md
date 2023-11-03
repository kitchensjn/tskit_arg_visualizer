# Pathing Scenarios

This file includes an explanation of the orthogonal pathing used to link nodes in the ancestral recombination graph (ARG) when `draw(...,edge_type="ortho")`. The ARG visualizer takes a tskit tree sequence as input and converts it to a D3 force simulation so the nomenclature used in this file is a combination of those two libraries. This is a working document; I've tried to capture any scenarios that I could think of, but there may be others that should be included.

To start, the only critical axis for plotting the ARG is the y-axis, which corresponds to time. The grand most recent common ancestor (GMRCA and oldest node) of the ARG is found at the top of the ARG and the samples are found at the bottom. The y-axis is not scaled proportionally with time, instead it is divided into equally spaced ranks. All sample nodes are on the bottom rank, and all older nodes get their own unique rank corresponding to their relative age. These ranks are fixed and cannot be changed by the simulation or user. The x-axis does not provide relevant information about the relationships between the nodes and is simply used to untangle the ARG.

## Node Types

There are two types of nodes found within the ARG: recombination nodes and bifurcation nodes. Recombination nodes have two parents and one child. When the recombination node is the target (child) of the link, the link enters from either the right or left side of the node. When the recombination node is the source (parent) of the link, the link exits from the bottom of the node. Bifurcations nodes have one parent and two children. These nodes follow the opposite pattern to recombination nodes. When the node is the target of the link, the link enters into the top of the node. When the node is the source of the link, the link exits from either side of the node.
    
More than two children or parents are not allowed and so do not need to be handled. Determining the side of the node that the link exits from requires information on the relative positions of nodes in that region of the graph.

## Path Types

There are four known path types (the first three are defined by d3, where "mid" is a custom pathing):

- **stepAfter**: moves horizontally then vertically
- **stepBefore**: moves vertically then horizontally
- **step**: moves horizontally then vertically then horizontally
- **mid**: moves vertically then horizontally then vertically

The path type of an edge is based on the combination of input/output connections defined using a four character string ("connection combo"). The first two characters are associated with the source node connection and the last two correspond to the target node connection. An example path type is r0tR, which refers to a source recombination node connecting to the right side of target recombination node.

### Source Node Connection Types

- **r0**: A recombination node connected on the bottom. The 0 is simply a placeholder character.
- **tL and tR**: A bifurcation node connected on either the left (L) or right (R). "t" is short for "true direction". This means that the target node is in the same direction of the connection.
- **fL and fR**: A bifurcation node connected on either the left (L) or right (R). "f" is short for "false direction". This means that the target node is in the opposite direction of the connection.

### Target Node Connection Types

- **b0**: A bifurcation node connected on the top. The 0 is simply a placeholder character.
- **tL and tR**: A recombination node connected on either the left (L) or right (R). "t" is short for "true direction". This means that the source node is in the same direction of the connection.
- **fL and fR**: A recombination node connected on either the left (L) or right (R). "f" is short for "false direction". This means that the source node is in the opposite direction of the connection.

### What Causes A "False Direction"?

When there are multiple parent connections into a target node, they need to enter on opposite sides. This is easy when the parents are on opposite sides of the child. But when the parents are on the same side, one connection needs to be rerouted to the alternate side. The younger parent is given priority in the direction that they connect to the child; this was chosen to potentially reduce crossover between the connections. The same thing happens with source nodes when both children are on the same side. In this case, the older child has priority.

### Connection Combo to Path Type

Connection combos are simplified to ignore direction information. Below is a table of the path types and associated connection combos:

| Path Type    | Connection Combos |
| ------------ | ----------------- |
| stepAfter    | rf, tb, tf        |
| stepBefore   | rt, fb, ft        |
| step         | tt                |
| mid          | rb, ff            |
