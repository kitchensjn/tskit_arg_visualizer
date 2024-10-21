TODO and Thoughts

- Separate nodes table into info and styles
    This might be looking for a problem here as I don't think that keeping these together is necessarily a problem
- Node subgraph plot
    - Previously, users could convert the arg_json into a D3ARG object so that it could then be modified and replotted. The node subgraph is slightly different as it lacks information about the full graph and includes some additional information that isn't in the original D3ARG JSON. Is there a way to cleanly incorporate these? Will require testing.
