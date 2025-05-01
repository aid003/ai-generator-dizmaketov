from graph.state_schema import PipelineState
from langgraph.graph import StateGraph

from graph.steps.analyze_command import analyze_command
from graph.steps.build_context import build_context
from graph.steps.generate_prompt import generate_prompt
from graph.steps.call_llm import call_llm_step
from graph.steps.parse_response import parse_response
from graph.steps.apply_changes import apply_changes




def create_graph():
    builder = StateGraph(state_schema=PipelineState)

    builder.add_node("AnalyzeCommand", analyze_command)
    builder.add_node("BuildContext", build_context)
    builder.add_node("GeneratePrompt", generate_prompt)
    builder.add_node("CallLlm", call_llm_step)
    builder.add_node("ParseResponse", parse_response)
    builder.add_node("ApplyChanges", apply_changes)

    builder.set_entry_point("AnalyzeCommand")
    builder.add_edge("AnalyzeCommand", "BuildContext")
    builder.add_edge("BuildContext", "GeneratePrompt")
    builder.add_edge("GeneratePrompt", "CallLlm")
    builder.add_edge("CallLlm", "ParseResponse")
    builder.add_edge("ParseResponse", "ApplyChanges")
    builder.set_finish_point("ApplyChanges")

    return builder.compile()

graph = create_graph()