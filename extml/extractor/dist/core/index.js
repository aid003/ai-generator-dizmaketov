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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFromUrl = extractFromUrl;
const playwright_1 = require("playwright");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = __importStar(require("./utils"));
function extractImageFileName(urlStr) {
    if (urlStr.includes("/_next/image")) {
        const parsedUrl = new URL(urlStr, "http://localhost");
        const original = parsedUrl.searchParams.get("url");
        if (original) {
            return path_1.default.basename(decodeURIComponent(original));
        }
    }
    return path_1.default.basename(urlStr.split("?")[0]);
}
async function processAndSaveCss(cssUrl, cssContent, cssFolder, targetDir, opts) {
    let modifiedCss = cssContent;
    const regex = /url\((?!['"]?data:)(['"]?)(.*?)\1\)/gi;
    let match;
    while ((match = regex.exec(cssContent)) !== null) {
        const originalUrl = match[2];
        try {
            const absoluteUrl = new URL(originalUrl, cssUrl).toString();
            const response = await fetch(absoluteUrl);
            if (!response.ok) {
                const msg = `Не удалось скачать изображение: ${absoluteUrl}`;
                console.error(msg);
                opts?.onLog?.(msg);
                continue;
            }
            const buffer = Buffer.from(await response.arrayBuffer());
            const fileName = extractImageFileName(absoluteUrl);
            const imagesFolder = path_1.default.join(targetDir, "images");
            fs_1.default.mkdirSync(imagesFolder, { recursive: true });
            const imagePath = path_1.default.join(imagesFolder, fileName);
            fs_1.default.writeFileSync(imagePath, buffer);
            const msg = `Сохранено изображение из CSS: ${fileName}`;
            console.log(msg);
            opts?.onLog?.(msg);
            const localPath = `images/${fileName}`;
            modifiedCss = modifiedCss.replace(match[0], `url("${localPath}")`);
        }
        catch (err) {
            const msg = `Ошибка обработки URL ${originalUrl}: ${err.message}`;
            console.error(msg);
            opts?.onError?.(err);
        }
    }
    const fileNameCss = path_1.default.basename(cssUrl.split("?")[0]);
    const filePathCss = path_1.default.join(cssFolder, fileNameCss);
    (0, utils_1.saveFile)(filePathCss, modifiedCss, opts);
}
async function extractFromUrl(url, mode = 0, opts) {
    const { cssFolder, jsFolder, targetDir, hostFolder } = (0, utils_1.default)(url, opts);
    console.log("CSS folder path:", cssFolder);
    console.log("JS folder path:", jsFolder);
    console.log("TargetDir folder path:", targetDir);
    opts?.onLog?.(`CSS folder path: ${cssFolder}`);
    opts?.onLog?.(`JS folder path: ${jsFolder}`);
    opts?.onLog?.(`TargetDir folder path: ${targetDir}`);
    console.log(`🚀 Запуск браузера для: ${url}`);
    opts?.onLog?.(`🚀 Запуск браузера для: ${url}`);
    const browser = await playwright_1.chromium.launch({ headless: false });
    const page = await browser.newPage();
    page.on("response", async (response) => {
        try {
            const responseUrl = response.url();
            const headers = response.headers();
            const contentType = headers["content-type"] || "";
            if (contentType.includes("text/css") || responseUrl.endsWith(".css")) {
                const cssContent = await response.text();
                await processAndSaveCss(responseUrl, cssContent, cssFolder, targetDir, opts);
                const msg = `Сохранён и обработан CSS: ${path_1.default.basename(responseUrl.split("?")[0])}`;
                console.log(msg);
                opts?.onLog?.(msg);
            }
            else if (contentType.includes("javascript") ||
                responseUrl.endsWith(".js")) {
                const jsContent = await response.text();
                const fileName = path_1.default.basename(responseUrl.split("?")[0]);
                const filePath = path_1.default.join(jsFolder, fileName);
                (0, utils_1.saveFile)(filePath, jsContent, opts);
                const msg = `Сохранён JS: ${fileName}`;
                console.log(msg);
                opts?.onLog?.(msg);
            }
            else if (responseUrl.endsWith(".map")) {
                const mapContent = await response.text();
                const fileName = path_1.default.basename(responseUrl.split("?")[0]);
                const filePath = path_1.default.join(jsFolder, fileName);
                (0, utils_1.saveFile)(filePath, mapContent, opts);
                const msg = `Сохранён source map: ${fileName}`;
                console.log(msg);
                opts?.onLog?.(msg);
            }
            else if (contentType.startsWith("image/") ||
                /\.(png|jpe?g|svg|webp)$/i.test(responseUrl)) {
                const imageBuffer = await response.body();
                const fileName = extractImageFileName(responseUrl);
                const imagesFolder = path_1.default.join(targetDir, "images");
                fs_1.default.mkdirSync(imagesFolder, { recursive: true });
                const filePath = path_1.default.join(imagesFolder, fileName);
                fs_1.default.writeFileSync(filePath, imageBuffer);
                const msg = `Сохранено изображение: ${fileName}`;
                console.log(msg);
                opts?.onLog?.(msg);
            }
        }
        catch (error) {
            const msg = `Ошибка при обработке response: ${error.message}`;
            console.error(msg);
            opts?.onError?.(error);
        }
    });
    console.log("🌍 Открытие страницы...");
    opts?.onLog?.("🌍 Открытие страницы...");
    await page.goto(url, { waitUntil: "load", timeout: 0 });
    console.log("🌍 Страница загружена");
    opts?.onLog?.("🌍 Страница загружена");
    console.log("🧷 Запуск автопрокрутки и движения мыши...");
    opts?.onLog?.("🧷 Запуск автопрокрутки и движения мыши...");
    await Promise.all([
        (0, utils_1.autoScrollAndMouseMove)(page, opts),
        (0, utils_1.waitForNetworkIdle)(page, opts?.idleTime ?? 1000, opts?.checkInterval ?? 100, opts?.maxTimeout ?? 20000, opts?.allowanceInterval ?? 20000, opts?.hardTimeout ?? 120000, opts),
    ]);
    console.log("🧷 Сетевая активность и прокрутка завершены");
    opts?.onLog?.("🧷 Сетевая активность и прокрутка завершены");
    let finalHtml = await page.content();
    finalHtml = finalHtml.replace(/(<link[^>]*href=["'])([^"']+\.css)(\?[^"']*)?(["'][^>]*>)/gi, (_match, p1, p2, p3, p4) => {
        const base = path_1.default.basename(p2);
        return `${p1}css/${base}${p3 || ""}${p4}`;
    });
    finalHtml = finalHtml.replace(/(<script[^>]*src=["'])([^"']+\.js)(\?[^"']*)?(["'][^>]*>)/gi, (_match, p1, p2, p3, p4) => {
        const base = path_1.default.basename(p2);
        return `${p1}js/${base}${p3 || ""}${p4}`;
    });
    finalHtml = finalHtml.replace(/(<img[^>]*src=["'])([^"']+)(["'][^>]*>)/gi, (_match, p1, p2, p3) => {
        let fileName = "";
        if (p2.includes("/_next/image")) {
            fileName = extractImageFileName(p2);
        }
        else {
            fileName = path_1.default.basename(p2.split("?")[0]);
        }
        return `${p1}images/${fileName}${p3}`;
    });
    finalHtml = finalHtml.replace(/(<img[^>]*srcset=["'])([^"']+)(["'][^>]*>)/gi, (_match, p1, p2, p3) => {
        const newSrcset = p2
            .split(",")
            .map((entry) => {
            const trimmed = entry.trim();
            const parts = trimmed.split(/\s+/);
            const urlPart = parts[0];
            const descriptor = parts.slice(1).join(" ");
            let fileName = "";
            if (urlPart.includes("/_next/image")) {
                fileName = extractImageFileName(urlPart);
            }
            else {
                fileName = path_1.default.basename(urlPart.split("?")[0]);
            }
            return `images/${fileName}${descriptor ? " " + descriptor : ""}`;
        })
            .join(", ");
        return `${p1}${newSrcset}${p3}`;
    });
    if (mode >= 1) {
        finalHtml = finalHtml.replace(/\sdata-nimg="[^"]*"/gi, "");
    }
    if (mode === 2) {
        finalHtml = finalHtml.replace(/<script[^>]*src=["']js\/(?:_app|framework|main)[^"']*["'][^>]*>\s*<\/script>/gi, "");
    }
    const htmlPath = path_1.default.join(targetDir, "index.html");
    (0, utils_1.saveFile)(htmlPath, finalHtml, opts);
    const msg = "Сохранён HTML: index.html";
    console.log(msg);
    opts?.onLog?.(msg);
    page.removeAllListeners("response");
    await browser.close();
    opts?.onFinish?.(hostFolder);
}
