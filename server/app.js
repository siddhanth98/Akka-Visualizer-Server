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

    function assessEvent(eventName, obj) {
        let o = JSON.parse(obj);
        let currentEventTime = o["time"];

        o["eventName"] = eventName;
        events.push(JSON.stringify(o));

        if (events.length > 0) {
            let ev = JSON.parse(events[0]);
            let latestEventTime = ev["time"];

            /*if (latestEventTime <= currentEventTime) {
                /!* Current event is in order *!/
                /!* Remove and handle stored event first and then store current event to be handled later *!/
                events.shift();
                handleEvent(ev);
            }*/
            if (latestEventTime > currentEventTime) events.push(events.shift());
        }
        /* Current event happened earlier than latest event stored */
        /* Forward current event to vis */
        /*o["eventName"] = eventName;
        events.push(JSON.stringify(o));*/
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
        eventInterval = setInterval(() => {
            if (events.length > 0) handleEvent(JSON.parse(events.shift()));
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
            setEventInterval(t / n)
        })
        .on("disconnect", () => {
            console.log("client disconnected");
            socket.disconnect();
        });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
