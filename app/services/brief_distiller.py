import os
import re
import json
import asyncio
from typing import Optional, List
from dotenv import load_dotenv

from app.schemas import DistilledBrief, get_gemini_safe_schema

load_dotenv()

SYSTEM_PROMPT_DISTILLER = """
You are the Brief Distillation Engine for ICP Clarity Lab.
Your mission is to take an unstructured, lengthy, or voice-dictated English business description from a founder and distill it into a compact, precise, and strictly necessary JSON representation.

STRICT RULES:
1. ONLY extract necessary information that directly aids ICP definition, assumption testing, and market research.
2. DO NOT invent facts, company headcounts, or revenue numbers that the founder never stated.
3. For 'explicit_constraints', capture any stated exclusions (e.g. 'no residential', 'do not want small stores', 'must have solar-ready roof') or mandatory boundaries.
4. For 'precision_search_queries', generate EXACTLY 3 or 4 laser-focused search queries tailored for querying Hacker News, Wikipedia, and developer/operator forums. These queries must directly target the core operational pain point, industry workflow bottleneck, or target buyer's common frustration (e.g. 'b2b hiring recruiter screening dropoff', 'commercial solar tariff return on investment', 'internal workflow approval friction').
5. Keep the JSON compact and concise.
"""


def _mock_distill_fallback(raw_brief: str) -> DistilledBrief:
    """
    Deterministic fallback when GEMINI_API_KEY is not set or unavailable.
    """
    clean_text = raw_brief.strip()
    sentences = [s.strip() for s in re.split(r"[.!?\n]+", clean_text) if len(s.strip()) > 5]

    offering = sentences[0] if sentences else "B2B Product / Service"
    target = sentences[1] if len(sentences) > 1 else "Growing B2B Companies"

    words = re.findall(r"\b[A-Za-z]{4,}\b", clean_text.lower())
    stopwords = {"this", "that", "with", "from", "have", "some", "what", "their", "will", "would", "about", "provide", "growing", "companies"}
    keywords = [w for w in words if w not in stopwords][:6]
    key_phrase = " ".join(keywords[:3]) if keywords else "b2b business challenges"

    return DistilledBrief(
        core_offering=offering[:200],
        target_audience_hypothesis=target[:150],
        explicit_constraints=[s for s in sentences if any(w in s.lower() for w in ["not", "never", "only", "no", "exclude", "except"])][:3],
        precision_search_queries=[
            f"{key_phrase} pain points",
            f"{key_phrase} workflow bottlenecks",
            f"{key_phrase} buyer objections"
        ]
    )


async def distill_raw_brief(raw_brief: str) -> DistilledBrief:
    """
    Distills raw English text into a compact DistilledBrief JSON using Gemini.
    Uses resilient multi-model cascading and exponential retry to bypass 503 high-demand spikes.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        return _mock_distill_fallback(raw_brief)

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    safe_schema = get_gemini_safe_schema(DistilledBrief)

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT_DISTILLER,
        response_mime_type="application/json",
        response_schema=safe_schema,
        temperature=0.1,
    )

    model_name = "gemini-2.5-flash-lite"
    contents = f"Founder's Business Brief:\n\n{raw_brief}"

    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config,
            )
            if response.text:
                data = json.loads(response.text)
                return DistilledBrief(**data)
        except Exception as e:
            err_str = str(e)
            is_503 = "503" in err_str or "UNAVAILABLE" in err_str or "high demand" in err_str
            is_429 = "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str
            if is_503 and attempt == 0:
                print(f"[BriefDistiller] Model {model_name} busy (503). Retrying after 1.5s...")
                await asyncio.sleep(1.5)
                continue
            elif is_429:
                print(f"[BriefDistiller] Model {model_name} quota exhausted (429). Using deterministic brief extraction.")
                break
            else:
                print(f"[BriefDistiller] Model {model_name} error: {err_str[:120]}. Using deterministic brief extraction.")
                break

    return _mock_distill_fallback(raw_brief)
