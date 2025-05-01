"use client";
import ChatInput from "@/features/ChatInput/ui/ChatInput";
import styles from "./Chat.module.css";
import { useEffect, useState } from "react";
import ChatMessages from "@/features/ChatMessages/ui/ChatMessages";
import GuideTip from "@/shared/GuideTip/ui/GuideTip";
import socketMl from "@/shared/socket-ml/socket";
import { Message } from "@/shared/socket-ml/types/types";
import { useRouter } from "next/navigation";

type ChatProps = {
  selectedList: string[];
  setSelectedList: React.Dispatch<React.SetStateAction<string[]>>;
  url: string;
};

const Chat = ({ selectedList, setSelectedList, url }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showTip, setShowTip] = useState(true);

  const router = useRouter();

  useEffect(() => {
    socketMl.connect();
    return () => {
      socketMl.disconnect();
    };
  }, []);

  return (
    <>
      <div className={styles.chatContainer}>
        <ChatMessages messages={messages} setMessages={setMessages} />
        <ChatInput
          setMessages={setMessages}
          selectedList={selectedList}
          selectedCount={selectedList.length}
          setSelectedList={setSelectedList}
          url={url}
        />
      </div>
      {showTip && (
        <GuideTip
          id="onboarding-002"
          steps={[
            {
              title: "Добро пожаловать в редактор сайта!",
              description:
                "Этот интерфейс помогает редактировать элементы сайта.",
            },
            {
              title: "Выбор элементов",
              description:
                "Вы можете наводить и выбирать нужные части сайта нажатием правой кнопки мыши.",
            },
            {
              title: "Готово!",
              description:
                "Теперь вы можете ввести текстовый запрос и изменить выбранные элементы.",
            },
          ]}
          onFinish={() => setShowTip(false)}
        />
      )}
    </>
  );
};

export default Chat;
