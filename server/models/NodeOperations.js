const Node = require("./VisNode");
const nodes = {}, nodeNameToId = {};
let id = 0;

/**
 * Updates the state of the node
 * The state object has the label of the node which is used to retrieve its ID
 * @param state Object having new values of a (sub)set of node attributes
 * @return ID of node being updated
 */
function update(state) {
    let nodeId = getNodeId(state.name);
    let node = nodes[nodeId];
    Object.keys(state).forEach(k => node.state[k] = state[k]);
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
 * @param neighbors List of neighbors
 * @param state State of a node having all properties of an actor entity
 * @return New node reference
 */
function createNode(label, neighbors = [], state = {}) {
    let newNode = new Node(id, label, neighbors, state);
    nodes[id] = newNode;
    nodeNameToId[label] = id;
    id += 1;
    console.log(`created node labelled ${label}\n`);
    return newNode;
}

module.exports = {createNode, deleteNode, getNodeId, update};