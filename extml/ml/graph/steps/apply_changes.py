from pathlib import Path
from src.scripts.replace_script import apply_html_change, apply_css_change_to_html

def apply_changes(state: dict) -> dict:
    print("[ApplyChanges] Применяем HTML/CSS изменения")

    parsed = state["parsed_response"]
    context = state["context"]
    proj = state["project"]

    base_dir = Path(__file__).resolve().parent.parent.parent.parent
    print("[DEBUG] 📁 base_dir:", base_dir)

    print("[DEBUG] 📦 state['url_site'] =", repr(state['url_site']))
    root_path = base_dir / 'extractor' / 'output' / state['url_site'].strip('/') / 'index.html'
    print("[DEBUG] 📄 root_path:", root_path)
    print("[DEBUG] ✅ exists:", root_path.exists())

    assert root_path.exists(), f"❌ Файл не найден: {root_path}"

    found_element = context["found_element"]
    apply_html_change(root_path, found_element, parsed["new_html"])

    if parsed.get("new_css"):
        index_path = Path(proj["index_html"])
        apply_css_change_to_html(str(index_path.parent), parsed["new_css"])

    return state
