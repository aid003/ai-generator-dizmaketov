import { chromium, Page } from "playwright";
import fs from "fs";
import path from "path";
import createOrUpdateDir, {
  autoScrollAndMouseMove,
  saveFile,
  waitForNetworkIdle,
} from "./utils";

function extractImageFileName(urlStr: string): string {
  if (urlStr.includes("/_next/image")) {
    const parsedUrl = new URL(urlStr, "http://localhost");
    const original = parsedUrl.searchParams.get("url");
    if (original) {
      return path.basename(decodeURIComponent(original));
    }
  }
  return path.basename(urlStr.split("?")[0]);
}

async function processAndSaveCss(
  cssUrl: string,
  cssContent: string,
  cssFolder: string,
  targetDir: string,
  opts?: {
    onLog?: (msg: string) => void;
    onError?: (err: Error) => void;
  }
): Promise<void> {
  let modifiedCss = cssContent;
  const regex = /url\((?!['"]?data:)(['"]?)(.*?)\1\)/gi;
  let match: RegExpExecArray | null;
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
      const imagesFolder = path.join(targetDir, "images");
      fs.mkdirSync(imagesFolder, { recursive: true });
      const imagePath = path.join(imagesFolder, fileName);
      fs.writeFileSync(imagePath, buffer);
      const msg = `Сохранено изображение из CSS: ${fileName}`;
      console.log(msg);
      opts?.onLog?.(msg);
      const localPath = `images/${fileName}`;
      modifiedCss = modifiedCss.replace(match[0], `url("${localPath}")`);
    } catch (err: any) {
      const msg = `Ошибка обработки URL ${originalUrl}: ${err.message}`;
      console.error(msg);
      opts?.onError?.(err);
    }
  }

  const fileNameCss = path.basename(cssUrl.split("?")[0]);
  const filePathCss = path.join(cssFolder, fileNameCss);
  saveFile(filePathCss, modifiedCss, opts);
}

export async function extractFromUrl(
  url: string,
  mode: 0 | 1 | 2 = 0,
  opts?: {
    onLog?: (msg: string) => void;
    onFinish?: (hostFolder: string) => void;
    onError?: (err: Error) => void;
    idleTime?: number;
    checkInterval?: number;
    maxTimeout?: number;
    allowanceInterval?: number;
    hardTimeout?: number;
  }
) {
  const { cssFolder, jsFolder, targetDir, hostFolder } = createOrUpdateDir(
    url,
    opts
  );
  console.log("CSS folder path:", cssFolder);
  console.log("JS folder path:", jsFolder);
  console.log("TargetDir folder path:", targetDir);
  opts?.onLog?.(`CSS folder path: ${cssFolder}`);
  opts?.onLog?.(`JS folder path: ${jsFolder}`);
  opts?.onLog?.(`TargetDir folder path: ${targetDir}`);

  console.log(`🚀 Запуск браузера для: ${url}`);
  opts?.onLog?.(`🚀 Запуск браузера для: ${url}`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("response", async (response) => {
    try {
      const responseUrl = response.url();
      const headers = response.headers();
      const contentType = headers["content-type"] || "";

      if (contentType.includes("text/css") || responseUrl.endsWith(".css")) {
        const cssContent = await response.text();
        await processAndSaveCss(
          responseUrl,
          cssContent,
          cssFolder,
          targetDir,
          opts
        );
        const msg = `Сохранён и обработан CSS: ${path.basename(
          responseUrl.split("?")[0]
        )}`;
        console.log(msg);
        opts?.onLog?.(msg);
      } else if (
        contentType.includes("javascript") ||
        responseUrl.endsWith(".js")
      ) {
        const jsContent = await response.text();
        const fileName = path.basename(responseUrl.split("?")[0]);
        const filePath = path.join(jsFolder, fileName);
        saveFile(filePath, jsContent, opts);
        const msg = `Сохранён JS: ${fileName}`;
        console.log(msg);
        opts?.onLog?.(msg);
      } else if (responseUrl.endsWith(".map")) {
        const mapContent = await response.text();
        const fileName = path.basename(responseUrl.split("?")[0]);
        const filePath = path.join(jsFolder, fileName);
        saveFile(filePath, mapContent, opts);
        const msg = `Сохранён source map: ${fileName}`;
        console.log(msg);
        opts?.onLog?.(msg);
      } else if (
        contentType.startsWith("image/") ||
        /\.(png|jpe?g|svg|webp)$/i.test(responseUrl)
      ) {
        const imageBuffer = await response.body();
        const fileName = extractImageFileName(responseUrl);
        const imagesFolder = path.join(targetDir, "images");
        fs.mkdirSync(imagesFolder, { recursive: true });
        const filePath = path.join(imagesFolder, fileName);
        fs.writeFileSync(filePath, imageBuffer);
        const msg = `Сохранено изображение: ${fileName}`;
        console.log(msg);
        opts?.onLog?.(msg);
      }
    } catch (error: any) {
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
    autoScrollAndMouseMove(page, opts),
    waitForNetworkIdle(
      page,
      opts?.idleTime ?? 1000,
      opts?.checkInterval ?? 100,
      opts?.maxTimeout ?? 20000,
      opts?.allowanceInterval ?? 20000,
      opts?.hardTimeout ?? 120000,
      opts
    ),
  ]);
  console.log("🧷 Сетевая активность и прокрутка завершены");
  opts?.onLog?.("🧷 Сетевая активность и прокрутка завершены");

  let finalHtml = await page.content();

  finalHtml = finalHtml.replace(
    /(<link[^>]*href=["'])([^"']+\.css)(\?[^"']*)?(["'][^>]*>)/gi,
    (_match, p1, p2, p3, p4) => {
      const base = path.basename(p2);
      return `${p1}css/${base}${p3 || ""}${p4}`;
    }
  );

  finalHtml = finalHtml.replace(
    /(<script[^>]*src=["'])([^"']+\.js)(\?[^"']*)?(["'][^>]*>)/gi,
    (_match, p1, p2, p3, p4) => {
      const base = path.basename(p2);
      return `${p1}js/${base}${p3 || ""}${p4}`;
    }
  );

  finalHtml = finalHtml.replace(
    /(<img[^>]*src=["'])([^"']+)(["'][^>]*>)/gi,
    (_match, p1, p2, p3) => {
      let fileName = "";
      if (p2.includes("/_next/image")) {
        fileName = extractImageFileName(p2);
      } else {
        fileName = path.basename(p2.split("?")[0]);
      }
      return `${p1}images/${fileName}${p3}`;
    }
  );

  finalHtml = finalHtml.replace(
    /(<img[^>]*srcset=["'])([^"']+)(["'][^>]*>)/gi,
    (_match, p1, p2, p3) => {
      const newSrcset = p2
        .split(",")
        .map((entry: string) => {
          const trimmed = entry.trim();
          const parts = trimmed.split(/\s+/);
          const urlPart = parts[0];
          const descriptor = parts.slice(1).join(" ");
          let fileName = "";
          if (urlPart.includes("/_next/image")) {
            fileName = extractImageFileName(urlPart);
          } else {
            fileName = path.basename(urlPart.split("?")[0]);
          }
          return `images/${fileName}${descriptor ? " " + descriptor : ""}`;
        })
        .join(", ");
      return `${p1}${newSrcset}${p3}`;
    }
  );

  if (mode >= 1) {
    finalHtml = finalHtml.replace(/\sdata-nimg="[^"]*"/gi, "");
  }
  if (mode === 2) {
    finalHtml = finalHtml.replace(
      /<script[^>]*src=["']js\/(?:_app|framework|main)[^"']*["'][^>]*>\s*<\/script>/gi,
      ""
    );
  }

  const htmlPath = path.join(targetDir, "index.html");
  saveFile(htmlPath, finalHtml, opts);
  const msg = "Сохранён HTML: index.html";
  console.log(msg);
  opts?.onLog?.(msg);

  page.removeAllListeners("response");
  await browser.close();
  opts?.onFinish?.(hostFolder);
}
