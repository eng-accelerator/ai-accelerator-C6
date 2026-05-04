from __future__ import annotations

import base64
import mimetypes
from pathlib import Path
from typing import Any


def image_file_to_data_url(file_path: str) -> str:
    path = Path(file_path)
    mime_type, _ = mimetypes.guess_type(path.name)
    if not mime_type or not mime_type.startswith("image/"):
        raise ValueError("Please provide a supported image file.")

    encoded_text = base64.b64encode(path.read_bytes()).decode("utf-8")
    return f"data:{mime_type};base64,{encoded_text}"


def get_uploaded_file_path(file_value: Any) -> str | None:
    if not file_value:
        return None
    if isinstance(file_value, str):
        return file_value
    if isinstance(file_value, dict):
        return file_value.get("path") or file_value.get("name")
    return getattr(file_value, "path", None) or getattr(file_value, "name", None)


def build_user_content(message: dict[str, Any]) -> str | list[dict[str, Any]]:
    text = (message.get("text") or "").strip()
    files = message.get("files") or []

    content: list[dict[str, Any]] = []
    if text:
        content.append({"type": "text", "text": text})

    for file_value in files:
        file_path = get_uploaded_file_path(file_value)
        if file_path:
            content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": image_file_to_data_url(file_path)},
                }
            )

    if not content:
        return "Please send text or upload an image."
    if len(content) == 1 and content[0]["type"] == "text":
        return content[0]["text"]
    if not text:
        content.insert(0, {"type": "text", "text": "Please analyze this image."})
    return content


def build_multimodal_messages(
    history: list[dict[str, Any]],
    current_message: dict[str, Any],
) -> list[dict[str, Any]]:
    messages: list[dict[str, Any]] = []

    for item in history:
        role = item.get("role")
        content = item.get("content")
        if role in {"user", "assistant"} and isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content.strip()})

    messages.append({"role": "user", "content": build_user_content(current_message)})
    return messages
