function Edge(id, from, to, label) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.label = label;
    this.weight = 1;
}

module.exports = Edge;