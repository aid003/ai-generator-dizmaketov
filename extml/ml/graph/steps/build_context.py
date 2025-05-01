from pathlib import Path
from src.parse.parser_utils import parse_project_simple, load_all_css, load_all_js, analyze_dom_and_collect_context
from src.scripts.context_builder import save_full_context_to_file

def build_context(state: dict) -> dict:
    print("[BuildContext] Сбор контекста из HTML/CSS/JS")

    url_site = state["url_site"]
    snippets = state["snippets"]

    base_dir  = Path(__file__).resolve().parent.parent.parent.parent
    root_path = base_dir / "extractor" / "output" / url_site / "index.html"

    print("[DEBUG] 🌐 build_context root_path:", root_path)
    assert root_path.exists(), f"❌ build_context: файл не найден {root_path}"
    proj = parse_project_simple(root_path)
    index_path = Path(proj["index_html"])

    # Загружаем CSS и JS
    css_dir = index_path.parent / "css"
    all_css = load_all_css(str(css_dir))
    all_js = load_all_js(proj["js_files"])
    
    # Анализируем DOM
    context_data = analyze_dom_and_collect_context(
        index_html=str(index_path),
        all_css=all_css,
        all_js=all_js,
        selected_snippet=str(snippets[0])
    )

    save_full_context_to_file(context_data)

    state["context"] = context_data
    state["project"] = proj  # пригодится позже для применения
    return state
