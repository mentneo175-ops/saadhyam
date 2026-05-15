"""
Test login endpoint with detailed error output
"""
import requests
import json
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_login():
    """Test login endpoint"""
    url = "http://localhost:8000/auth/login"
    data = {
        "email": "testuser@example.com",
        "password": "password123"
    }
    
    logger.info(f"Testing login at: {url}")
    logger.info(f"Data: {data}")
    
    try:
        response = requests.post(url, json=data)
        logger.info(f"Status Code: {response.status_code}")
        logger.info(f"Response: {response.text}")
        
        if response.status_code == 200:
            logger.info("✅ Login successful!")
            logger.info(f"Response JSON: {response.json()}")
        else:
            logger.error(f"❌ Login failed: {response.status_code}")
            logger.error(f"Error: {response.text}")
            
    except Exception as e:
        logger.error(f"❌ Request failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_login()
