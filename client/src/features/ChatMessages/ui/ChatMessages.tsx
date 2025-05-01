"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ChatMessages.module.css";
import { Message } from "@/shared/socket-ml/types/types";
import socketMl from "@/shared/socket-ml/socket";
import { FaArrowLeft } from "react-icons/fa6";
import { useRouter } from "next/navigation";

type ChatMessagesProps = {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
};

const ChatMessages = ({ messages, setMessages }: ChatMessagesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const [dots, setDots] = useState(".");

  const router = useRouter();

  useEffect(() => {
    if (!loadingMessageId) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length === 3 ? "." : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, [loadingMessageId]);

  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: "1",
        role: "user",
        content: "Привет, давай сделаем шрифт чуть больше и фон зеленым.",
        timestamp: Date.now(),
      },
      {
        id: "2",
        role: "bot",
        content: "Привет! Сделано, проверяй.",
        timestamp: Date.now(),
      },
    ];
    setMessages(mockMessages);
  }, [setMessages]);

  useEffect(() => {
    const handleLoading = () => {
      const id = crypto.randomUUID();
      setLoadingMessageId(id);
      const thinkingMessage: Message = {
        id,
        role: "bot",
        content: "Думаю.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, thinkingMessage]);
    };

    const handleMessage = (content: string) => {
      console.log("СООБЩЕНИЕ ОТ ML:", content);
      if (!loadingMessageId) {
        console.log("НЕТ ОТВЕТА ОТ ML или ОН НЕ ВАЛИДНЫЙ");
        return;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId ? { ...msg, content } : msg
        )
      );
      setLoadingMessageId(null);

      setTimeout(() => {
        window.postMessage({ type: "serverUpdate" }, "*");
      }, 2_000);
    };

    socketMl.on("loading", handleLoading);
    socketMl.on("message", handleMessage);

    return () => {
      socketMl.off("loading", handleLoading);
      socketMl.off("message", handleMessage);
    };
  }, [loadingMessageId, setMessages]);

  useEffect(() => {
    containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
  }, [messages]);

  return (
    <div ref={containerRef} className={styles.messagesContainer}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`${styles.message} ${
            msg.role === "user" ? styles.user : styles.bot
          }`}
        >
          {msg.id === loadingMessageId ? `Думаю${dots}` : msg.content}
        </div>
      ))}
      <p
        style={{
          position: "fixed",
          top: "0.5rem",
          left: "0.5rem",
          zIndex: 10,
          color: "white",
          cursor: "pointer",
          fontSize: "1.3rem",
        }}
        onClick={() => {
          router.back();
        }}
      >
        <FaArrowLeft />
      </p>
    </div>
  );
};

export default ChatMessages;
