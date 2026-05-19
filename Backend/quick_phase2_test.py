"""
Quick Phase 2 Security Feature Verification
Tests Phase 2 implementations without requiring running server
"""

import sys
import os
from colorama import init, Fore, Style

init(autoreset=True)

def print_header(text):
    print(f"\n{Fore.CYAN}{Style.BRIGHT}{'='*60}")
    print(f"{text}")
    print(f"{'='*60}{Style.RESET_ALL}")

def print_success(text):
    print(f"{Fore.GREEN}✓ {text}{Style.RESET_ALL}")

def print_failure(text):
    print(f"{Fore.RED}✗ {text}{Style.RESET_ALL}")

def print_info(text):
    print(f"{Fore.YELLOW}ℹ {text}{Style.RESET_ALL}")

print_header("PHASE 2 SECURITY IMPLEMENTATION VERIFICATION")

# Test 1: Check if files exist
print_header("1. FILE EXISTENCE CHECK")

files_to_check = {
    "Audit Logger": "services/audit_logger.py",
    "Password Validator": "utils/password_validator.py",
    "Validators": "utils/validators.py",
    "API Key Model": "models/api_key.py",
    "RBAC Model": "models/rbac.py",
    "RBAC Service": "services/rbac_service.py",
    "Security Middleware": "middleware/security.py",
    "Security Middleware 2": "middleware/security_middleware.py",
}

all_exist = True
for name, filepath in files_to_check.items():
    if os.path.exists(filepath):
        print_success(f"{name}: {filepath}")
    else:
        print_failure(f"{name}: {filepath} NOT FOUND")
        all_exist = False

# Test 2: Import modules
print_header("2. MODULE IMPORT TEST")

try:
    from services.audit_logger import audit_logger, AuditEventType
    print_success("Audit Logger imported successfully")
except Exception as e:
    print_failure(f"Audit Logger import failed: {e}")

try:
    from utils.password_validator import PasswordValidator, PasswordStrength
    print_success("Password Validator imported successfully")
except Exception as e:
    print_failure(f"Password Validator import failed: {e}")

try:
    from utils.validators import validate_password_strength
    print_success("Validators imported successfully")
except Exception as e:
    print_failure(f"Validators import failed: {e}")

try:
    from models.api_key import APIKey, APIKeyManager
    print_success("API Key models imported successfully")
except Exception as e:
    print_failure(f"API Key models import failed: {e}")

try:
    from models.rbac import Role, Permission, UserRole
    print_success("RBAC models imported successfully")
except Exception as e:
    print_failure(f"RBAC models import failed: {e}")

try:
    from services.rbac_service import RBACService
    print_success("RBAC Service imported successfully")
except Exception as e:
    print_failure(f"RBAC Service import failed: {e}")

try:
    from middleware.security import setup_rate_limiting, add_security_headers
    print_success("Security middleware imported successfully")
except Exception as e:
    print_failure(f"Security middleware import failed: {e}")

# Test 3: Password Validation
print_header("3. PASSWORD VALIDATION TEST")

try:
    from utils.password_validator import PasswordValidator
    
    # Test weak password
    is_valid, error, strength = PasswordValidator.validate("weak")
    if not is_valid:
        print_success(f"Weak password rejected: {error}")
    else:
        print_failure("Weak password was accepted!")
    
    # Test strong password
    is_valid, error, strength = PasswordValidator.validate("MyStr0ng!P@ssw0rd")
    if is_valid:
        print_success(f"Strong password accepted with strength: {strength.value}")
    else:
        print_failure(f"Strong password rejected: {error}")
    
    # Show requirements
    requirements = PasswordValidator.get_requirements()
    print_info(f"Password requirements: {requirements}")
    
except Exception as e:
    print_failure(f"Password validation test failed: {e}")

# Test 4: Audit Logger
print_header("4. AUDIT LOGGER TEST")

try:
    from services.audit_logger import audit_logger
    
    # Test logging
    audit_logger.log_login(
        user_id=999,
        user_email="test@example.com",
        ip_address="127.0.0.1",
        user_agent="TestScript",
        status="success"
    )
    print_success("Login event logged successfully")
    
    audit_logger.log_unauthorized_access(
        user_id=999,
        user_email="test@example.com",
        resource="/admin",
        ip_address="127.0.0.1",
        reason="Test"
    )
    print_success("Unauthorized access logged successfully")
    
    print_info("Check logs/audit.log for entries")
    
except Exception as e:
    print_failure(f"Audit logger test failed: {e}")

# Test 5: Configuration Check
print_header("5. CONFIGURATION CHECK")

try:
    from config.settings import settings
    
    config_items = [
        ("ENFORCE_HTTPS", settings.ENFORCE_HTTPS),
        ("AUDIT_LOGGING_ENABLED", settings.AUDIT_LOGGING_ENABLED),
        ("PASSWORD_MIN_LENGTH", settings.PASSWORD_MIN_LENGTH),
        ("API_KEY_ENABLED", settings.API_KEY_ENABLED),
        ("RBAC_ENABLED", settings.RBAC_ENABLED),
        ("RATE_LIMIT_ENABLED", settings.RATE_LIMIT_ENABLED),
        ("SECURITY_MONITORING_ENABLED", settings.SECURITY_MONITORING_ENABLED),
    ]
    
    for name, value in config_items:
        if value:
            print_success(f"{name}: {value}")
        else:
            print_info(f"{name}: {value} (disabled)")
    
except Exception as e:
    print_failure(f"Configuration check failed: {e}")

# Summary
print_header("VERIFICATION SUMMARY")

if all_exist:
    print_success("All Phase 2 files are present")
else:
    print_failure("Some Phase 2 files are missing")

print_info("\nTo run full tests:")
print_info("  1. Start the backend: python main.py")
print_info("  2. Run manual tests: python test_phase2_manual.py")
print_info("  3. Run automated tests: python -m pytest tests/test_phase2_security.py -v")

print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}\n")
