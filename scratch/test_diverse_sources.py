import asyncio
import httpx
import xml.etree.ElementTree as ET
import re
from typing import List, Dict, Any

async def test_sources():
    async with httpx.AsyncClient(headers={"User-Agent": "Mozilla/5.0"}, timeout=8.0) as client:
        # 1. Arbeitnow
        r1 = await client.get("https://www.arbeitnow.com/api/job-board-api?page=1")
        jobs1 = r1.json().get("data", []) if r1.status_code == 200 else []
        print(f"[Arbeitnow] Found {len(jobs1)} jobs.")
        for j in jobs1[:2]:
            print(f"  * {j.get('company_name')} | {j.get('location')} | {j.get('title')}")

        # 2. Jobicy
        r2 = await client.get("https://jobicy.com/api/v2/remote-jobs?count=10")
        jobs2 = r2.json().get("jobs", []) if r2.status_code == 200 else []
        print(f"\n[Jobicy] Found {len(jobs2)} jobs.")
        for j in jobs2[:2]:
            print(f"  * {j.get('companyName')} | {j.get('jobGeo')} | {j.get('jobTitle')}")

        # 3. ET MSME
        r3 = await client.get("https://economictimes.indiatimes.com/small-biz/rssfeeds/5575607.cms")
        if r3.status_code == 200:
            root = ET.fromstring(r3.text)
            items = root.findall(".//item")
            print(f"\n[ET MSME] Found {len(items)} items.")
            for it in items[:2]:
                print(f"  * {it.findtext('title')} | {it.findtext('link')[:60]}")

if __name__ == "__main__":
    asyncio.run(test_sources())
