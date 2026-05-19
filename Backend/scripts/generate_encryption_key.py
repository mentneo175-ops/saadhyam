"""
Generate Encryption Key for Meta Ads Token Storage
Run this script to generate a secure encryption key
"""

from cryptography.fernet import Fernet

def generate_key():
    """Generate a new Fernet encryption key"""
    key = Fernet.generate_key()
    return key.decode()

if __name__ == "__main__":
    print("=" * 60)
    print("🔐 Meta Ads Encryption Key Generator")
    print("=" * 60)
    print()
    
    key = generate_key()
    
    print("Your encryption key:")
    print()
    print(f"  {key}")
    print()
    print("Add this to your Backend/.env file:")
    print()
    print(f"  ENCRYPTION_KEY={key}")
    print()
    print("⚠️  IMPORTANT:")
    print("  - Keep this key secure and private")
    print("  - Never commit this key to version control")
    print("  - If you lose this key, you'll lose access to encrypted tokens")
    print("  - Use different keys for development and production")
    print()
    print("=" * 60)
