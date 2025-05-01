"use client";
import { useRef, useState } from "react";
import styles from "./ChatInput.module.css";
import { FaArrowRight } from "react-icons/fa6";
import socketMl from "@/shared/socket-ml/socket";
import { v4 as uuidv4 } from "uuid";
import { MessagePayload, Message } from "@/shared/socket-ml/types/types";

type InputProps = {
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  selectedList: string[];
  setSelectedList: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCount: number;
  url: string;
};

const ChatInput = ({
  setMessages,
  selectedList,
  setSelectedList,
  selectedCount = 0,
  url,
}: InputProps) => {
  const [inputValue, setInputValue] = useState<string>("");
  // const [hasSent, setHasSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSend = () => {
    console.log(inputValue.trim(), selectedCount);
    if (!inputValue.trim() || selectedCount === 0) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    const payload: MessagePayload = {
      message: userMessage,
      selectedList: selectedList,
      selectedUrl: url,
    };

    console.log("📤 Payload:", payload);
    socketMl.emit("message", payload);
    setMessages((prev) => [...prev, userMessage]);

    setSelectedList([]);
    setInputValue("");
    // setHasSent(true);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && selectedCount > 0) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.inputContainer}>
      <div className={styles.label}>
        {selectedCount > 0 ? (
          <p>выбрано {selectedCount} элементов для изменения</p>
        ) : (
          <p>выберите элементы для изменения</p>
        )}
      </div>
      <textarea
        className={styles.input}
        placeholder="Введите ваш запрос"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {selectedCount > 0 && inputValue.trim() !== "" && (
        <button className={styles.sendButton} onClick={handleSend}>
          <FaArrowRight />
        </button>
      )}
    </div>
  );
};

export default ChatInput;
