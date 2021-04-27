const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const port = 3001;
const index = require("./routes/index");

/* Import required modules here */
const {createNode, deleteNode, getNodeId, update} = require("./models/NodeOperations");
const {createEdge, removeEdge} = require("./models/EdgeOperations");

const app = express();

let actorHandlerClient, visualizerClient;

app.use(express.json());
app.use(index);

const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*"
    }
});

io.on("connection", (socket) => {

    console.log("client connected");

    socket
        .on("setSocketId", (id) => {
            if (id === "actorHandler") {
                console.log("actor handler is up");
                actorHandlerClient = socket;
            }
            else {
                console.log("visualizer is up");
                visualizerClient = socket;
            }
        })
        .on("constructNode", (name) => {
            let newNode = createNode(name);
            if (visualizerClient) visualizerClient.emit("constructNode", newNode.id, name)
        })
        .on("constructEdge", (...args) => {
            // args[0] - message name ; args[1] - sending actor ref ; args[2] - receiving actor ref
            let label = args[0], from = getNodeId(args[1]), to = getNodeId(args[2]);
            console.log(`edge \"${label}\" constructed from ${args[1]} to ${args[2]}\n`);

            let edgeId = removeEdge(from, to);
            let newEdge = createEdge(from, to, label);

            if (edgeId !== -1) visualizerClient.emit("deleteEdge", edgeId);

            if (visualizerClient) visualizerClient.emit("constructEdge", newEdge.id, label, from, to);
        })
        .on("destroyNode", (name) => {
            let nodeId = deleteNode(name);
            if (visualizerClient) visualizerClient.emit("deleteNode", nodeId);
        })
/*
        .on("setState", (state) => {
            let nodeId = update(state);
            if (visualizerClient) visualizerClient.emit("setState", state);
        })
*/
        .on("disconnect", () => {
            console.log("client disconnected");
            socket.disconnect();
        });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
