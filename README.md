<h1>tskit_arg_visualizer 
  <a href="https://doi.org/10.1093/bioadv/vbaf302">
    <img alt="DOI:10.1093/bioadv/vbaf302" src="http://img.shields.io/badge/DOI-10.1093/bioadv/vbaf302-064358.svg">
  </a>
  <a href="https://james-kitchens.com/tskit_arg_visualizer/latest/">Live Demo</a>
</h1>

<p align="center">
  <img alt="ARG Visualizer Example" src="https://raw.githubusercontent.com/kitchensjn/tskit_arg_visualizer/master/images/tskit_arg_visualizer.png" width="500">
</p>

*Code for above image [here](https://github.com/kitchensjn/tskit_arg_visualizer/blob/main/docs/readme_figure.ipynb).*

A method for drawing ancestral recombination graphs from tskit tree sequences in Python using D3.js. ARGs are plotted using a D3's [force layout](https://github.com/d3/d3-force). All nodes have a fixed position on the y-axis set by fy. Sample nodes have a fixed position on the x-axis set by fx; the ordering of the sample nodes comes from the first tree in the tskit tree sequence (this is not always the optimal ordering but is generally a good starting point for plotting). The x positions of other nodes are set by a force simulation where all nodes repel each other countered by a linkage force between connected nodes in the graph.

Users can click and drag the nodes (including the sample) along the x-axis to further clean up the layout of the graph. The simulation does not take into account line crosses, which can often be improved with some fiddling. Once a node has been moved by a user, its position is fixed with regards to the force simulation.

See [tutorial.md](https://github.com/kitchensjn/tskit_arg_visualizer/blob/main/docs/tutorial.md) for a walkthrough of the package.

## Testing (Local and CI)

This repository now includes:

- Python tests (pytest), under `tests/`
- Minimal browser smoke tests (Playwright), under `tests/playwright/`

### Local setup

1. Install Python dependencies and test runner:

```bash
python -m pip install --upgrade pip
pip install -e .
pip install pytest
```

2. Install Playwright tooling:

```bash
npm install
npx playwright install --with-deps chromium
```

3. Run tests:

```bash
python -m pytest tests/ -q
npm run test:e2e
```

### GitHub Actions

CI is defined in `.github/workflows/ci.yml` and runs both:

- `python -m pytest tests/ -q`
- `npm run test:e2e`

If commands change locally, update them in both this README and the workflow file so local and CI behavior stay aligned.