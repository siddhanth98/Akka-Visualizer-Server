function clusterByNodeType() {
    let clusterOptions;
    let nodeTypes = ["control-node", "data-node"];
    let colors = {"control-node": "blue", "data-node": "red"};

    nodeTypes.forEach(t => {
        clusterOptions = {
            joinCondition: function(childOptions) {
                return childOptions &&
                    childOptions.state &&
                    childOptions.state.nodeType === t;
            },
            clusterNodeProperties: {
                id: "cluster-".concat(t),
                shape: "diamond",
                color: colors[t],
                label: t.concat("s"),
                font: {
                    color: "white"
                }
            }
        };
        try {
            network.cluster(clusterOptions);
        }
        catch(err) {
            console.error(err);
        }
    })
}

function clusterByColor() {
    let clusterOptions;
    let colors = ["red", "brown"];
    colors.forEach(c => {
        clusterOptions = {
            joinCondition: function (childOptions) {
                return childOptions.color.background === c;
            },
            clusterNodeProperties: {
                id: "cluster-".concat(c),
                shape: "database",
                color: c,
                label: c,
                font: {
                    color: "white"
                }
            }
        };
        network.cluster(clusterOptions);
    })
}

function clogEdges(edgeWeights, edgeCounts) {
    console.log(edges);
    edges.getIds().forEach(id => {
        console.log(`clogging edge ${id}`);
        edges.update({
            id: id,
            value: edgeWeights[id],
            font: {
                size: 10
            }
        });
    });
    console.log(edges);
}

function unclogEdges() {
    console.log(edges);
    edges.getIds().forEach(id => {
        let edge = edges.get(id);
        console.log(`unclogging edge ${edge.id}`);
        edges.remove(edge.id);
        edges.update({
            id: edge.id,
            from: edge.from,
            to: edge.to,
            label: edge.label,
            arrows: "to",
            length: edge.length,
            font: {
                size: 10
            }
        });
    });
    console.log(edges);
}

function display(node) {
    let stateToDisplay = "";
    Object.keys(node.state).forEach(s => stateToDisplay += `${s} : ${node.state[s]}\n`);
    if (stateToDisplay.length > 0)
        alert(stateToDisplay);
}

function startNetwork(data) {
    let container = document.getElementById("mynetwork");
    // options common to every node and edge in the graph
    let options = {
        physics: true,
        edges: {
            smooth: {
                type: "continuous",
            },
            font: {
                size: 10
            },
            color: "white"
        }
    };

    // initialize the network!
    let network = new vis.Network(container, data, options);
    network.on("selectEdge", function (params) {
        if (edgeCounts[params.edges[0]])
            alert(`${edgeCounts[params.edges[0]]} messages were sent along this way up till now`);
    });

    network.on("selectNode", function (params) {
        if (network.isCluster(params.nodes[0]) === true) network.openCluster(params.nodes[0]);
        else {
            let clickedNodeId = params.nodes[0];
            let clickedNode = nodes.get(clickedNodeId);
            display(clickedNode);
        }
    });
    return network;
}

function displayData(nodes, node) {
    if (nodes.get(node.id)) {
        const container = document.createElement("div");
        let html = JSON.stringify(nodes.get(node.id).state);
        container.innerHTML = html;
        return container;
    }
    return "";
}

let socket = io("http://localhost:3001/");
socket.emit("setSocketId", "visualizerClient");

// initialize nodes dataset
let nodesArray = [];
let nodes = new vis.DataSet({});

// initialize edges dataset
let edgeCounts = {};
let edgeWeights = {};
let edges = new vis.DataSet({});

// Set node/edge filter values here
let edgeFilterValues = {};

// Set node/edge filter functions here
let edgeFilterFunction = (edge) => {
    return edgeFilterValues[edge.id];
};

let edgesView = new vis.DataView(edges, {
    filter: edgeFilterFunction
});

let network = startNetwork({nodes: nodes, edges: edgesView});

document.getElementById("cluster-color").addEventListener("click", function() {
    clusterByColor();
});

document.getElementById("cluster-node-type").addEventListener("click", function() {
    clusterByNodeType();
});

document.getElementById("clog-edges").addEventListener("click", function() {
    clogEdges(edgeWeights, edgeCounts);
});

document.getElementById("unclog-edges").addEventListener("click", function() {
    unclogEdges();
});

document.getElementById("pause").onclick = function() {
    socket.emit("pause");
}

document.getElementById("resume").onclick = function() {
    let numEvents = document.getElementById("numEvents").value;
    let duration = document.getElementById("duration").value;
    if (numEvents && duration)
        socket.emit("resume", parseInt(numEvents), parseInt(duration));
}
socket
    .on("constructNode", (node) => { /* create a new node in the graph */
        console.log(`constructing node labelled ${node.label}`);
        let newNodeColor = node.id % 2 === 0 ? "red" : "brown";
        let newNodeFontColor = "white";
        nodes.add({
            color: newNodeColor,
            font: {color: newNodeFontColor},
            ...node
        });
    })
    .on("constructEdge", (edge) => { /* create a new edge in the graph */
        let id = edge.id, label = edge.label, from = edge.from, to = edge.to;
        console.log(`constructing edge \"${label}\" from ${from} to ${to}`);

        edges.update({
            id: id,
            from: from,
            to: to,
            label: label,
            arrows: "to",
            length: 400
        });
        edgeCounts[edge.id] = edge.count;
        edgeWeights[edge.id] = edge.weight;
        edgeFilterValues[id] = true;
        edgesView.refresh();
    })
    .on("deleteNode", (nodeId) => {
        console.log(`deleting nodeID ${nodeId}`);
        nodes.remove({id: nodeId});
    })
    .on("deleteEdge", (edgeId) => {
        console.log(`deleting edgeID ${edgeId}`);
        if (edgeFilterValues[edgeId]) {
            delete edgeFilterValues[edgeId];
            edgesView.refresh();
        }
    })
    .on("setState", (node) => {
        try {
            nodes.update({
                id: node.id,
                ...node
            });
        }
        catch(err) {
            console.error(err);
        }
    })
    .on("disconnect", () => socket.disconnect());
