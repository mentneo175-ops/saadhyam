from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict

from services.redis_service import get_redis_client
from feature_flags import _check_trial_usage_and_increment
from . import auth, models

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/feature-trials", response_model=List[Dict])
async def list_feature_trials(current_user: models.User = Depends(auth.require_super_admin)) -> List[Dict]:
    """Return a list of per-user per-feature trial counters with TTLs.
    Falls back to the in-memory store used when Redis is unavailable.
    """
    results = []

    # Try Redis first
    try:
        client = await get_redis_client()
        if client:
            keys = await client.keys("feature_trial:*")
            # aioredis may return bytes
            for k in keys:
                key = k.decode() if isinstance(k, (bytes, bytearray)) else str(k)
                # key format: feature_trial:{user_id}:{feature_key}
                parts = key.split(":", 2)
                if len(parts) != 3:
                    continue
                _, user_id, feature_key = parts
                try:
                    count = await client.get(key)
                    ttl = await client.ttl(key)
                    count = int(count) if count is not None else 0
                except Exception:
                    count = None
                    ttl = None
                results.append({"user_id": user_id, "feature_key": feature_key, "count": count, "ttl_seconds": ttl})
            return results
    except Exception:
        # fallthrough to in-memory
        pass

    # Fallback: inspect in-memory store used by feature_flags
    try:
        store = getattr(_check_trial_usage_and_increment, "_local_store", None)
        if store:
            for key, entry in store.items():
                parts = key.split(":", 2)
                if len(parts) != 3:
                    continue
                _, user_id, feature_key = parts
                results.append({"user_id": user_id, "feature_key": feature_key, "count": entry.get("count"), "ttl_seconds": int(entry.get("expiry", 0) - __import__('time').time())})
            return results
    except Exception:
        pass

    # If neither Redis nor in-memory store available, return empty list
    return results


@router.post("/feature-trials/reset")
async def reset_feature_trial(payload: Dict, current_user: models.User = Depends(auth.require_super_admin)):
    user_id = payload.get("user_id")
    feature_key = payload.get("feature_key")
    if not user_id or not feature_key:
        raise HTTPException(status_code=400, detail="user_id and feature_key are required")

    key = f"feature_trial:{user_id}:{feature_key}"

    try:
        client = await get_redis_client()
        if client:
            deleted = await client.delete(key)
            return {"ok": True, "deleted": bool(deleted), "key": key}
    except Exception:
        pass

    try:
        store = getattr(_check_trial_usage_and_increment, "_local_store", None)
        if store and key in store:
          del store[key]
          return {"ok": True, "deleted": True, "key": key}
    except Exception:
        pass

    return {"ok": True, "deleted": False, "key": key}
