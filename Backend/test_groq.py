import httpx
import json

api_key = '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'
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

payload = {
    'model': 'llama-3.3-70b-versatile',
    'messages': [
        {'role': 'user', 'content': 'Tell me about Google in 2 sentences'}
    ],
    'temperature': 0.7,
    'max_tokens': 100
}

response = httpx.post('https://api.groq.com/openai/v1/chat/completions', json=payload, headers=headers)
print(f'Status: {response.status_code}')

if response.status_code == 200:
    data = response.json()
    content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
    print(f'Response: {content}')
else:
    print(f'Error: {response.text}')
