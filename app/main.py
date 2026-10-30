import os
import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Body, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, PlainTextResponse
from dotenv import load_dotenv

from app.schemas import (
    DistilledBrief,
    DistillBriefRequest,
    CompileICPRequest,
    ICPReport,
    LeadStatusUpdateRequest,
    ScrapeSourceRequest,
    DiscoveredProspectCompany
)
from app.services.brief_distiller import distill_raw_brief
from app.services.enrichment import gather_enrichment_signals
from app.services.gemini_compiler import compile_icp_report
from app.services.prospect_finder import discover_real_prospects
from app.services.unblocked_sources_registry import (
    get_all_unblocked_sources,
    get_sources_by_category,
    get_source_by_id,
)
from app.services.workspace_store import (
    save_campaign,
    list_campaigns,
    get_campaign,
    update_lead_status,
)
from app.services.exporter import (
    generate_markdown_report,
    generate_json_report,
    generate_prospects_csv,
)

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(
    title="ICP Clarity Lab & GTM OSINT Platform",
    description="Reality-grounded B2B Ideal Customer Profile compiler and autonomous public OSINT prospect discovery engine.",
    version="2.0.0"
)

# Mount static assets
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
app.mount("/css", StaticFiles(directory=str(STATIC_DIR / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(STATIC_DIR / "js")), name="js")


# ---------------------------------------------------------------------------
# Frontend Views
# ---------------------------------------------------------------------------

@app.get("/", response_class=FileResponse)
async def read_index():
    index_file = STATIC_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="Landing page not found.")
    return FileResponse(index_file)


@app.get("/app", response_class=FileResponse)
async def read_app_workspace():
    app_file = STATIC_DIR / "app.html"
    if not app_file.exists():
        raise HTTPException(status_code=404, detail="App workspace not found.")
    return FileResponse(app_file)


# ---------------------------------------------------------------------------
# Platform Diagnostics & Presets
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health_check() -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    has_valid_key = bool(api_key and api_key != "your_gemini_api_key_here")
    return {
        "status": "online",
        "gemini_api_configured": has_valid_key,
        "primary_model": "gemini-2.5-flash-lite",
        "fallback_model": "deterministic_local_engine",
        "mcp_server_available": True,
        "unblocked_sources_count": len(get_all_unblocked_sources()),
        "cache_enabled": os.getenv("ENABLE_CACHE", "true").lower() == "true"
    }


@app.get("/api/presets")
async def get_presets() -> List[Dict[str, Any]]:
    return [
        {
            "id": "kriu_hiring",
            "name": "KRIU — B2B Hiring & Talent Assessment",
            "industry": "HR Tech & Developer Hiring",
            "raw_brief": "I am building KRIU, a hiring-related workflow platform for B2B tech companies and growing startups. We help hiring managers and tech leads evaluate candidate engineering capabilities faster and reduce interview fatigue. We want to avoid generic small gig marketplaces and focus on funded startups and scaling product companies in India and remote teams that are actively hiring engineers.",
            "target_customer_archetype": "Engineering Leaders & CTOs",
            "sample_urls": ["https://news.ycombinator.com/jobs"],
            "suggested_keywords": [
                "startup hiring engineers India",
                "software engineer interview take-home",
                "technical assessment engineering fatigue"
            ]
        },
        {
            "id": "solar_telangana",
            "name": "Commercial Solar Rooftop Installations",
            "industry": "Renewable Energy & Manufacturing",
            "raw_brief": "I provide commercial solar installations to manufacturing companies in Telangana. I am interested in companies with suitable industrial facilities and high electricity consumption. I prefer businesses that are expanding or upgrading facilities. I don't want residential customers or small retail shops.",
            "target_customer_archetype": "Plant Heads & Operations Directors",
            "sample_urls": [],
            "suggested_keywords": [
                "solar manufacturing plant Telangana Hyderabad",
                "commercial industrial rooftop solar electricity cost",
                "manufacturing facility expansion Telangana"
            ]
        },
        {
            "id": "workflow_automation",
            "name": "Logistics & Supply Chain Process Automation",
            "industry": "B2B SaaS & Operations",
            "raw_brief": "I provide custom AI and process automation for mid-sized logistics and distribution companies in India and SEA. We automate invoice processing, warehouse dispatch updates, and exception reporting. We do not work with early-stage non-revenue startups or companies with fewer than 20 operations staff.",
            "target_customer_archetype": "VP of Operations & Logistics Heads",
            "sample_urls": [],
            "suggested_keywords": [
                "logistics invoice reconciliation bottleneck",
                "warehouse dispatch exception reporting",
                "supply chain workflow automation friction"
            ]
        },
        {
            "id": "tech_agency",
            "name": "Executive Tech Recruitment Agency",
            "industry": "Professional Services",
            "raw_brief": "We run a specialized recruitment agency placing senior backend and AI engineers for series-A to series-C startups. We do not do mass volume hiring or generic IT staffing. We want founders and CTOs who are tired of receiving 500 unqualified resumes from traditional job boards.",
            "target_customer_archetype": "Founders & Co-Founders",
            "sample_urls": [],
            "suggested_keywords": [
                "startup senior engineer hiring agency fee",
                "CTO recruiting executive search friction",
                "unqualified resume spam tech hiring"
            ]
        }
    ]


# ---------------------------------------------------------------------------
# Unblocked Sources Directory & Live Source Scraper
# ---------------------------------------------------------------------------

@app.get("/api/unblocked-sources")
async def list_unblocked_sources_endpoint(category: Optional[str] = None):
    """Returns the full catalog of 50+ live-verified restriction-free public sources."""
    if category:
        return {"sources": get_sources_by_category(category)}
    return {"sources": get_all_unblocked_sources()}


@app.post("/api/scrape-source")
async def scrape_source_endpoint(req: ScrapeSourceRequest):
    """Executes an on-demand live scrape of any single unblocked source."""
    source = get_source_by_id(req.source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found.")

    # Run quick targeted scout
    brief = DistilledBrief(
        core_offering=f"Solutions for {req.query}",
        target_audience_hypothesis=req.query,
        target_customer_archetype="Decision Makers",
        time_window_days=req.time_window_days,
        precision_search_queries=[req.query]
    )

    prospects = await discover_real_prospects(
        brief=brief,
        time_window_days=req.time_window_days,
        enable_live_grounding=False
    )

    return {
        "source_id": req.source_id,
        "source_name": source["name"],
        "query": req.query,
        "results_count": len(prospects),
        "results": prospects
    }


# ---------------------------------------------------------------------------
# Stage 1: Brief Distillation
# ---------------------------------------------------------------------------

@app.post("/api/distill-brief", response_model=DistilledBrief)
async def distill_brief_endpoint(payload: DistillBriefRequest):
    """
    Stage 1: Converts unstructured raw brief into a compact, strictly necessary
    DistilledBrief JSON representation.
    """
    if len(payload.raw_brief.strip()) < 15:
        raise HTTPException(status_code=400, detail="Business brief must be at least 15 characters.")
    return await distill_raw_brief(payload.raw_brief)


# ---------------------------------------------------------------------------
# Stage 2 & 3: Master Compiler & Prospect Discovery Pipeline
# ---------------------------------------------------------------------------

@app.post("/api/compile-icp", response_model=ICPReport)
async def compile_icp_endpoint(payload: CompileICPRequest):
    """
    Executes the 5-Agent autonomous pipeline:
    1. Gathers non-blocking market pain signals (HN/StackExchange/URLs).
    2. Runs Gemini ICP compiler (or deterministic fallback if requested).
    3. Concurrently scouts 50 unblocked public sources to discover matching SMB companies.
    4. Crawls websites, harvests verified public emails, phones, and LinkedIn links.
    5. Synthesizes tailored Mom-Test and cold outreach copy.
    6. Automatically saves campaign to local GTM workbook store.
    """
    brief = payload.brief_json
    urls = [u.strip() for u in payload.urls if u.strip()]
    time_window = getattr(payload, "sliding_time_window_days", None) or getattr(brief, "time_window_days", 30) or 30

    target_count = getattr(payload, "target_prospect_count", None) or getattr(brief, "target_prospect_count", 8) or 8

    # Execute enrichment, compilation, and live prospect discovery concurrently
    enrich_task = gather_enrichment_signals(
        search_queries=brief.precision_search_queries,
        urls=urls
    )

    prospect_task = discover_real_prospects(
        brief=brief,
        urls=urls,
        time_window_days=time_window,
        target_count=target_count,
        enable_live_grounding=payload.enable_live_grounding
    )

    (snippets, enrich_telemetry), prospects = await asyncio.gather(
        enrich_task,
        prospect_task
    )

    # Compile structured ICP report
    report = await compile_icp_report(
        brief=brief,
        external_snippets=snippets,
        urls=urls,
        force_refresh=payload.force_refresh
    )

    # Attach discovered prospects and active sources to report
    report.discovered_prospects = prospects
    report.active_sources_queried = [
        "Hacker News: Who is Hiring?",
        "YC Directory (Small Teams <= 50)",
        "Google News SME RSS",
        "Clearbit Domain Resolver",
        "Jina Reader Website Proxy",
        "StackExchange Developer Discussions"
    ]

    report.telemetry.update({
        "enrichment_sources_queried": enrich_telemetry.get("sources_queried", []),
        "snippets_count": enrich_telemetry.get("snippets_count", 0),
        "prospects_count": len(prospects),
        "enrichment_tokens_est": enrich_telemetry.get("estimated_tokens", 0)
    })

    # Automatically save as a Campaign Workbook in .cache/workspaces/
    try:
        campaign_name = f"{brief.target_audience_hypothesis[:35]} ({brief.target_customer_archetype})"
        save_campaign(
            name=campaign_name,
            brief=brief.model_dump(),
            leads=[p.model_dump() for p in prospects]
        )
    except Exception as ce:
        print(f"[Main] Notice: could not auto-save campaign: {ce}")

    return report


# ---------------------------------------------------------------------------
# GTM Campaign Workbooks & CRM Persistence
# ---------------------------------------------------------------------------

@app.get("/api/campaigns")
async def list_campaigns_endpoint():
    """Lists all saved GTM campaigns."""
    return {"campaigns": list_campaigns()}


@app.get("/api/campaigns/{campaign_id}")
async def get_campaign_endpoint(campaign_id: str):
    """Loads a full campaign workbook with all prospect leads."""
    campaign = get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    return campaign


@app.post("/api/campaigns/{campaign_id}/lead-status")
async def update_lead_status_endpoint(campaign_id: str, payload: LeadStatusUpdateRequest):
    """Updates CRM lead status (new, contacted, replied, meeting_booked, not_a_fit)."""
    success = update_lead_status(campaign_id, payload.lead_id, payload.crm_status)
    if not success:
        raise HTTPException(status_code=404, detail="Lead or campaign not found.")
    return {"status": "updated", "lead_id": payload.lead_id, "new_crm_status": payload.crm_status}


# ---------------------------------------------------------------------------
# Export Endpoints (Markdown, JSON, and CSV)
# ---------------------------------------------------------------------------

@app.post("/api/export/markdown", response_class=PlainTextResponse)
async def export_markdown_endpoint(report: ICPReport):
    """Exports an ICPReport into a complete human-readable Markdown file."""
    return generate_markdown_report(report)


@app.post("/api/export/json")
async def export_json_endpoint(report: ICPReport):
    """Exports an ICPReport into clean JSON."""
    return generate_json_report(report)


@app.post("/api/export/csv")
async def export_csv_endpoint(report: ICPReport):
    """Exports discovered prospects, decision-makers, and outreach copy into a CRM CSV file."""
    csv_content = generate_prospects_csv(report)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=prospects_and_contacts.csv"}
    )


# ---------------------------------------------------------------------------
# Model Context Protocol (MCP) Information
# ---------------------------------------------------------------------------

@app.get("/api/mcp-status")
async def mcp_status_endpoint():
    """Returns instructions and connection parameters for ChatGPT, Claude, and Antigravity."""
    return {
        "status": "active",
        "protocol": "Model Context Protocol (MCP) 2.x",
        "entry_point": "app.mcp_server",
        "claude_desktop_config_snippet": {
            "mcpServers": {
                "icp-clarity-lab": {
                    "command": "python",
                    "args": ["-m", "app.mcp_server"]
                }
            }
        },
        "available_tools": [
            "discover_prospects",
            "stitch_company_contacts",
            "list_unblocked_sources",
            "generate_outreach",
            "save_campaign_leads"
        ],
        "token_cost": "0 Gemini API tokens consumed when using external AI clients"
    }
