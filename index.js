function Node(id, label) {
    this.id = id;
    this.label = label;
    this.neighbors = [];
    this.state = {};
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
                label: c
            }
        };
        network.cluster(clusterOptions);
    })
}

function removeEdge(from, to) {
    let index = -1;
    for (let id of Object.keys(edgeData)) {
        if (edgeData[id].from === from && edgeData[id].to === to) {
            index = id;
            break;
        }
    }
    if (index > -1) {
        delete edgeData[index];
        edges.remove(index);
    }
}

function display(node) {
    let stateToDisplay = "";
    Object.keys(node.state).forEach(s => stateToDisplay += `${s} : ${node.state[s]}\n`);
    alert(stateToDisplay);
}

let socket = io("http://localhost:3001/");
console.log(socket);
socket.emit("setSocketId", "visualizerClient");

// create an array with nodes
let nodesArray = [];
let nodes = new vis.DataSet(nodesArray);

// create an array with edges
let edgesArray = [];

let edges = new vis.DataSet(edgesArray);

// create a network
let container = document.getElementById('mynetwork');

// provide the data in the vis format
let data = {
    nodes: nodes,
    edges: edges
};
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

let index = 1;
let edgeIndex = 0;
let nodeData = {};
let edgeData = {};

// initialize the network!
let network = new vis.Network(container, data, options);

network.on("selectNode", function (params) {
    if (network.isCluster(params.nodes[0]) === true) network.openCluster(params.nodes[0]);
    else {
        let clickedNodeId = params.nodes[0];
        let clickedNode = nodeData[clickedNodeId];
        display(clickedNode);
    }
});

network.on("selectEdge", function (params) {
    console.log(params);
});

document.getElementById("cluster").addEventListener("click", function() {
    clusterByColor();
});

document.getElementById("stop").onclick = function() {
    socket.emit("stop");
}

socket.on("constructNode", (name) => {
    console.log(`got request for constructing node ${name}`);
    let newNodeId = name;
    let newNodeColor = newNodeId % 2 === 0 ? "red" : "brown";
    let newNodeFontColor = "white";
    nodes.add({
        id: newNodeId,
        label: newNodeId,
        color: newNodeColor,
        font: {color: newNodeFontColor}
    });
    index += 1;
    nodeData[newNodeId] = new Node(newNodeId, newNodeId);

}).on("constructEdge", (...args) => {
    let edgeLabel = args[0], from = args[1], to = args[2];
    console.log(`got request for constructing edge \"${edgeLabel}\" from ${from} to ${to}`);

    removeEdge(from, to);
    edges.add({
        id: edgeIndex,
        from: from,
        to: to,
        label: "".concat(edgeLabel),
        arrows: "to",
        length: 200
    });
    edgeData[edgeIndex] = {from: from, to: to};
    edgeIndex += 1;
}).on("destroyNode", (name) => {
    nodes.remove({id: name});
}).on("setState", (state) => {
    let nodeId = state.name;
    let node = nodeData[nodeId];
    Object.keys(state).forEach(s => node.state[s] = state[s]);
}).on("disconnect", () => socket.disconnect());
