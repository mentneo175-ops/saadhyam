"""
Advanced Password Strength Validation
Ensures passwords meet security requirements
"""

import re
from enum import Enum
from typing import Tuple


class PasswordStrength(str, Enum):
    """Password strength levels"""
    WEAK = "weak"
    FAIR = "fair"
    GOOD = "good"
    STRONG = "strong"
    VERY_STRONG = "very_strong"


class PasswordValidator:
    """Validator for password strength and requirements"""
    
    # Minimum requirements
    MIN_LENGTH = 8
    MIN_UPPERCASE = 1
    MIN_LOWERCASE = 1
    MIN_NUMBERS = 1
    MIN_SPECIAL = 1
    
    # Special characters allowed
    SPECIAL_CHARS = r'!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`'
    
    # Common weak passwords
    WEAK_PASSWORDS = {
        'password', 'password123', '123456', '12345678',
        'qwerty', 'abc123', 'admin', 'letmein',
        'welcome', 'monkey', 'dragon', 'master',
        '1234567890', 'password1', 'pass123'
    }
    
    @staticmethod
    def validate(password: str) -> Tuple[bool, str, PasswordStrength]:
        """
        Validate password strength
        Returns: (is_valid, error_message, strength_level)
        """
        # Check minimum length
        if len(password) < PasswordValidator.MIN_LENGTH:
            return (
                False,
                f"Password must be at least {PasswordValidator.MIN_LENGTH} characters long",
                PasswordStrength.WEAK
            )
        
        # Check for common weak passwords
        if password.lower() in PasswordValidator.WEAK_PASSWORDS:
            return (
                False,
                "Password is too common. Please choose a unique password",
                PasswordStrength.WEAK
            )
        
        # Check for uppercase letters
        if not re.search(r'[A-Z]', password):
            return (
                False,
                "Password must contain at least one uppercase letter",
                PasswordStrength.WEAK
            )
        
        # Check for lowercase letters
        if not re.search(r'[a-z]', password):
            return (
                False,
                "Password must contain at least one lowercase letter",
                PasswordStrength.WEAK
            )
        
        # Check for numbers
        if not re.search(r'\d', password):
            return (
                False,
                "Password must contain at least one number",
                PasswordStrength.WEAK
            )
        
        # Check for special characters
        if not re.search(f'[{re.escape(PasswordValidator.SPECIAL_CHARS)}]', password):
            return (
                False,
                "Password must contain at least one special character (!@#$%^&*etc)",
                PasswordStrength.WEAK
            )
        
        # Check for sequential characters
        if PasswordValidator._has_sequential_chars(password):
            return (
                False,
                "Password contains sequential characters (abc, 123, etc). Please avoid these patterns",
                PasswordStrength.WEAK
            )
        
        # Check for repeated characters
        if PasswordValidator._has_repeated_chars(password):
            return (
                False,
                "Password contains too many repeated characters. Please vary your password",
                PasswordStrength.FAIR
            )
        
        # Calculate strength
        strength = PasswordValidator._calculate_strength(password)
        
        return (True, "", strength)
    
    @staticmethod
    def _has_sequential_chars(password: str) -> bool:
        """Check for sequential characters like abc, 123"""
        # Check for sequential letters
        for i in range(len(password) - 2):
            if (ord(password[i+1]) == ord(password[i]) + 1 and
                ord(password[i+2]) == ord(password[i+1]) + 1):
                return True
        return False
    
    @staticmethod
    def _has_repeated_chars(password: str) -> bool:
        """Check for repeated characters"""
        for i in range(len(password) - 2):
            if password[i] == password[i+1] == password[i+2]:
                return True
        return False
    
    @staticmethod
    def _calculate_strength(password: str) -> PasswordStrength:
        """Calculate password strength based on various factors"""
        score = 0
        
        # Length scoring
        length = len(password)
        if length >= 12:
            score += 2
        elif length >= 10:
            score += 1
        
        # Character variety
        if re.search(r'[A-Z]', password):
            score += 1
        if re.search(r'[a-z]', password):
            score += 1
        if re.search(r'\d', password):
            score += 1
        if re.search(f'[{re.escape(PasswordValidator.SPECIAL_CHARS)}]', password):
            score += 1
        
        # Number of special characters
        special_count = sum(1 for c in password if c in PasswordValidator.SPECIAL_CHARS)
        if special_count >= 2:
            score += 1
        
        # Determine strength level
        if score <= 2:
            return PasswordStrength.WEAK
        elif score <= 3:
            return PasswordStrength.FAIR
        elif score <= 4:
            return PasswordStrength.GOOD
        elif score <= 5:
            return PasswordStrength.STRONG
        else:
            return PasswordStrength.VERY_STRONG
    
    @staticmethod
    def get_requirements() -> dict:
        """Get password requirements"""
        return {
            "min_length": PasswordValidator.MIN_LENGTH,
            "min_uppercase": PasswordValidator.MIN_UPPERCASE,
            "min_lowercase": PasswordValidator.MIN_LOWERCASE,
            "min_numbers": PasswordValidator.MIN_NUMBERS,
            "min_special_chars": PasswordValidator.MIN_SPECIAL,
            "allowed_special": PasswordValidator.SPECIAL_CHARS,
            "avoid_sequential": True,
            "avoid_repeated": True,
            "avoid_common": True,
        }
