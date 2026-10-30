import pytest
import json
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import (
    DistilledBrief,
    ClaimStatus,
    LedgerItem,
    BuyerPersona,
    PersonaRoleType,
    ValidationQuestion,
    ValidationStep,
    ICPReport,
    DiscoveredProspectCompany,
    DecisionMakerContact,
    OutreachDraft,
)
from app.services.brief_distiller import distill_raw_brief
from app.services.enrichment import gather_enrichment_signals
from app.services.gemini_compiler import compile_icp_report
from app.services.exporter import (
    generate_markdown_report,
    generate_json_report,
    generate_prospects_csv,
)
from app.services.unblocked_sources_registry import (
    get_all_unblocked_sources,
    get_sources_by_category,
    filter_by_sliding_time_window,
)
from app.services.osint_stitcher import (
    resolve_company_domain,
    build_linkedin_search_url,
    crawl_and_stitch_contacts,
)
from app.services.outreach_synthesizer import generate_tailored_outreach
from app.services.workspace_store import (
    save_campaign,
    list_campaigns,
    get_campaign,
    update_lead_status,
)
from app.services.prospect_finder import discover_real_prospects
from app.mcp_server import mcp, list_unblocked_sources, generate_outreach


@pytest.fixture
def client():
    return TestClient(app)


# ---------------------------------------------------------------------------
# Unit Tests: Unblocked Sources Registry & Time Slider
# ---------------------------------------------------------------------------

def test_unblocked_sources_catalog():
    sources = get_all_unblocked_sources()
    assert len(sources) >= 50
    cats = {s["category"] for s in sources}
    assert "ats_job_boards" in cats
    assert "dev_pain_communities" in cats
    assert "startup_directories" in cats
    assert "package_registries" in cats
    assert "regional_msme_news" in cats
    assert "corporate_registries" in cats

    ats_sources = get_sources_by_category("ats_job_boards")
    assert len(ats_sources) >= 10


def test_sliding_time_window_filtering():
    # 7-day window
    assert filter_by_sliding_time_window("Tue, 27 Oct 2026 07:00:00 GMT", 30) is True
    assert filter_by_sliding_time_window("Wed, 01 Jan 2020 00:00:00 GMT", 7) is False
    # All-time window (0 days) always returns True
    assert filter_by_sliding_time_window("Wed, 01 Jan 2020 00:00:00 GMT", 0) is True


# ---------------------------------------------------------------------------
# Unit Tests: OSINT Stitcher & Outreach Synthesizer
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_domain_resolution_and_linkedin_search():
    domain = await resolve_company_domain("Razorpay")
    assert domain is not None
    assert "razorpay" in domain

    search_url = build_linkedin_search_url("Harshil Mathur", "Razorpay")
    assert "linkedin.com/search/results/people" in search_url
    assert "Harshil" in search_url


@pytest.mark.asyncio
async def test_outreach_synthesizer():
    draft = await generate_tailored_outreach(
        company_name="Acme Tech",
        full_name="Jane Doe",
        role_title="CTO",
        problem_symptom_matched="interview screening bottlenecks",
        core_offering="B2B developer assessment platform",
        proof_excerpt="Our team is facing interview fatigue and taking 3 weeks to evaluate senior fullstack developers."
    )
    assert isinstance(draft, OutreachDraft)
    assert len(draft.subject_line) > 3
    assert len(draft.cold_email_body) > 20
    assert len(draft.linkedin_dm_note) <= 300
    assert "?" in draft.mom_test_opener


# ---------------------------------------------------------------------------
# Unit Tests: Model Context Protocol (MCP) Server
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_mcp_server_tools():
    assert mcp.name == "ICP-Clarity-Lab-MCP"
    tools = await mcp.list_tools()
    tool_names = [t.name for t in tools]
    assert "discover_prospects" in tool_names
    assert "stitch_company_contacts" in tool_names
    assert "list_unblocked_sources" in tool_names
    assert "generate_outreach" in tool_names

    # Test direct tool invocation
    sources_raw = list_unblocked_sources("ats_job_boards")
    sources_data = json.loads(sources_raw)
    assert sources_data["count"] >= 10


# ---------------------------------------------------------------------------
# Unit Tests: GTM Campaign Persistence
# ---------------------------------------------------------------------------

def test_campaign_workspace_store():
    leads = [
        {"id": "lead_test_1", "company_name": "Test Co", "crm_status": "new"}
    ]
    saved = save_campaign(name="Test Campaign", brief={"core_offering": "Testing"}, leads=leads)
    assert saved["id"].startswith("camp_")

    all_campaigns = list_campaigns()
    assert any(c["id"] == saved["id"] for c in all_campaigns)

    # Test status update
    success = update_lead_status(saved["id"], "lead_test_1", "contacted")
    assert success is True

    loaded = get_campaign(saved["id"])
    assert loaded["leads"][0]["crm_status"] == "contacted"


# ---------------------------------------------------------------------------
# Unit Tests: Live Prospect Finder
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_discover_real_prospects_execution():
    brief = DistilledBrief(
        core_offering="Engineering assessment workflow tool",
        target_audience_hypothesis="Scaling tech product startups in India",
        target_customer_archetype="CTOs & Engineering Leads",
        time_window_days=30,
        explicit_constraints=["India teams"],
        precision_search_queries=["startup hiring engineers India", "developer screening ATS"]
    )
    prospects = await discover_real_prospects(brief, time_window_days=30, enable_live_grounding=False)
    assert isinstance(prospects, list)
    assert len(prospects) >= 1
    p = prospects[0]
    assert isinstance(p, DiscoveredProspectCompany)
    assert len(p.company_name) > 1
    assert p.website_url.startswith("http")
    assert p.fit_score >= 50
    assert p.outreach_draft is not None
    assert p.evidence_proof is not None
    assert p.evidence_proof.proof_url.startswith("http")
    assert p.evidence_proof.source_url.startswith("http")
    assert len(p.evidence_proof.fit_explanation) > 0


# ---------------------------------------------------------------------------
# Integration & HTTP Endpoint Tests
# ---------------------------------------------------------------------------

def test_http_health_and_sources(client):
    r_health = client.get("/api/health")
    assert r_health.status_code == 200
    assert r_health.json()["unblocked_sources_count"] >= 50

    r_sources = client.get("/api/unblocked-sources")
    assert r_sources.status_code == 200
    assert len(r_sources.json()["sources"]) >= 50

    r_mcp = client.get("/api/mcp-status")
    assert r_mcp.status_code == 200
    assert r_mcp.json()["status"] == "active"


def test_http_compile_and_csv_export(client):
    brief_data = {
        "core_offering": "Developer screening workflow platform",
        "target_audience_hypothesis": "Tech startups in India",
        "target_customer_archetype": "CTOs",
        "target_company_size_focus": "Small & Mid-Sized",
        "time_window_days": 30,
        "explicit_constraints": [],
        "precision_search_queries": ["developer screening", "tech hiring India"],
        "selected_source_categories": ["ats_job_boards", "startup_directories"]
    }

    # 1. Compile ICP & Prospects
    r_compile = client.post(
        "/api/compile-icp",
        json={
            "brief_json": brief_data,
            "urls": [],
            "force_refresh": True,
            "enable_live_grounding": False
        }
    )
    assert r_compile.status_code == 200
    report_data = r_compile.json()
    assert "discovered_prospects" in report_data
    assert len(report_data["discovered_prospects"]) >= 1

    # 2. Export CSV
    r_csv = client.post("/api/export/csv", json=report_data)
    assert r_csv.status_code == 200
    assert "text/csv" in r_csv.headers["content-type"]
    assert "Company Name,Official Website" in r_csv.text

    # 3. Export Markdown (with Section 6)
    r_md = client.post("/api/export/markdown", json=report_data)
    assert r_md.status_code == 200
    assert "Live Matched Target Companies" in r_md.text
