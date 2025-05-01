from pydantic import BaseModel

class LLMResponse(BaseModel):
    new_html: str = ""
    new_css: str = ""
    new_js: str = ""
    explanation: str = ""