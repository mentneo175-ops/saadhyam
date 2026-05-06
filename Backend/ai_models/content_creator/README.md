# Image Generation Microservice

A FastAPI microservice that generates images from prompts using either:

- Stable Diffusion via a local Automatic1111 API
- FLUX.1 Schnell via Hugging Face Inference API
- Mistral content-creator adapter flow to generate image prompt + caption before image generation

## Project Structure

```text
image_service/
├── app/
│   ├── main.py
│   ├── routes/
│   │   └── image.py
│   ├── services/
│   │   ├── sd_service.py
│   │   ├── flux_service.py
│   │   ├── prompt_builder.py
│   │   └── pipeline.py
│   ├── models/
│   │   └── schema.py
├── output/
│   └── images/
├── requirements.txt
└── README.md
```

## Install Dependencies

Create and activate a virtual environment, then install the requirements.

On this machine, use Python 3.14:

```powershell
C:\Users\surya\AppData\Local\Programs\Python\Python314\python.exe -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## Run the API

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Start Stable Diffusion API

Stable Diffusion generation uses the local Automatic1111 endpoint:

```text
http://127.0.0.1:7860/sdapi/v1/txt2img
```

Make sure Automatic1111 is running with the API enabled before sending `model: "sd"` requests.

## FLUX.1 Schnell Setup
If the model is gated for your account, set one of these environment variables before starting the service:

- `HUGGINGFACE_TOKEN`
- `HF_TOKEN`

## Mistral Content Creator Flow

When `use_content_creator` is `true` in the request payload:

1. The Mistral content creator generates:
  - `image_prompt`
  - `caption`
2. The generated `image_prompt` is sent to FLUX or SD for image generation.
3. The API response returns `generated_prompt` and `generated_caption`.

Content-creator mode options:

- `MISTRAL_CONTENT_MODE=api` (default): Uses Hugging Face Inference API for text generation.
- `MISTRAL_CONTENT_MODE=local`: Attempts local adapter inference from `mistral_adapter/checkpoint-*`.

Optional text model override:

- `MISTRAL_TEXT_MODEL=mistralai/Mistral-7B-Instruct-v0.3`

## Example API Request

```bash
curl -X POST http://127.0.0.1:8000/generate-image \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"luxury salon promotion\",
    \"business_type\": \"salon\",
    \"use_case\": \"poster\",
    \"style\": \"premium\",
    \"model\": \"flux\",
    \"use_content_creator\": true
  }"
```

Example response:

```json
{
  "status": "success",
  "image_path": "C:\\path\\to\\image_service\\output\\images\\salon_20260429_120000_000000.png",
  "image_url": "/image/salon_20260429_120000_000000.png",
  "model_used": "flux",
  "filename": "salon_20260429_120000_000000.png",
  "generated_prompt": "premium poster for salon, ...",
  "generated_caption": "Your next appointment deserves this vibe."
}
```

## Get the Generated Image

```text
GET /image/{filename}
```

## Notes

- Images are stored as `output/images/{business_type}_{timestamp}.png`.
- Stable Diffusion failures return a clear message if Automatic1111 is offline.
- FLUX model load failures return a clear message if the model cannot be downloaded or authenticated.
- The FLUX pipeline is instantiated only once per process.
```