from enum import Enum
from typing import List, Optional, Dict, Any, Type
from urllib.parse import quote_plus
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Schema Sanitizer for Gemini Developer API Mode
# ---------------------------------------------------------------------------

def get_gemini_safe_schema(model_cls: Type[BaseModel]) -> dict:
    """
    Produces a JSON schema completely stripped of 'additionalProperties'
    to guarantee compatibility with Google AI Studio Gemini Developer API mode.
    """
    schema = model_cls.model_json_schema()

    def _strip(node):
        if isinstance(node, dict):
            node.pop("additionalProperties", None)
            for v in node.values():
                _strip(v)
        elif isinstance(node, list):
            for item in node:
                _strip(item)

    _strip(schema)
    return schema


# ---------------------------------------------------------------------------
# Stage 1: Compact, Necessary-Only Brief Specification
# ---------------------------------------------------------------------------

class DistilledBrief(BaseModel):
    """
    Compact distillation of the founder's raw English or Wispr Flow dictated brief.
    Strictly contains ONLY necessary fields required by downstream modules
    to prevent AI hallucinations and token bloat.
    """
    core_offering: str = Field(
        ...,
        description="Crisp 1-2 sentence definition of the exact product or service sold."
    )
    target_audience_hypothesis: str = Field(
        ...,
        description="The customer entity type or business category hypothesized by the founder."
    )
    target_customer_archetype: str = Field(
        default="Founders & Engineering Leaders",
        description="Specific buyer persona role targeted (e.g., 'Founders & CEOs', 'Engineering Leaders / CTOs', 'Plant Heads / Operations Directors', 'HR Heads')."
    )
    target_company_size_focus: str = Field(
        default="Small & Mid-Sized (5-150 employees)",
        description="Target business scale focus (e.g., 'Small (2-50 employees)', 'Mid-Sized (51-200 employees)', 'Regional MSMEs')."
    )
    time_window_days: int = Field(
        default=30,
        description="Sliding time range filter in days (e.g., 1 for 24h, 7 for 7d, 30 for 30d, 90 for 90d, 365 for 1y, 0 for all-time)."
    )
    target_prospect_count: int = Field(
        default=8,
        description="Number of prospect companies to discover and filter (e.g. 4, 8, 15, 25)."
    )
    explicit_constraints: List[str] = Field(
        default_factory=list,
        description="Explicit stated disqualifiers, exclusions, or mandatory boundaries (e.g., 'no residential customers', 'Telangana only')."
    )
    precision_search_queries: List[str] = Field(
        ...,
        description="Exactly 3-4 high-signal, domain-specific search query strings designed for non-blocking Hacker News, Wikipedia, and StackExchange research."
    )
    selected_source_categories: List[str] = Field(
        default_factory=lambda: [
            "ats_job_boards",
            "dev_pain_communities",
            "startup_directories",
            "package_registries",
            "regional_msme_news",
            "corporate_registries",
        ],
        description="Categories of public unblocked feeds selected for client discovery."
    )


# ---------------------------------------------------------------------------
# Stage 2 & 3: Epistemic Assumption Ledger
# ---------------------------------------------------------------------------

class ClaimStatus(str, Enum):
    USER_PROVIDED = "user_provided"
    AI_INTERPRETATION = "ai_interpretation"
    EXTERNAL_SIGNAL = "external_signal"
    ASSUMPTION = "assumption"
    UNKNOWN = "unknown"
    USER_CONFIRMED = "user_confirmed"


class LedgerItem(BaseModel):
    """
    A single claim, criterion, or signal in the Assumption Ledger.
    Carries explicit origin status so unverified assumptions are never confused with facts.
    """
    id: str = Field(..., description="Unique identifier (e.g., 'crit_1', 'assump_2').")
    statement: str = Field(..., description="The concrete claim, criterion, or signal.")
    category: str = Field(
        ...,
        description="Classification: 'mandatory' | 'preferred' | 'exclusion' | 'buying_signal' | 'pain_point' | 'operational_constraint'."
    )
    status: ClaimStatus = Field(
        ...,
        description="Origin status: user_provided | ai_interpretation | external_signal | assumption | unknown | user_confirmed."
    )
    explanation: str = Field(
        ...,
        description="Clear rationale for why this claim was extracted or hypothesized."
    )
    source_url: Optional[str] = Field(
        None,
        description="Clickable source URL if the item originated from an external web or API signal."
    )
    user_confirmed: bool = Field(
        False,
        description="True if the user has explicitly reviewed and accepted this interpretation or assumption."
    )


# ---------------------------------------------------------------------------
# Module 4: Buyer Persona & Decision-Maker Matrix
# ---------------------------------------------------------------------------

class PersonaRoleType(str, Enum):
    ECONOMIC_BUYER = "economic_buyer"
    CHAMPION_INFLUENCER = "champion_influencer"
    END_USER = "end_user"
    TECHNICAL_GATEKEEPER = "technical_gatekeeper"


class BuyerPersona(BaseModel):
    """
    Detailed B2B buyer role representation.
    Distinguishes role responsibilities, pain points, and authority limits.
    """
    id: str = Field(..., description="Unique role identifier (e.g., 'role_econ', 'role_champ').")
    role_title: str = Field(
        ...,
        description="Representative organizational role title (e.g., 'VP of Talent Acquisition', 'CTO / Engineering Lead', 'Facilities Director')."
    )
    role_type: PersonaRoleType = Field(
        ...,
        description="Role classification: economic_buyer | champion_influencer | end_user | technical_gatekeeper."
    )
    core_pain_and_stake: str = Field(
        ...,
        description="Specific operational headache that gives this role a genuine stake in the offering."
    )
    evaluation_criteria: List[str] = Field(
        default_factory=list,
        description="Concrete metrics or outcomes this role cares about when judging solutions."
    )
    authority_qualification: str = Field(
        ...,
        description="Explicit qualification regarding what remains UNVERIFIED about their budget authority (prevents assuming title = signing authority)."
    )
    deal_breaker_risk: str = Field(
        ...,
        description="Primary objection or organizational risk that could cause this persona to veto or delay the deal."
    )


# ---------------------------------------------------------------------------
# Module 5 & 6: Customer-Validation Questions & Exploratory Plan
# ---------------------------------------------------------------------------

class ValidationQuestion(BaseModel):
    """
    Non-leading discovery interview question tied directly to an unresolved assumption or buyer persona.
    """
    id: str = Field(..., description="Unique question ID (e.g., 'q_1').")
    linked_item_id: str = Field(
        ...,
        description="ID of the specific ledger item (assumption or unknown) or buyer persona this question investigates."
    )
    target_persona_title: str = Field(
        ...,
        description="Which buyer role this question should be asked to."
    )
    discovery_question: str = Field(
        ...,
        description="Behavioral, past-experience question following 'Mom Test' principles (no pitch, no hypothetical agreement)."
    )
    validation_signal: str = Field(
        ...,
        description="What real-world answer would confirm or strengthen the hypothesis."
    )
    invalidation_signal: str = Field(
        ...,
        description="What real-world answer would weaken or disprove the hypothesis."
    )


class ValidationStep(BaseModel):
    """
    Exploratory, small-scale validation action.
    """
    step_number: int = Field(..., description="Execution sequence number.")
    action: str = Field(..., description="Actionable customer discovery task.")
    target_profile: str = Field(..., description="Exact persona and company profile to contact.")
    uncertainty_addressed: str = Field(..., description="Core assumption or unknown being tested.")
    decision_rule: str = Field(..., description="How to update the ICP based on observed evidence.")


# ---------------------------------------------------------------------------
# Module 7 & 8: Structured Schema Definitions, Contacts OSINT & Verification Proof
# ---------------------------------------------------------------------------

class ExternalEvidenceSnippet(BaseModel):
    """
    Non-blocking external signal fetched from URL markdown, HN Algolia, or StackExchange.
    """
    source_type: str = Field(..., description="'url_extracted' | 'hacker_news' | 'job_board' | 'stackexchange' | 'registry'")
    title: str = Field(..., description="Title of the thread, page, or article.")
    snippet: str = Field(..., description="Concise text excerpt (under 300 characters).")
    url: str = Field(..., description="Direct clickable link.")


class GeographyScope(BaseModel):
    """
    Explicitly typed geographic scope (avoids open dicts that trigger additionalProperties).
    """
    include: List[str] = Field(default_factory=list, description="Target locations to include.")
    exclude: List[str] = Field(default_factory=list, description="Locations explicitly excluded.")


class EvidenceProof(BaseModel):
    """
    Verifiable ground-truth proof demonstrating why this company fits the ICP.
    Contains direct clickable URLs and exact quoted verbatim text.
    """
    proof_url: str = Field(..., description="Direct clickable verification link to the exact job post, news announcement, or YC/company page.")
    source_name: str = Field(..., description="Name of the source (e.g. 'Hacker News Who is Hiring', 'YC Directory', 'Google News').")
    proof_date: Optional[str] = Field(None, description="Date of the evidence if available.")
    verbatim_excerpt: str = Field(..., description="Actual quoted text proving the pain point.")
    fit_explanation: str = Field(..., description="Why this verbatim excerpt proves this company has the problem.")

    @property
    def source_url(self) -> str:
        """Backwards compatibility alias for proof_url."""
        return self.proof_url


class DecisionMakerContact(BaseModel):
    """
    Real executive, founder, or engineering lead identified for a prospect company.
    Zero-guessing policy: never synthesizes or assumes private emails.
    """
    full_name: str = Field(..., description="Real full name (e.g. 'Harshil Mathur', 'Rohit Chennamaneni').")
    role_title: str = Field(..., description="Exact title (e.g. 'Founder & CEO', 'VP of Engineering', 'Director of Operations').")
    stakeholder_responsibility: str = Field(
        default="Operational stakeholder or budget signer.",
        description="Why this specific individual is affected by or responsible for solving the problem."
    )
    linkedin_url: Optional[str] = Field(None, description="Direct verified LinkedIn /in/ profile URL if published.")
    linkedin_search_url: str = Field(
        default="",
        description="1-Click targeted LinkedIn People Search URL to verify their live profile."
    )
    github_or_social_url: Optional[str] = Field(None, description="Direct verified GitHub or Twitter/X profile URL.")
    email: Optional[str] = Field(None, description="Direct verified email (None if not publicly listed on their site).")
    email_verification_status: str = Field(
        default="not_publicly_listed",
        description="'verified_public' | 'not_publicly_listed'."
    )
    provenance_source: str = Field(
        default="Live Web Directory / Website",
        description="Where this individual and their role was verified."
    )


class OutreachDraft(BaseModel):
    """
    AI-crafted hyper-personalized outreach assets connected directly to the company's observed problem symptom.
    """
    subject_line: str = Field(..., description="Short, curiosity-driven, problem-centric email subject line.")
    cold_email_body: str = Field(..., description="Peer-to-peer 3-4 sentence cold email referencing their specific bottleneck.")
    linkedin_dm_note: str = Field(..., description="Personalized connection note under 280 characters.")
    mom_test_opener: str = Field(..., description="Non-pitch, past-behavior customer discovery question.")


class DiscoveredProspectCompany(BaseModel):
    """
    Real company actively experiencing the problem the founder's product solves.
    """
    id: str = Field(default="", description="Unique identifier for the lead.")
    company_name: str = Field(..., description="Real company name.")
    website_url: str = Field(..., description="Official company domain/URL.")
    company_size_tier: str = Field(
        default="Small (2-50)",
        description="'Small (2-50)' | 'Mid-Sized (51-200)' | 'Regional MSME' | 'Enterprise'."
    )
    location: str = Field(default="India / Global", description="City, Region, and Country.")
    industry_and_one_liner: str = Field(..., description="What the company does in 1 concise sentence.")
    problem_symptom_matched: str = Field(
        ...,
        description="Concrete observable evidence of why this company has the problem right now."
    )
    evidence_proof: Optional[EvidenceProof] = Field(
        None,
        description="Grounded proof object containing clickable proof URL, verbatim quoted excerpt, and fit explanation."
    )
    fit_score: int = Field(default=85, description="Match score from 0 to 100.")
    public_emails: List[str] = Field(default_factory=list, description="Scraped public inboxes (hello@, sales@, team@) verified on website.")
    phone_numbers: List[str] = Field(default_factory=list, description="Scraped telephone numbers verified on website.")
    company_linkedin_url: Optional[str] = Field(None, description="Official LinkedIn company page.")
    decision_makers: List[DecisionMakerContact] = Field(default_factory=list, description="Key decision-makers identified.")
    outreach_draft: Optional[OutreachDraft] = Field(None, description="Problem-tailored outreach copy.")
    source_name: str = Field(default="Open Web OSINT", description="Name of the unblocked feed or engine.")
    source_url: str = Field(default="", description="Clickable provenance source link.")
    crm_status: str = Field(
        default="new",
        description="'new' | 'contacted' | 'replied' | 'meeting_booked' | 'not_a_fit'."
    )


class LLMCompiledICP(BaseModel):
    """
    Strict contract passed as response_schema to the Gemini model.
    Contains NO open dictionary fields, preventing additionalProperties errors.
    """
    business_summary: str = Field(..., description="Clean, structured restatement of the founder's business.")
    icp_statement: str = Field(..., description="One-sentence Ideal Customer Profile thesis.")
    offering: str = Field(..., description="Specific offering.")
    target_entity: str = Field(..., description="Target business entity type.")
    geography: GeographyScope = Field(default_factory=GeographyScope, description="Geographic scope.")
    ledger_items: List[LedgerItem] = Field(default_factory=list, description="Assumption ledger items.")
    unknowns: List[str] = Field(default_factory=list, description="Critical information gaps.")
    buyer_personas: List[BuyerPersona] = Field(default_factory=list, description="Buyer Persona Matrix.")
    validation_questions: List[ValidationQuestion] = Field(default_factory=list, description="Validation interview questions.")
    validation_plan: List[ValidationStep] = Field(default_factory=list, description="Validation roadmap.")
    external_signals: List[ExternalEvidenceSnippet] = Field(default_factory=list, description="Grounded external signals.")


class ICPReport(BaseModel):
    """
    Full structured ICP document returned by the API, including real discovered prospects and server telemetry.
    """
    business_summary: str = Field(..., description="Clean, structured restatement of the founder's business.")
    icp_statement: str = Field(..., description="One-sentence Ideal Customer Profile thesis.")
    offering: str = Field(..., description="Specific offering.")
    target_entity: str = Field(..., description="Target business entity type.")
    geography: GeographyScope = Field(default_factory=GeographyScope, description="Geographic boundaries.")
    ledger_items: List[LedgerItem] = Field(default_factory=list, description="Assumption ledger.")
    unknowns: List[str] = Field(default_factory=list, description="Explicit gaps.")
    buyer_personas: List[BuyerPersona] = Field(default_factory=list, description="Buyer Persona & Decision-Maker Matrix.")
    validation_questions: List[ValidationQuestion] = Field(default_factory=list, description="Customer-validation questions.")
    validation_plan: List[ValidationStep] = Field(default_factory=list, description="Validation roadmap.")
    external_signals: List[ExternalEvidenceSnippet] = Field(default_factory=list, description="External snippets.")
    discovered_prospects: List[DiscoveredProspectCompany] = Field(
        default_factory=list,
        description="Live target companies and decision-makers discovered across public sources."
    )
    active_sources_queried: List[str] = Field(
        default_factory=list,
        description="List of public unblocked feeds queried during this execution."
    )
    telemetry: Dict[str, Any] = Field(default_factory=dict, description="Audit telemetry generated by server.")


# ---------------------------------------------------------------------------
# Request & Response Payloads
# ---------------------------------------------------------------------------

class DistillBriefRequest(BaseModel):
    raw_brief: str = Field(..., min_length=15, description="Founder's raw text or voice transcript.")


class CompileICPRequest(BaseModel):
    brief_json: DistilledBrief = Field(..., description="The reviewed/edited compact Brief Specification JSON.")
    urls: List[str] = Field(
        default_factory=list,
        description="Optional URLs for extraction."
    )
    force_refresh: bool = Field(False, description="Bypass local cache if True.")
    deterministic_mode: bool = Field(False, description="Run with 0 AI tokens using pure local Python rules.")
    enable_live_grounding: bool = Field(True, description="Attempt Google Search Grounding with safe try/catch fallback.")
    sliding_time_window_days: Optional[int] = Field(None, description="Optional override for sliding time window cutoff in days.")
    target_prospect_count: Optional[int] = Field(None, description="Optional override for number of prospects to discover.")


class LeadStatusUpdateRequest(BaseModel):
    campaign_id: str
    lead_id: str
    crm_status: str = Field(..., description="'new' | 'contacted' | 'replied' | 'meeting_booked' | 'not_a_fit'")


class ScrapeSourceRequest(BaseModel):
    source_id: str = Field(..., description="ID from the 50 Unblocked Sources Registry.")
    query: str = Field(..., description="Search keyword or role title.")
    time_window_days: int = Field(default=30, description="Time range cutoff.")
