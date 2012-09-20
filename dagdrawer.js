/*
 *
 * Package: DagDrawer
 *
 * Javascript functions to draw Acyclic graphs
 *
 *
 */


Animations = {};
Animations.bounce_radius = 5;
// node should probably be a rect, and label a text
Animations.bounce = function(node, label) {
    var bb = node.original_bbox || node.getBBox();
    node.original_bbox = bb;
    var t = Animations.bounce_radius;
    // node.animate({scale:"1.5,1.5")}, 200);

    node.animate({
                x : bb.x - t,
                y : bb.y - t,
                width : bb.width + 2 * t,
                height : bb.height + 2 * t
            }, 200);
}

Animations.bounceBack = function(node, label) {
    var bb = node.original_bbox || node.getBBox();
    node.animate({
                x : bb.x,
                y : bb.y,
                width : bb.width,
                height : bb.height
            }, 200);
}

var default_settings = {
    margin : 50,
    width : 640,
    height : 480,
    layer_spacing : 50,
    log : Notifications.notify,
    title : 'Direct Acyclic Graph Drawer',
    nodes : {
        width : 60,
        height : 40,
        r : 5,

        spacing : 20,
        color : 'blue',
        label : {
            margin_width : 5,
            attrs : {
                'font-size' : '12px'
                // ,'font-family': 'Arial,Helvetica,sans-serif'
                ,
                fill : 'black',
                stroke : 'none',
                'font-weight' : 'bold'
            },
            color : 'black'
        },
        rect: {
            fill : 'white',
            stroke : 'blue',
            //"fill-opacity" : 0,
            "stroke-width" : 2
        },
        onMouseOver : Animations.bounce,
        onMouseOut : Animations.bounceBack

    },

    nodes_highlighted : {
    	color: 'red'
        ,rect: {
            fill : 'orange',
            stroke : 'red',
            "fill-opacity" : 0.5,
            "stroke-width" : 2
        }
    },

    edges : {
        color : 'red',
        arrow_height : 6
    }
};




// ===============================
// Group: Data Structures

/*
 * variable: node_by_name
 *
 * A hash whose keys are the node names (should be an integer), and the values
 * are the node objects. The node names should be the numbers from 1 to the
 * number of nodes.
 *
 */

/*

 Variable: nodes

 A list of the grpah nodes, with attributes:
 	name - the identifier of the node
    label - will display the text in the node instead of the internal name
    dummy - identifies the node as as dummy node, that is usually drawed as a point
    link - url that will be used if the node is clicked
    highlighted - node is highlighted (drawn differently, depending on the settings)

 */

/*
 * variable: edges
 *
 * a list of edges, where each edge is a list [a, b] where a and be are *node
 * names* (should be integers).
 *
 */

/*
variable: settings

The user settings. It is a hash/object that enables customization. For
example the current defaults look like this

(start code)
var default_settings = {
    margin : 50,
    width : 640,
    height : 480,
    layer_spacing : 50,
    log : Notifications.notify,
    title : 'Direct Acyclic Graph Drawer',
    nodes : {
        width : 60,
        height : 40,
        r : 5,

        spacing : 20,
        color : 'blue',
        label : {
            margin_width : 5,
            attrs : {
                'font-size' : '12px'
                // ,'font-family': 'Arial,Helvetica,sans-serif'
                ,
                fill : 'black',
                stroke : 'none',
                'font-weight' : 'bold'
            },
            color : 'black'
        },
        onMouseOver : Animations.bounce,
        onMouseOut : Animations.bounceBack

    },

    nodes_highlighted : {
    	color: 'red'
    },

    edges : {
        color : 'red',
        arrow_height : 6
    }
};
(end code)

*/


// ==============================
// Group: Setup

/*
 * Constructor: DagDrawer
 *
 * constructor.
 *
 * Params:
 * 	nodes - a list of node objects : <nodes>
 *  edges - the edges list : <edges>
 *  settings - the user settings : <settings>
 *  dom_id - the DOM id to use for the Graph Drawing
 *
 *
 */

function DagDrawer(nodes, edges, userSettings, dom_id) {

    var settings = Ext.apply({},userSettings, default_settings);
	var nhs = Ext.apply({}, settings.nodes_highlighted, settings.nodes)
    settings.nodes_highlighted = nhs;

    var paper = Raphael(dom_id, settings.width, settings.height);

    this.paper = paper;
    this.settings = settings;
    this.nodes = nodes;
    this.edges = edges;

    this.log = settings.log;

    // make a hash of nodes
    var node_by_name = {};
    nodes.forEach(function(node) {
                node_by_name[node.name] = node;
            });
    this.node_by_name = node_by_name;

    this.log("DagDrawer", "computeLayout1");
    var layout = DagDrawer.computeLayout1(nodes, edges);

    this.allShapes = this.applyLayout(layout);

    this.center();
}


/*
 * Method: COMPUTE_SUCCESSORS
 *
 * static method*, compute the list of successors
 *
 * Parameters: node_by_name - the nodes : <node_by_name> edges - the edges list :
 * <edges>
 *
 * Returns: the successors - hash of node: sorted list of nodes
 *
 *
 */
DagDrawer.COMPUTE_SUCCESSORS = function(node_by_name, edges) {
    var successors = {};
    for (nn in node_by_name) {
        successors[nn] = [];
    }
    edges.forEach(function(e) {
                successors[e[0]].push(e[1]);
            });
    for (nn in node_by_name) {
        successors[nn].sort(function(a, b) {
                    return a < b ? -1 : a == b ? 0 : 1
                });
    }
    return successors;
}

/*
 * Method: COMPUTE_PREDECESSORS
 *
 * static method*, compute the list of precessors, the opposite of
 * <COMPUTE_SUCCESSORS>
 *
 * See <COMPUTE_SUCCESSORS> for params and return type.
 *
 */
DagDrawer.COMPUTE_PREDECESSORS = function(node_by_name, edges) {
    var predecessors = {};
    for (nn in node_by_name) {
        predecessors[nn] = [];
    }
    edges.forEach(function(e) {
                predecessors[e[1]].push(e[0]);
            });
    for (nn in node_by_name) {
        predecessors[nn].sort(function(a, b) {
                    return a < b ? -1 : a == b ? 0 : 1
                });
    }
    return predecessors;
}



// =========
// Group: Layering


/*
 * Method: longestPathLayering
 *
 * Simple algorithm that computes the layers of a digraph See "Graph Drawing"
 * pp272
 *
 * This algorithm produces the minimum number of layers, but some layers may be
 * quite large compared to the others.
 *
 * Parameters: node_by_name - the nodes : <node_by_name> edges - the edges list :
 * <edges>
 *
 * Returns: the layers - a list of list of node indices
 *
 */

DagDrawer.longestPathLayering = function(node_by_name, edges) {
    // make a hash of out edges from nodes
    var out_edges = {};
    var in_edges_counts = {};
    for (var name in node_by_name) {
        out_edges[name] = [];
        in_edges_counts[name] = 0;
    }

    edges.forEach(function(e) {
                out_edges[e[0]].push(e[1]);
                in_edges_counts[e[1]]++;
            });

    // init queue with sources
    var queue = [];
    for (var nodename in node_by_name) {
        if (in_edges_counts[nodename] == 0)
            queue.push(nodename);
    }

    var longest_path = {}; // do not need the in_edges anymore
    for (var nodename in node_by_name)
        longest_path[nodename] = 0;

    var n = null;
    while (n = queue.pop()) {
        var l = longest_path[n] + 1;
        out_edges[n].forEach(function(son) {
                    longest_path[son] = Math.max(longest_path[son], l);
                    queue.push(son);
                });
    }

    var layers = [];
    for (var nodename in node_by_name) {
        var l = longest_path[nodename];
        if ( ! layers[l] )
            layers[l] = [];
        layers[l].push(nodename);
    }


    return layers;
}

/*
 * Method: addDummyNodes
 *
 * add dummy nodes so that no edge crosses a layer.
 *
 * The edges crossing a layer are broken in several edges passing by dummy
 * nodes.
 *
 * N.B*: currently, the new dummy nodes are directly added to the *node_by_name*
 * parameter. This is ugly but...
 *
 * Parameters: node_by_name - the nodes : <node_by_name> edges - the edges list :
 * <edges> layers - a list of list of node indices, see <longestPathLayering>
 *
 * Returns: the newly created edges - the edges list : <edges>
 *
 */
/*
 * add dummy nodes so that no edge crosses a layer return the new edges put the
 * new
 */
DagDrawer.addDummyNodes = function(node_by_name, edges, layers) {
    var layer_by_node = {};
    for(var i=0; i< layers.length; ++i) {
        layers[i].forEach(function(n) {layer_by_node[n] = i ;} );
    }

    var new_edges = [];
    edges.forEach(function(e) {
                var a = e[0], b = e[1];
                var pred = a;

                if (layer_by_node[b] - layer_by_node[a] > 1) {
                    for (var l = layer_by_node[a] + 1; l < layer_by_node[b]; ++l) {
                        var name = ['dummy', a, b, l].join('_');
                        var node = {
                            name : name,
                            label : '',
                            dummy : true
                        };
                        node_by_name[name] = node;
                        layers[l].push( name );

                        new_edges.push([pred, name]);
                        pred = name;
                    }
                    new_edges.push([pred, b]);
                } else {
                    new_edges.push(e);
                }

            });

    return new_edges;
}

// ======================
// Group: Layer ordering

/*
 * Method: two_layer_adjacent_exchange
 *
 * 2-layer crossing minimization problem : Algorithm adjacent exchange. This is
 * the base method for layer ordering
 *
 * See Graph Drawing pp283
 *
 * Parameters: node_by_name - the nodes : <node_by_name> successors - the list
 * of successors layer1 - ordered layer : an array of node indices. layer2 -
 * ordered layer : an array of node indices.
 *
 * Returns: an object with:
 *
 * crossings - the matrix of crossing numbers, see <COMPUTE_CROSSING_NUMBERS>
 * lower_bound - the lower bound of the number of crossing numbers : int
 * ordering - an ordering of layer2 : list of nodes indices
 */

DagDrawer.two_layer_adjacent_exchange = function(node_by_name, successors,
        layer1, layer2) {
    var crossings = DagDrawer.COMPUTE_CROSSING_NUMBERS(successors, layer1,
            layer2);
    var cn = DagDrawer.COMPUTE_CROSSINGS(crossings, layer2);
    var lb = DagDrawer.COMPUTE_CROSSING_LOWER_BOUND(crossings, layer2);
    // alert("lower bound of # of crossings=" + lb + ", initial # of crossings="
    // + cn);

    if (cn == lb) { // already optimal, nothing to do
        return {
            crossings : cn,
            lower_bound : lb,
            ordering : layer2
        };
    }

    var best_crossing = cn;
    var l2 = layer2.slice();
    var n2 = l2.length, i = 0, left = 0, right = 0, cross = 0;
    while (true) {
        left = l2[0];
        for (i = 1; i < n2; ++i) { // scan
            right = l2[i];

            if (crossings[left][right] > crossings[right][left]) {
                // swap nodes
                l2[i - 1] = right;
                l2[i] = left;
            }

            left = l2[i];
        }
        // compute
        cross = DagDrawer.COMPUTE_CROSSINGS(crossings, l2);
        // alert("cross="+cross);
        if (cross >= best_crossing)
            break;
        best_crossing = cross;
        if (best_crossing == lb)
            break; // reached the lower bound
    }
    return {
        crossings : best_crossing,
        lower_bound : lb,
        ordering : l2
    };
}


/*
 * Method: topDownLayerByLayerSweep
 *
 * Do a top-down layer by layer sweep ordering to reduce the number of
 * crossings.
 *
 * The two-layer algorithm function is given as argument, and takes
 * (node_by_name, successors, layer1, layer2) as arguments, and return a hash of
 * {crossings:#, ordering:list}
 *
 * Parameters: node_by_name - the nodes : <node_by_name> edges - the edges list :
 * <edges> layers_orig - a list of list of node indices, see
 * <longestPathLayering> two_layer_algorithm - the algorithm to use for 2-layer
 * minimization problem : function, see <two_layer_adjacent_exchange>
 *
 * Returns: an object with:
 *
 * crossings - the matrix of crossing numbers, see <COMPUTE_CROSSING_NUMBERS>
 * lower_bound - the lower bound of the number of crossing numbers : int layers -
 * the ordered layers : list of nodes indices
 */
DagDrawer.topDownLayerByLayerSweep = function(node_by_name,
        edges, layers_orig, two_layer_algorithm) {
     var successors = DagDrawer.COMPUTE_SUCCESSORS(node_by_name, edges);
     var nb = layers_orig.length;

    var layers = layers_orig.map(function(t) {
                return t.slice()
            }); // clone

    var best = Number.MAX_VALUE;

   // while (1) {
        var lower_bound = 0;
        var l1 = layers[0];
        var nb_crossings = 0;
        for (var i = 1; i < nb; ++i) {
            var l2 = layers[i];
            var res = two_layer_algorithm.call(null, node_by_name, successors,
                    l1, l2);
            lower_bound += res.lower_bound;
            nb_crossings += res.crossings;
            l1 = layers[i] = res.ordering;
        }
        // alert("nb_crossings="+nb_crossings + ", lower_bound=" + lower_bound);
// if (nb_crossings >= best)
// break;
        best = nb_crossings;
// if (lower_bound == nb_crossings)
// break;
 // }
    return {
        crossings : best,
        lower_bound:lower_bound,
        layers : layers
    };
}

 /*
	 * Method: bottomUpLayerByLayerSweep
	 *
	 * Do a bottom-up layer by layer sweep to reduce crossing number. calls
	 * <topDownLayerByLayerSweep>
	 *
	 */
 DagDrawer.bottomUpLayerByLayerSweep = function(node_by_name, edges, layers, two_layer_algorithm) {
     // inverse layers and edges
     var reversed_edges = edges.map(function(e) {return e.slice().reverse() } );
     var reversed_layers = layers.slice().reverse();

     var res = DagDrawer.topDownLayerByLayerSweep(node_by_name, reversed_edges,
             reversed_layers, two_layer_algorithm);
     res.layers.reverse();
     return res;
 }



/*
 * Method: orderLayersUsing2waysSweep
 *
 * Do a topDown layer sweep *and* a bottomUp one, and return the layering of
 * which minimizes the number of crossings. See <bottomUpLayerByLayerSweep> and
 * <topDownLayerByLayerSweep>
 *
 * Parameters: node_by_name - the nodes : <node_by_name> edges - the edges list :
 * <edges> layers - a list of list of node indices, see <longestPathLayering>
 * algo - the algorithm to use for 2-layer minimization problem : function
 *
 */

DagDrawer.orderLayersUsing2waysSweep = function(node_by_name, edges, layers, algo) {

    var res_top = DagDrawer.topDownLayerByLayerSweep(node_by_name,
            edges, layers, algo);
    var res_up = DagDrawer.bottomUpLayerByLayerSweep(node_by_name,
            edges, layers, algo);
    return res_top.crossings < res_up.crossings ? res_top : res_up;
}

/*
 * Method: COMPUTE_CROSSINGS
 *
 * Static Method*, compute the number of crossings between one ordered layer and
 * an ordering of the next layer Useful to test an layer ordering
 *
 * Parameters: matrix - the matrix of crossing numbers, as computed by
 * <COMPUTE_CROSSING_NUMBERS> layer2 - the layer : an array of node indices.
 *
 * Returns: the number of crossings - int
 */
DagDrawer.COMPUTE_CROSSINGS = function(matrix, layer2) {
    var n2 = layer2.length;
    var crossings = 0;
    for (var i = 0; i < n2; ++i) {
        for (var j = i + 1; j < n2; ++j)
            crossings += matrix[layer2[i]][layer2[j]];
    }
    return crossings;
}

/*
 * Method: COMPUTE_CROSSING_LOWER_BOUND
 *
 * Static Method*, compute the lower bound of the number of crossings between
 * one ordered layer and the next (unordered) layer.
 *
 *
 * Parameters: matrix - the matrix of crossing numbers, as computed by
 * <COMPUTE_CROSSING_NUMBERS> layer2 - the layer : a list of node indices.
 *
 * Returns: lower bound - int
 */
DagDrawer.COMPUTE_CROSSING_LOWER_BOUND = function(matrix, layer2) {
    var n2 = layer2.length;
    var lb = 0;
    for (var i = 0; i < n2; ++i) {
        for (var j = i + 1; j < n2; ++j)
            lb += Math.min(matrix[layer2[i]][layer2[j]],
                    matrix[layer2[j]][layer2[i]]);
    }
    return lb;
}

/*
 * Method: COMPUTE_CROSSING_NUMBERS
 *
 * Static Method*, compute the crossing numbers for layer 2 assuming that layer1
 * is ordered.
 *
 *
 * Parameters: successors - the list of successors layer1 - ordered layer : a
 * list of node indices. layer2 - the unordered layer : a list of node indices.
 *
 * Returns: matrix - a matrix n2 by n2 where n2 is the # of nodes in layer2
 */

DagDrawer.COMPUTE_CROSSING_NUMBERS = function(successors, layer1, layer2) {
    var n1 = layer1.length;
    var p = layer1[0];
    var isNodeLayer2 = {};
    layer2.forEach(function(x) {
                isNodeLayer2[x] = true
            });

    // init crossing matrix
    var matrix = {};
    var n2 = layer2.length;
    for (var i = 0; i < n2; ++i) {
        var t = matrix[layer2[i]] = {};
        for (var j = 0; j < n2; ++j)
            t[layer2[j]] = 0;
    }

    // compute all successor lists from layer1 to layer2
    var succs = {};
    layer1.forEach(function(n) {
                var list = successors[n];
                succs[n] = list.filter(function(x) {
                            return isNodeLayer2[x]
                        });

            });

    var psucc, pn, qsucc, qn, p, q, p2, q2;
    for (var pi = 0; pi < n1; ++pi) {
        p = layer1[pi];
        psucc = succs[p];
        pn = psucc.length;
        for (var qi = pi + 1; qi < n1; ++qi) {
            q = layer1[qi];
            qsucc = succs[q];
            qn = qsucc.length;
            for (var i = 0; i < pn; ++i) {
                p2 = psucc[i];
                for (var j = 0; j < qn; ++j) {
                    q2 = qsucc[j];
                    if (p2 != q2)
                        matrix[q2][p2]++;
                }
            }
        }
    }

    return matrix;
}

// ============================
// Group: Layout


/*
 * Method: applyLayout
 *
 * apply a layout to the graph, and draw it
 *
 * Parameters: layout - {nodes:, edges:, layers: }
 *
 * Returns: list of shapes
 */
DagDrawer.prototype.applyLayout = function(layout) {
    this.eraseAll();
    var settings = this.settings;

    var node_by_name = {};
    layout.nodes.forEach(function(node) {
                node_by_name[node.name] = node;
            });

    var shapes_by_layer = this.buildShapesByLayer(this.paper, node_by_name,
            layout.layers, settings);

    this.setLayerHeights(shapes_by_layer, settings);
    this.centerLayersHorizontally(shapes_by_layer, settings);

    // gather all
    var allNodeShapes = [];
    shapes_by_layer.forEach(function(layer) {
                allNodeShapes.pushArray(layer.shapes);
            });


    var allShapes = allShapes = [];
    allShapes.pushArray(allNodeShapes);

    var connections = this.initEdges(this.paper, allShapes, layout.edges, settings);
    connections.forEach(function(s) {
                if (s.line)
                    allShapes.push(s.shape);
                if (s.bg)
                    allShapes.push(s.bg)
            });
    return allShapes;
}

/*
 * Method: computeLayout1
 *
 * compute a layout using - longestPathLayering - max(bottom_up, top_down) layer
 * sweep
 *
 * Parameters: nodes - the nodes of the graph edges - the edges list : <edges>
 *
 * Returns: {nodes:, edges:, layers: }
 */

DagDrawer.computeLayout1 = function(nodes, edges) {

    var node_by_name = {}; // make a hash of nodes
    nodes.forEach(function(node) {
                node_by_name[node.name] = node;
            });

    var layers = DagDrawer.longestPathLayering(node_by_name, edges);

    // add dummy nodes and corresponding edges
    var new_edges = DagDrawer.addDummyNodes(node_by_name, edges, layers);
    // caution: the new dummy nodes are directly added to node_by_name and
	// layers

    var res = DagDrawer.orderLayersUsing2waysSweep(node_by_name, new_edges, layers, DagDrawer.two_layer_adjacent_exchange);

    return { nodes:getPropertiesValues(node_by_name), edges:new_edges, layers:res.layers };
}

  /*
	 * Method: computeLayout2
	 *
	 * compute a layout using - longestPathLayering - topDown layer sweep
	 *
	 * Parameters: nodes - the nodes of the graph edges - the edges list :
	 * <edges>
	 *
	 * Returns: {nodes:, edges:, layers: }
	 */

 DagDrawer.computeLayout2 = function(nodes, edges) {

    var node_by_name = {}; // make a hash of nodes
    nodes.forEach(function(node) {
                node_by_name[node.name] = node;
            });

    var layers = DagDrawer.longestPathLayering(node_by_name, edges);

    // add dummy nodes and corresponding edges
    var new_edges = DagDrawer.addDummyNodes(node_by_name, edges, layers);
    // caution: the new dummy nodes are directly added to node_by_name and
	// layers

    var res = DagDrawer.topDownLayerByLayerSweep(node_by_name, new_edges, layers, DagDrawer.two_layer_adjacent_exchange);

    return { nodes:getPropertiesValues(node_by_name), edges:new_edges, layers:res.layers };
 }

 /*
	 * Method: computeLayout3
	 *
	 * compute a layout using - longestPathLayering - bottom_up layer sweep
	 *
	 * Parameters: nodes - the nodes of the graph edges - the edges list :
	 * <edges>
	 *
	 * Returns: {nodes:, edges:, layers: }
	 */

DagDrawer.computeLayout3 = function(nodes, edges) {

    var node_by_name = {}; // make a hash of nodes
    nodes.forEach(function(node) {
                node_by_name[node.name] = node;
            });

    var layers = DagDrawer.longestPathLayering(node_by_name, edges);

    // add dummy nodes and corresponding edges
    var new_edges = DagDrawer.addDummyNodes(node_by_name, edges, layers);
    // caution: the new dummy nodes are directly added to node_by_name and
	// layers

    var res = DagDrawer.bottomUpLayerByLayerSweep(node_by_name, new_edges, layers, DagDrawer.two_layer_adjacent_exchange);

    return { nodes:getPropertiesValues(node_by_name), edges:new_edges, layers:res.layers };
}

// =====================
// Group: Other Methods

/*
 * Method: eraseAll
 *
 * delete and erase all shapes
 *
 */

DagDrawer.prototype.eraseAll = function() {
    if ( this.allShapes)
        this.allShapes.forEach(function(s) { s.remove() });
    this.allShapes = null;
}

/*
 * Method: center
 *
 * center the whole graph drawing
 *
 */
DagDrawer.prototype.center = function() {
    var settings = this.settings;
    this.translate(settings.margin, settings.margin);
    // resize canvas
    var box = this.getBBox();
    this.paper.setSize(box.width + 2*settings.margin, box.height + 2*settings.margin);
}

/*
 * Method: translate translate the whole graph drawing Parameters: x - the
 * horizontal delta y - the vertical delta
 *
 *
 */
DagDrawer.prototype.translate = function(x, y) {
    this.allShapes.forEach(function(s) {
                s.translate(x, y)
            });
}

/*
 * Method: getBBox
 *
 * compute the whole graph drawing Bounding Box
 *
 * Returns: the bbox - a rectangle {x:, y:, width:, height: }
 *
 *
 */
DagDrawer.prototype.getBBox = function() {
    var x1 = Number.MAX_VALUE;
    var y1 = Number.MAX_VALUE;
    var x2 = 0;
    var y2 = 0;
    this.allShapes.forEach(function(s) {
                var bb = s.getBBox();
                x1 = Math.min(x1, bb.x);
                y1 = Math.min(y1, bb.y);
                x2 = Math.max(x2, bb.x + bb.width);
                y2 = Math.max(y2, bb.y + bb.height);
            });

    return {
        x : x1,
        y : y1,
        width : (x2 - x1),
        height : (y2 - y1)
    };
}



// ============================
// Group: Shapes related Methods
// Shapes are graphical objects created unsing the Raphael library
// <http://raphaeljs.com/>

/*
 * Method: initEdges
 *
 * create the drawing/shapes for the edges
 *
 * Parameters: paper - the Raphael canvas allShapes - the list of all
 * Shapes/graphics, should contain the node shapes edges - the edges list :
 * <edges> settings - the user settings : <settings>
 *
 * Returns: the list of edges shapes
 *
 *
 */
DagDrawer.prototype.initEdges = function(paper, allShapes, edges, settings) {
    // make a hash of node names
    var shape_by_name = {};
    allShapes.forEach(function(s) {
                shape_by_name[s.node.name] = s;
            });

    var color = settings.edges.color;

    var self = this;
    var connections = edges.map(function(e) {
                var pred = shape_by_name[e[0]];
                var succ = shape_by_name[e[1]];
                // var c = paper.connection(pred, succ, color);
                var c = self.drawEdge(paper, pred, succ, color);

                return c;
            });

    return connections;
}



/*
 * organize the nodes per layer in function of their layer attribute (or 0 if
 * not set)
 *
 * @return an array of array of node names
 *
 */
/*
 * DagDrawer.prototype.getLayers = function(node_by_name) { // layers var layers =
 * []; for (var n in node_by_name) { var node = node_by_name[n];
 *
 * var lev = node.layer || 0; if (!layers[lev]) layers[lev] = [];
 * layers[lev].push(n); } return layers; }
 */

/*
 * Method: buildShapesByLayer
 *
 * create the nodes shapes and organize them by layer.
 *
 * Parameters: paper - the Raphael canvas node_by_name - the nodes :
 * <node_by_name> layers - the layers : a list of list of nodes settings - the
 * user settings : <settings>
 *
 * Returns: a list of {layer:layer index, nodes:list of nodes, shapes: list of
 * node}
 *
 */
DagDrawer.prototype.buildShapesByLayer = function(paper, node_by_name,
        layers, settings) {

    var shapes_by_layer = [];
    for (var layer = 0; layer < layers.length; ++layer) {
        var lnodes = layers[layer].map(function(n) {
                    return node_by_name[n]
                });
        if (lnodes.length) {
            var entry = {
                layer : layer,
                nodes : lnodes
            };
            entry.shapes = this.buildNodeShapes(paper, lnodes, settings);
            shapes_by_layer.push(entry);
        }
    }

    return shapes_by_layer;
}

 /*
	 * Method: centerLayersHorizontally
	 *
	 * Center horizontally all the layers. It translates the shapes in the
	 * layers.
	 *
	 * Parameters: shapes_by_layer - the shapes by layer as returned by
	 * <buildShapesByLayer> settings - the user settings : <settings>
	 *
	 */

DagDrawer.prototype.centerLayersHorizontally = function(shapes_by_layer, settings) {
    // compute all width

    var widths = shapes_by_layer.map(function(layer) {
                var bb = layer.shapes[layer.shapes.length - 1].getBBox();
                return bb.x + bb.width;
            });

    var maxWidth = widths.reduce(function(a, b) {
                return Math.max(a, b)
            });

    // now center all layers

    shapes_by_layer.forEach(function(layer) {
                var bb = layer.shapes[layer.shapes.length - 1].getBBox();
                var x = maxWidth - (bb.x + bb.width);

                if (x > 0) {
                    layer.shapes.forEach(function(s) {
                                s.translate(x / 2, 0);
                            });
                }
            });
}

 /*
	 * Method: setLayerHeights
	 *
	 * Center horizontally all the layers. It translates the shapes in the
	 * layers.
	 *
	 * Parameters: shapes_by_layer - the shapes by layer as returned by
	 * <buildShapesByLayer> settings - the user settings : <settings>
	 *
	 */
DagDrawer.prototype.setLayerHeights = function(shapes_by_layer, settings) {
    // process layers
    var spacing = settings.layer_spacing;
    var y = 0;

    shapes_by_layer.forEach(function(layer) {
                var lh = 0;
                layer.shapes.forEach(function(x) {
                            lh = Math.max(x.getBBox().height, lh);
                            x.translate(0, y);
                        });
                y += lh + spacing;
            });

}
 /*
	 * Method: buildNodeShapes
	 *
	 * Build the node shapes.
	 *
	 * Parameters: paper - the Raphael canvas nodes - the list of nodes settings -
	 * the user settings : <settings>
	 *
	 * Returns: a list of shapes
	 *
	 */
DagDrawer.prototype.buildNodeShapes = function(paper, nodes, settings) {
    var shapes = [];
    var x = 0;

    var self = this;
    nodes.forEach(function(node) {
                var s = self.buildNode(paper, node, x, settings);
                s.node = node;
                x += s.getBBox().width + settings.nodes.spacing;
                // r.mousedown(dragger);

                shapes.push(s);
            });

    return shapes;
}

/*
 * Method: buildNode
 *
 * Build the shape of a node.
 *
 * Parameters: paper - the Raphael canvas node - the node x - the shape
 * horizontal coordinate settings - the user settings : <settings>
 *
 * Returns: a shape
 *
 */
DagDrawer.prototype.buildNode = function(paper, node, x, settings) {
	var ns = settings.nodes;
	if (node.highlighted) {
		ns = settings.nodes_highlighted;
	}

    var w = ns.width;
    var h = ns.height;
    var r = ns.r;
    var color = ns.color || Raphael.getColor();

    // the node object : a set
    var s = paper.set();

    // ? is it a dummy node ???
    if (node.dummy) {

        s.push(paper.circle(x, h / 2, 2).attr('fill', 'black'));

    } else {

        var label = paper.text(x, h / 2, node.label);
        var labelSettings = ns.label;
        label.attr({
                    stroke : labelSettings.color || color
                });
        label.attr(labelSettings.attrs);

        var bb = label.getBBox();
        // check is we need to resize the rectangle
        var label_width = bb.width + 2 * ns.label.margin_width;
        var rw = Math.max(label_width, w);
        label.translate(rw / 2, 0); // center the label

        // build a rectangle around the label
        var rect = paper.rect(x, 0, rw, h, r);
        rect.attr( ns.rect );

 /*       rect.click(function() {
                    Notifications.notify("DAG",
                            "click on rectangle for node {0}", node.label)
                });*/

        if (node.link) {
            rect.node.style.cursor = 'pointer';
            label.node.style.cursor = 'pointer';
            var click_callback = function() {
                document.location.href = node.link;
            };
            rect.click(click_callback);
            label.click(click_callback);
        }

        if (ns.onMouseOver)
            rect.mouseover(function() {
                        ns.onMouseOver(rect, label)
                    });
        if (ns.onMouseOut)
            rect.mouseout(function() {
                        ns.onMouseOut(rect, label)
                    });

        rect.toBack();
        //rect.node.style.cursor = "move";

        s.push(rect);
        s.push(label);

    }

    return s;
}



Raphael.fn.connection = function(obj1, obj2, line, bg) {
    if (obj1.line && obj1.from && obj1.to) {
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }
    var bb1 = obj1.getBBox();
    var bb2 = obj2.getBBox();
    var p = [{
                x : bb1.x + bb1.width / 2,
                y : bb1.y - 1
            }, {
                x : bb1.x + bb1.width / 2,
                y : bb1.y + bb1.height + 1
            }, {
                x : bb1.x - 1,
                y : bb1.y + bb1.height / 2
            }, {
                x : bb1.x + bb1.width + 1,
                y : bb1.y + bb1.height / 2
            }, {
                x : bb2.x + bb2.width / 2,
                y : bb2.y - 1
            }, {
                x : bb2.x + bb2.width / 2,
                y : bb2.y + bb2.height + 1
            }, {
                x : bb2.x - 1,
                y : bb2.y + bb2.height / 2
            }, {
                x : bb2.x + bb2.width + 1,
                y : bb2.y + bb2.height / 2
            }];
    var d = {}, dis = [];
    for (var i = 0; i < 4; i++) {
        for (var j = 4; j < 8; j++) {
            var dx = Math.abs(p[i].x - p[j].x), dy = Math.abs(p[i].y - p[j].y);
            if ((i == j - 4)
                    || (((i != 3 && j != 6) || p[i].x < p[j].x)
                            && ((i != 2 && j != 7) || p[i].x > p[j].x)
                            && ((i != 0 && j != 5) || p[i].y > p[j].y) && ((i != 1 && j != 4) || p[i].y < p[j].y))) {
                dis.push(dx + dy);
                d[dis[dis.length - 1]] = [i, j];
            }
        }
    }
    if (dis.length == 0) {
        var res = [0, 4];
    } else {
        var res = d[Math.min.apply(Math, dis)];
    }
    var x1 = p[res[0]].x, y1 = p[res[0]].y, x4 = p[res[1]].x, y4 = p[res[1]].y, dx = Math
            .max(Math.abs(x1 - x4) / 2, 10), dy = Math.max(Math.abs(y1 - y4)
                    / 2, 10), x2 = [x1, x1, x1 - dx, x1 + dx][res[0]]
            .toFixed(3), y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3), x3 = [
            0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3), y3 = [0,
            0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);
    var path = ["M", x1.toFixed(3), y1.toFixed(3), "C", x2, y2, x3, y3,
            x4.toFixed(3), y4.toFixed(3)].join(",");
    // alert("path="+path);
    if (line && line.line) {
        line.bg && line.bg.attr({
                    path : path
                });
        line.line.attr({
                    path : path
                });
    } else {
        var color = typeof line == "string" ? line : "#000";
        return {
            bg : bg && bg.split && this.path({
                        stroke : bg.split("|")[0],
                        fill : "none",
                        "stroke-width" : bg.split("|")[1] || 3
                    }, path),
            line : this.path({
                        stroke : color,
                        fill : "none"
                    }, path),
            from : obj1,
            to : obj2
        };
    }
};

/*
 * Method: drawDownwardsArrowHead
 *
 * draw and build the shape of an arrow head, pointing downwards. The extreme
 * point where the arrow is pointing is (0,0)
 *
 * Parameters: paper - Raphael canvas height - the height of the arrow color -
 * the color of the arrow
 *
 * Returns: the arrow head shape
 *
 */

DagDrawer.prototype.drawDownwardsArrowHead = function(paper, height, color) {
    var x = height / 2;
    var h = -height - 1;
	var arrow = paper.path("M{0},{1}L{2},{3}L{4},{5}C{6},{7},{8},{9}Z",-x,h,0,-1,x,h,0, h+2, -x, h);
	arrow.attr({
            stroke : color,
            fill : color
        });

//    var arrow = paper.path({
//                stroke : color,
//                fill : color
//            });
//    var x = height / 2;
//    var h = -height - 1;
//    arrow.moveTo(-x, h).lineTo(0, -1).lineTo(x, h).curveTo(0, h + 2, -x, h)
//            .andClose();

    return arrow;

}

/*
 * Method: drawEdge
 *
 * draw an edge between two objects/shapes borrowed from raphaeljs example
 * <http://raphaeljs.com/graffle.js>
 *
 * Parameters: paper - Raphael canvas obj1 - source shape obj2 - destination
 * shape line - the edhe color
 *
 *
 * Returns: the edge shape
 *
 */

DagDrawer.prototype.drawEdge = function(paper, obj1, obj2, line, bg) {
    if (obj1.line && obj1.from && obj1.to) {
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }

    var arrowHeight = this.settings.edges.arrow_height;

    var bb1 = obj1.getBBox();
    var bb2 = obj2.getBBox();

    // origin
    var xo = bb1.x + bb1.width / 2;
    var yo = bb1.y + bb1.height + 1;

    // destination
    var xd = bb2.x + bb2.width / 2;
    var yd = bb2.y - 1;

    /*
	 * // use the middle as control point var dx = Math.abs(xo - xd); var dy =
	 * Math.abs(yo - yd);
	 */
    var xmid = (xo + xd) / 2;
    var ymid = (yo + yd) / 2;
    var color = typeof line == "string" ? line : "#000";
    var path = ["M", xo.toFixed(3), yo.toFixed(3), "C", xo.toFixed(3),
            ymid.toFixed(3), xd.toFixed(3), ymid.toFixed(3), xd.toFixed(3),
            (yd - arrowHeight).toFixed(3)].join(",");

    var arrow = this.drawDownwardsArrowHead(paper, arrowHeight, color);
    arrow.translate(xd, yd);

/*
 * if (line && line.line) { line.bg && line.bg.attr({ path : path });
 * line.line.attr({ path : path }); } else {
 */
    var set = paper.set();
//    var line = paper.path({
//                stroke : color,
//                fill : "none"
//            }, path);
    var line = paper.path(path);
    line.attr({stroke : color, fill : "none"});
    set.push(line);
    set.push(arrow);

    return {
        bg : bg && bg.split && paper.path({
                    stroke : bg.split("|")[0],
                    fill : "none",
                    "stroke-width" : bg.split("|")[1] || 3
                }, path),
        line : line,
        shape : set,
        arrow : arrow,
        from : obj1,
        to : obj2
    };
}
