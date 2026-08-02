"""
test_ai_video_subtitles.py
Integration tests for v3.6 AI Subtitle Generation & Animated Captions endpoints.
Run from: c:\\Users\\likhi\\Downloads\\saadhyam\\Backend
"""
# -*- coding: utf-8 -*-
import asyncio
import sys
import json
from pathlib import Path

# The script may be in Backend/ or in the scratch dir - detect automatically
THIS_FILE = Path(__file__).resolve()
BACKEND_DIR = THIS_FILE.parent if THIS_FILE.parent.name == "Backend" else THIS_FILE.parents[3] / "saadhyam" / "Backend"
sys.path.insert(0, str(BACKEND_DIR))

SAMPLE_NARRATION = (
    "Our AI Video Generator helps businesses create professional marketing videos in minutes. "
    "Simply enter your product details and our advanced AI will craft a compelling script, "
    "generate stunning visuals, and produce studio-quality voiceovers automatically. "
    "Try it today and transform your marketing strategy."
)

SAMPLE_SEGMENTS = [
    {"id": 1, "start": 0.0, "end": 3.5, "text": "Our AI Video Generator helps businesses", "words": []},
    {"id": 2, "start": 3.5, "end": 7.0, "text": "create professional marketing videos in minutes.", "words": []},
    {"id": 3, "start": 7.0, "end": 11.0, "text": "Simply enter your product details", "words": []},
    {"id": 4, "start": 11.0, "end": 15.5, "text": "and our AI will craft a compelling script.", "words": []},
]


async def test_empty_narration_returns_400():
    """Empty narration must raise ValueError."""
    from plugins.marketing_ai_video_generator.main import PluginMain
    plugin = PluginMain()
    try:
        await plugin.generate_subtitles_api({"narration": "", "request_id": "t-400"})
        print("FAIL - expected ValueError for empty narration")
        return False
    except ValueError as e:
        print(f"PASS - Empty narration -> ValueError: {e}")
        return True


async def test_subtitle_generation():
    """Subtitle generation should return segments and SRT/VTT/ASS/TXT files."""
    from plugins.marketing_ai_video_generator.main import PluginMain
    plugin = PluginMain()
    result = await plugin.generate_subtitles_api({
        "narration": SAMPLE_NARRATION,
        "language": "en",
        "quality": "fast",
        "outputFormats": ["srt", "vtt", "ass", "txt"],
        "projectTitle": "test_video",
        "request_id": "t-gen"
    })

    segments = result.get("segments", [])
    provider = result.get("provider", "")
    srt_url = result.get("srtUrl", "")
    vtt_url = result.get("vttUrl", "")
    ass_url = result.get("assUrl", "")
    txt_url = result.get("txtUrl", "")

    assert len(segments) > 0, "No segments generated"
    assert provider, "Provider not returned"
    print(f"PASS - Subtitle generation: {len(segments)} segments via {provider}")

    # Verify word timestamps exist
    has_words = any(len(s.get("words", [])) > 0 for s in segments)
    print(f"PASS - Word timestamps: {'present' if has_words else 'absent (fallback mode)'}")

    # Verify file creation
    for url, label in [(srt_url, "SRT"), (vtt_url, "VTT"), (ass_url, "ASS"), (txt_url, "TXT")]:
        if url:
            fpath = BACKEND_DIR / url.lstrip("/")
            if fpath.exists() and fpath.stat().st_size > 0:
                print(f"PASS - {label} file exists: {fpath.name} ({fpath.stat().st_size} bytes)")
            else:
                print(f"FAIL - {label} file missing or empty: {fpath}")
        else:
            print(f"WARN - {label} URL not returned")

    return True


async def test_subtitle_presets():
    """Presets endpoint must return 8 presets."""
    from plugins.marketing_ai_video_generator.main import PluginMain
    plugin = PluginMain()
    presets = plugin.get_subtitle_presets()
    assert len(presets) == 8, f"Expected 8 presets, got {len(presets)}"
    expected_names = {"TikTok", "Instagram Reels", "YouTube Shorts", "Corporate", "Netflix", "Cinematic", "Gaming", "Minimal"}
    returned_names = {p["name"] for p in presets}
    assert returned_names == expected_names, f"Preset names mismatch: {returned_names}"
    print(f"PASS - Subtitle presets: {len(presets)} presets returned correctly")
    return True


async def test_upload_srt_parsing():
    """Upload SRT content should parse into segments correctly."""
    from plugins.marketing_ai_video_generator.main import PluginMain
    plugin = PluginMain()
    sample_srt = """1\n00:00:00,000 --> 00:00:02,500\nOur AI Video Generator\n\n2\n00:00:02,500 --> 00:00:05,000\nhelps businesses create videos.\n\n"""
    result = await plugin.upload_subtitles_api({"content": sample_srt, "format": "srt"})
    segs = result.get("segments", [])
    assert len(segs) == 2, f"Expected 2 segments from SRT, got {len(segs)}"
    assert segs[0]["text"] == "Our AI Video Generator"
    assert abs(segs[0]["start"] - 0.0) < 0.01
    assert abs(segs[0]["end"] - 2.5) < 0.01
    print(f"PASS - SRT upload parse: {len(segs)} segments parsed correctly")
    return True


async def test_export_srt():
    """Export endpoint should produce a valid SRT file."""
    from plugins.marketing_ai_video_generator.main import PluginMain
    plugin = PluginMain()
    result = await plugin.export_subtitles_api({
        "segments": SAMPLE_SEGMENTS,
        "format": "srt",
        "captionStyle": {},
        "projectTitle": "test_export",
        "request_id": "t-exp"
    })
    file_url = result.get("fileUrl", "")
    assert file_url, "No fileUrl returned"
    fpath = BACKEND_DIR / file_url.lstrip("/")
    assert fpath.exists() and fpath.stat().st_size > 0, f"Export SRT file missing: {fpath}"
    content = fpath.read_text(encoding="utf-8")
    assert "-->" in content, "SRT content missing timing arrows"
    print(f"PASS - SRT export: {fpath.name} ({fpath.stat().st_size} bytes)")
    return True


async def test_translation():
    """Translation should return translated segments (may use fallback copy)."""
    from plugins.marketing_ai_video_generator.main import PluginMain
    plugin = PluginMain()
    result = await plugin.translate_subtitles_api({
        "segments": SAMPLE_SEGMENTS,
        "targetLanguages": ["hi"],
        "projectTitle": "test_translate",
        "request_id": "t-trans"
    })
    translations = result.get("translations", {})
    files = result.get("files", {})
    assert "hi" in translations, "Hindi translation not in result"
    assert len(translations["hi"]) == len(SAMPLE_SEGMENTS), "Segment count mismatch after translation"
    assert "hi" in files, "Hindi file paths not returned"
    print(f"PASS - Translation: {len(translations['hi'])} segments translated to Hindi")
    return True


async def main():
    print("\n" + "=" * 60)
    print("v3.6 Subtitle Generation Integration Tests")
    print("=" * 60)
    results = []
    for test_fn in [
        test_empty_narration_returns_400,
        test_subtitle_generation,
        test_subtitle_presets,
        test_upload_srt_parsing,
        test_export_srt,
        test_translation,
    ]:
        try:
            result = await test_fn()
            results.append(result)
        except Exception as e:
            print(f"FAIL – {test_fn.__name__}: {e}")
            import traceback; traceback.print_exc()
            results.append(False)
    print("\n" + "=" * 60)
    passed = sum(1 for r in results if r)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    print("=" * 60)
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
