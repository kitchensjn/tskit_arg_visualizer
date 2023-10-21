var line = d3.line();
var step = d3.line().curve(d3.curveStep);
var stepAfter = d3.line().curve(d3.curveStepAfter);
var stepBefore = d3.line().curve(d3.curveStepBefore);

function draw_force_diagram() {
    
    var graph = $arg;
    var y_axis = $y_axis;
    var subset = $subset_nodes;
    var evenly_distributed_positions = $evenly_distributed_positions;

    var dashboard = d3.select("#arg_${divnum}").append("div").attr("class", "dashboard");
    
    var clipboard = dashboard.append("button")
        .on("click", function() {
            navigator.clipboard.writeText("${source}".replace(/'nodes': .*'links'/, "'nodes': " + JSON.stringify(graph.nodes) + ", 'links'").replaceAll("'", '"'));
            d3.select("#arg_${divnum} .copymessage").style("visibility", "visible");
            setTimeout( function() {
                d3.select("#arg_${divnum} .copymessage").style("visibility", "hidden");
            }, 1000);
        });
    clipboard.append("svg") //<!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("viewBox", "0 0 448 512")
        .append("path")
        .attr("d", "M208 0H332.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9V336c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V48c0-26.5 21.5-48 48-48zM48 128h80v64H64V448H256V416h64v48c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V176c0-26.5 21.5-48 48-48z");
    clipboard.append("span").attr("class", "tip desc").text("Copy To Clipboard");
    clipboard.append("span").attr("class", "tip copymessage").text("Copied!");

    var reheat = dashboard.append("button")
        .on("click", function(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();       
            var order = d3.selectAll("#arg_${divnum} .sample").data().sort((a, b) => d3.ascending(a.x, b.x)).map(a => a.id);;
            d3.selectAll("#arg_${divnum} .node").classed("unfix", function(d) {
                if (d.flag != 1) {
                    delete d.fx;
                } else {
                    d.fx = evenly_distributed_positions[order.indexOf(d.id)];
                }
            });
        });
    reheat.append("svg") //<!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("viewBox", "0 0 384 512")
        .append("path")
        .attr("d", "M153.6 29.9l16-21.3C173.6 3.2 180 0 186.7 0C198.4 0 208 9.6 208 21.3V43.5c0 13.1 5.4 25.7 14.9 34.7L307.6 159C356.4 205.6 384 270.2 384 337.7C384 434 306 512 209.7 512H192C86 512 0 426 0 320v-3.8c0-48.8 19.4-95.6 53.9-130.1l3.5-3.5c4.2-4.2 10-6.6 16-6.6C85.9 176 96 186.1 96 198.6V288c0 35.3 28.7 64 64 64s64-28.7 64-64v-3.9c0-18-7.2-35.3-19.9-48l-38.6-38.6c-24-24-37.5-56.7-37.5-90.7c0-27.7 9-54.8 25.6-76.9z");
    reheat.append("span").attr("class", "tip desc").text("Reheat Simulation");
    
    var evenly_distribute = dashboard.append("button")
        .on("click", function() {
            var order = d3.selectAll("#arg_${divnum} .sample").data().sort((a, b) => d3.ascending(a.x, b.x)).map(a => a.id);;
            d3.selectAll("#arg_${divnum} .sample").classed("distribute", function(d) {
                d.fx = evenly_distributed_positions[order.indexOf(d.id)];
            });
        });
    evenly_distribute.append("svg") //<!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("viewBox", "0 0 512 512")
        .append("path")
        .attr("d", "M504.3 273.6c4.9-4.5 7.7-10.9 7.7-17.6s-2.8-13-7.7-17.6l-112-104c-7-6.5-17.2-8.2-25.9-4.4s-14.4 12.5-14.4 22l0 56-192 0 0-56c0-9.5-5.7-18.2-14.4-22s-18.9-2.1-25.9 4.4l-112 104C2.8 243 0 249.3 0 256s2.8 13 7.7 17.6l112 104c7 6.5 17.2 8.2 25.9 4.4s14.4-12.5 14.4-22l0-56 192 0 0 56c0 9.5 5.7 18.2 14.4 22s18.9 2.1 25.9-4.4l112-104z")
    evenly_distribute.append("span").attr("class", "tip desc").text("Space Samples");

    var svg = d3.select("#arg_${divnum}").append("svg")
        .attr("width", $width)
        .attr("height", $height)
        .style("padding-top", "10px");

    var result = y_axis.ticks.map(function (x) { 
        return parseInt(x, 10); 
    });


    if (y_axis.include_labels == "true") {
        var bottom = $height - 50;
        if ($tree_highlighting) {
            bottom = $height - 125;
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

    var link_container = svg
        .append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(graph.links)
        .enter()
        .append("g")
        .attr("bounds", function(d) {
            return d.bounds;
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
    
    if ($variable_edge_width) {
        link
            .style("stroke-width", function(d) {
                return d.region_fraction * 7 + 1;
            });
    }
    
    if ($tree_highlighting) {
        link
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .style('stroke', '#1eebb1')
                    .style("cursor", "pointer");
                d3.select("#arg_${divnum} .breakpoints")
                    .selectAll("rect")
                        .filter(function(j) {
                            return d.bounds.split(" ").some(function(region) {
                                region = region.split("-");
                                return (parseFloat(region[0]) <= j.start) & (parseFloat(region[1]) >= j.stop)
                            });
                        })
                        .style('fill', '#1eebb1');
            })
            .on('mouseout', function (d, i) {
                d3.select(this)
                    .style('stroke', '#053e4e')
                    .style("cursor", "default")
                d3.select("#arg_${divnum} .breakpoints").selectAll("rect")
                    .style("fill", "#053e4e")
            });
    }

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
            var classy = ""
            if (subset.includes(d.id)) {
                classy += "node";
            } else {
                classy += "hiddennode";
            }
            if (d.flag == 1) {
                classy += " sample";
            }
            return classy
        })
        .attr("parents", function(d) {
            return d.child_of.toString().replace(",", " ")
        })
        .attr("children", function(d) {
            return d.parent_of.toString().replace(",", " ")
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

    
    if ($include_node_labels) {
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
    };
    
    function determine_path_type(d) {
        path_type = ""
        var start_position_x = d.source.x;
        var start_position_y = d.source.y;
        var stop_position_x = d.target.x;
        var stop_position_y = d.target.y;
        var vnub = Math.min((stop_position_y-start_position_y)/2, 20);
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
                    if (d.source.id == d.alt_parent) {
                        var leftOrRight = 20;
                        if (d.index % 2 == 0) {
                            leftOrRight = -20;
                        }
                        return "M " + d.source.x + " " + d.source.y + " C " + (d.source.x + leftOrRight).toString() + " " +  (d.source.y - 10).toString() + ", " + (d.target.x + leftOrRight).toString() + " " + (d.target.y + 10).toString() + ", " + d.target.x + " " + d.target.y;
                    } else {
                        return line([[d.source.x, d.source.y], [d.target.x, d.target.y]]);
                    }
                }
            });

        function determine_label_positioning(d) {
            if (d.flag == 131072 || d.parent_of.length == 0 || d.child_of.length == 0) {
                return "c";
            } else if (d.child_of.length == 1) {
                var parent = document.getElementById(String($divnum) + "_node" + d.child_of[0])
                if (parent != null) {
                    var parent_x = parent.getAttribute("cx");
                    if (parent_x > d.x) {
                        return "l";
                    } else {
                        return "r";
                    }
                } else {
                    return "r";
                }
            } else {
                return "r";
            }
        };

        if ($include_node_labels) {

            label
                .attr("x", function(d) {
                    var positioning = determine_label_positioning(d);
                    if (positioning == "l") {
                        return d.x - 15;
                    } else if (positioning == "r") {
                        return d.x + 15;
                    } else {
                        return d.x;
                    }
                })
                .style("text-anchor", function(d) {
                    var positioning = determine_label_positioning(d);
                    if (positioning == "l") {
                        return "end";
                    } else if (positioning == "r") {
                        return "start";
                    } else {
                        return "middle";
                    }
                })
                .attr("y", function(d) {
                    if (d.parent_of.length == 0) {
                        return d.y + 25;
                    } else {
                        return d.y - 15;
                    }
                });
        };
    }

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
    }

    function dragged(event, d) {
        d.fx = event.x;
    }

    if ($tree_highlighting) {
        
        var th_group = svg.append("g").attr("class", "tree_highlighting");
        
        th_group
            .append("g")
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
            .attr("y", $height-60)
            .attr("width", function(d) {
                return d.width;
            })
            .attr("height", 40)
            .attr("stroke", "#FFFFFF")
            .attr("stroke-width", 5)
            .attr("fill", "#053e4e")
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .style('fill', '#1eebb1')
                    .style("cursor", "pointer");
                var highlight_links = d3.select("#arg_${divnum} .links")
                    .selectAll("g")
                        .filter(function(j) {
                            return j.bounds.split(" ").some(function(region) {
                                region = region.split("-");
                                return (parseFloat(region[1]) > d.start) & (parseFloat(region[0]) < d.stop)
                            });
                        });
                highlight_links.raise();
                //if ($variable_edge_width) {
                    highlight_links
                        .select(".link")
                        .style("stroke", "#1eebb1");
                //} else {
                //    highlight_links
                //        .select(".link")
                //        .style("stroke", "#1eebb1")
                //        .style("stroke-width", 7);
                //};
            })
            .on('mouseout', function (d, i) {
                d3.select(this)
                    .style('fill', '#053e4e')
                    .style("cursor", "default");
                //if ($variable_edge_width) {
                    d3.selectAll("#arg_${divnum} .link")
                        .style("stroke", "#053e4e");
                //} else {
                //    d3.selectAll("#arg_${divnum} .link")
                //        .style("stroke", "#053e4e")
                //        .style("stroke-width", 3);
                //};     
            });
        
        var endpoints = th_group.append("g").attr("class", "endpoints");
        
        endpoints
            .append("text")
                .attr("class", "label")
                .style("text-anchor", "start")
                .text(graph.breakpoints[0].start)
                .attr("x", graph.breakpoints[0].x_pos)
                .attr("y", $height-5);
        
        endpoints
            .append("text")
                .attr("class", "label")
                .style("text-anchor", "end")
                .text(graph.breakpoints[graph.breakpoints.length-1].stop)
                .attr("x", $width)
                .attr("y", $height-5);
    }
}

draw_force_diagram()