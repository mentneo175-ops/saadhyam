# Review Reply AI Module

Professional AI-powered customer review reply generator for Saadhyam AI.

## 📋 Overview

The Review Reply AI module generates professional, contextual replies to customer reviews using:
- **Base Model**: Mistral-7B-Instruct-v0.2
- **Fine-tuning**: LoRA (Low-Rank Adaptation)
- **Quantization**: 4-bit for efficiency
- **Framework**: Hugging Face Transformers + PEFT

## 🏗️ Architecture

```
review_reply_ai/
├── __init__.py           # Package exports
├── model_loader.py       # Model loading (singleton pattern)
├── prompt.py             # Prompt building
├── generator.py          # Reply generation logic
└── README.md             # This file
```

## 🔧 Components

### 1. model_loader.py
**Loads and manages the AI model**

```python
from ai_models.review_reply_ai import get_model, get_tokenizer, load_model

# Load model once at startup
load_model()

# Get model and tokenizer
model = get_model()
tokenizer = get_tokenizer()
```

**Features:**
- Singleton pattern (loads model only once)
- 4-bit quantization for memory efficiency
- LoRA adapter support
- Proper error handling

### 2. prompt.py
**Builds structured prompts**

```python
from ai_models.review_reply_ai import build_prompt

prompt = build_prompt(
    review="Great service but slow",
    rating=4,
    business_type="Restaurant",
    tone="grateful"
)
```

**Supported Tones:**
- `professional` - Formal and courteous
- `friendly` - Warm and approachable
- `calm` - Understanding and patient
- `grateful` - Appreciative and thankful
- `apologetic` - Solution-focused

### 3. generator.py
**Generates replies**

```python
from ai_models.review_reply_ai import generate_reply

result = generate_reply(
    review="Great service but slow",
    rating=4,
    business_type="Restaurant",
    tone="grateful",
    max_tokens=150
)

print(result["reply"])
```

**Returns:**
```python
{
    "success": True,
    "reply": "Thank you for your feedback...",
    "business_type": "Restaurant",
    "rating": 4,
    "tone": "grateful",
    "error": None
}
```

## 🚀 Usage

### Basic Usage

```python
from ai_models.review_reply_ai import generate_reply

# Generate a reply
result = generate_reply(
    review="The food was delicious but the wait was long",
    rating=4,
    business_type="Restaurant",
    tone="grateful"
)

if result["success"]:
    print(result["reply"])
else:
    print(f"Error: {result['error']}")
```

### Batch Processing

```python
from ai_models.review_reply_ai.generator import generate_batch_replies

reviews = [
    {"review": "Great service!", "rating": 5},
    {"review": "Poor quality", "rating": 2},
    {"review": "Average experience", "rating": 3}
]

results = generate_batch_replies(
    reviews=reviews,
    business_type="Hotel",
    tone="professional"
)
```

### With FastAPI

```python
from fastapi import FastAPI
from ai_models.review_reply_ai.model_loader import load_model

app = FastAPI()

@app.on_event("startup")
async def startup():
    load_model()

@app.post("/generate-reply")
async def generate(request: GenerateReplyRequest):
    result = generate_reply(
        review=request.review,
        rating=request.rating,
        business_type=request.business_type,
        tone=request.tone
    )
    return result
```

## 📊 Performance

| Metric | Value |
|--------|-------|
| Model Size | 7B parameters |
| Quantization | 4-bit |
| Memory Usage | ~2-3GB |
| Response Time | 1-3 seconds |
| Max Tokens | 150 |
| Temperature | 0.7 |

## 🔄 Model Loading

The model is loaded **once at application startup** using a singleton pattern:

```python
# First call - loads model
model = get_model()

# Subsequent calls - returns cached model
model = get_model()  # No reload
```

## 📝 Prompt Structure

The prompt includes:
1. **System Context** - Role and expertise
2. **Rating Context** - What the rating means
3. **Tone Instructions** - How to respond
4. **Guidelines** - Best practices
5. **Review** - Customer's actual review

Example:
```
You are a professional customer service representative for a Restaurant business.

This is a 4-star review indicating a good experience.

Your task is to generate a grateful and appreciative reply...

Guidelines:
- Keep the reply concise (2-3 sentences maximum)
- Address the customer's concerns or compliments
- Offer solutions if there are issues
- Thank the customer for their feedback
...

Customer Review:
"Great service but slow"

Generate a professional reply:
```

## 🎯 Business Types Supported

- Restaurant
- Hotel
- E-commerce
- Retail
- Service
- Healthcare
- Education
- Entertainment
- And more...

## 🔐 Error Handling

The module handles:
- Model loading failures
- Tokenization errors
- Generation timeouts
- Invalid inputs
- Memory issues

All errors are logged and returned in the response.

## 📈 Optimization Tips

1. **Batch Processing**: Process multiple reviews together
2. **Caching**: Cache model in memory (already done)
3. **Quantization**: Uses 4-bit for efficiency
4. **Token Limit**: Set reasonable max_tokens (150)
5. **Temperature**: Adjust for consistency vs creativity

## 🧪 Testing

```python
# Test basic generation
result = generate_reply(
    review="Excellent product!",
    rating=5,
    business_type="E-commerce",
    tone="grateful"
)
assert result["success"]
assert len(result["reply"]) > 0

# Test error handling
result = generate_reply(
    review="",  # Empty review
    rating=3,
    business_type="Restaurant"
)
# Should handle gracefully
```

## 📚 API Reference

### generate_reply()

```python
def generate_reply(
    review: str,
    rating: int,
    business_type: str,
    tone: str = "professional",
    max_tokens: int = 150
) -> Dict[str, Any]
```

**Parameters:**
- `review` (str): Customer review (required)
- `rating` (int): 1-5 stars (required)
- `business_type` (str): Type of business (required)
- `tone` (str): Response tone (default: "professional")
- `max_tokens` (int): Max tokens to generate (default: 150)

**Returns:**
- `success` (bool): Whether generation succeeded
- `reply` (str): Generated reply
- `business_type` (str): Business type
- `rating` (int): Rating
- `tone` (str): Tone used
- `error` (str): Error message if failed

### load_model()

```python
def load_model() -> Tuple[Model, Tokenizer]
```

Loads the model and tokenizer. Call once at startup.

### get_model()

```python
def get_model() -> Optional[Model]
```

Returns the loaded model or None.

### get_tokenizer()

```python
def get_tokenizer() -> Optional[Tokenizer]
```

Returns the loaded tokenizer or None.

## 🔗 Integration

See `routes/review_reply.py` for FastAPI integration example.

## 📖 Documentation

- **Main Backend**: See `Backend/main.py`
- **Routes**: See `Backend/routes/review_reply.py`
- **Database**: See `Backend/db/models.py`
- **Services**: See `Backend/services/history_service.py`

## 🚀 Deployment

1. Install dependencies: `pip install -r requirements_review_reply.txt`
2. Set environment variables in `.env`
3. Initialize database: `python -c "from config.database import init_db; init_db()"`
4. Run server: `python main.py`

## 📞 Support

For issues or questions, check:
1. Logs in console output
2. Error messages in API responses
3. Database records in `review_history` table

---

**Version**: 1.0.0  
**Last Updated**: April 29, 2026
