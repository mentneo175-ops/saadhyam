"""Test Website AI router import"""
try:
    from ai_models.website_ai.app.api.v1.routes import generation as website_ai_generation
    from ai_models.website_ai.app.api.v1.routes import jobs as website_ai_jobs
    from ai_models.website_ai.app.routes import website as website_ai_website
    from ai_models.website_ai.app.routes import api as website_ai_api
    print("✅ All Website AI routers imported successfully")
except Exception as e:
    print(f"❌ Failed to import Website AI routers: {e}")
    import traceback
    traceback.print_exc()
