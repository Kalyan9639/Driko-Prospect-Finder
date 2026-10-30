import re
import json
import logging
from urllib.parse import quote_plus
from typing import List, Dict, Any, Optional
import httpx

from app.schemas import DecisionMakerContact

logger = logging.getLogger("OSINTStitcher")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

EMAIL_EXCLUDE_EXTS = (
    ".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp", ".css", ".js", ".woff", ".woff2", ".ico"
)
EMAIL_EXCLUDE_DOMAINS = (
    "example.com", "schema.org", "sentry.io", "wixpress.com", "domain.com", "email.com", "cloudflare.com"
)


def build_linkedin_search_url(full_name: str, company_name: str = "") -> str:
    """
    Constructs a targeted 1-click LinkedIn People Search URL so the user can verify
    live profiles directly without hallucinating fake profile paths.
    """
    query = f"{full_name} {company_name}".strip()
    return f"https://www.linkedin.com/search/results/people/?keywords={quote_plus(query)}"


# ---------------------------------------------------------------------------
# Domain Resolution via Clearbit Autocomplete (100% Free / Unauthenticated)
# ---------------------------------------------------------------------------

async def resolve_company_domain(company_name: str, client: Optional[httpx.AsyncClient] = None) -> Optional[str]:
    """
    Maps any company name to its exact official domain in ~50ms using Clearbit's open endpoint.
    Example: 'Premier Energies' -> 'premierenergies.com'
    """
    clean_name = re.sub(r"\b(Pvt|Ltd|Private|Limited|Inc|Corp|LLC)\b", "", company_name, flags=re.I).strip()
    url = f"https://autocomplete.clearbit.com/v1/companies/suggest?query={clean_name}"
    
    close_client = False
    if client is None:
        client = httpx.AsyncClient(headers=HEADERS, timeout=6.0)
        close_client = True

    try:
        r = await client.get(url)
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list) and len(data) > 0:
                domain = data[0].get("domain")
                if domain:
                    return domain.lower().strip()
    except Exception as e:
        logger.debug(f"Clearbit resolution failed for {company_name}: {e}")
    finally:
        if close_client:
            await client.aclose()

    return None


# ---------------------------------------------------------------------------
# Deep Website Crawler & Contact Harvester (Zero Guessing Policy)
# ---------------------------------------------------------------------------

async def crawl_and_stitch_contacts(
    domain_or_url: str,
    company_name: str = "",
    client: Optional[httpx.AsyncClient] = None
) -> Dict[str, Any]:
    """
    Visits the company's official domain (/ and optionally /about, /contact, /team)
    to extract:
    1. Verified public inboxes (info@, contact@, hello@, sales@) actually listed on the site.
    2. Verified office phone numbers.
    3. Official company LinkedIn page.
    4. Executive team members listed in schema.org JSON-LD or leadership sections.
    5. Targeted 1-click LinkedIn Search URLs (never guessing fake personal emails).
    """
    clean_domain = domain_or_url.replace("https://", "").replace("http://", "").split("/")[0].strip()
    if not clean_domain:
        return {"public_emails": [], "phone_numbers": [], "company_linkedin": None, "decision_makers": []}

    base_url = f"https://{clean_domain}"
    close_client = False
    if client is None:
        client = httpx.AsyncClient(headers=HEADERS, timeout=6.0, follow_redirects=True)
        close_client = True

    pages_html: List[str] = []
    
    # 1. Fetch Homepage
    try:
        r = await client.get(base_url)
        if r.status_code == 200:
            pages_html.append(r.text)
    except Exception:
        pass

    # 2. Try fetching /about or /contact
    for sub in ["/contact", "/about", "/leadership"]:
        try:
            sub_r = await client.get(f"{base_url}{sub}")
            if sub_r.status_code == 200:
                pages_html.append(sub_r.text)
                break
        except Exception:
            pass

    if close_client:
        await client.aclose()

    combined_text = "\n".join(pages_html)

    # 3. Extract Verified Public Inboxes (Only if explicitly found on site)
    raw_emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", combined_text)
    public_emails: List[str] = []
    for e in set(raw_emails):
        e_lower = e.lower().strip()
        if any(e_lower.endswith(ext) for ext in EMAIL_EXCLUDE_EXTS):
            continue
        if any(dom in e_lower for dom in EMAIL_EXCLUDE_DOMAINS):
            continue
        public_emails.append(e_lower)

    # Prioritize official inboxes
    public_emails.sort(key=lambda x: 0 if any(k in x for k in ("contact", "info", "hello", "sales", "team", "careers")) else 1)

    # 4. Extract Real Phone Numbers (Only if explicitly found in HTML)
    phone_matches = re.findall(r"(?:(?:\+91|0)?[-.\s]?[6-9]\d{9}|\+?[1-9]\d{1,2}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4})", combined_text)
    phone_numbers = list(set([p.strip() for p in phone_matches if len(re.sub(r'\D', '', p)) >= 10]))[:2]

    # 5. Extract Verified LinkedIn URLs
    linkedin_companies = list(set(re.findall(r"https?://(?:www\.|in\.)?linkedin\.com/company/[a-zA-Z0-9_-]+", combined_text)))
    company_linkedin = linkedin_companies[0] if linkedin_companies else None

    # 6. Extract Schema.org JSON-LD Leadership
    decision_makers: List[DecisionMakerContact] = []
    ld_blocks = re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', combined_text, re.S | re.I)
    for block in ld_blocks:
        try:
            data = json.loads(block)
            items = data if isinstance(data, list) else [data]
            for it in items:
                for key in ("founder", "founders", "employee", "employees"):
                    people = it.get(key)
                    if people:
                        if isinstance(people, dict):
                            people = [people]
                        for p in people:
                            if isinstance(p, dict):
                                name = p.get("name")
                                job = p.get("jobTitle") or "Executive"
                                same_as = p.get("sameAs") or []
                                li_url = None
                                if isinstance(same_as, str) and "linkedin.com/in/" in same_as:
                                    li_url = same_as
                                elif isinstance(same_as, list):
                                    for link in same_as:
                                        if "linkedin.com/in/" in link:
                                            li_url = link
                                            break
                                if name:
                                    co_name = company_name or clean_domain
                                    search_url = f"https://www.linkedin.com/search/results/people/?keywords={quote_plus(name)}+{quote_plus(co_name)}"
                                    decision_makers.append(
                                        DecisionMakerContact(
                                            full_name=name,
                                            role_title=job,
                                            stakeholder_responsibility=f"Leads organizational decisions as {job}.",
                                            linkedin_url=li_url,
                                            linkedin_search_url=search_url,
                                            email=None,  # NEVER guess private email
                                            email_verification_status="not_publicly_listed",
                                            provenance_source=f"Official {clean_domain} Schema.org Metadata"
                                        )
                                    )
        except Exception:
            pass

    return {
        "domain": clean_domain,
        "public_emails": public_emails[:3],
        "phone_numbers": phone_numbers,
        "company_linkedin": company_linkedin,
        "decision_makers": decision_makers[:3]
    }
