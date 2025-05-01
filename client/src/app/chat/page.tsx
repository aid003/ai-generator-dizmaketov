import ChatClient from "@/widgets/Chat/ChatClient";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Загрузка чата...</div>}>
      <ChatClient />
    </Suspense>
  );
}
