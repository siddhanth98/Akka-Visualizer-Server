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
let events = []; /* this will store socket events with millisecond-timestamps */

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

    function handleEvent(ev) {
        switch(ev["eventName"]) {
            case "constructNode":
                handleNodeCreation(ev);
                break;
            case "constructEdge":
                handleEdgeCreation(ev);
                break;
            case "deleteNode":
                handleNodeDeletion(ev);
                break;
        }
    }

    function assessEvent(eventName, obj) {
        let o = JSON.parse(obj);
        let currentEventTime = o["time"];

        if (events.length > 0) {
            let ev = JSON.parse(events[0]);
            let latestEventTime = ev["time"];

            if (latestEventTime <= currentEventTime) {
                /* Current event is in order */
                /* Remove and handle stored event first and then store current event to be handled later */
                events.shift();
                handleEvent(ev);
            }
        }
        /* Current event happened earlier than latest event stored */
        /* Forward current event to vis */
        o["eventName"] = eventName;
        events.push(JSON.stringify(o));
    }

    function handleNodeCreation(o) {
        console.log(o);
        let newNode = createNode(o.name);
        if (visualizerClient) visualizerClient.emit("constructNode", newNode);
    }

    function handleEdgeCreation(o) {
        console.log(o);
        let label = o.label, from = getNodeId(o.from), to = getNodeId(o.to);
        console.log(`edge \"${label}\" constructed from ${o.from}(id=${from}) to ${o.to}(id=${to})\n`);

        let oldEdge = removeEdge(from, to);
        let newEdge = createEdge(from, to, label);

        if (visualizerClient) {
            if (oldEdge) {
                newEdge.weight = oldEdge["weight"]+1;
                visualizerClient.emit("deleteEdge", oldEdge["id"]);
            }
            visualizerClient.emit("constructEdge", newEdge);
        }
    }

    function handleNodeDeletion(o) {
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
                setInterval(() => {
                    if (events.length > 0) handleEvent(JSON.parse(events.shift()));
                }, 10);
            }
            else {
                console.log("visualizer is up");
                visualizerClient = socket;
            }
        })
        .on("constructNode", (obj) => {
            assessEvent("constructNode", obj);
        })
        .on("constructEdge", (obj) => {
            assessEvent("constructEdge", obj);
        })
        .on("destroyNode", (obj) => {
            assessEvent("deleteNode", obj);
        })
        .on("setState", (state) => {
            let node = update(JSON.parse(state));
            if (visualizerClient) visualizerClient.emit("setState", node);
        })
        .on("disconnect", () => {
            console.log("client disconnected");
            socket.disconnect();
        });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
