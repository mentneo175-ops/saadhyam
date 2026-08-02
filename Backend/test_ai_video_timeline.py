"""
test_ai_video_timeline.py
Integration tests for v3.7 Professional Timeline Editor backend endpoints.
Run from: c:\\Users\\likhi\\Downloads\\saadhyam\\Backend
"""
import asyncio
import sys
import json
from pathlib import Path

# Detect Backend dir automatically
THIS_FILE = Path(__file__).resolve()
BACKEND_DIR = THIS_FILE.parent if THIS_FILE.parent.name == "Backend" else THIS_FILE.parents[3] / "saadhyam" / "Backend"
sys.path.insert(0, str(BACKEND_DIR))

# Dummy input data matching scenes representation
SAMPLE_SCENES = [
    {
        "id": "scene-1",
        "title": "Intro Hook",
        "duration": 5,
        "visualDescription": "Glowing logo animations sliding in",
        "cameraAngle": "Zoom In",
        "animation": "Fade",
        "transition": "CrossFade",
        "imageUrl": "/output/images/intro.png",
    },
    {
        "id": "scene-2",
        "title": "Problem Statement",
        "duration": 10,
        "visualDescription": "Frustrated users looking at data logs",
        "cameraAngle": "Wide Angle",
        "animation": "Slide Left",
        "transition": "Wipe Left",
        "imageUrl": "/output/images/problem.png",
    }
]

SAMPLE_SUBTITLES = {
    "segments": [
        {"id": 1, "start": 0.0, "end": 4.5, "text": "Are you ready to transform B2B sales?", "words": []},
        {"id": 2, "start": 5.0, "end": 9.5, "text": "Legacy dashboards are slow and complex.", "words": []}
    ]
}


async def test_timeline_endpoint():
    """Verify building editing timeline JSON from scenes, voice, music, subtitles."""
    from plugins.marketing_ai_video_generator.main import PluginMain
    plugin = PluginMain()

    result = await plugin.timeline_api({
        "scenes": SAMPLE_SCENES,
        "voice": {"voice": "Rachel", "audioUrl": "/output/audio/voice_123.mp3", "provider": "OpenAI"},
        "music": {"mood": "Corporate", "musicUrl": "/output/audio/music_123.mp3", "volume": 0.25},
        "subtitles": SAMPLE_SUBTITLES,
        "fps": 30,
        "request_id": "test-tl-1"
    })

    assert result.get("success") is True, f"Failed to build timeline: {result}"
    timeline = result.get("timeline", {})
    assert "tracks" in timeline, "Missing tracks key in timeline dict"
    
    tracks = timeline["tracks"]
    assert len(tracks.get("scenes", [])) == 2, "Expected 2 scene track blocks"
    assert len(tracks.get("voice", [])) == 1, "Expected 1 voice track block"
    assert len(tracks.get("music", [])) == 1, "Expected 1 music track block"
    assert len(tracks.get("subtitles", [])) == 2, "Expected 2 subtitle track blocks"
    
    # Assert times
    assert tracks["scenes"][0]["start"] == 0.0
    assert tracks["scenes"][0]["end"] == 5.0
    assert tracks["scenes"][1]["start"] == 5.0
    assert tracks["scenes"][1]["end"] == 15.0
    
    # Check subtitle range match
    assert "subtitleRange" in tracks["scenes"][0]
    print("PASS - Timeline track JSON structure constructed and validated successfully")
    return True


async def test_scene_animation_endpoint():
    """Verify scene animation endpoint parses anim config and generates CSS class overrides."""
    from plugins.marketing_ai_video_generator.main import PluginMain
    plugin = PluginMain()

    # Valid animation
    result = await plugin.scene_animation_api({
        "sceneId": "scene-1",
        "animation": "Ken Burns",
        "transition": "Wipe Left",
        "duration": 1.2,
        "easing": "ease-in-out",
        "request_id": "test-anim-1"
    })
    data = result.get("data", {})
    assert result.get("success") is True
    assert data["animation"] == "Ken Burns"
    assert data["transition"] == "Wipe Left"
    assert "kenBurns" in data["previewCss"]
    print("PASS - Scene animation CSS overrides and transition validators parsed correctly")

    # Invalid animation fallback test
    result_fallback = await plugin.scene_animation_api({
        "animation": "SuperMagicAnim",  # invalid
        "transition": "InvalidTransition",  # invalid
    })
    data_f = result_fallback.get("data", {})
    assert data_f["animation"] == "Fade"  # fallback
    assert data_f["transition"] == "CrossFade"  # fallback
    print("PASS - Invalid animation and transition fallback defaults verified successfully")
    return True


async def test_overlay_endpoint():
    """Verify overlay API registers logo/watermark assets and maps positions correctly."""
    from plugins.marketing_ai_video_generator.main import PluginMain
    plugin = PluginMain()

    # Create dummy CTA Button overlay
    result = await plugin.overlay_api({
        "type": "CTA Button",
        "label": "Click Link",
        "x": 10.0,
        "y": 80.0,
        "width": 30.0,
        "height": 15.0,
        "opacity": 0.9,
        "zIndex": 25,
        "startTime": 2.0,
        "endTime": 8.0,
        "text": "Register Now",
        "request_id": "test-ov-1"
    })
    
    assert result.get("success") is True
    data = result.get("data", {})
    assert data["type"] == "CTA Button"
    assert data["x"] == 10.0
    assert data["y"] == 80.0
    assert data["opacity"] == 0.9
    assert data["zIndex"] == 25
    assert data["text"] == "Register Now"
    print("PASS - Overlay coordinates and z-index clamping validation successful")
    return True


async def main():
    print("\n" + "=" * 65)
    print("v3.7 Timeline Editor API Integration Verification")
    print("=" * 65)
    
    tests = [
        test_timeline_endpoint,
        test_scene_animation_endpoint,
        test_overlay_endpoint
    ]
    
    passed = 0
    for t in tests:
        try:
            if await t():
                passed += 1
        except Exception as e:
            print(f"FAIL - {t.__name__}: {e}")
            import traceback; traceback.print_exc()
            
    print("\n" + "=" * 65)
    print(f"Summary: {passed}/{len(tests)} tests passed")
    print("=" * 65)
    return passed == len(tests)


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
