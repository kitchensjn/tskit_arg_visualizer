function parseRgbString(rgbString) {
  const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const a = match[4] ? parseFloat(match[4]) : 1; // Default alpha to 1 if not present
    return { r, g, b, a };
  }
  return null; // Or throw an error for invalid format
}

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

function main_visualizer(
    d3,
    divnum,
    graph,
    width,
    height,
    y_axis,
    edge_styles,
    condense_mutations,
    label_mutations,
    tree_highlighting,
    title,
    rotate_tip_labels,
    plot_type,
    preamble,
    source,
    filename_for_saving,
) {
    /*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
    
    function download (url, name, opts) {
        var xhr = new XMLHttpRequest()
        xhr.open('GET', url)
        xhr.responseType = 'blob'
        xhr.onload = function () {
            saveAs(xhr.response, name, opts)
        }
        xhr.onerror = function () {
            console.error('could not download file')
        }
        xhr.send()
    }
    
    function corsEnabled (url) {
        var xhr = new XMLHttpRequest()
        // use sync to avoid popup blocker
        xhr.open('HEAD', url, false)
        try {
            xhr.send()
        } catch (e) {}
        return xhr.status >= 200 && xhr.status <= 299
    }
    
    // 'a.click()' doesn't work for all browsers (#465)
    function click (node) {
        try {
            node.dispatchEvent(new MouseEvent('click'))
        } catch (e) {
            var evt = document.createEvent('MouseEvents')
            evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80,
                                20, false, false, false, false, 0, null)
            node.dispatchEvent(evt)
        }
    }
    
    function saveAs (blob, name, opts) {
        var URL = URL || webkitURL
        // Namespace is used to prevent conflict w/ Chrome Poper Blocker extension (Issue #561)
        var a = document.createElementNS('http://www.w3.org/1999/xhtml', 'a')
        name = name || blob.name || 'download'

        a.download = name
        a.rel = 'noopener' // tabnabbing

        // TODO: detect chrome extensions & packaged apps
        // a.target = '_blank'

        if (typeof blob === 'string') {
            // Support regular links
            a.href = blob
            if (a.origin !== location.origin) {
            corsEnabled(a.href)
                ? download(blob, name, opts)
                : click(a, a.target = '_blank')
            } else {
            click(a)
            }
        } else {
            // Support blobs
            a.href = URL.createObjectURL(blob)
            setTimeout(function () { URL.revokeObjectURL(a.href) }, 4E4) // 40s
            setTimeout(function () { click(a) }, 0)
        }
    }

    const NODE_IS_SAMPLE = 1;
    const NODE_IS_RE_EVENT = 131072;
    var line = d3.line();
    var step = d3.line().curve(d3.curveStep);
    var stepAfter = d3.line().curve(d3.curveStepAfter);
    var stepBefore = d3.line().curve(d3.curveStepBefore);


    // https://gist.github.com/Rokotyan/0556f8facbaf344507cdc45dc3622177
    // Below are the functions that handle actual exporting:
    // getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
    function getSVGString( svgNode ) {
        svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
        var cssStyleText = getCSSStyles();
        appendCSS( cssStyleText, svgNode );
        var serializer = new XMLSerializer();
        var svgString = serializer.serializeToString(svgNode);
        svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
        svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix
        return svgString;

        function getCSSStyles() {
            // Extract CSS Rules
            var extractedCSSText = "";
            for (var i = 0; i < document.styleSheets.length; i++) { // this could be improved as it loops through all stylings on page
                var s = document.styleSheets[i];
                try {
                    if(!s.cssRules) continue;
                } catch( e ) {
                    if(e.name !== 'SecurityError') throw e; // for Firefox
                    continue;
                }
                var cssRules = s.cssRules;
                for (var r = 0; r < cssRules.length; r++) {
                    extractedCSSText += cssRules[r].cssText.replace(".d3arg ", ""); // removing reference to d3arg
                }
            }
            return extractedCSSText;

        }

        function appendCSS( cssText, element ) {
            var styleElement = document.createElement("style");
            styleElement.setAttribute("type","text/css"); 
            styleElement.innerHTML = cssText;
            var refNode = element.hasChildNodes() ? element.children[0] : null;
            element.insertBefore( styleElement, refNode );
        }
    }


    function svgString2Image( svgString, width, height, format, callback ) {
        var format = format ? format : 'png';
        var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        var image = new Image();
        image.onload = function() {
            context.clearRect ( 0, 0, width, height);
            context.drawImage(image, 0, 0, width, height);
            canvas.toBlob( function(blob) {
                var filesize = Math.round( blob.length/1024 ) + ' KB';
                if ( callback ) callback( blob, filesize );
            });
        };
        image.src = imgsrc;
    }

    function draw_force_diagram() {
        var evenly_distributed_positions = graph.evenly_distributed_positions;
        var div_selector = "#arg_" + String(divnum);
        if (preamble) {
            d3.select(div_selector).html(preamble);
        }
        var tip = d3.select(div_selector).append("div")
            .attr("class", "tooltip")
            .style("display", "none");

        var dashboard = d3.select(div_selector).append("div").attr("class", "dashboard");
        
        var saving = dashboard.append("button").attr("class", "dashbutton");
        saving.append("svg") //<!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("viewBox", "0 0 512 512")
            .append("path")
            .attr("d", "M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z");
        var saving_methods = saving.append("span").attr("class", "tip desc");
        var methods = saving_methods.append("div").text("Download As:").append("div").attr("class", "savemethods")

        methods.append("button").text("JSON")
            .on("click", function() {
                d3.selectAll(div_selector + " .node").classed("fix", function(d) {
                    d.fx = d.x;
                });
                src = JSON.parse(source);
                src.data.nodes = graph.nodes;
                var textBlob = new Blob([JSON.stringify(src)], {type: "text/plain"});
                saveAs(textBlob, filename_for_saving + ".json");
            });
        methods.append("button").text("SVG")
            .on('click', function(){
                var svgString = getSVGString(svg.node());
                var svgBlob = new Blob([svgString], {type:"image/svg+xml;charset=utf-8"});
                saveAs(svgBlob, filename_for_saving);
            });
        methods.append("button").text("PNG")
            .on('click', function(){
                var svgString = getSVGString(svg.node());
                svgString2Image(svgString, 2*width, 2*height, 'png', save); // passes Blob and filesize String to the callback
            
                function save(dataBlob){
                    saveAs(dataBlob, filename_for_saving); // FileSaver.js function
                }
            });
        
        /*
        methods.append("button").text("HTML")
            .on("click", function(){
                d3.selectAll(div_selector + " .node").classed("fix", function(d) {
                    d.fx = d.x;
                });
                var html = document.querySelector("html").outerHTML;
                var arg_div = document.getElementById(div_selector).innerHTML;
                console.log(arg_div);
                html = html.replace(arg_div, "");
                html = html.replace(source.match(/'nodes': .*'links'/), "'nodes': " + JSON.stringify(graph.nodes) + ", 'links'")
                saveAs(new Blob([html], {type:"text/plain;charset=utf-8"}), "tskit_arg_visualizer.html");
            })
        */

        var reheat = dashboard.append("button").attr("class", "dashbutton activecolor")
            .on("click", function(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();       
                var order = d3.selectAll(div_selector + " .sample").data().sort((a, b) => d3.ascending(a.x, b.x)).map(a => a.id);;
                d3.selectAll(div_selector + " .node").classed("unfix", function(d) {
                    if ((d.ts_flags & NODE_IS_SAMPLE) & (d.x_pos_reference == -1)) {
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
        
        if (plot_type == "full") {
            var evenly_distribute = dashboard.append("button").attr("class", "dashbutton activecolor")
                .on("click", function() {
                    var order = d3.selectAll(div_selector + " .sample").data().sort((a, b) => d3.ascending(a.x, b.x)).map(a => a.id);;
                    d3.selectAll(div_selector + " .sample").classed("distribute", function(d) {
                        d.fx = evenly_distributed_positions[order.indexOf(d.id)];
                    });
                });
            evenly_distribute.append("svg") //<!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
                .attr("xmlns", "http://www.w3.org/2000/svg")
                .attr("viewBox", "0 0 512 512")
                .append("path")
                .attr("d", "M504.3 273.6c4.9-4.5 7.7-10.9 7.7-17.6s-2.8-13-7.7-17.6l-112-104c-7-6.5-17.2-8.2-25.9-4.4s-14.4 12.5-14.4 22l0 56-192 0 0-56c0-9.5-5.7-18.2-14.4-22s-18.9-2.1-25.9 4.4l-112 104C2.8 243 0 249.3 0 256s2.8 13 7.7 17.6l112 104c7 6.5 17.2 8.2 25.9 4.4s14.4-12.5 14.4-22l0-56 192 0 0 56c0 9.5 5.7 18.2 14.4 22s18.9 2.1 25.9-4.4l112-104z")
            evenly_distribute.append("span").attr("class", "tip desc").text("Space Samples");
        }

        var labelling = dashboard.append("button").attr("class", "dashbutton");
        labelling.append("svg") //<!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("viewBox", "0 0 512 512")
            .append("path")
            .attr("d", "M0 80L0 229.5c0 17 6.7 33.3 18.7 45.3l176 176c25 25 65.5 25 90.5 0L418.7 317.3c25-25 25-65.5 0-90.5l-176-176c-12-12-28.3-18.7-45.3-18.7L48 32C21.5 32 0 53.5 0 80zm112 32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z");
        var labelling_methods = labelling.append("span").attr("class", "tip desc");
        var methods = labelling_methods.append("div").text("Node Labels:").append("div").attr("class", "labelmethods")
        
        function switch_node_label(selected) {
            label_text.each(function(d) {
                d3.select(this).selectAll("*").remove();
                if (selected == "default") {
                    multi_line_text.call(this, d.label, (d.parent_of.length == 0));
                } else if (selected == "id") {
                    multi_line_text.call(this, "#" + String(d.id));
                } else {
                    multi_line_text.call(this, "");
                }
            })
        }
        
        methods.append("button").attr("class", "node-labels-default").text("DEFAULT")
            .on("click", function() {
                switch_node_label("default");
                // Underline the current selection (could use different highlighting method here)
                d3.selectAll(div_selector + " .labelmethods button").style("text-decoration", "none");
                d3.select(this).style("text-decoration", "underline");
            });
        methods.append("button").attr("class", "node-labels-id").text("#ID")
            .on('click', function(){
                switch_node_label("id");
                // Underline the current selection (could use different highlighting method here)
                d3.selectAll(div_selector + " .labelmethods button").style("text-decoration", "none");
                d3.select(this).style("text-decoration", "underline");
            });
        methods.append("button").attr("class", "node-labels-none").text("NONE")
            .on('click', function(){
                switch_node_label("none");
                // Underline the current selection (could use different highlighting method here)
                d3.selectAll(div_selector + " .labelmethods button").style("text-decoration", "none");
                d3.select(this).style("text-decoration", "underline");
            });


        var svg = d3.select(div_selector).append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background-color", "white");

        var result = y_axis.ticks.map(function (x) { 
            return parseInt(x, 10); 
        });

        if (eval(y_axis.include_labels)) {
            var bottom = height - 50;
            if (tree_highlighting) {
                bottom = height - 125;
            }
            var top = 50;
            if (title != "None") {
                top = 100
            }
            var yscale = d3.scaleLinear() 
                .domain([y_axis.max_min[0], y_axis.max_min[1]]) 
                .range([y_axis.max_min[0], y_axis.max_min[1]]); 

            var y_axis_text = y_axis.text;

            var d3_y_axis = d3.axisRight().scale(yscale)
                .tickValues(result)
                .tickFormat((d, i) => y_axis_text[i]); 

            var y_axis_labels = svg
                .append("g")
                .attr("class", "yaxis")
                .attr("transform", "translate(25,0)")
                .call(d3_y_axis);
            
            if (y_axis.title != "None") {
                y_axis_labels.append("text")
                .attr("x", -15)
                .attr("y", (y_axis.max_min[0]+y_axis.max_min[1])/2)
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .attr("class", "label")
                .attr("transform", "rotate(-90, -15, " + (y_axis.max_min[0]+y_axis.max_min[1])/2 + ")")
                .text(y_axis.title);
            }
        }

        var simulation = d3
            .forceSimulation(graph.nodes)
            .force("link", d3.forceLink()
                .id(d => d.id)
                .links(graph.links)
            )
            //.force("center", d3.forceCenter(275,250).strength(-10))
            .force("charge", d3.forceManyBody().strength(-100))
            .on("tick", ticked);

        var link_container = svg
            .append("g")
            .attr("class", "links")
            .selectAll("path")
            .data(graph.links)
            .enter()
            .append("g")
            .attr("bounds", d => d.bounds);

        if ((edge_styles.type == "ortho") & eval(edge_styles.include_underlink)) {
            var underlink = link_container
                .append("path")
                .attr("class", "underlink");
        }

        var link = link_container
            .append("path")
            .attr("class", "link")
            .attr("stroke", d => d.stroke)
            .attr("stroke-width", "4px");
        
        if (eval(edge_styles.variable_width)) {
            link
                .style("stroke-width", d => d.region_fraction * 7 + 1);
        }

        if (tree_highlighting) {
            d3.selectAll(div_selector + " .link")
                .on('mouseover', function (event, d) {
                    if (!d3.select(div_selector + ">svg").classed("no-hover")) {
                        d3.select(this)
                            .style('stroke', '#1eebb1')
                            .style("cursor", "pointer");
                        d3.selectAll(div_selector + " .sites .e" + d.id).style("display", "block");
                        d3.selectAll(div_selector + " .endpoints")
                            .style('display', 'none'); /* hide other labels to avoid clashes */
                        const bars = d3.select(div_selector + " .breakpoints").selectAll(".included");
                        bars /* colour in all bars covered by these bounds */
                            .filter(function(j) {
                                return d.bounds.split(" ").some(function(region) {
                                    region = region.split("-");
                                    return (parseFloat(region[0]) <= j.start) & (parseFloat(region[1]) >= j.stop)
                                });
                            })
                            .selectAll("rect").style('fill', '#1eebb1');
                        bars /* show the leftmost position label */
                            .filter(function(j) {
                                return d.bounds.split(" ").some(function(region) {
                                    region = region.split("-");
                                    return (parseFloat(region[0]) == j.start)
                                });
                            })
                            .selectAll("text.start").style('display', 'block');
                        bars /* show the rightmost position label */
                            .filter(function(j) {
                                return d.bounds.split(" ").some(function(region) {
                                    region = region.split("-");
                                    return (parseFloat(region[1]) == j.stop)
                                });
                            })
                            .selectAll("text.stop").style('display', 'block');
                    }
                })
                .on('mouseout', function (event, d) {
                    if (!d3.select(div_selector + ">svg").classed("no-hover")) {
                        d3.select(this)
                            .style('stroke', d.stroke)
                            .style("cursor", "default");
                        const bars = d3.select(div_selector + " .breakpoints").selectAll(".included");
                        bars.selectAll("rect").style("fill", d.fill);
                        bars.selectAll("text").style("display", "none");
                        d3.selectAll(div_selector + " .endpoints")
                            .style('display', 'block');
                        d3.selectAll(div_selector + " .sites .e" + d.id).style("display", "none");
                    }
                });
        }

        var node_group = svg
            .append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(graph.nodes)
            .enter()
            .append("g");

        var missing_edges = node_group
            .filter(d => (d.not_included_parents>0) | (d.not_included_children>0))
            .append("g")
            .attr("class", "missing");

        var missing_parents = missing_edges
            .filter(d => d.not_included_parents>0)
            .append("g")
            .attr("class", "parents")
            .append("g");
        var missing_parents_paths = missing_parents.append("path");
        var missing_parents_texts = missing_parents
            .append("text")
                .attr("class", "label")
                .style("fill", "gray")
                .text(d => d.not_included_parents);

        var missing_children = missing_edges
            .filter(d => d.not_included_children>0)
            .append("g")
            .attr("class", "children")
            .append("g");
        var missing_children_paths = missing_children.append("path");
        var missing_children_texts = missing_children
            .append("text")
                .attr("class", "label")
                .style("fill", "gray")
                .text(d => d.not_included_children);

        function multi_line_text(text, top_align) {
            if (text != null) {
                // Split label text onto separate lines by newline characters, if they exist
                const lines = text.split("\n");
                const parentX = d3.select(this).attr("x") || "0";  // Get parent text's x position
                const initialDy = top_align ? "0em" : (-1 * (lines.length - 1)) + "em";

                d3.select(this).text(null); // clear existing text
                d3.select(this).selectAll('tspan')
                    .data(lines)
                    .enter()
                    .append('tspan')
                    .text(d => d)
                    .attr('x', parentX)  // Use parent's x position
                    .attr('dy', (d, i) => ((i === 0) ? initialDy : "1em"));
            }
        }
        var node = node_group
            .append("path")
            .attr("transform", d => "translate(" + d.x + "," + d.y + ")")
            .attr("d", d3.symbol().type(d => eval(d.symbol)).size(d => d.size))
            .attr("fill", d => d.fill)
            .attr("stroke", d => d.stroke)
            .attr("stroke-width", d => d.stroke_width)
            .attr("id", d => String(divnum) + "_node" + d.id)
            .attr("class", d => "node flag" + d.ts_flags + (d.ts_flags & NODE_IS_SAMPLE ? " sample" : ""))
            .attr("parents", d => d.child_of.toString().replace(",", " "))
            .attr("children", d => d.parent_of.toString().replace(",", " "))
            .call(
                d3
                    .drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended)
            )
            .on('mouseover', function (d, i) {
                d3.select(this)
                    .style("cursor", "pointer")
            });

        function highlight_mut(mutation_id, site_id, fill) {
            /* other mutations at the same site on the tree */
            d3.selectAll(div_selector + " .mutations .s" + site_id + " rect").style("stroke", fill);
            /* highlight only this mutation in the bar */
            d3.select(div_selector + " .sites .m" + mutation_id).style("display", "block");
        }

        function dehighlight_mut(mutation_id, site_id) {
            d3.selectAll(div_selector + " .mutations .s" + site_id + " rect")
                .each(function(d) {
                    d3.select(this)
                        .style("stroke", d.stroke)
                        .style("fill", d.fill);
                    });
            d3.select(div_selector + " .sites .m" + mutation_id).style("display", "none");
        }

        function highlight_mut(mutation_id, site_id, fill) {
            /* other mutations at the same site on the tree */
            d3.selectAll(div_selector + " .mutations .s" + site_id + " rect").style("stroke", fill);
            /* highlight only this mutation in the bar */
            d3.select(div_selector + " .sites .m" + mutation_id).style("display", "block");
        }

        function dehighlight_mut(mutation_id, site_id) {
            d3.selectAll(div_selector + " .mutations .s" + site_id + " rect")
                .each(function(d) {
                    d3.select(this)
                        .style("stroke", d.stroke)
                        .style("fill", d.fill);
                    });
            d3.select(div_selector + " .sites .m" + mutation_id).style("display", "none");
        }

        var mut_symbol = svg
            .append("g")
            .attr("class", "mutations")
            .selectAll("rect")
            .data(graph.mutations)
            .enter()
            .append("g")
            .attr("class", d => {
                if (condense_mutations) {
                    return (
                        d.site_id.map(id => "s" + id).join(" ") + " " +
                        d.mutation_id.map(id => "m" + id).join(" ")
                    )
                } else {
                    return "s" + d.site_id + " " + "m" + d.mutation_id;
                }}
            )
            .attr("class", d => {
                if (condense_mutations) {
                    return (
                        d.site_id.map(id => "s" + id).join(" ") + " " +
                        d.mutation_id.map(id => "m" + id).join(" ")
                    )
                } else {
                    return "s" + d.site_id + " " + "m" + d.mutation_id;
                }}
            )
            .on("mouseover", function(event, d) {
                if (!d3.select(div_selector + ">svg").classed("no-hover")) {
                    d3.select(this).style("cursor", "pointer");
                    /* highlight all mutations at the same site (easy to spot reversions etc) */
                    if (condense_mutations) {
                        d.mutation_id.forEach((id, i) => highlight_mut(id, d.site_id[i], d.fill));
                    } else {
                        highlight_mut(d.mutation_id, d.site_id, d.fill)
                    }
                    if (condense_mutations) {
                        d.mutation_id.forEach((id, i) => highlight_mut(id, d.site_id[i], d.fill));
                    } else {
                        highlight_mut(d.mutation_id, d.site_id, d.fill)
                    }
                    /* Show a tooltip with the mutation information */
                    var rect = d3.select(div_selector).node().getBoundingClientRect();
                    tip
                        .style("display", "block")
                        .html("<p style='margin: 0px;'>" + d.content + "</p>")
                        .style("border", d.fill + " solid 2px")
                        .style("left", (event.pageX - rect.x) + "px")
                        .style("top", (event.pageY - rect.y + 25) + "px")
                        .style("transform", "translateX(-50%)");
                }
            })
            .on("mouseout", function(event, d) {
                if (!d3.select(div_selector + ">svg").classed("no-hover")) {
                    if (!eval(d.active)) {
                        d3.select(this).style("cursor", "default");
                        if (condense_mutations) {
                            d.mutation_id.forEach((id, i) => dehighlight_mut(id, d.site_id[i]));
                        } else {
                            dehighlight_mut(d.mutation_id, d.site_id);
                        }
                    }
                    if (!eval(d.active)) {
                        d3.select(this).style("cursor", "default");
                        if (condense_mutations) {
                            d.mutation_id.forEach((id, i) => dehighlight_mut(id, d.site_id[i]));
                        } else {
                            dehighlight_mut(d.mutation_id, d.site_id);
                        } 
                        tip.style("display", "none");
                    }
                }
            });

        if (label_mutations) {
            var mut_symbol_label = mut_symbol
                .append("text")
                //.attr("class", "label")
                .style("font-size", d => (d.size * 2 + "px"))
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .attr("fill", d => {
                    var box = document.createElement("div");
                    box.style.color = d.fill;
                    document.body.appendChild(box);
                    var rgb = parseRgbString(window.getComputedStyle(box).color);
                    document.body.removeChild(box);
                    var lightness = 0.2126*rgb["r"] + 0.7152*rgb["g"] + 0.0722*rgb["b"];
                    if (lightness > 0.5) {
                        return "#053e4e"
                    }
                    return "white"
                })
                .text(d => d.label)
                .each(function(d) {
                    // Store the text width on the data object
                    d.textWidth = this.getComputedTextLength();
                });
        }

        var mut_symbol_rect = mut_symbol
            .append("rect")
            .attr("class", "symbol")
            .attr("fill", d => d.fill)
            .attr("stroke", d => d.stroke)
            .attr("stroke-width", 2)
            // Set the rect width / height based on the calculated text width
            .attr("width", function(d) {
                if (label_mutations && d.textWidth) {
                    d.computedWidth = d.textWidth + 6; // Add left/right padding
                } else {
                    d.computedWidth = d.size * 3; // aspect ratio is 3 (3 times wider than tall)
                }
                return d.computedWidth;  
            })
            .attr("height", function(d) {
                if (label_mutations) {
                    d.computedHeight = (d.size * 2) + 4; // Font size + top/bottom padding
                }
                else {
                    d.computedHeight = d.size;
                }
                return d.computedHeight;
            })
            .lower();

        function rotate_tip(d) {
            /* NB: why is there an "eval" here? */
            if ((d.parent_of.length == 0) & (eval(rotate_tip_labels))) {
                return "translate(-4, 0) rotate(90)"
            }
            return null
        }

        var label = svg
            .append("g")
            .attr("class", "node-labels")
            .selectAll("text")
            .data(graph.nodes)
            .enter()
            //.filter(d => eval(d.include_label))
            .append("g");

        var label_text = label
            .attr("class", d => "label n" + d.id)
            .append("text")
            .each(function(d) {
                multi_line_text.call(this, d.label, (d.parent_of.length == 0));
            })
            //.each(d => multi_line_text.call(this, d.label, (d.parent_of.length == 0)))
            .attr("transform", rotate_tip);

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
            var alt_child = document.getElementById(String(divnum) + "_node" + d.alt_child);
            if (alt_child != null) {
                var alt_child_x = alt_child.getAttribute("cx");
                var alt_child_y = alt_child.getAttribute("cy");
            }
            if (d.source.ts_flags & NODE_IS_RE_EVENT) {
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
            var alt_parent = document.getElementById(String(divnum) + "_node" + d.alt_parent);
            if (alt_parent != null) {
                var alt_parent_x = alt_parent.getAttribute("cx");
                var alt_parent_y = alt_parent.getAttribute("cy");
            }
            if (d.target.ts_flags & NODE_IS_RE_EVENT) {
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
            return [path_type, start_position_x, start_position_y, stop_position_x, stop_position_y];
        }

        function ortho_pathing(d, path_info, underlink=false) {      
            const path_type = path_info[0];
            const simple_path_type = Array.from(path_type)[0] + Array.from(path_type)[2];
            const start_position_x = path_info[1];
            const start_position_y = path_info[2];
            const stop_position_x = path_info[3];
            const stop_position_y = path_info[4];

            const after_paths = ["rf", "tb", "tf"];
            const before_paths = ["rt", "fb", "ft"];
            const step_paths = ["tt"];
            const mid_paths = ["rb", "ff"];

            if (underlink) {
                if (after_paths.includes(simple_path_type)) {
                    return stepAfter([[start_position_x, start_position_y],[stop_position_x, stop_position_y]]);
                } else if (before_paths.includes(simple_path_type)) {
                    return stepBefore([[start_position_x, start_position_y],[stop_position_x, stop_position_y]]);
                } else if (step_paths.includes(simple_path_type)) {
                    return step([[start_position_x, start_position_y],[stop_position_x, stop_position_y]]);
                } else if (mid_paths.includes(simple_path_type)) {
                    return line([[start_position_x, start_position_y],[start_position_x, start_position_y + (stop_position_y - start_position_y)/2]]) + line([[start_position_x, start_position_y + (stop_position_y - start_position_y)/2],[stop_position_x, start_position_y + (stop_position_y - start_position_y)/2]]) + line([[stop_position_x, start_position_y + (stop_position_y - start_position_y)/2], [stop_position_x, stop_position_y]]);
                }
            } else {
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
        }

        function ticked() {
            node
                .attr("transform", function(d) {
                    if (eval(y_axis.include_labels)) {
                        return "translate(" + Math.max(150, Math.min(width-50, d.x)) + "," + d.y + ")";
                    } else {
                        return "translate(" + Math.max(50, Math.min(width-50, d.x)) + "," + d.y + ")";
                    }
                })
                .attr("cx", function(d) {
                    if ((edge_styles.type == "ortho") & (d.x_pos_reference != -1)) {
                        var ref = document.getElementById(String(divnum) + "_node" + d.x_pos_reference);
                        if (ref != null) {
                            d.fx = ref.getAttribute("cx");
                        }
                    }
                    if (eval(y_axis.include_labels)) {
                        return d.x = Math.max(150, Math.min(width-50, d.x));
                    } else {
                        return d.x = Math.max(50, Math.min(width-50, d.x));
                    }
                })
                .attr("cy", d => d.y);
            
            link_container.each(function(d) {
                var path_info = determine_path_type(d);
                var path = "";
                if (edge_styles.type == "ortho") {
                    path = ortho_pathing(d, path_info);
                    underlink_path = ortho_pathing(d, path_info, underlink=true);
                } else if (d.source.id == d.alt_parent) {
                    var leftOrRight = 20;
                    if (d.index % 2 == 0) {
                        leftOrRight = -20;
                    }
                    path = "M " + d.source.x + " " + d.source.y + " C " + (d.source.x + leftOrRight).toString() + " " +  (d.source.y - 10).toString() + ", " + (d.target.x + leftOrRight).toString() + " " + (d.target.y + 10).toString() + ", " + d.target.x + " " + d.target.y;
                } else {
                    path = line([[d.source.x, d.source.y], [d.target.x, d.target.y]]);
                }
                if ((edge_styles.type == "ortho") & eval(edge_styles.include_underlink)) {
                    var u = d3.select(this).select(".underlink");
                    u.attr("d", underlink_path);
                }
                var l = d3.select(this).select(".link");
                l.attr("path_type", path_info[0]);
                l.attr("d", path)
                l.attr("fill", "none");
            });

            mut_symbol_rect
                .attr("x", function(d) {
                    var parent = document.getElementById(String(divnum) + "_node" + d.source);
                    if (parent != null) {
                        var parent_x = parseFloat(parent.getAttribute("cx"));
                        var parent_y = parseFloat(parent.getAttribute("cy"));
                        var child = document.getElementById(String(divnum) + "_node" + d.target);
                        if (child != null) {
                            var child_x = parseFloat(child.getAttribute("cx"));
                            var child_y = parseFloat(child.getAttribute("cy"));
                            if (parent_x - child_x == 0) {
                                return parent_x - d.computedWidth/2;
                            } else {
                                var slope = (parent_y - child_y) / (parent_x - child_x);
                                var intercept = parent_y - slope * parent_x;
                                return ((d.y - intercept) / slope) - d.computedWidth/2;
                            }
                        } else {
                            return 0;
                        }
                    } else {
                        return 0;
                    }
                })
                .attr("y", d => d.y - d.computedHeight/2);

            mut_symbol
                .attr("transform", function(d) {
                    var parent = document.getElementById(String(divnum) + "_node" + d.source);
                    if (parent != null) {
                        var parent_x = parseFloat(parent.getAttribute("cx"));
                        var parent_y = parseFloat(parent.getAttribute("cy"));
                        var child = document.getElementById(String(divnum) + "_node" + d.target);
                        if (child != null) {
                            var child_x = parseFloat(child.getAttribute("cx"));
                            var child_y = parseFloat(child.getAttribute("cy"));
                            var slope = (parent_y - child_y) / (parent_x - child_x);
                            var intercept = parent_y - slope * parent_x;
                            var rect = this.children[0];
                            return "rotate(" + String(-Math.atan((child_x-parent_x)/(child_y-parent_y))*180/Math.PI) + ", " + String(parseFloat(rect.getAttribute("x"))+parseFloat(rect.getAttribute("width"))/2) + ", " + String(parseFloat(rect.getAttribute("y"))+parseFloat(rect.getAttribute("height"))/2) + ")";
                        } else {
                            return "rotate(0)";
                        }
                    } else {
                        return "rotate(0)";
                    }
                });
            
            if (label_mutations) {
                mut_symbol_label
                    .attr("transform", function(d) {
                        var y = d.y + 1;
                        var x = 0;
                        var parent = document.getElementById(String(divnum) + "_node" + d.source);
                        if (parent != null) {
                            var parent_x = parseFloat(parent.getAttribute("cx"));
                            var parent_y = parseFloat(parent.getAttribute("cy"));
                            var child = document.getElementById(String(divnum) + "_node" + d.target);
                            if (child != null) {
                                var child_x = parseFloat(child.getAttribute("cx"));
                                var child_y = parseFloat(child.getAttribute("cy"));
                                if (parent_x - child_x == 0) {
                                    x = parent_x;
                                } else {
                                    var slope = (parent_y - child_y) / (parent_x - child_x);
                                    var intercept = parent_y - slope * parent_x;
                                    x = ((d.y - intercept) / slope);
                                }
                            } else {
                                x = 0;
                            }
                        } else {
                            x = 0;
                        }
                        return "translate(" + String(x) + "," + String(y) + ")";
                    });
            }

            function determine_label_positioning(d) {
                if (d.ts_flags & NODE_IS_RE_EVENT || d.parent_of.length == 0 || d.child_of.length == 0) {
                    return "c";
                } else if (d.child_of.length == 1) {
                    var parent = document.getElementById(String(divnum) + "_node" + d.child_of[0])
                    if (parent != null) {
                        var parent_x = parent.getAttribute("cx");
                        if (parent_x > d.x+1) {
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

            label
                .each(function(d) {
                    var l = d3.select(this);
                    var positioning = determine_label_positioning(d);
                    var x = d.x;
                    var anchor = "middle";
                    // Find offsets from CSS
                    const cstyle = getComputedStyle(this)
                    const symbolSize = Math.sqrt(d.size);
                    const cssOffset = cstyle.getPropertyValue('--offset');
                    // default should depend on the symbol size (which is square pixels) and the font size
                    const offset = cssOffset ? parseInt(cssOffset) : symbolSize/2 + parseFloat(cstyle.fontSize)/2;
                    const cssTipoffset = cstyle.getPropertyValue('--tipoffset');
                    // default of 25 if not set: perhaps should be related to the tip symbol size?
                    const tipoffset = cssTipoffset ? parseInt(cssTipoffset) : symbolSize/2 + parseFloat(cstyle.fontSize);
                    if (positioning == "l") {
                        x = d.x - offset;
                        anchor = "end";
                    } else if (positioning == "r") {
                        x = d.x + offset;
                        anchor = "start";
                    }
                    l.attr("text-anchor", anchor);
                    l.attr("transform", function(d) {
                        // adding slightly more spacing in the y-axis when positioning is middle (c)
                        var y = d.y - offset;
                        if (positioning == "c") {
                            y = y - 3;
                        }
                        if (d.parent_of.length == 0) {
                            y = d.y + tipoffset;
                            if (positioning == "c") {
                                y = y + 3;
                            }
                        }
                        // only bother showing up to 4 d.p.
                        return "translate(" + parseFloat(x.toFixed(4)) + "," + parseFloat(y.toFixed(4)) + ")";
                    })
                });

            missing_parents_paths
                .each(function(d) {
                    var l = d3.select(this);
                    l.style("stroke-width", "4px");
                    l.style("stroke-dasharray", "5");
                    l.style("stroke", "gray");
                    l.attr("d", line([[d.x, d.y], [d.x, d.y-30]]));
                });
            
            missing_parents_texts
                .each(function(d) {
                    var l = d3.select(this);
                    l.attr("text-anchor", "middle");
                    l.attr("x", d.x);
                    l.attr("y", d.y-30);
                });

            missing_children_paths
                .each(function(d) {
                    var l = d3.select(this);
                    l.style("stroke-width", "4px");
                    l.style("stroke-dasharray", "5");
                    l.style("stroke", "gray");
                    l.attr("d", line([[d.x, d.y], [d.x, d.y+30]]));
                });
            
            missing_children_texts
                .each(function(d) {
                    var l = d3.select(this);
                    l.attr("text-anchor", "middle");
                    l.attr("x", d.x);
                    l.attr("y", d.y+40);
                });
        }

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d3.selectAll(div_selector + " .node").classed("ref", function(j) {
                if ((edge_styles.type == "ortho") & (j.id == d.x_pos_reference)) {
                    j.fx = d.x;
                }
            });
            svg.attr("class", "no-hover");
        }

        function dragged(event, d) {
            d.fx = event.x;
            d3.selectAll(div_selector + " .node").classed("ref", function(j) {
                if ((edge_styles.type == "ortho") & (j.id == d.x_pos_reference)) {
                    j.fx = event.x;
                }
            });
        }

        function dragended(event, d) {
            svg.attr("class", null);
        }

        if (tree_highlighting) {
            
            var th_group = svg.append("g").attr("class", "tree_highlighting");
            
            var breakpoint_regions = th_group
                .append("g")
                .attr("class", "breakpoints")
                .selectAll("g")
                .data(graph.breakpoints)
                .enter()
                .append("g")
                .attr("class", d => eval(d.included) ? "included" : null)
                .attr("start", d => d.start)
                .attr("stop", d => d.stop);

            breakpoint_regions
                .append("rect")
                .attr("x", d => d.x_pos)
                .attr("y", height-60)
                .attr("width", d => d.width)
                .attr("height", 40)
                .attr("stroke", "#FFFFFF")
                .attr("stroke-width", 1)
                .attr("fill", d => eval(d.included) ? d.fill : "gray");

            breakpoint_regions
                .append("text")
                .attr("x", d => d.x_pos)
                .attr("y", height-5)
                .attr("class", "label start")
                .style("display", "none")
                .text(d => String(d.start));

            breakpoint_regions
                .append("text")
                .attr("x", d => d.x_pos + d.width)
                .attr("y", height-5)
                .attr("class", "label stop")
                .style("display", "none")
                .text(d => String(d.stop));

            breakpoint_regions
                .on('mouseover', function (event, d) {
                    if (!d3.select(div_selector + ">svg").classed("no-hover")) {
                        if (eval(d.included)) {
                            d3.select(this).selectAll("rect")
                                .style('fill', '#1eebb1')
                                .style("cursor", "pointer");
                            d3.select(this).selectAll("text")
                                .style('display', 'block');
                            d3.selectAll(div_selector + " .endpoints")
                                .style('display', 'none'); /* hide other labels to avoid clashes */
                            var highlight_links = d3.select(div_selector + " .links")
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
                        }
                    }
                })
                .on('mouseout', function (event, d) {
                    if (!d3.select(div_selector + ">svg").classed("no-hover")) {
                        if (eval(d.included)) {
                            d3.select(this).selectAll("rect")
                                .style('fill', d.fill)
                                .style("cursor", "default");
                            d3.select(this).selectAll("text")
                                .style('display', 'none');
                            d3.selectAll(div_selector + " .endpoints")
                                .style('display', 'block');
                            d3.selectAll(div_selector + " .link")
                                .style("stroke", d => d.stroke);
                        }
                    }
                });
            
            var endpoints = th_group.append("g").attr("class", "endpoints");
            
            endpoints
                .append("text")
                    .attr("class", "label")
                    .style("text-anchor", "start")
                    .text(graph.breakpoints[0].start)
                    .attr("x", graph.breakpoints[0].x_pos)
                    .attr("y", height-5);
            
            endpoints
                .append("text")
                    .attr("class", "label")
                    .style("text-anchor", "end")
                    .text(graph.breakpoints[graph.breakpoints.length-1].stop)
                    .attr("x", width)
                    .attr("y", height-5);

            var mutation_data = graph.mutations;
            if (condense_mutations) { /* explode the graph.mutations df into one row per mut */
                mutation_data = [];
                graph.mutations.forEach(function(d) {
                    d.mutation_id.forEach(function(x, i) {
                        mutation_data.push({
                            mutation_id: x,
                            site_id: d.site_id[i],
                            edge: d.edge,
                            fill: d.fill,
                            x_pos: d.x_pos[i], 
                            position: d.position[i]
                        });
                    });
                });
            };

            var mutation_data = graph.mutations;
            if (condense_mutations) { /* explode the graph.mutations df into one row per mut */
                mutation_data = [];
                graph.mutations.forEach(function(d) {
                    d.mutation_id.forEach(function(x, i) {
                        mutation_data.push({
                            mutation_id: x,
                            site_id: d.site_id[i],
                            edge: d.edge,
                            fill: d.fill,
                            x_pos: d.x_pos[i], 
                            position: d.position[i]
                        });
                    });
                });
            };

            var site_pos = th_group
                .append("g")
                .attr("class", "sites")
                .selectAll("line")
                .data(mutation_data)  /* NB: one per mutation to allow different line colors */
                .data(mutation_data)  /* NB: one per mutation to allow different line colors */
                .enter()
                .append("g")
                .attr("class", d => "s" + d.site_id + " " + "e" + d.edge + " " + "m" + d.mutation_id)
                .attr("class", d => "s" + d.site_id + " " + "e" + d.edge + " " + "m" + d.mutation_id)
                .attr("transform", d => "translate(" + d.x_pos + "," + (height-60) + ")")
                .style("display", "none");

            function createSiteLine(selection) {
                return selection
                    .append("line")
                    .attr("y1", -5)
                    .attr("y2", 40+5)
                    .style("stroke-width", 3)
                    .style("fill", "none");
            }
                  
            function createSiteText(selection) {
                return selection
                    .append("text")
                    .attr("y", -8)  /* above the tick */
                    .attr("class", "label");
            }
            
            site_pos
                .each(function(d) {
                    const select = d3.select(this);
                    createSiteLine(select)
                        .style("stroke", d.fill);
                    createSiteText(select)
                        .text(String(d.position));
                });
            
            /*
            var mut_text = mut_pos
                .append("text")
                .attr("text-anchor", function(d) {
                    if (d.x_pos > (width*9/10)) {
                        return "end";
                    } else if (d.x_pos < width*1/10) {
                        return "start";
                    } else {
                        return "middle";
                    }
                })
                .style("font-size", "10px")
                .style("font-family", "Arial")
                .attr("fill", d => d.fill)
                .attr("transform", d => "translate(" + String(d.x_pos) + "," + String(height-60-10) + ")");
        
            mut_text
                .text(function(d) {
                    if (label_mutations) {
                        return String(d.site_id) + ":" + String(d.position);
                    } else {
                        return d.label;
                    }
                });
            */
        }

        if (title != "None") {
            svg.append("text")
                .style("font-size", "20px")
                .attr("x", width / 2)
                .attr("text-anchor", "middle")
                .attr("y", 30)
                .each(function() { 
                    multi_line_text.call(this, title, true); 
                });
        }
    }

    draw_force_diagram()
}

/* NB: the code below fires up the visualizer: templates in this call
    can be used to pass in the appropriate data
*/

ensureRequire()
    .then(require => {
        require.config({ paths: {d3: 'https://d3js.org/d3.v7.min'}});
        require(["d3"], function(d3) {
            main_visualizer(d3, $divnum, $data, $width, $height, $y_axis, $edges, $condense_mutations, $label_mutations, $tree_highlighting, $title, $rotate_tip_labels, $plot_type, $preamble, $source, $save_filename)
        });
    })
    .catch(err => console.error('Failed to load require.js:', err));

