const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const port = 3001;
const index = require("./routes/index");

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

    socket.on("setSocketId", (id) => {
        if (id === "actorHandler") {
            console.log("actor handler is up");
            actorHandlerClient = socket;
        }
        else {
            console.log("visualizer is up");
            visualizerClient = socket;
        }
    }).on("constructNode", (name) => {
        console.log("node is being constructed");
        if (visualizerClient) visualizerClient.emit("constructNode", name)
    }).on("constructEdge", (...args) => {
        console.log(`edge is being constructed from ${args[1]} to ${args[2]}`);
        if (visualizerClient) visualizerClient.emit("constructEdge", args[0], args[1], args[2]);
    }).on("destroyNode", (name) => {
        console.log(`node ${name} is being destroyed`);
        if (visualizerClient) visualizerClient.emit("destroyNode", name);
    }).on("setState", (state) => {
        if (visualizerClient) visualizerClient.emit("setState", state);
    }).on("disconnect", () => {
        console.log("client disconnected");
        socket.disconnect();
    });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
