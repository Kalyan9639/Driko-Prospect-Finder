import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import asyncio
import json
from app.schemas import DistilledBrief
from app.services.prospect_finder import discover_real_prospects

async def main():
    brief = DistilledBrief(
        core_offering="A hiring-related workflow platform that helps hiring managers and tech leads evaluate candidate engineering capabilities faster and reduce interview fatigue.",
        target_audience_hypothesis="Funded startups and scaling product companies in India and remote teams actively hiring engineers.",
        target_customer_archetype="CTOs, VPs of Engineering, and Tech Hiring Managers",
        target_company_size_focus="Small & Mid-Sized (10-150 employees)",
        target_prospect_count=4,
        time_window_days=30,
        explicit_constraints=["India & Remote"],
        precision_search_queries=["developer assessment", "engineering hiring India", "screening interviews"]
    )
    
    print("[1] Discovering prospects with target_count=4...")
    prospects = await discover_real_prospects(brief, time_window_days=30, enable_live_grounding=False, target_count=4)
    
    print(f"\n[2] Found {len(prospects)} prospects (requested 4).")
    for i, p in enumerate(prospects, 1):
        print(f"\n--- Prospect {i}: {p.company_name} ({p.website_url}) ---")
        print(f"Fit Score: {p.fit_score}% | Tier: {p.company_size_tier} | Location: {p.location}")
        
        # Proof verification
        if p.evidence_proof:
            print(f"PROOF URL: {p.evidence_proof.proof_url}")
            print(f"SOURCE: {p.evidence_proof.source_name}")
            print(f"VERBATIM EXCERPT: {p.evidence_proof.verbatim_excerpt[:100]}...")
            print(f"FIT EXPLANATION: {p.evidence_proof.fit_explanation}")
        
        # Decision Makers
        print(f"DECISION MAKERS ({len(p.decision_makers)}):")
        for dm in p.decision_makers:
            print(f"  * {dm.full_name} | {dm.role_title}")
            print(f"    Responsibility: {dm.stakeholder_responsibility}")
            print(f"    Email: {dm.email} (Status: {dm.email_verification_status})")
            print(f"    LinkedIn URL: {dm.linkedin_url}")
            print(f"    LinkedIn Search: {dm.linkedin_search_url}")
            
        # AI Outreach
        if p.outreach_draft:
            print("AI OUTREACH DRAFT:")
            print(f"  Subject: {p.outreach_draft.subject_line}")
            print(f"  Cold Email (first 120 chars): {p.outreach_draft.cold_email_body[:120]}...")
            print(f"  LinkedIn Note ({len(p.outreach_draft.linkedin_dm_note)} chars): {p.outreach_draft.linkedin_dm_note}")
            print(f"  Mom Test Opener: {p.outreach_draft.mom_test_opener}")

if __name__ == "__main__":
    asyncio.run(main())
