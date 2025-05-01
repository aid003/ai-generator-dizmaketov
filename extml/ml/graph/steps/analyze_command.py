def analyze_command(state: dict) -> dict:
    '''
    В будущем будем использовать для классификации и анализа намерения
    '''

    print (f"[AnalyzeCommand] Команда получена: {state.get("command")}")
