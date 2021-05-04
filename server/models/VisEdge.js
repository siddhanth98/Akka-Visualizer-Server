function Edge(id, from, to, label) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.label = label;
    this.count = 1;
    this.weight = 0.1;
}

module.exports = Edge;