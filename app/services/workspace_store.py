import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

WORKSPACE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".cache", "workspaces")
os.makedirs(WORKSPACE_DIR, exist_ok=True)


def _get_campaign_path(campaign_id: str) -> str:
    clean_id = "".join(c for c in campaign_id if c.isalnum() or c in ("-", "_"))
    return os.path.join(WORKSPACE_DIR, f"{clean_id}.json")


def save_campaign(name: str, brief: Dict[str, Any], leads: List[Dict[str, Any]], campaign_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Saves or updates an ICP Prospecting Campaign to local disk storage.
    """
    if not campaign_id:
        campaign_id = f"camp_{uuid.uuid4().hex[:10]}"

    # Ensure every lead has a stable unique ID
    for idx, lead in enumerate(leads):
        if not lead.get("id"):
            lead["id"] = f"lead_{campaign_id}_{idx}"
        if not lead.get("crm_status"):
            lead["crm_status"] = "new"

    record = {
        "id": campaign_id,
        "name": name or f"Campaign - {datetime.now(timezone.utc).strftime('%b %d, %Y')}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "brief": brief,
        "leads_count": len(leads),
        "leads": leads
    }

    path = _get_campaign_path(campaign_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2, ensure_ascii=False)

    return record


def list_campaigns() -> List[Dict[str, Any]]:
    """Returns a list of all saved GTM campaigns without full lead details."""
    campaigns = []
    if not os.path.exists(WORKSPACE_DIR):
        return []

    for fname in os.listdir(WORKSPACE_DIR):
        if fname.endswith(".json"):
            path = os.path.join(WORKSPACE_DIR, fname)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    campaigns.append({
                        "id": data.get("id"),
                        "name": data.get("name"),
                        "created_at": data.get("created_at"),
                        "leads_count": len(data.get("leads", [])),
                        "brief_offering": data.get("brief", {}).get("core_offering", "")
                    })
            except Exception:
                pass

    campaigns.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return campaigns


def get_campaign(campaign_id: str) -> Optional[Dict[str, Any]]:
    """Loads a full campaign record by ID."""
    path = _get_campaign_path(campaign_id)
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def update_lead_status(campaign_id: str, lead_id: str, crm_status: str) -> bool:
    """Updates the CRM outreach status of a single prospect in a campaign."""
    path = _get_campaign_path(campaign_id)
    if not os.path.exists(path):
        return False

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        updated = False
        for lead in data.get("leads", []):
            if lead.get("id") == lead_id:
                lead["crm_status"] = crm_status
                updated = True
                break

        if updated:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
    except Exception:
        pass

    return False
