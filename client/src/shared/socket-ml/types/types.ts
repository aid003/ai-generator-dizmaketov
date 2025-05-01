export type MessageRole = "user" | "bot";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface MessagePayload {
  message: Message;
  selectedList: string[];
  selectedUrl: string
}

export interface ServerToClientEvents {
  message: (msg: string) => void;
  loading: () => void;
}

export interface ClientToServerEvents {
  message: (payload: MessagePayload) => void;
}
