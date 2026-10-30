"""
Model Context Protocol (MCP) Server for ICP Clarity Lab.
Provides standard MCP tools and resources so external AI interfaces (Claude Desktop,
ChatGPT via MCP, Cursor, Antigravity) can execute client discovery, OSINT contact stitching,
and GTM workbook management locally with ZERO Gemini API tokens consumed.
"""

import sys
import json
import asyncio
from typing import Optional, List, Dict, Any
from mcp.server.mcpserver import MCPServer

from app.schemas import DistilledBrief
from app.services.prospect_finder import discover_real_prospects
from app.services.osint_stitcher import (
    resolve_company_domain,
    crawl_and_stitch_contacts,
    build_linkedin_search_url,
)
from app.services.outreach_synthesizer import generate_tailored_outreach
from app.services.unblocked_sources_registry import (
    get_all_unblocked_sources,
    get_sources_by_category,
)
from app.services.workspace_store import save_campaign, list_campaigns, get_campaign


# Initialize the Model Context Protocol Server
mcp = MCPServer(
    name="ICP-Clarity-Lab-MCP",
    version="2.0.0",
    description="Agentic B2B GTM & Public OSINT Client Discovery Engine"
)


# ---------------------------------------------------------------------------
# MCP Tools (Actions callable by ChatGPT, Claude, Antigravity, Cursor)
# ---------------------------------------------------------------------------

@mcp.tool()
async def discover_prospects(
    core_offering: str,
    target_audience: str,
    customer_archetype: str = "Founders & Engineering Leaders",
    company_size_focus: str = "Small & Mid-Sized (5-150 employees)",
    time_window_days: int = 30
) -> str:
    """
    Search for real small and mid-sized companies actively experiencing the exact problem
    the founder's product solves across 50+ unblocked public sources (HN Who is Hiring,
    RemoteOK, YC small teams, regional MSME news feeds). Extracts official websites,
    verified public emails, decision-makers, and tailored outreach copy.
    """
    brief = DistilledBrief(
        core_offering=core_offering,
        target_audience_hypothesis=target_audience,
        target_customer_archetype=customer_archetype,
        target_company_size_focus=company_size_focus,
        time_window_days=time_window_days,
        explicit_constraints=["Exclude giant conglomerates and focus on companies with active problem symptoms."],
        precision_search_queries=[
            f"{target_audience} hiring OR expansion",
            f"{core_offering[:40]} workflow problem"
        ]
    )

    prospects = await discover_real_prospects(
        brief=brief,
        time_window_days=time_window_days,
        enable_live_grounding=False  # Keep 100% free / 0 external tokens in MCP mode
    )

    result = []
    for p in prospects:
        result.append({
            "company_name": p.company_name,
            "website_url": p.website_url,
            "company_size_tier": p.company_size_tier,
            "location": p.location,
            "fit_score": p.fit_score,
            "problem_symptom_matched": p.problem_symptom_matched,
            "public_emails": p.public_emails,
            "phone_numbers": p.phone_numbers,
            "company_linkedin_url": p.company_linkedin_url,
            "evidence_proof": {
                "source_name": p.evidence_proof.source_name if p.evidence_proof else "",
                "source_url": p.evidence_proof.source_url if p.evidence_proof else "",
                "verbatim_excerpt": p.evidence_proof.verbatim_excerpt if p.evidence_proof else "",
                "fit_explanation": p.evidence_proof.fit_explanation if p.evidence_proof else ""
            } if p.evidence_proof else None,
            "decision_makers": [
                {
                    "full_name": dm.full_name,
                    "role_title": dm.role_title,
                    "stakeholder_responsibility": dm.stakeholder_responsibility,
                    "email": dm.email,
                    "email_status": dm.email_verification_status,
                    "linkedin_url": dm.linkedin_url,
                    "linkedin_search_url": dm.linkedin_search_url
                }
                for dm in p.decision_makers
            ],
            "outreach_draft": {
                "subject_line": p.outreach_draft.subject_line if p.outreach_draft else "",
                "cold_email_body": p.outreach_draft.cold_email_body if p.outreach_draft else "",
                "linkedin_dm_note": p.outreach_draft.linkedin_dm_note if p.outreach_draft else "",
                "mom_test_opener": p.outreach_draft.mom_test_opener if p.outreach_draft else ""
            } if p.outreach_draft else None,
            "source_name": p.source_name,
            "source_url": p.source_url
        })

    return json.dumps({"status": "success", "prospects_found": len(result), "prospects": result}, indent=2)


@mcp.tool()
async def stitch_company_contacts(company_name_or_domain: str) -> str:
    """
    Given a company name or official domain, resolves the official website (via Clearbit),
    crawls the website (/about, /team, /contact), parses schema.org JSON-LD,
    and harvests public emails, phone numbers, official LinkedIn pages, and executive contacts.
    """
    domain = company_name_or_domain.strip()
    if "." not in domain or "/" in domain:
        resolved = await resolve_company_domain(domain)
        if resolved:
            domain = resolved

    contacts = await crawl_and_stitch_contacts(domain)
    return json.dumps({
        "status": "success",
        "domain": domain,
        "public_emails": contacts.get("public_emails", []),
        "phone_numbers": contacts.get("phone_numbers", []),
        "company_linkedin": contacts.get("company_linkedin"),
        "linkedin_profiles": contacts.get("linkedin_profiles", []),
        "decision_makers": [
            {
                "full_name": dm.full_name,
                "role_title": dm.role_title,
                "email": dm.email,
                "linkedin_url": dm.linkedin_url
            }
            for dm in contacts.get("decision_makers", [])
        ]
    }, indent=2)


@mcp.tool()
def list_unblocked_sources(category: Optional[str] = None) -> str:
    """
    Returns the catalog of 50+ live-verified (HTTP 200 OK) restriction-free public data sources
    used for non-blocking B2B lead discovery across ATS job feeds, startup directories,
    package registries, and regional MSME news.
    """
    if category:
        sources = get_sources_by_category(category)
    else:
        sources = get_all_unblocked_sources()

    return json.dumps({"count": len(sources), "sources": sources}, indent=2)


@mcp.tool()
async def generate_outreach(
    company_name: str,
    decision_maker_name: str,
    role_title: str,
    problem_symptom: str,
    core_offering: str,
    proof_excerpt: str = ""
) -> str:
    """
    Synthesizes tailored, non-pitch Mom-Test discovery questions, a 4-sentence cold email,
    and a short LinkedIn connection note referencing the company's specific observed problem.
    """
    draft = await generate_tailored_outreach(
        company_name=company_name,
        full_name=decision_maker_name,
        role_title=role_title,
        problem_symptom_matched=problem_symptom,
        core_offering=core_offering,
        proof_excerpt=proof_excerpt
    )
    return json.dumps({
        "subject_line": draft.subject_line,
        "cold_email_body": draft.cold_email_body,
        "linkedin_dm_note": draft.linkedin_dm_note,
        "mom_test_opener": draft.mom_test_opener
    }, indent=2)


@mcp.tool()
def save_campaign_leads(
    campaign_name: str,
    core_offering: str,
    target_audience: str,
    leads_json: str
) -> str:
    """
    Saves a batch of discovered leads into the local GTM Workbook (.cache/workspaces/)
    for CRM status tracking and CSV export.
    """
    try:
        leads = json.loads(leads_json)
        if not isinstance(leads, list):
            leads = [leads]
        brief = {"core_offering": core_offering, "target_audience": target_audience}
        record = save_campaign(name=campaign_name, brief=brief, leads=leads)
        return json.dumps({"status": "saved", "campaign_id": record["id"], "leads_count": record["leads_count"]})
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


# ---------------------------------------------------------------------------
# MCP Resources & Prompts
# ---------------------------------------------------------------------------

@mcp.resource("icp://sources/catalog")
def get_sources_catalog() -> str:
    """Resource returning the complete catalog of 50+ unblocked client sources."""
    return json.dumps(get_all_unblocked_sources(), indent=2)


@mcp.resource("icp://campaigns/list")
def get_campaigns_list() -> str:
    """Resource returning all saved GTM campaign workbooks."""
    return json.dumps(list_campaigns(), indent=2)


@mcp.prompt()
def icp_discovery_prompt(core_offering: str, target_audience: str) -> str:
    """
    Generates a prompt to guide an LLM through conducting a Mom-Test customer discovery session
    and qualifying small-to-midsize prospects.
    """
    return f"""You are an elite B2B Go-To-Market and Customer Discovery Strategist.
The user has the following offering: "{core_offering}"
Targeting: "{target_audience}"

Please use the 'discover_prospects' tool to find real small and mid-sized companies actively experiencing
the pain this offering solves. Review their verified contacts, analyze the observable buying signals,
and advise the founder on how to execute Mom-Test discovery interviews without pitching prematurely."""


# ---------------------------------------------------------------------------
# CLI Entry Point for stdio execution (Claude Desktop, Cursor, Antigravity)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # When executed as a script or via python -m app.mcp_server, run stdio transport
    mcp.run(transport="stdio")
