"use client";

import scraperSocket from "@/shared/socket-scraper/socket";
import { ScraperServerToClientEvents } from "@/shared/socket-scraper/types/types";
import { useEffect, useRef, useState } from "react";
import styles from "./ScrapeSite.module.css";
import { useRouter } from "next/navigation";

const ScrapeSite = () => {
  const [url, setUrl] = useState("https://example.com");
  const [depth, setDepth] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  const router = useRouter();

  const [idleTime, setIdleTime] = useState(1000);
  const [checkInterval, setCheckInterval] = useState(100);
  const [maxTimeout, setMaxTimeout] = useState(15000);
  const [allowanceInterval, setAllowanceInterval] = useState(15000);
  const [hardTimeout, setHardTimeout] = useState(40000);

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const container = logsContainerRef.current;
    if (container && autoScroll) {
      container.scrollTop = container.scrollHeight;
    }
  }, [logs, autoScroll]);

  useEffect(() => {
    const container = logsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const threshold = 20;
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const isAtTopVisually = distanceFromBottom <= threshold;

      setAutoScroll(isAtTopVisually);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleLog: ScraperServerToClientEvents["log"] = (msg) => {
      setLogs((prev) => [...prev, msg]);
    };

    const handleDone: ScraperServerToClientEvents["done"] = (hostFolder) => {
      setStatus("done");
      setLogs((prev) => [...prev, `✅ Парсинг завершен: ${hostFolder}`]);
      router.push(`/chat?url=${hostFolder}`);
    };

    const handleError: ScraperServerToClientEvents["error"] = (msg) => {
      setStatus("error");
      setLogs((prev) => [...prev, `❌ Ошибка: ${msg}`]);
    };

    const handleStarted: ScraperServerToClientEvents["extractStarted"] = (
      data
    ) => {
      setLogs((prev) => [...prev, `🚀 Начат парсинг: ${data.url} ]`]);
    };

    scraperSocket.on("log", handleLog);
    scraperSocket.on("done", handleDone);
    scraperSocket.on("error", handleError);
    scraperSocket.on("extractStarted", handleStarted);

    return () => {
      scraperSocket.off("log", handleLog);
      scraperSocket.off("done", handleDone);
      scraperSocket.off("error", handleError);
      scraperSocket.off("extractStarted", handleStarted);
    };
  }, [router]);

  const handleStart = () => {
    setLogs([]);
    setStatus("loading");

    scraperSocket.emit("startExtract", {
      url,
      depth,
      idleTime,
      checkInterval,
      maxTimeout,
      allowanceInterval,
      hardTimeout,
    });
  };

  return (
    <div className={styles.scraperContainer}>
      <h2 className={styles.heading}>🔥 Scraper</h2>
      <div className={styles.contentContainer}>
        <div className={styles.settingsContainer}>
          <div className={styles.inputContainer}>
            <label className={styles.label}>Сайт (URL)</label>
            <input
              type="text"
              className={styles.input}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Введите URL"
              required
            />
          </div>

          <div className={styles.inputContainer}>
            <label className={styles.label}>Тип скрапинга (0 - 2)</label>
            <input
              type="number"
              className={styles.input}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              min={0}
            />
          </div>

          <div className={styles.inputContainer}>
            <label className={styles.label}>Ожидание тишины сети (мс)</label>
            <input
              type="number"
              className={styles.input}
              value={idleTime}
              onChange={(e) => setIdleTime(Number(e.target.value))}
              min={0}
            />
          </div>

          <div className={styles.inputContainer}>
            <label className={styles.label}>Интервал проверки (мс)</label>
            <input
              type="number"
              className={styles.input}
              value={checkInterval}
              onChange={(e) => setCheckInterval(Number(e.target.value))}
              min={0}
            />
          </div>

          <div className={styles.inputContainer}>
            <label className={styles.label}>Макс. таймаут (мс)</label>
            <input
              type="number"
              className={styles.input}
              value={maxTimeout}
              onChange={(e) => setMaxTimeout(Number(e.target.value))}
              min={0}
            />
          </div>

          <div className={styles.inputContainer}>
            <label className={styles.label}>Шаг увелич. допуска (мс)</label>
            <input
              type="number"
              className={styles.input}
              value={allowanceInterval}
              onChange={(e) => setAllowanceInterval(Number(e.target.value))}
              min={0}
            />
          </div>

          <div className={styles.inputContainer}>
            <label className={styles.label}>Жёсткий таймаут (мс)</label>
            <input
              type="number"
              className={styles.input}
              value={hardTimeout}
              onChange={(e) => setHardTimeout(Number(e.target.value))}
              min={0}
            />
          </div>

          <button
            onClick={handleStart}
            className={styles.button}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Парсинг..." : "Старт"}
          </button>
        </div>

        <div
          ref={logsContainerRef}
          className={styles.logsContainer}
          style={{ flexDirection: "column" }}
        >
          {logs.length === 0 ? (
            <p className="text-gray-500 italic">Процесс появятся здесь...</p>
          ) : (
            logs.map((log, index) => <p key={index}>{log}</p>)
          )}
        </div>
      </div>
    </div>
  );
};

export default ScrapeSite;
