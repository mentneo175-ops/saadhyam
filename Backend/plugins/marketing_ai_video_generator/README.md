# AI Video Generator Plugin — v2.0

**Plugin Key:** `marketing_ai_video_generator`  
**Author:** Saadhyam AI  
**Version:** v2.0 — Production Ready Skeleton  
**Category:** Marketing

---

## Overview

The **AI Video Generator** plugin provides a complete backend skeleton for creating
marketing video projects using AI-assisted workflows. It integrates into the Saadhyam AI
plugin marketplace and exposes a structured action surface for:

- Generating professional video scripts from product descriptions
- Building scene-by-scene storyboards with timing and camera metadata
- Generating placeholder image manifests per scene
- Configuring and synthesising voiceover tracks
- Producing timed subtitle and caption entries
- Assembling full video timeline preview manifests
- Exporting projects as TXT, CSV, and JSON documents

> **v2.0 scope:** All action handlers return structured placeholder responses.  
> External AI services (OpenAI, ElevenLabs, Stable Diffusion, FFmpeg) are **not** integrated.  
> Live AI integrations are planned for **v3.0**.

---

## Architecture

```
Backend/
└── plugins/
    └── marketing_ai_video_generator/
        ├── __init__.py        # Package initialiser
        ├── manifest.json      # Plugin metadata, permissions, and actions registry
        ├── main.py            # PluginMain class — all action handlers
        └── README.md          # This file
```

### Class Hierarchy

```
AIPlugin (plugins/base.py)
    └── PluginMain (marketing_ai_video_generator/main.py)
```

`PluginMain` inherits from `AIPlugin` (which extends `BasePlugin`) and overrides:

| Method | Purpose |
|---|---|
| `get_info()` | Returns plugin metadata dict |
| `get_actions()` | Returns the full action registry list |
| `get_config_schema()` | Returns JSON schema for configuration |
| `validate_config(config)` | Validates incoming config against schema |
| `health_check()` | Returns `{"status": "healthy", "code": 200}` |
| `execute(action, params)` | Central dispatcher routing to sub-handlers |

---

## Workflow

The plugin supports a **10-step video creation workflow** that maps 1:1 to the
frontend wizard steps:

| Step | Frontend Label | Backend Action |
|---|---|---|
| 1 | Welcome | — (no action) |
| 2 | Brand Setup | `validate_config()` |
| 3 | Video Configuration | `validate_config()` |
| 4 | AI Script Generator | `generate_script` |
| 5 | Storyboard Builder | `generate_storyboard` |
| 6 | AI Image Generator | `generate_images` |
| 7 | Voice Synthesis | `generate_voice` |
| 8 | Caption Generator | `generate_captions` |
| 9 | Timeline Preview | `preview_video` |
| 10 | Export Engine | `export_project` |

---

## Configuration Schema

```json
{
  "business_name":      "string — Brand name displayed in the video",
  "website":            "string — Brand website URL for CTA overlays",
  "industry":           "string — Business industry vertical",
  "brand_primary_color":"string — Primary hex color (e.g. #a855f7)",
  "brand_secondary_color":"string — Secondary hex color",
  "preferred_platform": "string — Instagram | YouTube | TikTok | Facebook | LinkedIn",
  "video_style":        "string — animated | live_action | mixed",
  "voice_gender":       "string — Female | Male"
}
```

No fields are required — all configuration is optional and stored locally by the frontend.

---

## Supported Actions

### `generate_script`
Generate a structured video script including hook, body narration, scene breakdowns, and CTA.

```python
params = {
    "product": "Saadhyam AI",           # required
    "offer": "20% off first month",     # optional
    "keywords": ["SaaS", "automation"], # optional
    "platform": "Instagram",            # optional
    "duration": "30s",                  # optional
}
```

**Returns:** `{ title, hook, narration, scenes: [...], cta, platform, target_duration }`

---

### `generate_storyboard`
Build a scene list with timing, camera angles, animations, and transitions.

```python
params = {
    "script_title":     "Introducing Saadhyam AI",  # required
    "script_narration": "Full narration text...",   # required
    "num_scenes":       4,                          # optional (default 4, max 10)
}
```

**Returns:** `{ title, total_scenes, total_duration_s, scenes: [...] }`

---

### `generate_images`
Generate placeholder image metadata (gradient themes, AI prompts) per scene.

```python
params = {
    "scenes":       [...],      # required — storyboard scene list
    "brand_color":  "#a855f7",  # optional
    "style":        "corporate" # optional
}
```

**Returns:** `{ scenes: [...enriched with image_gradient, image_prompt, image_status] }`

---

### `generate_voice`
Compute voiceover configuration and estimated duration from narration text.

```python
params = {
    "narration": "Full narration text...",  # required
    "gender":    "Female",                  # optional
    "accent":    "US English",              # optional
    "speed":     "1.0x",                   # optional
}
```

**Returns:** `{ gender, accent, speed, word_count, estimated_duration_s, audio_status }`

---

### `generate_captions`
Distribute narration across scenes to produce timed subtitle entries.

```python
params = {
    "narration":   "Full narration text...",  # required
    "scenes":      [...],                     # required
    "font_family": "Inter",                   # optional
    "position":    "Bottom Center",           # optional
}
```

**Returns:** `{ total_captions, captions: [{ start_time_s, end_time_s, text, ... }] }`

---

### `preview_video`
Assemble a complete timeline manifest combining all layers.

```python
params = {
    "scenes":         [...],                # required
    "voice_config":   { "gender": ... },   # optional
    "caption_config": { "position": ... }, # optional
    "music_track":    "Corporate Tech",    # optional
}
```

**Returns:** `{ total_duration_s, timeline_tracks: [video, voice, captions, music], render_status }`

---

### `export_project`
Package full project into text, CSV, and JSON export strings.

```python
params = {
    "project_data": { ... },  # required — full project state
    "format":       "txt",    # optional — "txt" | "csv" | "json" | "mp4"
}
```

**Returns:** `{ txt_content, csv_content, json_content, mp4_status, timestamp }`

---

### `health_check`
Verify plugin availability and list sub-module status.

```python
# Called via: plugin.health_check()  OR  plugin.execute("health_check", {})
```

**Returns:**

```json
{
    "status": "healthy",
    "code": 200,
    "message": "AI Video Generator Plugin v2.0 is online and responsive.",
    "modules": { ... },
    "external_services": { ... }
}
```

---

## Testing

To validate the plugin from the Backend root:

```bash
cd Backend
py -3.11 -c "
from plugins.marketing_ai_video_generator.main import PluginMain

plugin = PluginMain()
print('get_info()      :', plugin.get_info())
print('get_actions()   :', [a['action'] for a in plugin.get_actions()])
print('health_check()  :', plugin.health_check())
print()

# generate_script
result = plugin.execute('generate_script', {'product': 'Saadhyam AI', 'platform': 'YouTube'})
print('generate_script :', result['success'], result['data']['title'])

# generate_storyboard
sb = plugin.execute('generate_storyboard', {
    'script_title': result['data']['title'],
    'script_narration': result['data']['narration'],
    'num_scenes': 4,
})
print('storyboard      :', sb['success'], sb['data']['total_scenes'], 'scenes')

# health_check via execute
hc = plugin.execute('health_check', {})
print('health via exec :', hc['status'], hc['code'])
"
```

---

## Future Roadmap

### v3.0 — External AI Integrations

| Feature | Service |
|---|---|
| AI Script Generation | OpenAI GPT-4o |
| AI Image Generation | Stable Diffusion / DALL-E 3 |
| AI Voice Synthesis | ElevenLabs / AWS Polly |
| Word-level Captions | OpenAI Whisper |
| MP4 Video Rendering | FFmpeg / MoviePy |
| Project Cloud Storage | AWS S3 / Firebase Storage |

### v4.0 — Platform Publishing

| Feature | Service |
|---|---|
| Instagram Publish | Instagram Graph API |
| YouTube Upload | YouTube Data API v3 |
| LinkedIn Video | LinkedIn Video API |
| TikTok Post | TikTok Display API |
