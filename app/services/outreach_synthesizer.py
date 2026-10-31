import os
import re
import json
import asyncio
import logging
from typing import Optional
from dotenv import load_dotenv

from app.schemas import OutreachDraft

load_dotenv()
logger = logging.getLogger("OutreachSynthesizer")


def _deterministic_outreach_fallback(
    company_name: str,
    full_name: Optional[str],
    role_title: Optional[str],
    problem_symptom_matched: str,
    core_offering: str
) -> OutreachDraft:
    """
    Rule-based fallback when Gemini API is unavailable or offline.
    """
    first_name = "there"
    if full_name:
        parts = [p for p in full_name.split() if p.lower() not in ("dr", "mr", "mrs", "ms", "prof")]
        if parts:
            first_name = parts[0]

    clean_symptom = problem_symptom_matched.strip()
    if len(clean_symptom) > 120:
        clean_symptom = clean_symptom[:117] + "..."

    short_offering = core_offering.strip()
    if len(short_offering) > 130:
        short_offering = short_offering[:127] + "..."

    role_str = role_title or "team lead"

    subject_line = f"Question re: {clean_symptom[:40]} at {company_name}"
    if "hiring" in clean_symptom.lower():
        subject_line = f"Engineering evaluation workflow at {company_name}"
    elif "solar" in clean_symptom.lower():
        subject_line = f"Rooftop solar expansion at {company_name}"

    cold_email = (
        f"Hi {first_name},\n\n"
        f"I noticed {company_name} is currently working through: \"{clean_symptom}\".\n\n"
        f"As {role_str}, you likely bear the headache of managing this workflow while keeping operations moving. "
        f"We developed {short_offering} specifically to help teams eliminate this manual friction.\n\n"
        f"Would you be open to a 10-minute peer chat this Thursday to see how similar teams are handling this?"
    )

    linkedin_note = (
        f"Hi {first_name} — saw {company_name}'s recent work regarding {clean_symptom[:45]}. "
        f"We built a workflow for {short_offering[:45]}. Would love to connect and share notes!"
    )
    if len(linkedin_note) > 280:
        linkedin_note = linkedin_note[:277] + "..."

    mom_test = (
        f"When your team currently navigates {clean_symptom[:50]}, what is the single biggest operational "
        f"bottleneck that eats up your hours before you see dependable results?"
    )

    return OutreachDraft(
        subject_line=subject_line,
        cold_email_body=cold_email,
        linkedin_dm_note=linkedin_note,
        mom_test_opener=mom_test
    )


async def generate_tailored_outreach(
    company_name: str,
    full_name: Optional[str],
    role_title: Optional[str],
    problem_symptom_matched: str,
    core_offering: str,
    evidence_excerpt: Optional[str] = None,
    proof_excerpt: Optional[str] = None,
    custom_provider: Optional[str] = None,
    custom_api_key: Optional[str] = None,
    custom_model: Optional[str] = None
) -> OutreachDraft:
    """
    Uses Gemini or Groq to craft authentic, peer-to-peer, non-templated outreach copy
    intelligently referencing the exact observed ground truth.
    Falls back gracefully to rule-based synthesis if API key is absent or offline.
    """
    if evidence_excerpt is None and proof_excerpt is not None:
        evidence_excerpt = proof_excerpt

    contact_name = full_name or "there"
    contact_role = role_title or "Department Lead"
    proof_context = evidence_excerpt or problem_symptom_matched

    system_prompt = "You are an elite B2B sales strategist writing hyper-personalized, peer-to-peer, non-pitch outreach."

    prompt = f"""
Company Name: {company_name}
Target Contact: {contact_name} ({contact_role})
Observed Ground Truth Proof: "{proof_context}"
Founder's Offering: {core_offering}

Generate 4 authentic assets:
1. subject_line: A short (under 7 words), curiosity-inducing, authentic subject line referencing their specific situation (NO generic "Question re:" templates).
2. cold_email_body: Maximum 3 to 4 concise sentences. Speak peer-to-peer. Acknowledge their exact observed situation, highlight how peers solve it without operational fatigue, and ask for a 10-minute exchange of notes.
3. linkedin_dm_note: A personalized connection note strictly under 280 characters.
4. mom_test_opener: A non-salesy, past-experience discovery question focused on their current workflow bottleneck.

Return ONLY a valid JSON object with keys:
subject_line, cold_email_body, linkedin_dm_note, mom_test_opener
"""

    from app.services.llm_router import route_llm_json

    data, error, telemetry = await route_llm_json(
        prompt=prompt,
        system_prompt=system_prompt,
        schema_cls=OutreachDraft,
        custom_provider=custom_provider,
        custom_api_key=custom_api_key,
        custom_model=custom_model,
        temperature=0.3
    )

    if data:
        try:
            return OutreachDraft(
                subject_line=data.get("subject_line", f"Note regarding {company_name}'s workflow"),
                cold_email_body=data.get("cold_email_body", ""),
                linkedin_dm_note=data.get("linkedin_dm_note", "")[:280],
                mom_test_opener=data.get("mom_test_opener", "")
            )
        except Exception as pe:
            logger.debug(f"[Outreach] Schema parsing failed: {pe}")

    if error:
        logger.debug(f"[Outreach] LLM execution notice: {error}. Using deterministic synthesis.")

    # Fallback to deterministic if models fail
    return _deterministic_outreach_fallback(
        company_name, full_name, role_title, problem_symptom_matched, core_offering
    )
