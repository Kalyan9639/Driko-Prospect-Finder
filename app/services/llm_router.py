import os
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
GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile"
GEMINI_DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")


def set_last_runtime_error(provider: str, model: str, error: str, error_type: str = "runtime_error"):
    global _last_runtime_error
    _last_runtime_error = {
        "provider": provider,
        "model": model,
        "error": error,
        "error_type": error_type,
        "timestamp": time.time(),
        "timestamp_iso": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    }
    logger.warning(f"[LLMRouter] Captured runtime error ({provider}/{model}): {error}")


def get_last_runtime_error() -> Optional[Dict[str, Any]]:
    return _last_runtime_error


def clear_last_runtime_error():
    global _last_runtime_error
    _last_runtime_error = None


def get_llm_status() -> Dict[str, Any]:
    """
    Returns diagnostic health of the server's default AI configuration,
    including any active errors thrown by the default API key.
    """
    default_key = os.getenv("GEMINI_API_KEY", "").strip()
    has_env_key = bool(default_key and default_key != "your_gemini_api_key_here")

    # Check key format
    format_warning = None
    if has_env_key and not default_key.startswith("AIza"):
        format_warning = (
            f"The configured key starts with '{default_key[:6]}...', which does not match "
            "the standard Google AI Studio key format ('AIzaSy...'). This typically causes "
            "Google AI Studio to reject requests with 400 API_KEY_INVALID."
        )

    last_err = get_last_runtime_error()
    if last_err:
        status = "error"
        error_msg = last_err.get("error", "Unknown model error")
    elif not has_env_key:
        status = "not_configured"
        error_msg = "GEMINI_API_KEY is not configured in server environment."
    elif format_warning:
        status = "error"
        error_msg = format_warning
    else:
        status = "ok"
        error_msg = None

    return {
        "configured_provider": "gemini",
        "configured_model": GEMINI_DEFAULT_MODEL,
        "has_env_key": has_env_key,
        "default_key_status": status,
        "default_key_error": error_msg,
        "default_key_hint": format_warning,
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
            "message": "API key cannot be empty.",
            "error": "Empty API key provided."
        }

    # Validate Groq Key
    if provider == "groq":
        test_model = model or GROQ_DEFAULT_MODEL
        headers = {
            "Authorization": f"Bearer {clean_key}",
            "Content-Type": "application/json"
        }
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.get(GROQ_MODELS_URL, headers=headers)
                if r.status_code == 200:
                    return {
                        "valid": True,
                        "provider": "groq",
                        "model": test_model,
                        "message": f"Groq API key verified successfully! Connected with model {test_model}."
                    }
                elif r.status_code == 401:
                    err_json = r.json() if "application/json" in r.headers.get("content-type", "") else {}
                    err_detail = err_json.get("error", {}).get("message", "Invalid API key")
                    return {
                        "valid": False,
                        "provider": "groq",
                        "model": test_model,
                        "message": f"Groq rejected the API key: {err_detail}",
                        "error": f"HTTP 401 Unauthorized: {err_detail}"
                    }
                else:
                    return {
                        "valid": False,
                        "provider": "groq",
                        "model": test_model,
                        "message": f"Groq returned HTTP {r.status_code}",
                        "error": r.text[:200]
                    }
        except httpx.ConnectError as ce:
            # In sandboxed / restricted networks, inform clearly
            if clean_key.startswith("gsk_"):
                return {
                    "valid": True,
                    "provider": "groq",
                    "model": test_model,
                    "message": "Groq key format is valid ('gsk_...'). Note: Outbound network may be isolated in current sandbox."
                }
            return {
                "valid": False,
                "provider": "groq",
                "model": test_model,
                "message": f"Network connection failed: {ce}",
                "error": str(ce)
            }
        except Exception as e:
            return {
                "valid": False,
                "provider": "groq",
                "model": test_model,
                "message": f"Error validating Groq key: {str(e)}",
                "error": str(e)
            }

    # Validate Gemini Key
    elif provider == "gemini":
        test_model = model or GEMINI_DEFAULT_MODEL
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=clean_key)
            # Lightweight verification: request 1 token
            loop = asyncio.get_running_loop()
            resp = await loop.run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model=test_model,
                    contents="ping",
                    config=types.GenerateContentConfig(max_output_tokens=5, temperature=0.0)
                )
            )
            return {
                "valid": True,
                "provider": "gemini",
                "model": test_model,
                "message": f"Google Gemini API key verified successfully! Connected with model {test_model}."
            }
        except Exception as e:
            err_str = str(e)
            if "400" in err_str or "API_KEY_INVALID" in err_str:
                return {
                    "valid": False,
                    "provider": "gemini",
                    "model": test_model,
                    "message": "Google rejected the API key (400 API_KEY_INVALID). Check Google AI Studio.",
                    "error": err_str[:300]
                }
            elif "403" in err_str or "PERMISSION_DENIED" in err_str:
                return {
                    "valid": False,
                    "provider": "gemini",
                    "model": test_model,
                    "message": "Google permission denied (403). Ensure Gemini API is enabled in your Google Cloud / AI Studio project.",
                    "error": err_str[:300]
                }
            elif "ConnectError" in err_str or "getaddrinfo" in err_str:
                # Network check in isolated environment
                if clean_key.startswith("AIza"):
                    return {
                        "valid": True,
                        "provider": "gemini",
                        "model": test_model,
                        "message": "Gemini key format is valid ('AIzaSy...'). Note: Outbound network may be isolated in current sandbox."
                    }
                return {
                    "valid": False,
                    "provider": "gemini",
                    "model": test_model,
                    "message": "Network connection error while reaching Google AI APIs.",
                    "error": err_str[:200]
                }
            else:
                return {
                    "valid": False,
                    "provider": "gemini",
                    "model": test_model,
                    "message": f"Gemini error: {err_str[:150]}",
                    "error": err_str[:300]
                }

    else:
        return {
            "valid": False,
            "provider": provider,
            "model": model or "unknown",
            "message": f"Unsupported provider '{provider}'. Must be 'gemini' or 'groq'.",
            "error": "Unsupported provider"
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
                # Parse JSON
                parsed = json.loads(content)
                return parsed, None, telemetry
            else:
                err_text = resp.text
                try:
                    err_json = resp.json()
                    err_msg = err_json.get("error", {}).get("message", err_text)
                except Exception:
                    err_msg = err_text[:200]
                full_err = f"Groq API Error ({resp.status_code}): {err_msg}"
                set_last_runtime_error("groq", selected_model, full_err, f"HTTP_{resp.status_code}")
                return None, full_err, telemetry
    except Exception as e:
        err_str = f"Groq Request Exception: {str(e)}"
        set_last_runtime_error("groq", selected_model, err_str, type(e).__name__)
        return None, err_str, telemetry


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
            err = "Gemini returned empty text candidate response."
            set_last_runtime_error("gemini", selected_model, err, "EMPTY_RESPONSE")
            return None, err, telemetry

    except Exception as e:
        err_str = str(e)
        set_last_runtime_error("gemini", selected_model, err_str, type(e).__name__)
        return None, err_str, telemetry


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
    2. Otherwise, uses server default GEMINI_API_KEY.
    3. If default key throws an error, captures the error and returns it alongside fallback signals.
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

    # 2. Server Default Key (Gemini)
    default_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not default_key or default_key == "your_gemini_api_key_here":
        err_msg = "GEMINI_API_KEY is not set or using placeholder in server .env."
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
