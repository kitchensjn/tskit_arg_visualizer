const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(
    path.join(__dirname, "../../tskit_arg_visualizer/visualizer.js"),
    "utf8"
);
const start = source.indexOf("function diamondEdgeRoute(");
const end = source.indexOf("\nfunction ensureRequire()", start);
const diamondEdgeRoute = new Function(
    `${source.slice(start, end)}; return diamondEdgeRoute;`
)();

test("the lower-ID edge in a diamond routes left", () => {
    const lowId = {
        id: 1,
        source: { id: 10 },
        target: { id: 20 },
        alt_child: 21,
    };
    const highId = {
        id: 2,
        source: { id: 10 },
        target: { id: 21 },
        alt_child: 20,
    };

    assert.equal(diamondEdgeRoute(lowId, [highId, lowId]).pathType, "fL");
});
