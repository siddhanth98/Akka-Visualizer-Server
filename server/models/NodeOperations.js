const Node = require("./VisNode");
let nodes = {}, nodeNameToId = {};
let nodeId = 0;

/**
 * Reset node index
 */
function resetNodeIndex() {
    nodeId = 0;
    nodes = {};
    nodeNameToId = {};
}

/**
 * Updates the state of the node
 * The state object has the label of the node which is used to retrieve its ID
 * @param state Object having new values of a (sub)set of node attributes
 * @return ID of node being updated
 */
function update(state) {
    let nodeId = getNodeId(state.name); /* it is assumed that "name" refers to the (unique) fully qualified name of the actor */
    let node = nodes[nodeId];
    if (node) {
        Object.keys(state).forEach(k => {
            node.state[k] = state[k];
        });
    }
    console.log("just updated state of node:");
    console.log(node);
    return node;
}

/**
 * Gets the unique ID corresponding to the name(label) of a node
 * @param name Label of node
 * @return ID of node
 */
function getNodeId(name) {
    return nodeNameToId[name];
}

/**
 * Deletes a node with the specified name in the graph
 * @param name Label of the node in the graph
 * @return ID of node being removed
 */
function deleteNode(name) {
    let nodeId = nodeNameToId[name];
    delete nodes[nodeId];
    return nodeId;
}

/**
 * Creates a new node with a new ID and stores it
 * @param label Name of node
 * @param state State of a node having all properties of an actor entity
 * @return New node reference
 */
function createNode(label, state = {}) {
    let newNode = new Node(nodeId, label, state);
    nodes[nodeId] = newNode;
    nodeNameToId[label] = nodeId;
    console.log(`created node labelled ${label} having id ${nodeId}\n`);
    nodeId += 1;
    return newNode;
}

module.exports = {createNode, deleteNode, getNodeId, update, resetNodeIndex};