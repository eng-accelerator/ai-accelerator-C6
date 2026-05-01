from __future__ import annotations

import os
from typing import Any
from dotenv import load_dotenv
load_dotenv()  # reads .env from current working directory


OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "openai/gpt-4o-mini"


def resolve_api_key(api_key: str | None = None) -> str:
    """Return an API key from the function argument or environment."""
    # TODO 1: return the stripped api_key if provided.
    # TODO 2: otherwise read OPENROUTER_API_KEY from the environment.
    # TODO 3: raise ValueError if neither exists.
    if api_key is not None:
        return api_key.strip()
    api_key = os.getenv("OPENROUTER_API_KEY")
    if api_key is None:
        raise ValueError("API key not found")
    return api_key.strip()


def create_openrouter_client(api_key: str) -> Any:
    """Create an OpenAI SDK client configured for OpenRouter."""
    from openai import OpenAI

    # TODO 4: return OpenAI(base_url=OPENROUTER_BASE_URL, api_key=api_key)
    return OpenAI(base_url=OPENROUTER_BASE_URL, api_key=api_key)


def build_text_messages(
    user_prompt: str,
    history: list[dict[str, Any]] | None = None,
) -> list[dict[str, str]]:
    """Convert prior chat history plus the new prompt into OpenRouter messages."""
    messages: list[dict[str, str]] = [{"role": "user", "content": "Explain Gradio in one sentence."}]

    for item in history or []:
        role = item.get("role")
        content = item.get("content")
        if role in {"user", "assistant"} and isinstance(content, str) and content.strip():
            # TODO 5: append the previous message as {"role": role, "content": content.strip()}
            messages.append({"role": role, "content": content.strip()})
            pass

    # TODO 6: append the latest user prompt.
    messages.append({"role": "user", "content": user_prompt})
    return messages


def ask_text_model(
    prompt: str,
    api_key: str | None = None,
    model: str = DEFAULT_MODEL,
    history: list[dict[str, Any]] | None = None,
) -> str:
    """Send one text-only chat request and return the assistant response."""
    client = create_openrouter_client(resolve_api_key(api_key))

    # TODO 7: call client.chat.completions.create with:
    # model=model
    # messages=build_text_messages(prompt, history)
    # extra_body={"provider": {"data_collection": "deny"}}
    response = client.chat.completions.create(
        model=model,
        messages=build_text_messages(prompt, history),
        extra_body={"provider": {"data_collection": "deny"}},
    )

    # TODO 8: return response.choices[0].message.content or an empty string.
    return response.choices[0].message.content or ""



if __name__ == "__main__":
    print(ask_text_model("Who invented it"))
