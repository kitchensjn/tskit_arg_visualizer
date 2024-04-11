function draw_breakpoints_on_chromosome() {

    var graph = $data;
        
    var svg = d3.select("#my_dataviz").append("svg")
        .attr("width", $width)
        .attr("height", 100)
        .style("background-color", "white");

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
        .attr("y", 25)
        .attr("width", function(d) {
            return d.width;
        })
        .attr("height", 40)
        .attr("stroke", "#FFFFFF")
        .attr("stroke-width", 1)
        .attr("fill", "#053e4e")
        .on('mouseover', function (event, d) {
            d3.select(this)
                .style('fill', '#1eebb1')
                .style("cursor", "pointer");
            /*
            var highlight_links = d3.select("#arg_${divnum} .links")
                .selectAll("g")
                    .filter(function(j) {
                        return j.bounds.split(" ").some(function(region) {
                            region = region.split("-");
                            return (parseFloat(region[1]) > d.start) & (parseFloat(region[0]) < d.stop)
                        });
                    });
            highlight_links.raise();
            highlight_links
                .select(".link")
                .style("stroke", "#1eebb1");
            */
        })
        .on('mouseout', function (d, i) {
            d3.select(this)
                .style('fill', '#053e4e')
                .style("cursor", "default");
            /*
            d3.selectAll("#arg_${divnum} .link")
                .style("stroke", function(d) {
                    return d.color;
                });   
            */
        });

    th_group
        .append("g")
        .attr("class", "windows")
        .selectAll("rect")
        .data(graph.windows)
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return d.x_pos;
        })
        .attr("y", 20)
        .attr("width", function(d) {
            return d.width;
        })
        .attr("height", 50)
        .attr("stroke", "#000000")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    
    var endpoints = th_group.append("g").attr("class", "endpoints");
    
    endpoints
        .append("text")
            .attr("class", "label")
            .style("text-anchor", "start")
            .style("fill", "#053e4e")
            .style("font-family", "Arial")
            .style("font-size", "12px")
            .text(graph.breakpoints[0].start)
            .attr("x", graph.breakpoints[0].x_pos)
            .attr("y", 80);
    
    endpoints
        .append("text")
            .attr("class", "label")
            .style("text-anchor", "end")
            .style("fill", "#053e4e")
            .style("font-family", "Arial")
            .style("font-size", "12px")
            .text(graph.breakpoints[graph.breakpoints.length-1].stop)
            .attr("x", $width)
            .attr("y", 80);
}

draw_breakpoints_on_chromosome()