var line = d3.line();
var step = d3.line().curve(d3.curveStep);
var stepAfter = d3.line().curve(d3.curveStepAfter);
var stepBefore = d3.line().curve(d3.curveStepBefore);

function draw_force_diagram() {
    
    var graph = $arg;
    var y_axis = $y_axis;
    var subset = $subset_nodes;

    //d3.select("#arg_${divnum}").style("position", "relative");

    var saving = d3.select("#arg_${divnum}").append("div").attr("class", "saving");
    
    saving.append("button")
        .text("Copy Source To Clipboard")
        .on("click", function(d) {
            navigator.clipboard.writeText("${source}".replace(/'nodes': .*'links'/, "'nodes': " + JSON.stringify(graph.nodes) + ", 'links'").replaceAll("'", '"'));
            d3.select("#arg_${divnum} .message").style("display", "block");
            setTimeout( function() {
                d3.select("#arg_${divnum} .message").style("display", "none");
            }, 1000);
        });

    saving.append("div").attr("class", "message").text("Copied!");

    d3.select("#arg_${divnum}").append("button")
        .text("Reheat Simulation")
        .on("click", function(j) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d3.selectAll("#arg_${divnum} .node").classed("unfix", function(d) {
                if (d.flag != 1) {
                    d.fx = null;
                }
            });
        });

    var svg = d3.select("#arg_${divnum}").append("svg")
        .attr("width", $width)
        .attr("height", $height);

    var result = y_axis.ticks.map(function (x) { 
        return parseInt(x, 10); 
    });


    if (y_axis.include_labels == "true") {
        var bottom = $height - 50;
        if ($tree_highlighting) {
            bottom = $height - 150;
        }
        var yscale = d3.scaleLinear() 
            .domain([y_axis.max_min[0], y_axis.max_min[1]]) 
            .range([bottom, 50]); 

        var y_axis_text = y_axis.text;

        var y_axis = d3.axisRight().scale(yscale)
            .tickValues(result)
            .tickFormat((d, i) => y_axis_text[i]); 

        var y_axis_labels = svg
            .append("g")
            .attr("class", "yaxis")
            .attr("transform", "translate(5,0)")
            .call(y_axis);
    }

    var simulation = d3
        .forceSimulation(graph.nodes)
        .force("link", d3.forceLink()
            .id(function(d) {
                return d.id;
            })
            .links(graph.links)
        )
        .force("charge", d3.forceManyBody().strength(-10))
        .on("tick", ticked);

    console.log(simulation);

    var link_container = svg
        .append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(graph.links)
        .enter()
        .append("g")
        .attr("left", function(d) {
            return d.left;
        })
        .attr("right", function(d) {
            return d.right;
        });
    
    var underlink = link_container
        .append("path")
        .attr("class", "underlink");

    var link = link_container
        .append("path")
        .attr("class", function(d) {
            if (subset.includes(d.source.id) & subset.includes(d.target.id)) {
                return "link"
            } else {
                return "hiddenlink"
            }
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
        .attr("class", function(d) {
            if (subset.includes(d.id)) {
                return "node"
            } else {
                return "hiddennode"
            }
        })
        .attr("r", 7)
        .call(
            d3
                .drag()
                .on("start", dragstarted)
                .on("drag", dragged)
        )
        .on('mouseover', function (d, i) {
            d3.select(this)
                .style("cursor", "pointer")
        });

    var label = svg
        .append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(graph.nodes)
        .enter()
        .append("text")
            .attr("class", function(d) {
                if (subset.includes(d.id)) {
                    return "label"
                } else {
                    return "hiddenlabel"
                }
            })
            .text(function (d) { return d.label; });

    
    function determine_path_type(d) {
        path_type = ""
        var start_position_x = d.source.x;
        var start_position_y = d.source.y;
        var stop_position_x = d.target.x;
        var stop_position_y = d.target.y;
        var vnub = 20;
        if ("y_axis.scale" == "time" | "y_axis.scale" == "log_time") {
            vnub = 0;
        }
        var alt_child = document.getElementById(String($divnum) + "_node" + d.alt_child);
        if (alt_child != null) {
            var alt_child_x = alt_child.getAttribute("cx");
            var alt_child_y = alt_child.getAttribute("cy");
        }
        if (d.source.flag == 131072) {
            path_type += "r0";
            start_position_y = d.source.y + vnub;
        } else {
            if (d.target.y < alt_child_y) {
                if (d.target.x < d.source.x) {
                    if (d.target.x < d.source.x - 40) {
                        path_type += "tL";
                    } else {
                        path_type += "fL";
                    }
                    start_position_x = d.source.x - 20;
                } else {
                    if (d.target.x > d.source.x + 40) {
                        path_type += "tR";
                    } else {
                        path_type += "fR";
                    }
                    start_position_x = d.source.x + 20;
                }
            } else if (d.target.y > alt_child_y) {
                if (alt_child_x < d.source.x) {
                    if (d.target.x < d.source.x + 40) {
                        path_type += "fR";
                    } else {
                        path_type += "tR";
                    }
                    start_position_x = d.source.x + 20;
                } else {
                    if (d.target.x > d.source.x - 40) {
                        path_type += "fL";
                    } else {
                        path_type += "tL";
                    }
                    start_position_x = d.source.x - 20;
                }
            } else {
                if (d.target.x < alt_child_x) {
                    if (d.target.x < d.source.x - 40) {
                        path_type += "tL";
                    } else {
                        path_type += "fL";
                    }
                    start_position_x = d.source.x - 20;
                } else if (d.target.x > alt_child_x) {
                    if (d.target.x > d.source.x + 40) {
                        path_type += "tR";
                    } else {
                        path_type += "fR";
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
                        path_type += "fR";
                    } else {
                        path_type += "tR";
                    }
                    stop_position_x = d.target.x + 20;
                } else {
                    if (d.source.x > d.target.x - 40) {
                        path_type += "fL";
                    } else {
                        path_type += "tL";
                    }
                    stop_position_x = d.target.x - 20;
                }
            } else if (d.source.y > alt_parent_y) {
                if (d.source.x < d.target.x) {
                    if (d.source.x < d.target.x - 40) {
                        path_type += "tL";
                    } else {
                        path_type += "fL";
                    }
                    stop_position_x = d.target.x - 20;
                } else {
                    if (d.source.x > d.target.x + 40) {
                        path_type += "tR";
                    } else {
                        path_type += "fR";
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
            path_type += "b0";
            stop_position_y = d.target.y - vnub;
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
        if ((d.source.id == 60) & (d.target.id == 35)) {
            path_type = "r0b0";
            start_position_x = d.source.x;
            start_position_y = d.source.y + vnub;
            stop_position_x = d.target.x;
            stop_position_y = d.target.y - vnub;
        }
        return [path_type, start_position_x, start_position_y, stop_position_x, stop_position_y];
    }

    function ticked() {

        node
            .attr("cx", function(d) {
                if (y_axis.include_labels == "false") {
                    return d.x = Math.max(50, Math.min($width-50, d.x));
                } else {
                    return d.x = Math.max(100, Math.min($width-50, d.x));
                }
            })
            .attr("cy", function(d) {
                return d.y;
            });

        underlink
            .attr("d", function(d) {
                if ("$edge_type" == "ortho") {
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
                }
            });

        link
            .attr("path_type", function(d) {
                return determine_path_type(d)[0];
            })
            .attr("d", function(d) {
                if ("$edge_type" == "ortho") {
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
                } else if ("$edge_type" == "line") {
                    return line([[d.source.x, d.source.y], [d.target.x, d.target.y]])
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

    if ($tree_highlighting) {
        svg.append("g")
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
            .attr("y", $height-90)
            .attr("width", function(d) {
                return d.width;
            })
            .attr("height", 40)
            .attr("stroke", "#FFFFFF")
            .attr("stroke-width", 5)
            .attr("fill", "#053e4e")
            .on('mouseover', function (d, i) {
                d3.select(this)
                    .style('fill', '#1eebb1')
                    .style("cursor", "pointer");
                var highlight_links = d3.select("#arg_${divnum} .links")
                    .selectAll("g")
                        .filter(function(j) {
                            return j.right > d.start & j.left < d.stop;
                        });
                highlight_links.raise();
                highlight_links
                    .select(".link")
                    .style("stroke", "#1eebb1")
                    .style("stroke-width", 7);
            })
            .on('mouseout', function (d, i) {
                d3.select(this)
                    .style('fill', '#053e4e')
                    .style("cursor", "default");
                d3.selectAll("#arg_${divnum} .link")
                    .style("stroke", "#053e4e")
                    .style("stroke-width", 3);
            });
    }

}

draw_force_diagram()