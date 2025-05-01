import os
from ollama import Client

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")

os.environ["NO_PROXY"] = "localhost,127.0.0.1,ollama"

def call_llm(prompt: str) -> str:
    client = Client(
        host=OLLAMA_BASE_URL,        
        headers={"x-some-header": "some-value"}
    )

    try:
        response = client.chat(
            model="qwen2.5-coder:7b", 
            messages=[{"role": "user", "content": prompt}],
        )
        print("Ответ LLM:", response.message.content)
        return response.message.content
    except Exception as e:
        print(f"Ошибка при вызове LLM: {e}")
        return ""
