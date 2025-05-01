import fs, { existsSync, mkdirSync, rmSync } from "fs";
import path, { join } from "path";
import { Page } from "playwright";

function sanitizeHost(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/[^\w.-]+/g, "")
    .replace(/\/$/, "")
    .slice(0, 80);
}

function recreateFolder(
  folderPath: string,
  opts?: { onLog?: (msg: string) => void }
) {
  if (existsSync(folderPath)) {
    rmSync(folderPath, { recursive: true, force: true });
    opts?.onLog?.(`Удалена папка: ${folderPath}`);
  }
  mkdirSync(folderPath, { recursive: true });
  opts?.onLog?.(`Создана папка: ${folderPath}`);
}

export default function createOrUpdateDir(
  url: string,
  opts?: { onLog?: (msg: string) => void }
) {
  const OUTPUT_ROOT = "./output";
  mkdirSync(OUTPUT_ROOT, { recursive: true });
  opts?.onLog?.(`Создана/проверена папка: ${OUTPUT_ROOT}`);

  const hostFolder = sanitizeHost(url);
  const targetDir = join(OUTPUT_ROOT, hostFolder);
  mkdirSync(targetDir, { recursive: true });
  opts?.onLog?.(`Создана/проверена папка: ${targetDir}`);

  const cssFolder = join(targetDir, "css");
  const jsFolder = join(targetDir, "js");

  recreateFolder(cssFolder, opts);
  recreateFolder(jsFolder, opts);

  return { cssFolder, jsFolder, targetDir, hostFolder };
}

export function saveFile(
  filePath: string,
  content: string,
  opts?: { onLog?: (msg: string) => void }
) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
  opts?.onLog?.(`Файл сохранён: ${filePath}`);
}

export async function waitForNetworkIdle(
  page: Page,
  idleTime = 1_000,
  checkInterval = 100,
  maxTimeout = 20_000,
  allowanceInterval = 20_000,
  hardTimeout = 120_000,
  opts?: {
    onLog?: (msg: string) => void;
    onError?: (err: Error) => void;
  }
): Promise<void> {
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
      if (inflight > 0) inflight--;
      if (inflight === 0) lastActivity = Date.now();
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

export async function autoScrollAndMouseMove(
  page: Page,
  opts?: {
    onLog?: (msg: string) => void;
  }
): Promise<void> {
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
  await new Promise((res) => setTimeout(res, 10_000));
  opts?.onLog?.("Прокрутка завершена. Возврат в начало страницы.");
}
