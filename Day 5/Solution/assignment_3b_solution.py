from __future__ import annotations

import os
from typing import Any

import gradio as gr
from openai import OpenAI

from assignment_2_solution import build_multimodal_messages


OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "openai/gpt-4o-mini"
MODEL_CHOICES = [
    "openai/gpt-4o-mini",
    "google/gemini-2.0-flash-001",
    "anthropic/claude-3.5-haiku",
]
APP_TITLE = "Advanced Multimodal Chat"


def stream_advanced_chat(
    message: dict[str, Any],
    history: list[dict[str, Any]],
    api_key: str,
    model: str,
    temperature: float,
    max_tokens: int,
):
    api_key = (api_key or os.getenv("OPENROUTER_API_KEY") or "").strip()
    if not api_key:
        yield "Add your OpenRouter API key first."
        return

    client = OpenAI(base_url=OPENROUTER_BASE_URL, api_key=api_key)
    response = client.chat.completions.create(
        model=(model or DEFAULT_MODEL).strip(),
        messages=build_multimodal_messages(history, message),
        temperature=temperature,
        max_tokens=max_tokens,
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
    api_key_input = gr.Textbox(label="OpenRouter API Key", type="password")
    model_input = gr.Dropdown(
        label="Model",
        choices=MODEL_CHOICES,
        value=DEFAULT_MODEL,
        allow_custom_value=True,
    )
    temperature_input = gr.Slider(
        label="Temperature",
        minimum=0,
        maximum=1.5,
        step=0.1,
        value=0.7,
    )
    max_tokens_input = gr.Slider(
        label="Max tokens",
        minimum=64,
        maximum=2048,
        step=64,
        value=512,
    )

    return gr.ChatInterface(
        fn=stream_advanced_chat,
        type="messages",
        multimodal=True,
        title=APP_TITLE,
        textbox=gr.MultimodalTextbox(file_types=["image"]),
        additional_inputs=[
            api_key_input,
            model_input,
            temperature_input,
            max_tokens_input,
        ],
    )


demo = build_demo()


if __name__ == "__main__":
    demo.launch()
