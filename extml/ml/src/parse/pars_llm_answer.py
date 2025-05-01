import json
import re
from pydantic import ValidationError
from src.parse.llm_response import LLMResponse
from src.llm.llm_client import call_llm

def parse_llm_response(response: str) -> dict:
    def clean_json_block(raw: str) -> str:
        raw = re.sub(r"^```json\\s*", "", raw.strip())
        raw = re.sub(r"\\s*```$", "", raw)
        return raw

    def try_parse(text: str):
        try:
            data = json.loads(clean_json_block(text))
            validated = LLMResponse(**data)
            return validated.dict()
        except (json.JSONDecodeError, ValidationError) as e:
            print(f"⚠️ Ошибка парсинга: {e}")
            return None

    print("🔍 Пробуем распарсить с первого раза...")
    parsed = try_parse(response)
    if parsed:
        return parsed

    print("⚠️ Не удалось. Пробуем автоисправление через LLM...")

    fix_prompt = f"""Ты получил невалидный JSON. Исправь его и верни только валидный JSON, без markdown-обёртки (без ```json).

Исходный текст:
{response}
"""
    second_answer = call_llm(fix_prompt)
    second_parsed = try_parse(second_answer)

    if second_parsed:
        print("✅ Исправленный JSON успешно распарсен.")
        return second_parsed

    print("❌ Не получилось даже со второго раза.")
    return {
        "new_html": "",
        "new_css": "",
        "new_js": "",
        "explanation": "❌ Ответ от LLM не удалось разобрать"
    }
