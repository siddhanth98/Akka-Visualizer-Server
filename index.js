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
                label: c
            }
        };
        network.cluster(clusterOptions);
    })
}

function display(node) {
    let stateToDisplay = "";
    Object.keys(node.state).forEach(s => stateToDisplay += `${s} : ${node.state[s]}\n`);
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
            }
        }
    };

    // initialize the network!
    let network = new vis.Network(container, data, options);
    network.on("selectEdge", function (params) {
        console.log(params);
    });

    /*
    network.on("selectNode", function (params) {
        if (network.isCluster(params.nodes[0]) === true) network.openCluster(params.nodes[0]);
        else {
            let clickedNodeId = params.nodes[0];
            let clickedNode = nodeData[clickedNodeId];
            display(clickedNode);
        }
    });
    */
    return network;
}

let socket = io("http://localhost:3001/");
socket.emit("setSocketId", "visualizerClient");

// initialize nodes dataset
let nodesArray = [];
let nodes = new vis.DataSet();

// initialize edges dataset
let edgesArray = [];
let edges = new vis.DataSet();

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

document.getElementById("cluster").addEventListener("click", function() {
    clusterByColor();
});

document.getElementById("stop").onclick = function() {
    socket.emit("stop");
}

socket.on("constructNode", (id, name) => { /* create a new node in the graph */
        console.log(`constructing node labelled ${name}`);
        let newNodeColor = id % 2 === 0 ? "red" : "brown";
        let newNodeFontColor = "white";
        nodes.add({
            id: id,
            label: name,
            color: newNodeColor,
            font: {color: newNodeFontColor}
        });
    })
    .on("constructEdge", (...args) => { /* create a new edge in the graph */
        // args[0] - id ; args[1] - message name ; args[2] - sending actor ref ; args[3] - receiving actor ref
        let id = args[0], label = args[1], from = args[2], to = args[3];
        console.log(`constructing edge \"${label}\" from ${from} to ${to}`);

        edges.add({
            id: id,
            from: from,
            to: to,
            label: label,
            arrows: "to",
            length: 200
        });
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
/* (try using indexedDB to store actor state information
    .on("setState", (state) => {
        let nodeId = state.name;
        let node = nodeData[nodeId];
        Object.keys(state).forEach(s => node.state[s] = state[s]); // state of a node gets updated here
    })
*/
    .on("disconnect", () => socket.disconnect());
