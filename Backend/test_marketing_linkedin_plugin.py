import asyncio

from plugins.marketing_linkedin.main import PluginMain


def test_linkedin_plugin_is_importable_and_configurable():
    plugin = PluginMain()
    assert plugin.plugin_key == "marketing_linkedin"
    assert plugin.validate_config({
        "linkedin_access_token": "token-123",
        "company_page_url": "https://www.linkedin.com/company/saadhyam"
    }) is True

    result = asyncio.run(plugin.create_campaign({"user_config": {}}, {
        "campaign_name": "Q3 Outreach",
        "objective": "lead_generation"
    }))
    assert result["success"] is True
