from src.scripts.context_builder import build_detailed_prompt

def generate_prompt(state: dict) -> dict:
    print("[GeneratePrompt] Генерация промпта с Chain-of-Thought")

    context = state["context"]
    command = state["command"]

    prompt = build_detailed_prompt(
        user_command=command,
        snippet=context["found_element"],
        parents=context["html_parents"],
        related_css=context["related_css"],
        related_js=context["related_js"],
        css_index_str=state["project"].get("css_index", "")
    )

    state["prompt"] = prompt
    return state
