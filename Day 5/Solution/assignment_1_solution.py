from __future__ import annotations

import os
from typing import Any


OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "openai/gpt-4o-mini"


def resolve_api_key(api_key: str | None = None) -> str:
    resolved = (api_key or os.getenv("OPENROUTER_API_KEY") or "").strip()
    if not resolved:
        raise ValueError("Set OPENROUTER_API_KEY or pass an API key.")
    return resolved


def create_openrouter_client(api_key: str) -> Any:
    from openai import OpenAI

    return OpenAI(base_url=OPENROUTER_BASE_URL, api_key=api_key)


def build_text_messages(
    user_prompt: str,
    history: list[dict[str, Any]] | None = None,
) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []

    for item in history or []:
        role = item.get("role")
        content = item.get("content")
        if role in {"user", "assistant"} and isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content.strip()})

    messages.append({"role": "user", "content": user_prompt.strip()})
    return messages


def ask_text_model(
    prompt: str,
    api_key: str | None = None,
    model: str = DEFAULT_MODEL,
    history: list[dict[str, Any]] | None = None,
) -> str:
    client = create_openrouter_client(resolve_api_key(api_key))
    response = client.chat.completions.create(
        model=model,
        messages=build_text_messages(prompt, history),
        extra_body={"provider": {"data_collection": "deny"}},
    )
    return response.choices[0].message.content or ""


if __name__ == "__main__":
    print(ask_text_model("Explain Gradio in one sentence."))
