from src.parse.pars_llm_answer import parse_llm_response

def parse_response(state: dict) -> dict:
    print("[ParseResponse] Парсим и валидируем ответ LLM")

    raw_response = state.get("llm_response", "")
    parsed = parse_llm_response(raw_response)

    if not isinstance(parsed, dict):
        print("❌ parse_llm_response вернул не словарь! Добавляем explanation-заглушку")
        parsed = {
            "new_html": "",
            "new_css": "",
            "new_js": "",
            "explanation": "Ответ от LLM не удалось разобрать"
        }

    state["parsed_response"] = parsed
    return state
