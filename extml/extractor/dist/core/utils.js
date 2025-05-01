"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createOrUpdateDir;
exports.saveFile = saveFile;
exports.waitForNetworkIdle = waitForNetworkIdle;
exports.autoScrollAndMouseMove = autoScrollAndMouseMove;
const fs_1 = __importStar(require("fs"));
const path_1 = __importStar(require("path"));
function sanitizeHost(url) {
    return url
        .replace(/^https?:\/\//, "")
        .replace(/[^\w.-]+/g, "")
        .replace(/\/$/, "")
        .slice(0, 80);
}
function recreateFolder(folderPath, opts) {
    if ((0, fs_1.existsSync)(folderPath)) {
        (0, fs_1.rmSync)(folderPath, { recursive: true, force: true });
        opts?.onLog?.(`Удалена папка: ${folderPath}`);
    }
    (0, fs_1.mkdirSync)(folderPath, { recursive: true });
    opts?.onLog?.(`Создана папка: ${folderPath}`);
}
function createOrUpdateDir(url, opts) {
    const OUTPUT_ROOT = "./output";
    (0, fs_1.mkdirSync)(OUTPUT_ROOT, { recursive: true });
    opts?.onLog?.(`Создана/проверена папка: ${OUTPUT_ROOT}`);
    const hostFolder = sanitizeHost(url);
    const targetDir = (0, path_1.join)(OUTPUT_ROOT, hostFolder);
    (0, fs_1.mkdirSync)(targetDir, { recursive: true });
    opts?.onLog?.(`Создана/проверена папка: ${targetDir}`);
    const cssFolder = (0, path_1.join)(targetDir, "css");
    const jsFolder = (0, path_1.join)(targetDir, "js");
    recreateFolder(cssFolder, opts);
    recreateFolder(jsFolder, opts);
    return { cssFolder, jsFolder, targetDir, hostFolder };
}
function saveFile(filePath, content, opts) {
    fs_1.default.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
    fs_1.default.writeFileSync(filePath, content, "utf-8");
    opts?.onLog?.(`Файл сохранён: ${filePath}`);
}
async function waitForNetworkIdle(page, idleTime = 1000, checkInterval = 100, maxTimeout = 20000, allowanceInterval = 20000, hardTimeout = 120000, opts) {
    return new Promise((resolve) => {
        let inflight = 0;
        let lastActivity = Date.now();
        const startTime = Date.now();
        let allowedConnections = 0;
        function onRequest() {
            inflight++;
            lastActivity = Date.now();
            const msg = `Запрос начат. Текущих запросов: ${inflight}`;
            console.log(msg);
            opts?.onLog?.(msg);
        }
        function onRequestFinished() {
            if (inflight > 0)
                inflight--;
            if (inflight === 0)
                lastActivity = Date.now();
            const msg = `Запрос завершён. Текущих запросов: ${inflight}`;
            console.log(msg);
            opts?.onLog?.(msg);
        }
        page.on("request", onRequest);
        page.on("requestfinished", onRequestFinished);
        page.on("requestfailed", onRequestFinished);
        const allowanceTimer = setInterval(() => {
            const elapsedSinceStart = Date.now() - startTime;
            if (elapsedSinceStart >= maxTimeout) {
                allowedConnections++;
                const msg = `Увеличено разрешённых запросов до ${allowedConnections} после ${elapsedSinceStart} мс.`;
                console.log(msg);
                opts?.onLog?.(msg);
            }
        }, allowanceInterval);
        const interval = setInterval(() => {
            const elapsed = Date.now() - lastActivity;
            const msg = `Проверка: inflight=${inflight}, allowedConnections=${allowedConnections}, elapsed=${elapsed} мс.`;
            console.log(msg);
            opts?.onLog?.(msg);
            if (inflight <= allowedConnections && elapsed >= idleTime) {
                clearInterval(interval);
                clearInterval(allowanceTimer);
                clearTimeout(finalTimeout);
                page.removeListener("request", onRequest);
                page.removeListener("requestfinished", onRequestFinished);
                page.removeListener("requestfailed", onRequestFinished);
                const doneMsg = "Условие таймаута сети выполнено.";
                console.log(doneMsg);
                opts?.onLog?.(doneMsg);
                resolve();
            }
        }, checkInterval);
        const finalTimeout = setTimeout(() => {
            const warn = "Достигнут жёсткий таймаут, завершаем ожидание.";
            console.warn(warn);
            opts?.onLog?.(warn);
            clearInterval(interval);
            clearInterval(allowanceTimer);
            page.removeListener("request", onRequest);
            page.removeListener("requestfinished", onRequestFinished);
            page.removeListener("requestfailed", onRequestFinished);
            resolve();
        }, hardTimeout);
    });
}
async function autoScrollAndMouseMove(page, opts) {
    const viewport = page.viewportSize();
    const viewportHeight = viewport ? viewport.height : 800;
    const viewportWidth = viewport ? viewport.width : 1280;
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const scrollStep = 300;
    let currentScroll = 0;
    while (currentScroll < scrollHeight) {
        await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
        const amplitude = viewportWidth / 4;
        const centerX = viewportWidth / 2;
        const steps = 5;
        for (let i = 0; i < steps; i++) {
            const angle = (2 * Math.PI * i) / steps;
            const x = centerX + amplitude * Math.sin(angle);
            const y = currentScroll + viewportHeight / 2;
            await page.mouse.move(x, y);
            await new Promise((res) => setTimeout(res, 100));
        }
        const logMsg = `Прокрутка до ${currentScroll}px`;
        opts?.onLog?.(logMsg);
        await new Promise((res) => setTimeout(res, 100));
        currentScroll += scrollStep;
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((res) => setTimeout(res, 10000));
    opts?.onLog?.("Прокрутка завершена. Возврат в начало страницы.");
}
