var width = 700,
    height = 600;

var svg = d3.select("#maindiv${divnum}").append("svg")
    .attr("width", width)
    .attr("height", height);
var graph = $arg;

var line = d3.line();
var step = d3.line().curve(d3.curveStep);
var stepAfter = d3.line().curve(d3.curveStepAfter);
var stepBefore = d3.line().curve(d3.curveStepBefore);

var simulation = d3
    .forceSimulation(graph.nodes)
    .force("link",d3.forceLink()
        .id(function(d) {
            return d.id;
        })
        .links(graph.links)
    )
    .force("charge", d3.forceManyBody().strength(-10))
    .on("tick", ticked);

var link = svg
    .append("g")
    .attr("class", "links")
    .selectAll("path")
    .data(graph.links)
    .enter()
    .append("path")
    .style("stroke", "#053e4e")
    .style("stroke-width", 3)
    .style("fill", "none");

var node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter()
    .append("circle")
    .attr("id", function(d) {
        return d.id
    })
    .attr("r", 7)
    .attr("fill", "#1eebb1")
    .attr("stroke", "#053e4e")
    .attr("stroke-width", 3)
    .call(
        d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
    );

var label = svg.selectAll(".text")
    .data(graph.nodes)
    .enter()
    .append("text")
        .text(function (d) { return d.label; })
        .style("text-anchor", "middle")
        .style("fill", "#053e4e")
        .style("font-family", "Arial")
        .style("font-size", 12);
    

function ticked() {

    node
        .attr("cx", function(d) {
            return d.x = Math.max(100, Math.min(600, d.x));
        })
        .attr("cy", function(d) {
            return d.y
        });

    link
        .attr("d", function(d) {
            if (d.target.flag == 131072) {
                var alt_parent_x = document.getElementById(d.direction_reference).getAttribute("cx");
                var alt_parent_y = document.getElementById(d.direction_reference).getAttribute("cy");
                if (d.source.flag == 131072) {
                    return stepBefore([[d.source.x,d.source.y],[d.target.x,d.target.y]]);
                } else {
                    if (d.source.y > alt_parent_y) {
                        if (d.source.x < d.target.x) {
                            return step([[d.source.x,d.source.y],[d.target.x,d.target.y]]);
                            //if (d.target.x - d.source.x > 20) {
                            //  return step([[d.source.x,d.source.y],[d.target.x,d.target.y]]);
                            //} else {
                            //  return line([[d.target.x-20, d.target.y], [d.target.x, d.target.y]]) + stepAfter([[d.source.x,d.source.y],[d.target.x-20,d.target.y]]);
                            //}
                        } else {
                            return step([[d.source.x,d.source.y],[d.target.x,d.target.y]]);
                            //if (d.source.x - d.target.x > 20) {
                            //  return step([[d.source.x,d.source.y],[d.target.x,d.target.y]]);
                            //} else {
                            //  return line([[d.target.x+20, d.target.y], [d.target.x, d.target.y]]) + stepAfter([[d.source.x,d.source.y],[d.target.x+20,d.target.y]]);
                            //}
                        }
                    } else {
                        if (d.source.y < alt_parent_y) {
                            if (alt_parent_x < d.target.x) {
                                if (d.source.x < d.target.x) {
                                    return line([[d.target.x+20, d.target.y], [d.target.x, d.target.y]]) + stepAfter([[d.source.x,d.source.y],[d.target.x+20,d.target.y]]);
                                } else {
                                    return step([[d.source.x,d.source.y],[d.target.x,d.target.y]]);
                                    //return line([[d.target.x+20, d.target.y], [d.target.x, d.target.y]]) + stepAfter([[d.source.x,d.source.y],[d.target.x+20,d.target.y]]);
                                    //return line([[d.source.x+20, d.source.y], [d.source.x, d.source.y]]) + stepBefore([[d.source.x+20,d.source.y],[d.target.x,d.target.y]]);
                                    //if (d.source.x - d.target.x > 20) {
                                    //  return step([[d.source.x,d.source.y],[d.target.x,d.target.y]]);
                                    //} else {
                                    //  return line([[d.target.x+20, d.target.y], [d.target.x, d.target.y]]) + stepAfter([[d.source.x,d.source.y],[d.target.x+20,d.target.y]]);
                                    //}
                                }
                            } else {
                                if (d.source.x > d.target.x) {
                                    return line([[d.target.x-20, d.target.y], [d.target.x, d.target.y]]) + stepAfter([[d.source.x,d.source.y],[d.target.x-20,d.target.y]]);
                                } else {
                                    return line([[d.source.x-20, d.source.y], [d.source.x, d.source.y]]) + stepBefore([[d.source.x-20,d.source.y],[d.target.x,d.target.y]]);
                                    //if (d.target.x - d.source.x > 20) {
                                    //  return step([[d.source.x,d.source.y],[d.target.x,d.target.y]]);
                                    //} else {
                                    //  return line([[d.target.x-20, d.target.y], [d.target.x, d.target.y]]) + stepAfter([[d.source.x,d.source.y],[d.target.x-20,d.target.y]]);
                                    //}
                                }
                            }
                        } else {
                            if (d.index % 2 == 0) {
                                if (d.source.x > d.target.x) {
                                    return line([[d.target.x, d.target.y], [d.target.x-20, d.target.y]]) + stepAfter([[d.source.x,d.source.y],[d.target.x-20,d.target.y]]);
                                } else {
                                    return line([[d.target.x, d.target.y], [d.target.x-20, d.target.y]]) + stepBefore([[d.source.x-20,d.source.y],[d.target.x-20,d.target.y]]) + line([[d.source.x-20, d.source.y], [d.source.x, d.source.y]]);
                                }
                            } else {
                                if (d.source.x > d.target.x) {
                                    return line([[d.target.x, d.target.y], [d.target.x+20, d.target.y]]) + stepBefore([[d.source.x+20,d.source.y],[d.target.x+20,d.target.y]]) + line([[d.source.x+20, d.source.y], [d.source.x, d.source.y]]);
                                } else {
                                    return line([[d.target.x, d.target.y], [d.target.x+20, d.target.y]]) + stepAfter([[d.source.x,d.source.y],[d.target.x+20,d.target.y]]);
                                }
                            }
                        }
                    }
                }
            } else {
                if (d.source.flag == 131072) {
                    return line([[d.target.x, d.target.y], [d.target.x, d.target.y-20]]) + stepBefore([[d.source.x,d.source.y],[d.target.x,d.target.y-20]]);
                } else {
                    return stepAfter([[d.source.x,d.source.y],[d.target.x,d.target.y]]);
                }
            }
        })

    label
        .attr("x", function(d) {
            if (d.flag == 131072) {
                return d.x;
            } else {
                return d.x + 15;
            }
        })
        .attr("y", function(d) {
            return d.y - 15;
        });
}

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
}

function dragged(d) {
    d.fx = d3.event.x;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
}