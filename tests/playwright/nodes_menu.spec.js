const { test, expect } = require("@playwright/test");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const D3 = fs.readFileSync(path.join(__dirname, "../../node_modules/d3/dist/d3.min.js"), "utf8");
const REQUIREJS = fs.readFileSync(path.join(__dirname, "../../node_modules/requirejs/require.js"), "utf8");

// Writes a plot with D3ARG.write_html, so no browser is opened by Python.
function writePlot(drawArgs) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "argviz-")), "plot.html");
  const code = [
    "import sys, msprime, tskit_arg_visualizer as v",
    "ts = msprime.sim_ancestry(3, sequence_length=1e3, recombination_rate=1e-3,",
    "    random_seed=1, model='dtwf', population_size=10)",
    `v.D3ARG.from_ts(ts).write_html(sys.argv[1], ${drawArgs})`,
  ].join("\n");
  execFileSync("python", ["-c", code, file]);
  return file;
}

// Serve d3 and require.js locally so the tests do not need network access.
async function openPlot(page, drawArgs) {
  await page.route("**/d3.v7.min.js", (r) =>
    r.fulfill({ contentType: "application/javascript", body: D3 }));
  await page.route("**/require.min.js", (r) =>
    r.fulfill({ contentType: "application/javascript", body: REQUIREJS }));
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("file://" + writePlot(drawArgs));
  await page.waitForSelector(".d3arg g.label text");
  return errors;
}

const rotatedLabels = (page) =>
  page.locator(".d3arg .nodes > g > g.label text[transform*='rotate']").count();
const tipCount = (page) =>
  page.locator(".d3arg .node.sample").count();
const underlined = (page, cls) =>
  page.locator(`button.${cls}`).evaluate((b) => b.style.textDecoration);

test("labels are grouped with their node symbol", async ({ page }) => {
  await openPlot(page, "");
  const nodes = await page.locator(".d3arg .nodes > g").count();
  expect(nodes).toBeGreaterThan(0);
  expect(await page.locator(".d3arg .nodes > g > path.node").count()).toBe(nodes);
  expect(await page.locator(".d3arg .nodes > g > g.label").count()).toBe(nodes);
});

test("tip labels are horizontal by default and can be rotated", async ({ page }) => {
  const errors = await openPlot(page, "");
  expect(await tipCount(page)).toBeGreaterThan(0);
  expect(await rotatedLabels(page)).toBe(0);
  expect(await underlined(page, "nodes-tip-horizontal")).toBe("underline");

  await page.locator("button.nodes-tip-rotated").dispatchEvent("click");
  expect(await rotatedLabels(page)).toBe(await tipCount(page));
  expect(await underlined(page, "nodes-tip-rotated")).toBe("underline");
  expect(await underlined(page, "nodes-tip-horizontal")).toBe("none");

  await page.locator("button.nodes-tip-horizontal").dispatchEvent("click");
  expect(await rotatedLabels(page)).toBe(0);
  expect(errors).toEqual([]);
});

test("rotate_tip_labels sets the initial state", async ({ page }) => {
  await openPlot(page, "rotate_tip_labels=True");
  expect(await rotatedLabels(page)).toBe(await tipCount(page));
  expect(await underlined(page, "nodes-tip-rotated")).toBe("underline");
});

test("label buttons keep deprecated class names", async ({ page }) => {
  await openPlot(page, "");
  for (const name of ["default", "id", "none"]) {
    expect(await page.locator(`button.nodes-label-${name}.node-labels-${name}`).count()).toBe(1);
  }
});
