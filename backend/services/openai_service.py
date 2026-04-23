import os
import re
from collections.abc import AsyncGenerator

from openai import AsyncOpenAI


SYSTEM_PROMPT = """
You are an expert SRE and backend incident investigator.
Analyze the provided logs and return your answer in this exact format:

Root Cause:
<what actually went wrong>

Error Chain:
<sequence of events that led to failure>

Affected Services:
<which services, components, or dependencies are impacted>

Severity:
<critical|warning|info>

Suggested Fix:
<concrete steps to resolve and prevent recurrence>
""".strip()


class OpenAIService:
    def __init__(self) -> None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set.")
        self.client = AsyncOpenAI(api_key=api_key)

    async def stream_log_analysis(self, log_text: str) -> AsyncGenerator[str, None]:
        stream = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            temperature=0.2,
            stream=True,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Analyze the following logs and provide the structured report.\n\nLogs:\n{log_text}",
                },
            ],
        )

        async for chunk in stream:
            token = chunk.choices[0].delta.content if chunk.choices and chunk.choices[0].delta else None
            if token:
                yield token

    @staticmethod
    def parse_structured_response(content: str) -> dict[str, str]:
        sections = {
            "root_cause": "Root Cause",
            "error_chain": "Error Chain",
            "affected_services": "Affected Services",
            "severity": "Severity",
            "suggested_fix": "Suggested Fix",
        }

        parsed: dict[str, str] = {}
        for key, label in sections.items():
            pattern = rf"{label}:\s*(.*?)(?=\n(?:Root Cause|Error Chain|Affected Services|Severity|Suggested Fix):|\Z)"
            match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
            parsed[key] = match.group(1).strip() if match else ""

        severity = parsed.get("severity", "").lower().strip()
        if severity not in {"critical", "warning", "info"}:
            parsed["severity"] = "info"

        return parsed
