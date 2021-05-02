const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const port = 3001;
const index = require("./routes/index");

/* Import required modules here */
const {createNode, deleteNode, getNodeId, update, resetNodeIndex} = require("./models/NodeOperations");


const {createEdge, removeEdge, resetEdgeIndex} = require("./models/EdgeOperations");

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

    function handleNodeCreation(obj) {
        console.log(obj);
        let o = JSON.parse(obj);
        let newNode = createNode(o.name);
        if (visualizerClient) visualizerClient.emit("constructNode", newNode.id, o.name);
    }

    function handleEdgeCreation(obj) {
        console.log(obj);
        let o = JSON.parse(obj);
        let label = o.label, from = getNodeId(o.from), to = getNodeId(o.to);
        console.log(`edge \"${label}\" constructed from ${o.from}(id=${from}) to ${o.to}(id=${to})\n`);

        let edgeId = removeEdge(from, to);
        let newEdge = createEdge(from, to, label);

        if (edgeId !== -1 && visualizerClient) {
            visualizerClient.emit("deleteEdge", edgeId);
            return;
        }
        if (visualizerClient)
            visualizerClient.emit("constructEdge", newEdge.id, label, from, to);
    }

    function handleNodeDeletion(obj) {
        let o = JSON.parse(obj);
        let nodeId = deleteNode(o.name);
        console.log(`killed ${o.name}`);
        if (visualizerClient) visualizerClient.emit("deleteNode", nodeId);
    }

    socket
        .on("setSocketId", (id) => {
            if (id === "actorHandler") {
                console.log("actor handler is up");
                actorHandlerClient = socket;
                // resetNodeIndex();
                // resetEdgeIndex();
            }
            else {
                console.log("visualizer is up");
                visualizerClient = socket;
            }
        })
        .on("constructNode", (obj) => {
            handleNodeCreation(obj);
        })
        .on("constructEdge", (obj) => {
            handleEdgeCreation(obj);
        })
        .on("destroyNode", (obj) => {
            handleNodeDeletion(obj);
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
