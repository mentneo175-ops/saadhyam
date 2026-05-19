import requests
import os
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("WHATSAPP_TOKEN")
PHONE_ID = os.getenv("WHATSAPP_PHONE_ID")
print(PHONE_ID)
print(TOKEN)
url = f"https://graph.facebook.com/v19.0/{PHONE_ID}/messages"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

payload = {
    "messaging_product": "whatsapp",
    "to": "919951768407",
    "type": "text",
    "text": {
        "body": "Hello from Saadhyam AI 🚀"
    }
}

response = requests.post(
    url,
    json=payload,
    headers=headers
)

print(response.json())