from typing import TypedDict

class PipelineState(TypedDict, total=False):
    command: str
    snippets: list[str]
    url_site: str
    context: dict
    project: dict
    prompt: str
    llm_response: str
    parsed_response: dict
