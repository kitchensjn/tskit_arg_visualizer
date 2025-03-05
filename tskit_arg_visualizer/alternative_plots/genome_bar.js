function ensureRequire() {
    // Needed e.g. in Jupyter notebooks: if require is already available, return resolved promise
    if (typeof require !== 'undefined') {
        return Promise.resolve(require);
    }

    // Otherwise, dynamically load require.js
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js';
        script.onload = () => resolve(require);
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

ensureRequire()
    .then(require => {
        require.config({ paths: {d3: 'https://d3js.org/d3.v7.min'}});
        require(["d3"], draw_genome_bar);
    })
    .catch(err => console.error('Failed to load require.js:', err));


function draw_genome_bar(d3) {

    var graph = $data;
        
    var svg = d3.select("#genome_bar_${divnum}").append("svg")
        .attr("width", $width)
        .attr("height", 100)
        .style("background-color", "white");
    
    svg
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
        .attr("fill", function(d) {
            return d.fill;
        });

    svg
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

    
    var endpoints = svg.append("g").attr("class", "endpoints");
    
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

    var mut_pos = svg
        .append("g")
        .attr("class", "mutations")
        .selectAll("line")
        .data(graph.mutations)
        .enter()
        .append("g");

    mut_pos
        .append("line")
        .attr("x1", function(d) { return d.x_pos; })
        .attr("y1", 20)
        .attr("x2", function(d) { return d.x_pos; })
        .attr("y2", 70)
        .style("stroke-width", 3)
        .style("stroke", function(d) { return d.fill; })
        .style("fill", "none");
    
    mut_pos
        .append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-family", "Arial")
        .attr("fill", function(d) { return d.fill; })
        .attr("transform", function(d) {
            if (d.site_id % 2 == 0) {
                return "translate(" + String(d.x_pos) + "," + String(20-5) + ")";
            } else {
                return "translate(" + String(d.x_pos) + "," + String(70+12) + ")";
            }
        })
        .text(function(d) { return d.site_id; });
}

draw_genome_bar()