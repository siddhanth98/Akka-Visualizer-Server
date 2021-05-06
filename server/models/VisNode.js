/**
 * Node object
 * @param id Unique ID of the node
 * @param label Path name of corresponding actor
 * @param state State object of the actor
 */
function Node(id, label, state) {
    this.id = id;
    this.label = label;
    this.state = state;
}

module.exports = Node;