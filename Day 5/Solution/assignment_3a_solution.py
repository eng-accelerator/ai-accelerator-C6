from __future__ import annotations

import os
from typing import Any

import gradio as gr
from openai import OpenAI

from assignment_2_solution import build_multimodal_messages


OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "openai/gpt-4o-mini"
APP_TITLE = "Basic Multimodal Chat"


def stream_basic_chat(
    message: dict[str, Any],
    history: list[dict[str, Any]],
    api_key: str,
):
    api_key = (api_key or os.getenv("OPENROUTER_API_KEY") or "").strip()
    if not api_key:
        yield "Add your OpenRouter API key first."
        return

    client = OpenAI(base_url=OPENROUTER_BASE_URL, api_key=api_key)
    response = client.chat.completions.create(
        model=DEFAULT_MODEL,
        messages=build_multimodal_messages(history, message),
        stream=True,
        extra_body={"provider": {"data_collection": "deny"}},
    )

    answer = ""
    for chunk in response:
        delta = chunk.choices[0].delta.content
        if delta:
            answer += delta
            yield answer


def build_demo() -> gr.ChatInterface:
    return gr.ChatInterface(
        fn=stream_basic_chat,
        type="messages",
        multimodal=True,
        title=APP_TITLE,
        textbox=gr.MultimodalTextbox(file_types=["image"]),
        additional_inputs=[gr.Textbox(label="OpenRouter API Key", type="password")],
    )


demo = build_demo()


if __name__ == "__main__":
    demo.launch()
