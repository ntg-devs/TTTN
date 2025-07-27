import express from "express";
import bodyParser from "body-parser";
import viewEngine from "./config/viewEngine";
import initwebRoutes from "./route/web";
import connectDB from "./config/connectDB";
import http from "http";
import { sendMessage } from "./services/messageService";
import schedulerService from "./services/schedulerService";
require("dotenv").config();
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
let app = express();

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Request methods you wish to allow
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );

    // Request headers you wish to allow
    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-Requested-With,content-type,Authorization"
    );

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader("Access-Control-Allow-Credentials", true);

    // Pass to next layer of middleware
    next();
});

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

viewEngine(app);
initwebRoutes(app);
connectDB(app);

const server = http.createServer(app);

const socketIo = require("socket.io")(server, {
    cors: {
        origin: "*",
    },
});

// Import real-time stats service
const realtimeStatsService = require("./services/realtimeStatsService");

socketIo.on("connection", (socket) => {
    console.log("New client connected" + socket.id);

    // Handle existing message functionality
    socket.on("sendDataClient", function (data) {
        sendMessage(data);
        socketIo.emit("sendDataServer", { data });
    });
    socket.on("loadRoomClient", function (data) {
        socketIo.emit("loadRoomServer", { data });
    });
    
    // Handle real-time stats WebSocket connections
    realtimeStatsService.handleWebSocketConnection(socket, socketIo);
    
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

// Start real-time stats refresh
realtimeStatsService.startStatsRefresh(socketIo);

// Make socketIo available globally for triggering updates
global.socketIo = socketIo;
let port = process.env.PORT || 6969;

server.listen(port, () => {
    console.log("Backend Nodejs is running on the port : " + port);
    
    // Initialize scheduled tasks for KOL tier management
    try {
        schedulerService.initializeScheduledTasks();
        console.log("Scheduled tasks initialized successfully");
    } catch (error) {
        console.error("Error initializing scheduled tasks:", error);
    }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    schedulerService.stopScheduledTasks();
    server.close(() => {
        console.log('Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    schedulerService.stopScheduledTasks();
    server.close(() => {
        console.log('Process terminated');
    });
});
