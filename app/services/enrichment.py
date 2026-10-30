import os
import asyncio
import re
import urllib.parse
from typing import List, Dict, Any, Tuple
import httpx
import trafilatura
from dotenv import load_dotenv

from app.schemas import ExternalEvidenceSnippet

load_dotenv()

USER_AGENT = "ICPClarityLab/1.0 (https://github.com/founder/icp-clarity-lab; b2b-profile-clarity-tool; contact: founder@claritylab.local)"
TIMEOUT_SECONDS = 4.0


# ---------------------------------------------------------------------------
# 1. Dual-Engine URL-to-Markdown Reader
# ---------------------------------------------------------------------------

async def fetch_clean_url_content(client: httpx.AsyncClient, url: str) -> List[ExternalEvidenceSnippet]:
    """
    Extracts clean, low-token Markdown from a target URL.
    Engine 1: Local Trafilatura (0 extra API calls, removes 75% boilerplate).
    Engine 2: r.jina.ai fallback if page is client-rendered SPA.
    """
    clean_url = url.strip()
    if not clean_url.startswith(("http://", "https://")):
        clean_url = f"https://{clean_url}"

    snippets: List[ExternalEvidenceSnippet] = []

    try:
        # Step A: Direct fetch with Trafilatura local extraction
        resp = await client.get(
            clean_url,
            headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"},
            timeout=TIMEOUT_SECONDS,
            follow_redirects=True
        )

        extracted_text = ""
        if resp.status_code == 200:
            extracted_text = trafilatura.extract(
                resp.text,
                output_format="markdown",
                include_links=False,
                include_images=False,
                include_tables=True,
                no_fallback=False
            ) or ""

        # Step B: If Trafilatura extracted very little (SPA / heavy JS), try Jina Reader
        if len(extracted_text.strip()) < 120:
            jina_url = f"https://r.jina.ai/{clean_url}"
            jina_headers = {"User-Agent": USER_AGENT}
            jina_key = os.getenv("JINA_API_KEY", "").strip()
            if jina_key:
                jina_headers["Authorization"] = f"Bearer {jina_key}"

            jina_resp = await client.get(jina_url, headers=jina_headers, timeout=TIMEOUT_SECONDS)
            if jina_resp.status_code == 200:
                extracted_text = jina_resp.text

        # Step C: Token truncation (clean 1,200 chars ~ 300 tokens)
        if extracted_text and len(extracted_text.strip()) >= 50:
            condensed = re.sub(r"\s+", " ", extracted_text).strip()
            preview = condensed[:800] + ("..." if len(condensed) > 800 else "")
            parsed_domain = urllib.parse.urlparse(clean_url).netloc
            snippets.append(ExternalEvidenceSnippet(
                source_type="url_extracted",
                title=f"Extracted Content: {parsed_domain}",
                snippet=preview,
                url=clean_url
            ))

    except Exception as e:
        print(f"[Enrichment] URL extraction error for {clean_url}: {e}")

    return snippets


# ---------------------------------------------------------------------------
# 2. Hacker News Algolia Official API (10,000 req/hr Free JSON)
# ---------------------------------------------------------------------------

async def fetch_hn_signals(client: httpx.AsyncClient, query: str) -> List[ExternalEvidenceSnippet]:
    """
    Searches Hacker News for real founder, CTO, and operator discussions.
    100% official, zero blocks, no API key required.
    """
    snippets: List[ExternalEvidenceSnippet] = []
    encoded_q = urllib.parse.quote(query)
    api_url = f"https://hn.algolia.com/api/v1/search?query={encoded_q}&tags=(story,ask_hn)&hitsPerPage=3"

    try:
        resp = await client.get(api_url, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT_SECONDS)
        if resp.status_code == 200:
            data = resp.json()
            for hit in data.get("hits", [])[:3]:
                title = hit.get("title", "")
                object_id = hit.get("objectID", "")
                text = hit.get("story_text") or hit.get("comment_text") or ""
                clean_snippet = re.sub(r"<[^>]+>", " ", text)
                clean_snippet = re.sub(r"\s+", " ", clean_snippet).strip()
                if not clean_snippet:
                    clean_snippet = f"Discussion on Hacker News regarding {title}."

                target_url = hit.get("url") or f"https://news.ycombinator.com/item?id={object_id}"
                snippets.append(ExternalEvidenceSnippet(
                    source_type="hacker_news",
                    title=f"HN Discussion: {title[:80]}",
                    snippet=clean_snippet[:250],
                    url=target_url
                ))
    except Exception as e:
        print(f"[Enrichment] HN Algolia search error for query '{query}': {e}")

    return snippets


# ---------------------------------------------------------------------------
# 3. Wikipedia Action API (Official Public Knowledge API)
# ---------------------------------------------------------------------------

async def fetch_wikipedia_context(client: httpx.AsyncClient, query: str) -> List[ExternalEvidenceSnippet]:
    """
    Retrieves industry taxonomy, value chain definitions, and terminology from Wikipedia.
    100% official, free, requires polite User-Agent.
    """
    snippets: List[ExternalEvidenceSnippet] = []
    encoded_q = urllib.parse.quote(query)
    api_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={encoded_q}&format=json&utf8=1&srlimit=2"

    try:
        resp = await client.get(api_url, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT_SECONDS)
        if resp.status_code == 200:
            data = resp.json()
            for item in data.get("query", {}).get("search", [])[:2]:
                title = item.get("title", "")
                snippet_raw = item.get("snippet", "")
                clean_snippet = re.sub(r"<[^>]+>", " ", snippet_raw)
                clean_snippet = re.sub(r"\s+", " ", clean_snippet).strip()
                page_url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"

                snippets.append(ExternalEvidenceSnippet(
                    source_type="wikipedia",
                    title=f"Industry Reference: {title}",
                    snippet=clean_snippet[:250],
                    url=page_url
                ))
    except Exception as e:
        print(f"[Enrichment] Wikipedia search error for query '{query}': {e}")

    return snippets


# ---------------------------------------------------------------------------
# 4. StackExchange API (Official Workflow & Engineering Pains)
# ---------------------------------------------------------------------------

async def fetch_stackexchange_signals(client: httpx.AsyncClient, query: str) -> List[ExternalEvidenceSnippet]:
    """
    Retrieves technical and operational workflow discussions from StackExchange.
    Official, keyless, rate-friendly.
    """
    snippets: List[ExternalEvidenceSnippet] = []
    # Pick top 2 keywords to avoid overly constrained search
    words = [w for w in re.findall(r"[A-Za-z]{4,}", query) if w.lower() not in {"pain", "points", "workflow", "buyer"}][:2]
    if not words:
        return snippets

    se_query = " ".join(words)
    encoded_q = urllib.parse.quote(se_query)
    api_url = f"https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q={encoded_q}&site=softwareengineering&pagesize=2"

    try:
        resp = await client.get(api_url, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT_SECONDS)
        if resp.status_code == 200:
            data = resp.json()
            for item in data.get("items", [])[:2]:
                title = item.get("title", "")
                link = item.get("link", "")
                clean_title = re.sub(r"&[a-z]+;", " ", title)
                snippets.append(ExternalEvidenceSnippet(
                    source_type="stackexchange",
                    title=f"StackExchange Workflow: {clean_title[:80]}",
                    snippet=f"Developer & operator discussion on: {clean_title}",
                    url=link
                ))
    except Exception as e:
        print(f"[Enrichment] StackExchange search error for '{query}': {e}")

    return snippets


# ---------------------------------------------------------------------------
# 5. Master Non-Blocking Enrichment Pipeline
# ---------------------------------------------------------------------------

async def gather_enrichment_signals(
    search_queries: List[str],
    urls: List[str]
) -> Tuple[List[ExternalEvidenceSnippet], Dict[str, Any]]:
    """
    Executes parallel, non-blocking enrichment across all sources with a strict timeout.
    Returns:
    - List of deduplicated, token-capped snippets.
    - Telemetry audit dictionary.
    """
    telemetry: Dict[str, Any] = {
        "sources_queried": [],
        "snippets_count": 0,
        "estimated_tokens": 0,
        "urls_processed": len(urls)
    }

    snippets: List[ExternalEvidenceSnippet] = []
    tasks = []

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS, follow_redirects=True) as client:
        # A. Process URLs
        for u in urls[:3]:
            if u.strip():
                tasks.append(fetch_clean_url_content(client, u.strip()))
                telemetry["sources_queried"].append(f"url:{u[:30]}")

        # B. Process Search Queries
        for q in search_queries[:3]:
            if q.strip():
                tasks.append(fetch_hn_signals(client, q.strip()))
                tasks.append(fetch_wikipedia_context(client, q.strip()))
                tasks.append(fetch_stackexchange_signals(client, q.strip()))
                telemetry["sources_queried"].append(f"query:{q[:25]}")

        # Execute all concurrently with error isolation
        results = await asyncio.gather(*tasks, return_exceptions=True)

        seen_urls = set()
        total_chars = 0

        for r in results:
            if isinstance(r, list):
                for item in r:
                    if isinstance(item, ExternalEvidenceSnippet) and item.url not in seen_urls:
                        # Enforce hard total context cap (5,000 chars ~ 1,250 tokens)
                        if total_chars + len(item.snippet) <= 5000:
                            snippets.append(item)
                            seen_urls.add(item.url)
                            total_chars += len(item.snippet)

    telemetry["snippets_count"] = len(snippets)
    telemetry["estimated_tokens"] = int(total_chars / 4)

    return snippets, telemetry
