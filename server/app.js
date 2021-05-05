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
let eventInterval;

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
            case "spawn":
                handleNodeCreation(ev);
                break;
            case "receive":
                handleEdgeCreation(ev);
                break;
            case "destroy":
                handleNodeDeletion(ev);
                break;
            case "update": {
                handleStateUpdate(ev.state);
                break;
            }
        }
    }

    function getEventPosition(time, eventsQueue) {
        let index = 0;
        for (let i = 0; i < eventsQueue.length; i += 1) {
            if (JSON.parse(eventsQueue[i])["time"] > time)
                break;
            index += 1;
        }
        return index;
    }

    function assessEvent(eventName, obj) {
        let o = JSON.parse(obj);
        let currentEventTime = o["time"];
        o["eventName"] = eventName;
        let newIndex = getEventPosition(currentEventTime, events);
        events = events.slice(0, newIndex).concat(JSON.stringify(o)).concat(events.slice(newIndex, events.length));
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
                newEdge.count = oldEdge["count"]+1;
                newEdge.weight = oldEdge["weight"]+0.1;
                visualizerClient.emit("deleteEdge", oldEdge["id"]);
            }
            visualizerClient.emit("constructEdge", newEdge);
        }
    }

    function handleStateUpdate(state) {
        let node = update(state);
        if (visualizerClient) visualizerClient.emit("setState", node);
    }

    function handleNodeDeletion(o) {
        let nodeId = deleteNode(o.name);
        console.log(`killed ${o.name}`);
        if (visualizerClient) visualizerClient.emit("deleteNode", nodeId);
    }

    function setEventInterval(time) {
        console.log(`setting interval of ${time} ms`);
        eventInterval = setInterval(() => {
            if (events.length > 0) {
                console.log("handling event now");
                handleEvent(JSON.parse(events.shift()));
            }
        }, time);
    }

    socket
        .on("setSocketId", (id) => {
            if (id === "actorHandler") {
                console.log("actor handler is up");
                actorHandlerClient = socket;
                // resetNodeIndex();
                // resetEdgeIndex();
                setEventInterval(1000);
            }
            else {
                console.log("visualizer is up");
                visualizerClient = socket;
            }
        })
        .on("spawn", (obj) => {
            assessEvent("spawn", obj);
        })
        .on("receive", (obj) => {
            assessEvent("receive", obj);
        })
        .on("destroyNode", (obj) => {
            assessEvent("destroy", obj);
        })
        .on("setState", (obj) => {
            assessEvent("update", obj);
        })
        .on("pause", () => {
            clearInterval(eventInterval);
        })
        .on("resume", (n, t) => {
            setEventInterval(1000*t / n)
        })
        .on("disconnect", () => {
            console.log("client disconnected");
            socket.disconnect();
        });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
