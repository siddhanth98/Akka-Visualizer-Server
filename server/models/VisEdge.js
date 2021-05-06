/**
 * Edge object
 * @param id Unique ID of the edge
 * @param from ID of the sender of the corresponding message
 * @param to ID of the receiver of the corresponding message
 * @param label Name of the corresponding message
 */
function Edge(id, from, to, label) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.label = label;
    this.count = 1;
    this.weight = 0.1;
}

module.exports = Edge;