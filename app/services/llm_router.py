import os
import re
import json
import time
import asyncio
import logging
from typing import Dict, Any, Optional, Tuple, Type
from dotenv import load_dotenv
import httpx
from pydantic import BaseModel

from app.schemas import get_gemini_safe_schema

load_dotenv()
logger = logging.getLogger("LLMRouter")

# Track the last runtime error from the LLM provider
_last_runtime_error: Optional[Dict[str, Any]] = None

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models"
GROQ_DEFAULT_MODEL = "openai/gpt-oss-20b"
GEMINI_DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")


def simplify_error_message(err: Any) -> str:
    """
    Condenses raw LLM exceptions, HTTP responses, and error blobs into short, clear messages:
    e.g. 'Request quota exhausted', 'Model is busy', 'Invalid API key', 'Network connection error'.
    """
    if not err:
        return "Unknown error"

    err_str = str(err)
    err_lower = err_str.lower()

    if any(q in err_lower for q in ["429", "resource_exhausted", "quota", "rate limit", "rate_limit", "exhausted"]):
        return "Request quota exhausted"
    elif any(b in err_lower for b in ["503", "unavailable", "high demand", "busy", "overloaded", "capacity"]):
        return "Model is busy"
    elif any(k in err_lower for k in ["400", "api_key_invalid", "401", "invalid api key", "invalid_api_key", "unauthorized"]):
        return "Invalid API key"
    elif any(p in err_lower for p in ["403", "permission_denied", "forbidden", "access denied"]):
        return "Access denied"
    elif any(n in err_lower for n in ["404", "not_found", "model not found"]):
        return "Model not found"
    elif any(c in err_lower for c in ["connecterror", "getaddrinfo", "timeout", "timed out", "connection"]):
        return "Network connection error"
    elif "safety" in err_lower or "blocked" in err_lower:
        return "Blocked by safety filters"
    else:
        # Short fallback: extract clean first line, max 50 chars
        first_line = err_str.strip().split("\n")[0].strip()
        first_line = re.sub(r"^(?:[a-zA-Z_]+(?:Error|Exception):\s*)", "", first_line).strip()
        if len(first_line) > 50:
            first_line = first_line[:47] + "..."
        return first_line or "Model error"


def set_last_runtime_error(provider: str, model: str, error: Any, error_type: str = "runtime_error"):
    global _last_runtime_error
    short_msg = simplify_error_message(error)
    _last_runtime_error = {
        "provider": provider,
        "model": model,
        "error": short_msg,
        "raw_error": str(error)[:500],
        "error_type": error_type,
        "timestamp": time.time(),
        "timestamp_iso": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    }
    logger.warning(f"[LLMRouter] Captured runtime error ({provider}/{model}): {short_msg}")


def get_last_runtime_error() -> Optional[Dict[str, Any]]:
    return _last_runtime_error


def clear_last_runtime_error():
    global _last_runtime_error
    _last_runtime_error = None


def get_llm_status() -> Dict[str, Any]:
    """
    Returns diagnostic health of the server's default AI configuration,
    including any active errors thrown by the default API key.
    Takes GEMINI_API_KEY from environment variables if present.
    """
    default_key = os.getenv("GEMINI_API_KEY", "").strip()
    has_env_key = bool(default_key and default_key != "your_gemini_api_key_here")

    last_err = get_last_runtime_error()
    if last_err:
        status = "error"
        error_msg = last_err.get("error", "Model error")
    elif not has_env_key:
        status = "not_configured"
        error_msg = "GEMINI_API_KEY not configured in environment"
    else:
        status = "ok"
        error_msg = None

    return {
        "configured_provider": "gemini",
        "configured_model": GEMINI_DEFAULT_MODEL,
        "has_env_key": has_env_key,
        "default_key_status": status,
        "default_key_error": error_msg,
        "default_key_hint": None,
        "last_error_details": last_err,
        "supported_custom_providers": ["gemini", "groq"],
        "recommendation": (
            "Not getting the best experience with the default model? "
            "Add your own Gemini or Groq API key to unlock full AI reasoning, unblocked rate limits, and custom outreach personalization."
        )
    }


async def validate_api_key(
    provider: str,
    api_key: str,
    model: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validates a user-supplied API key against Google Gemini or Groq.
    Returns: { "valid": bool, "provider": str, "model": str, "message": str, "error": Optional[str] }
    """
    provider = provider.lower().strip()
    clean_key = api_key.strip()

    if not clean_key:
        return {
            "valid": False,
            "provider": provider,
            "model": model or "unknown",
            "message": "API key cannot be empty",
            "error": "API key cannot be empty"
        }

    # Validate Groq Key
    if provider == "groq":
        test_model = model or GROQ_DEFAULT_MODEL
        headers = {
            "Authorization": f"Bearer {clean_key}",
            "Content-Type": "application/json"
        }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(GROQ_MODELS_URL, headers=headers)
                if r.status_code == 200:
                    return {
                        "valid": True,
                        "provider": "groq",
                        "model": test_model,
                        "message": f"Groq API key verified ({test_model})"
                    }
                elif r.status_code == 401:
                    return {
                        "valid": False,
                        "provider": "groq",
                        "model": test_model,
                        "message": "Invalid API key",
                        "error": "Invalid API key"
                    }
                else:
                    short_err = simplify_error_message(r.text)
                    return {
                        "valid": False,
                        "provider": "groq",
                        "model": test_model,
                        "message": short_err,
                        "error": short_err
                    }
        except Exception as e:
            short_err = simplify_error_message(e)
            return {
                "valid": False,
                "provider": "groq",
                "model": test_model,
                "message": short_err,
                "error": short_err
            }

    # Validate Gemini Key
    elif provider == "gemini":
        test_model = model or GEMINI_DEFAULT_MODEL
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=clean_key)
            loop = asyncio.get_running_loop()
            await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: client.models.generate_content(
                        model=test_model,
                        contents="ping",
                        config=types.GenerateContentConfig(max_output_tokens=5, temperature=0.0)
                    )
                ),
                timeout=5.0
            )
            return {
                "valid": True,
                "provider": "gemini",
                "model": test_model,
                "message": f"Gemini API key verified ({test_model})"
            }
        except Exception as e:
            short_err = simplify_error_message(e)
            return {
                "valid": False,
                "provider": "gemini",
                "model": test_model,
                "message": short_err,
                "error": short_err
            }

    else:
        return {
            "valid": False,
            "provider": provider,
            "model": model or "unknown",
            "message": f"Unsupported provider: {provider}",
            "error": f"Unsupported provider: {provider}"
        }


async def call_groq_json(
    prompt: str,
    system_prompt: str,
    api_key: str,
    model: Optional[str] = None,
    temperature: float = 0.2
) -> Tuple[Optional[Dict[str, Any]], Optional[str], Dict[str, Any]]:
    """
    Executes JSON generation on Groq Cloud via OpenAI-compatible REST API.
    """
    selected_model = model or GROQ_DEFAULT_MODEL
    telemetry = {
        "provider": "groq",
        "model_used": selected_model,
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0
    }

    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": selected_model,
        "messages": [
            {"role": "system", "content": f"{system_prompt}\nIMPORTANT: You must respond ONLY with valid JSON. Do not include markdown codeblocks."},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": temperature
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(GROQ_API_URL, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                usage = data.get("usage", {})
                telemetry["prompt_tokens"] = usage.get("prompt_tokens", 0)
                telemetry["completion_tokens"] = usage.get("completion_tokens", 0)
                telemetry["total_tokens"] = usage.get("total_tokens", 0)

                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return parsed, None, telemetry
            else:
                err_text = resp.text
                try:
                    err_json = resp.json()
                    err_msg = err_json.get("error", {}).get("message", err_text)
                except Exception:
                    err_msg = err_text
                short_err = simplify_error_message(err_msg)
                set_last_runtime_error("groq", selected_model, short_err, f"HTTP_{resp.status_code}")
                return None, short_err, telemetry
    except Exception as e:
        short_err = simplify_error_message(e)
        set_last_runtime_error("groq", selected_model, short_err, type(e).__name__)
        return None, short_err, telemetry


async def call_gemini_json(
    prompt: str,
    system_prompt: str,
    schema_cls: Optional[Type[BaseModel]],
    api_key: str,
    model: Optional[str] = None,
    temperature: float = 0.2
) -> Tuple[Optional[Dict[str, Any]], Optional[str], Dict[str, Any]]:
    """
    Executes JSON generation on Google Gemini using google.genai.Client.
    """
    selected_model = model or GEMINI_DEFAULT_MODEL
    telemetry = {
        "provider": "gemini",
        "model_used": selected_model,
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0
    }

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key.strip())
        config_kwargs: Dict[str, Any] = {
            "system_instruction": system_prompt,
            "response_mime_type": "application/json",
            "temperature": temperature,
        }

        if schema_cls is not None:
            config_kwargs["response_schema"] = get_gemini_safe_schema(schema_cls)

        config = types.GenerateContentConfig(**config_kwargs)

        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model=selected_model,
                contents=prompt,
                config=config,
            )
        )

        if response.usage_metadata:
            telemetry["prompt_tokens"] = response.usage_metadata.prompt_token_count or 0
            telemetry["completion_tokens"] = response.usage_metadata.candidates_token_count or 0
            telemetry["total_tokens"] = response.usage_metadata.total_token_count or 0

        if response.text:
            parsed = json.loads(response.text)
            return parsed, None, telemetry
        else:
            err = "Empty response received"
            set_last_runtime_error("gemini", selected_model, err, "EMPTY_RESPONSE")
            return None, err, telemetry

    except Exception as e:
        short_err = simplify_error_message(e)
        set_last_runtime_error("gemini", selected_model, short_err, type(e).__name__)
        return None, short_err, telemetry


async def route_llm_json(
    prompt: str,
    system_prompt: str,
    schema_cls: Optional[Type[BaseModel]] = None,
    custom_provider: Optional[str] = None,
    custom_api_key: Optional[str] = None,
    custom_model: Optional[str] = None,
    temperature: float = 0.2
) -> Tuple[Optional[Dict[str, Any]], Optional[str], Dict[str, Any]]:
    """
    Master router for LLM calls:
    1. If custom_api_key is provided with custom_provider ('groq' or 'gemini'), calls it directly.
    2. Otherwise, uses server default GEMINI_API_KEY from environment variables.
    3. If default key throws an error, captures the error shortly and returns it alongside fallback signals.
    """
    # 1. Custom Provider Requested
    if custom_api_key and custom_api_key.strip():
        provider = (custom_provider or "gemini").lower().strip()
        if provider == "groq":
            return await call_groq_json(
                prompt=prompt,
                system_prompt=system_prompt,
                api_key=custom_api_key,
                model=custom_model,
                temperature=temperature
            )
        else:
            return await call_gemini_json(
                prompt=prompt,
                system_prompt=system_prompt,
                schema_cls=schema_cls,
                api_key=custom_api_key,
                model=custom_model,
                temperature=temperature
            )

    # 2. Server Default Key (Gemini from environment variables)
    default_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not default_key or default_key == "your_gemini_api_key_here":
        err_msg = "GEMINI_API_KEY not configured"
        set_last_runtime_error("gemini", GEMINI_DEFAULT_MODEL, err_msg, "KEY_MISSING")
        return None, err_msg, {"provider": "gemini", "model_used": "deterministic_local"}

    return await call_gemini_json(
        prompt=prompt,
        system_prompt=system_prompt,
        schema_cls=schema_cls,
        api_key=default_key,
        model=custom_model or GEMINI_DEFAULT_MODEL,
        temperature=temperature
    )
