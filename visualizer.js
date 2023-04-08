var width = $width, height = $height;
var line = d3.line();
var step = d3.line().curve(d3.curveStep);
var stepAfter = d3.line().curve(d3.curveStepAfter);
var stepBefore = d3.line().curve(d3.curveStepBefore);

function draw_force_diagram() {
    var svg = d3.select("#arg_${divnum}").append("svg")
        .attr("width", width)
        .attr("height", height);
    var graph = $arg;

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

    var link_container = svg
        .append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(graph.links)
        .enter()
        .append("g");
    
    var underlink = link_container
        .append("path")
        .style("stroke", "#ffffff")
        .style("stroke-width", 10)
        .style("fill", "none");

    var link = link_container
        .append("path")
        .style("stroke", "#053e4e")
        .style("stroke-width", 3)
        .style("fill", "none")
        .attr("left", function(d) {
            return d.left;
        })
        .attr("right", function(d) {
            return d.right;
        });
    
    var node = svg
        .append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("id", function(d) {
            return String($divnum) + "_node" + d.id
        })
        .attr("r", 7)
        .attr("fill", "#1eebb1")
        .attr("stroke", "#053e4e")//#053e4e")
        .attr("stroke-width", 3)
        .call(
            d3
                .drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
        );

    var label = svg
        .append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(graph.nodes)
        .enter()
        .append("text")
            .text(function (d) { return d.label; })
            .style("text-anchor", "middle")
            .style("fill", "#053e4e")
            .style("font-family", "Arial")
            .style("font-size", 12);

    
    function determine_path_type(d) {
        path_type = ""
        var start_position_x = d.source.x;
        var start_position_y = d.source.y;
        var stop_position_x = d.target.x;
        var stop_position_y = d.target.y;

        var alt_child = document.getElementById(String($divnum) + "_node" + d.alt_child);
        if (alt_child != null) {
            var alt_child_x = alt_child.getAttribute("cx");
            var alt_child_y = alt_child.getAttribute("cy");
        }
        if (d.source.flag == 131072) {
            path_type += "r0";   //0
            start_position_y = d.source.y + 20;
        } else {
            if (d.target.y < alt_child_y) {
                if (d.target.x < d.source.x) {
                    if (d.target.x < d.source.x - 40) {
                        path_type += "tL";   //L
                    } else {
                        path_type += "fL";   //L
                    }
                    start_position_x = d.source.x - 20;
                } else {
                    if (d.target.x > d.source.x + 40) {
                        path_type += "tR";   //R
                    } else {
                        path_type += "fR";   //R
                    }
                    start_position_x = d.source.x + 20;
                }
            } else if (d.target.y > alt_child_y) {
                if (alt_child_x < d.source.x) {
                    if (d.target.x < d.source.x + 40) {
                        path_type += "fR";   //R
                    } else {
                        path_type += "tR";   //R
                    }
                    start_position_x = d.source.x + 20;
                } else {
                    if (d.target.x > d.source.x - 40) {
                        path_type += "fL";   //L
                    } else {
                        path_type += "tL";   //L
                    }
                    start_position_x = d.source.x - 20;
                }
            } else {
                if (d.target.x < alt_child_x) {
                    if (d.target.x < d.source.x - 40) {
                        path_type += "tL";   //L
                    } else {
                        path_type += "fL";   //L
                    }
                    start_position_x = d.source.x - 20;
                } else if (d.target.x > alt_child_x) {
                    if (d.target.x > d.source.x + 40) {
                        path_type += "tR";   //R
                    } else {
                        path_type += "fR";   //R
                    }
                    start_position_x = d.source.x + 20;
                } else {
                    if (d.index % 2 == 0) {
                        path_type += "fL";
                        start_position_x = d.source.x - 20;
                    } else {
                        path_type += "fR";
                        start_position_x = d.source.x + 20;
                    }
                }
            }
        }
        var alt_parent = document.getElementById(String($divnum) + "_node" + d.alt_parent);
        if (alt_parent != null) {
            var alt_parent_x = alt_parent.getAttribute("cx");
            var alt_parent_y = alt_parent.getAttribute("cy");
        }
        if (d.target.flag == 131072) {
            if (d.source.y < alt_parent_y) {
                if (alt_parent_x < d.target.x) {
                    if (d.source.x < d.target.x + 40) {
                        path_type += "fR";   //R
                    } else {
                        path_type += "tR";   //R
                    }
                    stop_position_x = d.target.x + 20;
                } else {
                    if (d.source.x > d.target.x - 40) {
                        path_type += "fL";   //L
                    } else {
                        path_type += "tL";   //L
                    }
                    stop_position_x = d.target.x - 20;
                }
            } else if (d.source.y > alt_parent_y) {
                if (d.source.x < d.target.x) {
                    if (d.source.x < d.target.x - 40) {
                        path_type += "tL";   //L
                    } else {
                        path_type += "fL";   //L
                    }
                    stop_position_x = d.target.x - 20;
                } else {
                    if (d.source.x > d.target.x + 40) {
                        path_type += "tR";   //R
                    } else {
                        path_type += "fR";   //R
                    }
                    stop_position_x = d.target.x + 20;
                }
            } else {
                if (d.index % 2 == 0) {
                    path_type += "fL";
                    stop_position_x = d.target.x - 20;
                } else {
                    path_type += "fR";
                    stop_position_x = d.target.x + 20;
                }
            }
        } else {
            path_type += "b0";   //0
            stop_position_y = d.target.y - 20;
        }
        if (path_type == "fLb0" ) {
            if (start_position_x >= stop_position_x) {
                path_type = "tLb0";
            }
        } else if (path_type == "fRb0") {
            if (start_position_x <= stop_position_x) {
                path_type = "tRb0";
            }
        } else if (path_type == "r0fL") {
            if (start_position_x <= stop_position_x) {
                path_type = "r0tL";
            }
        } else if (path_type == "r0fR") {
            if (start_position_x >= stop_position_x) {
                path_type = "r0tR";
            }
        } else if (path_type == "fLfL") {
            if (start_position_x <= stop_position_x) {
                path_type = "fLtL";
            } else {
                path_type = "tLfL";
            }
        } else if (path_type == "fRfR") {
            if (start_position_x >= stop_position_x) {
                path_type = "fRtR";
            } else {
                path_type = "tRfR";
            }
        }
        return [path_type, start_position_x, start_position_y, stop_position_x, stop_position_y];
    }
        

    function ticked() {

        node
            .attr("cx", function(d) {
                return d.x = Math.max(50, Math.min(width-50, d.x));
            })
            .attr("cy", function(d) {
                return d.y
            });

        underlink
            .attr("d", function(d) {
                const output = determine_path_type(d);
                
                const path_type = output[0];
                const simple_path_type = Array.from(path_type)[0] + Array.from(path_type)[2];
                const start_position_x = output[1];
                const start_position_y = output[2];
                const stop_position_x = output[3];
                const stop_position_y = output[4];

                const after_paths = ["rf", "tb", "tf"];
                const before_paths = ["rt", "fb", "ft"];
                const step_paths = ["tt"];
                const mid_paths = ["rb", "ff"];

                if (after_paths.includes(simple_path_type)) {
                    return line([[d.source.x, d.source.y],[start_position_x, start_position_y]]) + stepAfter([[start_position_x, start_position_y],[stop_position_x, stop_position_y]]) + line([[stop_position_x, stop_position_y], [d.target.x, d.target.y]]);
                } else if (before_paths.includes(simple_path_type)) {
                    return line([[d.source.x, d.source.y],[start_position_x, start_position_y]]) + stepBefore([[start_position_x, start_position_y],[stop_position_x, stop_position_y]]) + line([[stop_position_x, stop_position_y], [d.target.x, d.target.y]]);
                } else if (step_paths.includes(simple_path_type)) {
                    return line([[d.source.x, d.source.y],[start_position_x, start_position_y]]) + step([[start_position_x, start_position_y],[stop_position_x, stop_position_y]]) + line([[stop_position_x, stop_position_y], [d.target.x, d.target.y]]);
                } else if (mid_paths.includes(simple_path_type)) {
                    return line([[d.source.x, d.source.y],[start_position_x, start_position_y],[start_position_x, start_position_y],[start_position_x, start_position_y + (stop_position_y - start_position_y)/2],[start_position_x, start_position_y + (stop_position_y - start_position_y)/2],[stop_position_x, start_position_y + (stop_position_y - start_position_y)/2],[stop_position_x, start_position_y + (stop_position_y - start_position_y)/2], [stop_position_x, stop_position_y],[stop_position_x, stop_position_y], [d.target.x, d.target.y]]);
                }
            });

        link
            /*
            .style("stroke", function(d) {
                const path_type = determine_path_type(d)[0];
                const simple_path_type = Array.from(path_type)[0] + Array.from(path_type)[2];

                const after_paths = ["rf", "tb", "tf"];
                const before_paths = ["rt", "fb", "ft"];
                const step_paths = ["tt"];
                const mid_paths = ["rb", "ff"];

                
                if (after_paths.includes(simple_path_type)) {
                    return "blue";
                } else if (before_paths.includes(simple_path_type)) {
                    return "red";
                } else if (step_paths.includes(simple_path_type)) {
                    return "green";
                } else if (mid_paths.includes(simple_path_type)) {
                    return "black";
                }
            })
            */
            .attr("path_type", function(d) {
                return determine_path_type(d)[0];
            })
            .attr("d", function(d) {
                const output = determine_path_type(d);
                
                const path_type = output[0];
                const simple_path_type = Array.from(path_type)[0] + Array.from(path_type)[2];
                const start_position_x = output[1];
                const start_position_y = output[2];
                const stop_position_x = output[3];
                const stop_position_y = output[4];

                const after_paths = ["rf", "tb", "tf"];
                const before_paths = ["rt", "fb", "ft"];
                const step_paths = ["tt"];
                const mid_paths = ["rb", "ff"];

                if (after_paths.includes(simple_path_type)) {
                    return line([[d.source.x, d.source.y],[start_position_x, start_position_y]]) + stepAfter([[start_position_x, start_position_y],[stop_position_x, stop_position_y]]) + line([[stop_position_x, stop_position_y], [d.target.x, d.target.y]]);
                } else if (before_paths.includes(simple_path_type)) {
                    return line([[d.source.x, d.source.y],[start_position_x, start_position_y]]) + stepBefore([[start_position_x, start_position_y],[stop_position_x, stop_position_y]]) + line([[stop_position_x, stop_position_y], [d.target.x, d.target.y]]);
                } else if (step_paths.includes(simple_path_type)) {
                    return line([[d.source.x, d.source.y],[start_position_x, start_position_y]]) + step([[start_position_x, start_position_y],[stop_position_x, stop_position_y]]) + line([[stop_position_x, stop_position_y], [d.target.x, d.target.y]]);
                } else if (mid_paths.includes(simple_path_type)) {
                    return line([[d.source.x, d.source.y],[start_position_x, start_position_y]]) + line([[start_position_x, start_position_y],[start_position_x, start_position_y + (stop_position_y - start_position_y)/2]]) + line([[start_position_x, start_position_y + (stop_position_y - start_position_y)/2],[stop_position_x, start_position_y + (stop_position_y - start_position_y)/2]]) + line([[stop_position_x, start_position_y + (stop_position_y - start_position_y)/2], [stop_position_x, stop_position_y]]) + line([[stop_position_x, stop_position_y], [d.target.x, d.target.y]]);
                }
            });

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

    if ($tree_highlighting) {
        var breakpoints = svg.append("g")
            .attr("class", "breakpoints")
            .selectAll("rect")
            .data(graph.breakpoints)
            .enter()
            .append("rect")
            .attr("start", function(d) {
                return d.start;
            })
            .attr("stop", function(d) {
                return d.stop;
            })
            .attr("x", function(d) {
                return d.x_pos;
            })
            .attr("y", height-90)
            .attr("width", function(d) {
                return d.width;
            })
            .attr("height", 40)
            .attr("stroke", "#FFFFFF")
            .attr("stroke-width", 5)
            .attr("fill", "#053e4e")
            .on('mouseover', function (d, i) {
                d3.select(this)
                    .transition()
                        .duration('50')
                        .style('fill', '#1eebb1')
                    .style("cursor", "pointer");
                d3.selectAll("path")
                    .filter(function(j) {
                        return j.right > d.start & j.left < d.stop;
                    })
                    .style("stroke", "#1eebb1")
                    .style("stroke-width", 7);
            })
            .on('mouseout', function (d, i) {
                d3.select(this)
                    .transition()
                        .duration('50')
                        .style('fill', '#053e4e')
                    .style("cursor", "default");
                d3.selectAll("path")
                    .style("stroke", "#053e4e")
                    .style("stroke-width", 3);
            });
    }

}

draw_force_diagram()