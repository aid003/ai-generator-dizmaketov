"use client";

import Chat from "@/widgets/Chat/ui/Chat";
import styles from "@/shared/Styles/page.module.css";
import { useState, useEffect } from "react";
import Browser from "@/widgets/Browser/ui/Browser";
import { useRouter, useSearchParams } from "next/navigation";

export default function ChatClient() {
  const [selectedList, setSelectedList] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get("url");

  useEffect(() => {
    if (!url || url === null) {
      router.back();
    }
  }, [url, router]);

  return (
    <div className={styles.chatMainContainer}>
      <Chat
        selectedList={selectedList}
        setSelectedList={setSelectedList}
        url={url !== null ? url : "url not found"}
      />
      {url && (
        <Browser
          selectedList={selectedList}
          setSelectedList={setSelectedList}
          url={url}
        />
      )}
    </div>
  );
}
