function draw_edge_spans() {

    var data = $data;

    var width = 500;
    var height = 600;

    var svg = d3.select("#my_dataviz").append("svg")
        .attr("width", width+50)
        .attr("height", height+50)
        .style("background-color", "white");
    
    // Add X axis
    var x = d3.scaleLinear()
        .range([25, width])
        .domain([d3.min(data, function(d) { return +d.left; }), d3.max(data, function(d) { return +d.right; })]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(10));

    // Y axis
    var y = d3.scaleBand()
        .range([height,25])
        .domain(data.map(function(d) { return d.edge; }));

    // Lines
    svg.selectAll("myline")
        .data(data)
        .enter()
        .append("line")
            .attr("x1", function(d) { return x(d.left); })
            .attr("x2", function(d) { return x(d.right); })
            .attr("y1", function(d) { return y(d.edge); })
            .attr("y2", function(d) { return y(d.edge); })
            .attr("stroke", "#053e4e")
            .attr("stroke-width", "7px")
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .style("stroke", "#1eebb1")
                    .style("cursor", "pointer");
            })
            .on('mouseout', function (d, i) {
                d3.select(this)
                    .style("stroke", "#053e4e")
                    .style("cursor", "default")
            });
}

draw_edge_spans()