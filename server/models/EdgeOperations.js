const Edge = require("./VisEdge");
const edges = {};
let id = 0;

/**
 * Remove an edge and get its ID
 * This ID matches that of the edge in the vis client
 * @param from Sender node of edge being removed
 * @param to Receiver node of edge being removed
 * @return ID of edge being removed
 */
function removeEdge(from, to) {
    let edgeId = -1;
    for (let k of Object.keys(edges)) {
        if (edges[k].from === from && edges[k].to === to) {
            edgeId = k;
            break;
        }
    }
    if (edgeId !== -1) {
        console.log(`found edge id to remove - ${edgeId}\n`);
        delete edges[edgeId];
    }
    else console.log(`couldn't find an edge between ${from} and ${to}\n`);
    return edgeId;
}

/**
 * Create a new edge with sender and receiver details
 * @param from Server reference of sender node
 * @param to Server reference of receiver node
 * @param label Name of message to be displayed on the edge
 * @return New edge reference
 */
function createEdge(from, to, label) {
    let newEdge = new Edge(id, from, to, label);
    edges[id] = newEdge;
    // console.log(`edge \"${label}\" constructed from nodeIDs ${from} to ${to}`);
    id += 1;
    return newEdge;
}

module.exports = {createEdge, removeEdge};