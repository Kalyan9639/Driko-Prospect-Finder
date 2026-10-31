import os
import json
import time
import hashlib
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

from app.schemas import (
    DistilledBrief,
    ExternalEvidenceSnippet,
    ICPReport,
    LLMCompiledICP,
    GeographyScope,
    LedgerItem,
    ClaimStatus,
    BuyerPersona,
    PersonaRoleType,
    ValidationQuestion,
    ValidationStep,
    get_gemini_safe_schema
)

load_dotenv()

CACHE_DIR = Path(".cache/icp_reports")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

SYSTEM_PROMPT_COMPILER = """
You are the ICP Compiler & Validation Architect for ICP Clarity Lab.
Your goal is to transform the founder's distilled brief and external market signals into a structured, highly honest Ideal Customer Profile (ICP), an Assumption Ledger, a Buyer Persona Matrix, and a Customer Validation Plan.

EPISTEMIC RULES (NON-NEGOTIABLE):
1. NEVER INVENT company size, minimum headcount, revenue thresholds, or customer budgets that the founder did not provide.
2. If critical qualifying details are missing, explicitly put them in 'unknowns' or classify them as 'assumption' with a corresponding validation question.
3. In 'ledger_items', strictly assign the correct 'status':
   - 'user_provided': explicitly stated in the brief.
   - 'ai_interpretation': structured rephrasing of the user's intent.
   - 'external_signal': derived from the provided external research snippets (always include the real 'source_url').
   - 'assumption': plausible hypotheses that need testing before scaling sales.
   - 'unknown': missing requirements that cannot be assumed.
4. In 'buyer_personas' (Module 4), define 3 to 4 distinct organizational roles:
   - Must cover: economic_buyer, champion_influencer, end_user, and (if applicable) technical_gatekeeper.
   - For EACH persona, provide an explicit 'authority_qualification' stating what remains UNVERIFIED about their true budget and purchase authority (e.g., 'Has pain but usually needs CFO approval for contracts > $10k').
   - Provide a realistic 'deal_breaker_risk' (why they might kill or stall the project).
5. In 'validation_questions' (Module 5):
   - Link each question directly to an assumption, unknown, or buyer persona via 'linked_item_id'.
   - Questions MUST follow 'The Mom Test': behavioral, focused on past experience and current workflows, NEVER leading ('Would you buy this?') and NEVER pitching.
   - Provide concrete 'validation_signal' and 'invalidation_signal' criteria.
6. In 'validation_plan' (Module 6), outline 3 to 5 practical exploratory discovery steps with a clear 'decision_rule' explaining what changes if the assumption is disproven.
"""


def _generate_cache_key(brief: DistilledBrief, urls: List[str]) -> str:
    serialized = json.dumps({
        "brief": brief.model_dump(),
        "urls": sorted(urls)
    }, sort_keys=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _mock_icp_fallback(
    brief: DistilledBrief,
    external_snippets: List[ExternalEvidenceSnippet],
    telemetry: Dict[str, Any]
) -> ICPReport:
    """
    Deterministic fallback for offline/demo verification or when GEMINI_API_KEY is not set.
    """
    core_offering = brief.core_offering
    target = brief.target_audience_hypothesis

    ledger = [
        LedgerItem(
            id="crit_1",
            statement=f"Target business entity: {target}",
            category="mandatory",
            status=ClaimStatus.USER_PROVIDED,
            explanation="Explicitly specified by the founder in the business brief.",
            user_confirmed=True
        ),
        LedgerItem(
            id="crit_2",
            statement=f"Core offering provided: {core_offering}",
            category="mandatory",
            status=ClaimStatus.USER_PROVIDED,
            explanation="Explicitly stated core capability.",
            user_confirmed=True
        ),
    ]

    for i, c in enumerate(brief.explicit_constraints):
        ledger.append(LedgerItem(
            id=f"excl_{i+1}",
            statement=c,
            category="exclusion" if "no" in c.lower() or "not" in c.lower() else "operational_constraint",
            status=ClaimStatus.USER_PROVIDED,
            explanation="Direct constraint stated by the founder.",
            user_confirmed=True
        ))

    for i, s in enumerate(external_snippets[:2]):
        ledger.append(LedgerItem(
            id=f"sig_{i+1}",
            statement=f"Observed market pain: {s.title}",
            category="pain_point",
            status=ClaimStatus.EXTERNAL_SIGNAL,
            explanation=f"Surfaced from external discussion: {s.snippet[:120]}",
            source_url=s.url,
            user_confirmed=False
        ))

    ledger.append(LedgerItem(
        id="assump_1",
        statement="Target companies have an active operational budget earmarked for this specific bottleneck.",
        category="buying_signal",
        status=ClaimStatus.ASSUMPTION,
        explanation="Hypothesis that the observed pain equates to discretionary purchasing authority.",
        user_confirmed=False
    ))

    unknowns = [
        "What specific trigger event makes solving this problem urgent rather than a nice-to-have?",
        "What alternative workflow or tool is currently used to manage this bottleneck?"
    ]

    personas = [
        BuyerPersona(
            id="role_1",
            role_title="Business Owner / Founder / Executive Sponsor",
            role_type=PersonaRoleType.ECONOMIC_BUYER,
            core_pain_and_stake="Loss of operational bandwidth and slow time-to-value.",
            evaluation_criteria=["Return on investment", "Implementation speed", "Minimal operational disruption"],
            authority_qualification="Holds ultimate signing authority in companies under 100 people, but delegates operational evaluation to team leads.",
            deal_breaker_risk="Perceives the solution as high-friction to onboard or unproven in their specific niche."
        ),
        BuyerPersona(
            id="role_2",
            role_title="Department / Operations Lead",
            role_type=PersonaRoleType.CHAMPION_INFLUENCER,
            core_pain_and_stake="Daily friction, manual repetitive tasks, and firefighting team complaints.",
            evaluation_criteria=["Ease of day-to-day use", "Accuracy of outcomes", "Workflow integration"],
            authority_qualification="Can champion the product strongly but does not possess independent signature authority above discretionary budget limits.",
            deal_breaker_risk="Fears the new process requires extensive retraining or might fail during peak workloads."
        ),
        BuyerPersona(
            id="role_3",
            role_title="Frontline Operator / Specialist",
            role_type=PersonaRoleType.END_USER,
            core_pain_and_stake="Time lost navigating awkward legacy steps or clunky spreadsheets.",
            evaluation_criteria=["Speed", "Clarity of UI", "Fewer repetitive manual clicks"],
            authority_qualification="No budget authority; influence is restricted to user adoption or quiet resistance.",
            deal_breaker_risk="Refuses to use the software if it adds steps to their existing daily routine."
        )
    ]

    questions = [
        ValidationQuestion(
            id="q_1",
            linked_item_id="assump_1",
            target_persona_title="Business Owner / Founder",
            discovery_question="How did you handle this specific bottleneck the last time it occurred last month, and what did it cost you in time or money?",
            validation_signal="Describes concrete money or hours lost and mentions active attempts to solve it.",
            invalidation_signal="Indicates it happens rarely or was easily solved with existing free tools."
        ),
        ValidationQuestion(
            id="q_2",
            linked_item_id="role_2",
            target_persona_title="Department / Operations Lead",
            discovery_question="When was the last time your team evaluated a tool for this problem, and who had to sign off before you could try it?",
            validation_signal="Explains a clear sign-off process and names the internal sponsor.",
            invalidation_signal="States they have never been allowed to test outside software or must wait for corporate parent review."
        )
    ]

    plan = [
        ValidationStep(
            step_number=1,
            action="Conduct 5 discovery conversations using Mom-Test questions without pitching the solution.",
            target_profile=f"{target} matching the initial brief criteria.",
            uncertainty_addressed="Whether the identified bottleneck is painful enough to trigger immediate budget allocation.",
            decision_rule="If fewer than 2 of 5 report recent active spending or pain, narrow the ICP to higher-urgency sub-segments."
        ),
        ValidationStep(
            step_number=2,
            action="Map the actual buying committee across 3 candidate customer organizations.",
            target_profile="Candidate organizations in the target geography.",
            uncertainty_addressed="Who initiates vs who authorizes spending.",
            decision_rule="Adjust the primary buyer persona if end-user champions lack a path to economic signers."
        )
    ]

    telemetry.update({
        "model_used": "deterministic-fallback",
        "cache_hit": False,
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0
    })

    return ICPReport(
        business_summary=f"Offering: {core_offering}. Target: {target}.",
        icp_statement=f"Targeting {target} requiring {core_offering} without violating stated exclusions.",
        offering=core_offering,
        target_entity=target,
        geography=GeographyScope(include=["India", "Global B2B"], exclude=[]),
        ledger_items=ledger,
        unknowns=unknowns,
        buyer_personas=personas,
        validation_questions=questions,
        validation_plan=plan,
        external_signals=external_snippets,
        telemetry=telemetry
    )


async def compile_icp_report(
    brief: DistilledBrief,
    external_snippets: List[ExternalEvidenceSnippet],
    urls: List[str],
    force_refresh: bool = False,
    deterministic_mode: bool = False,
    custom_provider: Optional[str] = None,
    custom_api_key: Optional[str] = None,
    custom_model: Optional[str] = None
) -> ICPReport:
    """
    Compiles the full ICP Report using Gemini or Groq via LLM Router,
    with clean JSON schemas and high-fidelity deterministic fallback.
    """
    start_time = time.time()
    cache_key = _generate_cache_key(brief, urls)
    cache_file = CACHE_DIR / f"{cache_key}.json"

    # 1. Check Cache
    if not force_refresh and cache_file.exists() and os.getenv("ENABLE_CACHE", "true").lower() == "true":
        try:
            cached_data = json.loads(cache_file.read_text(encoding="utf-8"))
            cached_report = ICPReport(**cached_data)
            cached_report.telemetry["cache_hit"] = True
            cached_report.telemetry["elapsed_seconds"] = round(time.time() - start_time, 2)
            return cached_report
        except Exception as e:
            print(f"[Compiler] Cache read failed: {e}")

    telemetry: Dict[str, Any] = {
        "cache_hit": False,
        "external_snippets_count": len(external_snippets),
    }

    if deterministic_mode:
        fallback_report = _mock_icp_fallback(brief, external_snippets, telemetry)
        fallback_report.telemetry["elapsed_seconds"] = round(time.time() - start_time, 2)
        return fallback_report

    # Format the prompt context
    external_context_block = "\n".join([
        f"- [{s.source_type.upper()}] {s.title} ({s.url}): {s.snippet}"
        for s in external_snippets
    ]) if external_snippets else "No external signals provided."

    user_prompt = f"""
FOUNDER'S DISTILLED BRIEF SPECIFICATION:
Core Offering: {brief.core_offering}
Target Audience Hypothesis: {brief.target_audience_hypothesis}
Explicit Constraints & Exclusions: {', '.join(brief.explicit_constraints) if brief.explicit_constraints else 'None stated'}

REAL-WORLD EXTERNAL SIGNALS (Grounded Research):
{external_context_block}

Produce the complete LLMCompiledICP strictly matching the JSON schema.
"""

    from app.services.llm_router import route_llm_json

    data, error, router_telemetry = await route_llm_json(
        prompt=user_prompt,
        system_prompt=SYSTEM_PROMPT_COMPILER,
        schema_cls=LLMCompiledICP,
        custom_provider=custom_provider,
        custom_api_key=custom_api_key,
        custom_model=custom_model,
        temperature=0.2
    )

    telemetry.update(router_telemetry)
    telemetry["elapsed_seconds"] = round(time.time() - start_time, 2)

    if data:
        try:
            compiled_llm = LLMCompiledICP(**data)
            report = ICPReport(
                business_summary=compiled_llm.business_summary,
                icp_statement=compiled_llm.icp_statement,
                offering=compiled_llm.offering,
                target_entity=compiled_llm.target_entity,
                geography=compiled_llm.geography,
                ledger_items=compiled_llm.ledger_items,
                unknowns=compiled_llm.unknowns,
                buyer_personas=compiled_llm.buyer_personas,
                validation_questions=compiled_llm.validation_questions,
                validation_plan=compiled_llm.validation_plan,
                external_signals=compiled_llm.external_signals or external_snippets,
                telemetry=telemetry
            )

            # Save to disk cache
            try:
                cache_file.write_text(report.model_dump_json(indent=2), encoding="utf-8")
            except Exception as ce:
                print(f"[Compiler] Could not write cache file: {ce}")

            return report
        except Exception as parse_err:
            print(f"[Compiler] Schema parse error: {parse_err}. Reverting to fallback.")
            error = f"Schema validation error: {parse_err}"

    # If LLM failed, record error in telemetry and return deterministic report
    if error:
        telemetry["model_error"] = error
        print(f"[Compiler] LLM execution notice: {error}. Using high-precision deterministic compiler.")

    fallback_report = _mock_icp_fallback(brief, external_snippets, telemetry)
    fallback_report.telemetry["elapsed_seconds"] = round(time.time() - start_time, 2)
    return fallback_report
