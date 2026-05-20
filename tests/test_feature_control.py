from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1] / "Backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from services.feature_control import evaluate_feature, get_feature_key_for_path


class _FakeResult:
    def __init__(self, row):
        self._row = row

    def first(self):
        return self._row


class _FakeMappings:
    def __init__(self, row):
        self._row = row

    def first(self):
        return self._row


class _FakeExecuteResult:
    def __init__(self, row):
        self._row = row

    def mappings(self):
        return _FakeMappings(self._row)


class _FakeDB:
    def __init__(self, feature_flags_row=None, feature_control_row=None):
        self.feature_flags_row = feature_flags_row
        self.feature_control_row = feature_control_row

    def execute(self, query, params):
        sql_text = str(query)
        if "FROM feature_flags" in sql_text:
            return _FakeExecuteResult(self.feature_flags_row)
        if "FROM feature_control" in sql_text:
            return _FakeExecuteResult(self.feature_control_row)
        return _FakeExecuteResult(None)


def test_feature_route_mapping():
    assert get_feature_key_for_path("/dashboard") == "analytics_dashboard"
    assert get_feature_key_for_path("/instagram/accounts") == "instagram_manager"
    assert get_feature_key_for_path("/api/instagram-analytics/reports") == "instagram_manager"
    assert get_feature_key_for_path("/auth/instagram/callback") == "instagram_manager"
    assert get_feature_key_for_path("/api/whatsapp/campaigns") == "whatsapp_campaigns"
    assert get_feature_key_for_path("/api/whatsapp/messages") == "whatsapp_campaigns"
    assert get_feature_key_for_path("/api/dashboard/analytics") == "analytics_dashboard"
    assert get_feature_key_for_path("/api/voice-agent/campaigns") == "voice_agent"
    assert get_feature_key_for_path("/api/tasks") == "content_scheduler"
    assert get_feature_key_for_path("/api/partnership") == "lead_management"
    assert get_feature_key_for_path("/webhooks/incoming") == "api_integration"
    assert get_feature_key_for_path("/settings/instagram/connection-status") == "security_center"
    assert get_feature_key_for_path("/unrelated/path") is None


def test_evaluate_feature_allows_enabled_feature_flag():
    db = _FakeDB(
        feature_flags_row={"key": "voice_agent", "name": "Voice Agent", "status": "enabled", "reason": None}
    )

    decision = evaluate_feature(db, "voice_agent")

    assert decision.allowed is True
    assert decision.mode == "enabled"
    assert decision.source == "feature_flags"


def test_evaluate_feature_blocks_disabled_feature_control():
    db = _FakeDB(
        feature_flags_row=None,
        feature_control_row={
            "feature_key": "analytics_dashboard",
            "feature_name": "Analytics Dashboard",
            "is_enabled": False,
            "is_maintenance": False,
            "maintenance_message": "Disabled for maintenance",
        },
    )

    decision = evaluate_feature(db, "analytics_dashboard")

    assert decision.allowed is False
    assert decision.mode == "disabled"
    assert decision.source == "feature_control"
    assert "Disabled" in decision.message or "maintenance" in decision.message.lower()


def test_evaluate_feature_defaults_to_allow_when_unconfigured():
    db = _FakeDB()

    decision = evaluate_feature(db, "unconfigured_feature")

    assert decision.allowed is True
    assert decision.source == "default"
