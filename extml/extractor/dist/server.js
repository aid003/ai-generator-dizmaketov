"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const core_1 = require("./core");
const startServer = (port = 5500) => {
    const app = (0, express_1.default)();
    const server = http_1.default.createServer(app);
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
        },
    });
    const OUTPUT_DIR = path_1.default.resolve(__dirname, "../output");
    app.use(express_1.default.json());
    app.use((req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        next();
    });
    // Раздача статических сайтов
    fs_1.default.readdirSync(OUTPUT_DIR, { withFileTypes: true }).forEach((entry) => {
        if (entry.isDirectory()) {
            const siteName = entry.name;
            const fullPath = path_1.default.join(OUTPUT_DIR, siteName);
            app.use(`/${siteName}`, express_1.default.static(fullPath));
            app.get(`/${siteName}`, (_, res) => {
                res.sendFile(path_1.default.join(fullPath, "index.html"));
            });
        }
    });
    // Socket.IO логика
    io.of("/scraper").on("connection", (socket) => {
        console.log("🔌 Новый клиент подключился");
        socket.on("startExtract", async (options) => {
            const { url, depth, idleTime, checkInterval, maxTimeout, allowanceInterval, hardTimeout, } = options;
            if (!url ||
                depth === undefined ||
                idleTime === undefined ||
                checkInterval === undefined ||
                maxTimeout === undefined ||
                allowanceInterval === undefined ||
                hardTimeout === undefined) {
                socket.emit("error", "Не переданы все параметры");
                return;
            }
            try {
                socket.emit("extractStarted", { url, depth });
                (0, core_1.extractFromUrl)(url, depth, {
                    onLog: (msg) => {
                        socket.emit("log", msg);
                    },
                    onFinish: (hostFolder) => {
                        socket.emit("done", hostFolder);
                    },
                    onError: (err) => {
                        socket.emit("error", err.message);
                    },
                    idleTime,
                    checkInterval,
                    maxTimeout,
                    allowanceInterval,
                    hardTimeout,
                });
            }
            catch (err) {
                socket.emit("error", err.message);
            }
        });
        socket.on("availableSites", () => {
            try {
                const sites = fs_1.default
                    .readdirSync(OUTPUT_DIR, { withFileTypes: true })
                    .filter((entry) => entry.isDirectory())
                    .map((entry) => entry.name);
                socket.emit("availableSites", sites);
            }
            catch (err) {
                socket.emit("error", err.message);
            }
        });
    });
    server.listen(port, () => {
        console.log(`🚀 Сервер запущен на http://localhost:${port}`);
        console.log("📂 Доступные сайты:");
        fs_1.default.readdirSync(OUTPUT_DIR, { withFileTypes: true }).forEach((entry) => {
            if (entry.isDirectory()) {
                console.log(`→ http://localhost:${port}/${entry.name}`);
            }
        });
    });
};
exports.startServer = startServer;
