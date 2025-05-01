from src.llm.llm_client import call_llm

def call_llm_step(state: dict) -> dict:
    print("[CallLLM] Вызов языковой модели")

    prompt = state["prompt"]
    print(prompt)
    response = call_llm(prompt)

    state["llm_response"] = response
    return state
