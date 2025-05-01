"use client";
import React, { useCallback, useEffect, useState } from "react";
import styles from "./Browser.module.css";
import { useReloadIframe } from "../../../shared/hooks/useReloadIframe";

type BrowserProps = {
  selectedList: string[];
  setSelectedList: React.Dispatch<React.SetStateAction<string[]>>;
  url: string;
};

const Browser = ({ selectedList, setSelectedList, url }: BrowserProps) => {
  const { iframeRef, reload } = useReloadIframe();
  const [hovered, setHovered] = useState(false);
  const [currentHTML, setCurrentHTML] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Загрузка страницы...");
  const [scriptEnabled, setScriptEnabled] = useState(true);

  const scriptContent = `
    let lastHovered;
    document.addEventListener("mouseover", e => {
      const el = e.target; if (!el || !(el instanceof HTMLElement)) return;
      if (lastHovered && lastHovered !== el) lastHovered.style.outline = "";
      el.style.outline = "3px solid red";
      lastHovered = el;
      window.parent.postMessage({ type: "hover", html: el.outerHTML }, "*");
    });
    document.addEventListener("mouseout", e => {
      const el = e.target; if (!el) return;
      el.style.outline = "";
      window.parent.postMessage({ type: "leave" }, "*");
    });
    document.addEventListener("contextmenu", e => {
      e.preventDefault(); const el = e.target; if (!el || !(el instanceof HTMLElement)) return;
      const copy = el.cloneNode(true); if (copy instanceof HTMLElement) copy.style.outline = "";
      window.parent.postMessage({ type: "select", html: copy.outerHTML }, "*");
    });
  `;

  const injectScript = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) {
      console.warn("iframe.contentDocument is null");
      return;
    }
    const script = doc.createElement("script");
    script.type = "text/javascript";
    script.textContent = scriptContent;
    (doc.body || doc.head)?.appendChild(script);
    setIsLoading(false);
  }, [scriptContent]);

  const reloadFrame = useCallback(
    (message: string) => {
      setLoadingMessage(message);
      setIsLoading(true);
      reload();
    },
    [reload]
  );

  useEffect(() => {
    // Перезагружаем при изменении url
    reloadFrame("Загрузка новой страницы...");
  }, [url, reloadFrame]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      if (scriptEnabled) {
        try {
          injectScript();
        } catch (err) {
          console.error("Script injection error:", err);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    iframe.addEventListener("load", onLoad);
    const timeout = setTimeout(
      () =>
        setLoadingMessage(
          "Возможно, сайт плохо оптимизирован. Нужно чуть больше времени..."
        ),
      10000
    );
    return () => {
      iframe.removeEventListener("load", onLoad);
      clearTimeout(timeout);
    };
  }, [injectScript, scriptEnabled]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      switch (event.data.type) {
        case "hover":
          setHovered(true);
          setCurrentHTML(event.data.html);
          break;
        case "leave":
          setHovered(false);
          setCurrentHTML(null);
          break;
        case "select":
          setSelectedList((prev) =>
            prev.includes(event.data.html) ? prev : [...prev, event.data.html]
          );
          break;
        case "serverUpdate":
          reloadFrame("Обновление сервера, перезагружаю...");
          break;
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [reloadFrame, setSelectedList]);

  const handleClear = () => setSelectedList([]);
  const handleToggleScript = () => {
    setScriptEnabled((prev) => !prev);
    reloadFrame("Повторная загрузка...");
  };

  const getSnippetPhrase = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    let word = "снипетов";
    if (mod10 === 1 && mod100 !== 11) word = "снипет";
    else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
      word = "снипета";
    let verb = "выбрано";
    if (mod10 === 1 && mod100 !== 11) verb = "выбран";
    return `${verb}: ${count} ${word}`;
  };

  let tooltipContent = "не наведен";
  if (hovered && currentHTML) tooltipContent = "наведен";
  if (selectedList.length > 0)
    tooltipContent = getSnippetPhrase(selectedList.length);

  return (
    <div className={styles.wrapper}>
      <div className={styles.topPanel}>
        {selectedList.length > 0 && (
          <button onClick={handleClear} className={styles.clearButton}>
            Очистить
          </button>
        )}
        <button
          onClick={handleToggleScript}
          className={styles.toggleScriptButton}
        >
          {scriptEnabled ? "Отключить" : "Включить"} скрипт
        </button>
      </div>

      {scriptEnabled && (
        <div className={styles.tooltip}>
          <pre>{tooltipContent}</pre>
        </div>
      )}

      <div className={styles.browserContainer}>
        <div className={styles.iframeScaledWrapper}>
          <iframe
            ref={iframeRef}
            // src={`/api/proxy/${url}?t=${Date.now()}`}
            src={`/api/proxy/${url}`}
            className={styles.iframe}
          />
        </div>

        {isLoading && (
          <div className={styles.loaderOverlay}>
            <div className={styles.spinner}></div>
            <p>{loadingMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browser;
