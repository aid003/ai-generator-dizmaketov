# context_builder.py
import os

def build_detailed_prompt(
    user_command: str,
    snippet: str,
    parents: str,
    related_css: str,
    related_js: str,
    css_index_str: str = ""
) -> str:
    """
    Формирует развернутый текстовый prompt для LLM, который включает:
      1. Введение: описание задачи и контекста.
      2. Исходный HTML-блок (snippet) выбранного элемента.
      3. Родительские контейнеры (HTML-окружение элемента).
      4. Связанный CSS – все стили, в которых упоминаются id/классы элемента.
      5. Связанный JS – все скрипты, где содержится код, связанный с элементом.
      6. (Опционально) CSS-Index – индекс CSS-правил с информацией об их расположении (файл, селектор, номер строки).
      7. Команда пользователя, описывающая требуемые изменения.
      8. Инструкции, каким должен быть формат ответа LLM.

    Возвращает единый текст prompt.
    """
    sections = []

    # 1. Введение
    sections.append("## Введение")
    sections.append(
        "Имеется HTML-блок, его родительское окружение, CSS и JS, а также индекс CSS-правил, "
        "из которого видно, в каких файлах и на каких строках находятся ключевые правила. "
        "Необходимо внести изменения в выбранный элемент согласно команде пользователя."
    )

    # 2. Исходный HTML-блок (snippet)
    sections.append("\n## Исходный HTML-блок (snippet)")
    sections.append(snippet.strip() if snippet.strip() else "— (пусто)")

    # 3. Родительские контейнеры
    sections.append("\n## Родительские контейнеры")
    sections.append(parents)

    # 4. Связанный CSS
    sections.append("\n## Связанный CSS:")
    sections.append(str(related_css.strip() if related_css.strip() else "— (нет CSS)")[:800])

    # 7. Команда пользователя
    sections.append("\n## Команда пользователя")
    sections.append(user_command)

    # 8. Chain of Thought + JSON-инструкция
    sections.append("\n🧠 Работай по шагам:")
    sections.append(
        "1. Проанализируй HTML: что делает блок, как он оформлен, какие стили и вложенность.\n"
        "2. Проанализируй команду пользователя: что именно нужно изменить?\n"
        "3. Реши, нужно ли изменить HTML, CSS, JS — или всё сразу.\n"
        "4. Выбери минимально инвазивный способ — не ломай структуру.\n"
        "5. Объясни логику своего решения пошагово.\n"
        "6. Верни результат строго в следующем JSON-формате:\n\n"
        "{\n"
        '  "new_html": "<новый HTML-код>",\n'
        '  "new_css": "<новый CSS или пустая строка>",\n'
        '  "new_js": "<новый JS или пустая строка>",\n'
        '  "explanation": "<объяснение по шагам>"\n'
        "}\n"
        "\n"
        "‼️ Не добавляй никаких markdown-блоков (```json и т.п.). Верни только JSON."
    )

    final_text = "\n".join(sections)

    # Дополнительное сохранение prompt в файл для отладки
    prompt_file = "prompt_file/prompt.txt"
    if os.path.dirname(prompt_file):
        os.makedirs(os.path.dirname(prompt_file), exist_ok=True)
    with open(prompt_file, "w", encoding="utf-8") as f:
        f.write(final_text)

    print("Сохранён промпт в 'prompt.txt'")
    return final_text


def save_full_context_to_file(context: dict, path: str = "prompt_file/context_summary.txt"):
    """
    Сохраняет собранный контекст в единый текстовый файл.
    Ожидается, что context содержит следующие ключи:
      - found_element: HTML выбранного элемента,
      - html_parents: родительские контейнеры,
      - related_css: CSS, где упоминается элемент,
      - related_js: JS, где упоминается элемент,
      - found_in_file: имя файла, где был найден элемент.
    """
    if os.path.dirname(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)

    with open(path, "w", encoding="utf-8") as f:
        f.write("=== Найденный блок ===\n")
        found_element = context.get("found_element", "") or "—"
        f.write(found_element.strip() + "\n\n")

        f.write("=== Родительская структура ===\n")
        parents = context.get("html_parents", "") or "—"
        f.write(parents.strip() + "\n\n")

        f.write("=== CSS (если найдено) ===\n")
        css_text = context.get("related_css", "") or "—"
        f.write(css_text.strip() + "\n\n")

        f.write("=== JS (если найдено) ===\n")
        js_text = context.get("related_js", "") or "—"
        f.write(js_text.strip() + "\n\n")

        if "found_in_file" in context:
            f.write("=== Найдено в файле ===\n")
            f.write(f"{context['found_in_file']}\n")

    print(f"✅ Контекст сохранён в файл: {path}")
