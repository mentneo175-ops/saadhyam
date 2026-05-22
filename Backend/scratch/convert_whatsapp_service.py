import re

def convert_service(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Imports
    content = content.replace("import requests", "import httpx")
    
    # Signatures
    content = re.sub(r'def send_text_message\(', r'async def send_text_message(', content)
    content = re.sub(r'def send_template_message\(', r'async def send_template_message(', content)
    content = re.sub(r'def send_media_message\(', r'async def send_media_message(', content)
    content = re.sub(r'def mark_message_as_read\(', r'async def mark_message_as_read(', content)
    content = re.sub(r'def get_business_profile\(', r'async def get_business_profile(', content)
    
    # Requests calls
    # For post
    content = re.sub(
        r'response = requests\.post\((.*?)\)', 
        r'async with httpx.AsyncClient() as client:\n                response = await client.post(\1)', 
        content
    )
    # For get
    content = re.sub(
        r'response = requests\.get\((.*?)\)', 
        r'async with httpx.AsyncClient() as client:\n                response = await client.get(\1)', 
        content
    )
    
    # Exception handling
    content = content.replace("requests.exceptions.RequestException", "httpx.RequestError")
    content = content.replace("requests.exceptions.HTTPError", "httpx.HTTPStatusError")
    
    # Exceptions where 'e.response' might not exist directly need adjustment
    # In httpx, HTTPStatusError has e.response, but RequestError might not. 
    # For simplicity, we just keep the check `hasattr(e, 'response') and e.response is not None` which works.

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    convert_service(r"c:\Users\Sai kiran\Desktop\Sadhyam\Backend\services\whatsapp_service.py")
    print("whatsapp_service.py converted")
