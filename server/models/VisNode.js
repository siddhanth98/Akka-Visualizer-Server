function Node(id, label, neighbors, state) {
    this.id = id;
    this.label = label;
    this.neighbors = neighbors;
    this.state = state;
}

module.exports = Node;