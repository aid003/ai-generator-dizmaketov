import socketio
from uuid import uuid4
from time import time
from typing import Literal

from pydantic import BaseModel
from graph.graph import graph


# ────────── Pydantic-модели ──────────

MessageRole = Literal["user", "bot"]

class Message(BaseModel):
    id: str
    role: MessageRole
    content: str
    timestamp: int

class MessagePayload(BaseModel):
    message: Message
    selectedList: list[str]
    selectedUrl: str

def make_bot_reply(text: str) -> Message:
    return Message(
        id=str(uuid4()),
        role="bot",
        content=text,
        timestamp=int(time() * 1000)
    )

# ────────── Socket.IO ──────────


sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*"
)
app = socketio.ASGIApp(sio, socketio_path="socket.io")
ml_namespace = "/ml"

@sio.event(namespace=ml_namespace)
async def connect(sid, environ):
    print(f"🔌 Клиент подключён: {sid}")

@sio.event(namespace=ml_namespace)
async def disconnect(sid):
    print(f"❌ Клиент отключился: {sid}")

@sio.event(namespace=ml_namespace)
async def message(sid, data: dict):
    try:
        payload = MessagePayload.model_validate(data)
        user_command = payload.message.content
        snippets = payload.selectedList
        url_site = payload.selectedUrl

        print(f"[📥] Команда: {user_command}")
        print(f"[📄] Сниппеты: {snippets}")
        print(f"[🌐] Найденный сайт: {url_site}")

        await sio.emit("loading", namespace=ml_namespace, to=sid)
        
        state = {
            "command": user_command,
            "snippets": snippets,
            "url_site": url_site
        }

        result = graph.invoke(state)

        if not result:
            print("❌ result пустой или None после graph.invoke")
        elif "parsed_response" not in result:
            print("❌ В result нет ключа 'parsed_response'")
        else:
            print("✅ parsed_response найден:", result["parsed_response"])
        explanation = result.get("parsed_response", {}).get("explanation", "⚠️ Объяснение не получено.")
        print("Вот само объяснение: ", type(explanation))
        try:
            await sio.emit("message", explanation, namespace=ml_namespace, to=sid)
            print("✅ Успешно отправили сообщение по сокетам")
        except Exception as e:
            print("❌ Ошибка при отправке по сокетам:", e)

    except Exception as e:
        print(f"❌ Ошибка при обработке: {e}")
        await sio.emit("message", f"⚠️ Ошибка: {str(e)}", namespace=ml_namespace, to=sid)

# ────────── Запуск ──────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5550)
