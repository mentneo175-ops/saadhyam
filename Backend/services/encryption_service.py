"""
Encryption Service for securing user API keys
Uses AES encryption to protect sensitive credentials
"""

import base64
import logging
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from config.settings import settings

logger = logging.getLogger(__name__)

class EncryptionService:
    """
    Service for encrypting and decrypting sensitive user data like API keys
    """
    
    def __init__(self):
        """Initialize the encryption service with a key derived from settings"""
        self.fernet = self._get_cipher()
    
    def _get_cipher(self) -> Fernet:
        """Create Fernet cipher from the encryption key in settings"""
        try:
            # Use the encryption key from settings
            encryption_key = settings.ENCRYPTION_KEY.encode()
            
            # If the key is not base64 encoded, derive it properly
            if len(encryption_key) != 44:  # Base64 encoded key should be 44 chars
                # Derive key from the provided encryption key
                kdf = PBKDF2HMAC(
                    algorithm=hashes.SHA256(),
                    length=32,
                    salt=b'saadhyam_salt',  # Use a fixed salt for consistency
                    iterations=100000,
                )
                key = base64.urlsafe_b64encode(kdf.derive(encryption_key))
            else:
                key = encryption_key
            
            return Fernet(key)
            
        except Exception as e:
            logger.error(f"Failed to initialize encryption: {e}")
            # Fallback: generate a new key (WARNING: will lose existing encrypted data)
            logger.warning("Generating new encryption key - existing encrypted data will be unrecoverable!")
            key = Fernet.generate_key()
            return Fernet(key)
    
    def encrypt(self, data: str) -> str:
        """
        Encrypt a string and return base64 encoded encrypted data
        
        Args:
            data: Plain text string to encrypt
            
        Returns:
            Base64 encoded encrypted string
        """
        try:
            if not data:
                return ""
            
            encrypted_data = self.fernet.encrypt(data.encode())
            return base64.b64encode(encrypted_data).decode()
            
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise Exception(f"Failed to encrypt data: {str(e)}")
    
    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt base64 encoded encrypted data and return plain text
        
        Args:
            encrypted_data: Base64 encoded encrypted string
            
        Returns:
            Decrypted plain text string
        """
        try:
            if not encrypted_data:
                return ""
            
            # Decode from base64 first
            decoded_data = base64.b64decode(encrypted_data.encode())
            
            # Decrypt
            decrypted_data = self.fernet.decrypt(decoded_data)
            return decrypted_data.decode()
            
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise Exception(f"Failed to decrypt data: {str(e)}")
    
    def is_encrypted(self, data: str) -> bool:
        """
        Check if a string appears to be encrypted (base64 encoded)
        
        Args:
            data: String to check
            
        Returns:
            True if data appears to be encrypted
        """
        try:
            if not data:
                return False
            
            # Try to decode as base64
            decoded = base64.b64decode(data.encode())
            
            # Try to decrypt - if it works, it's encrypted
            self.fernet.decrypt(decoded)
            return True
            
        except Exception:
            return False

# Global instance
_encryption_service = None

def get_encryption_service() -> EncryptionService:
    """Get the global encryption service instance"""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service