"""
Manual Testing Script for Phase 2 Security Features
Run this script to manually test all Phase 2 implementations
"""

import requests
import json
import time
from datetime import datetime
from colorama import init, Fore, Style

# Initialize colorama for colored output
init(autoreset=True)

# Configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = f"test_{int(time.time())}@example.com"
TEST_PASSWORD = "MyStr0ng!P@ssw0rd#2024"
WEAK_PASSWORD = "weak"

# Test results
test_results = []


def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"{Fore.CYAN}{Style.BRIGHT}{text}")
    print("=" * 60)


def print_test(test_name):
    """Print test name"""
    print(f"\n{Fore.YELLOW}Testing: {test_name}")


def print_success(message):
    """Print success message"""
    print(f"{Fore.GREEN}✓ {message}")
    test_results.append(("PASS", message))


def print_failure(message):
    """Print failure message"""
    print(f"{Fore.RED}✗ {message}")
    test_results.append(("FAIL", message))


def print_info(message):
    """Print info message"""
    print(f"{Fore.BLUE}ℹ {message}")


def test_https_enforcement():
    """Test 1: HTTPS Enforcement"""
    print_header("TEST 1: HTTPS ENFORCEMENT")
    
    print_test("Security Headers Present")
    try:
        response = requests.get(f"{BASE_URL}/health")
        headers = response.headers
        
        # Check for security headers
        required_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
            "Referrer-Policy",
            "Content-Security-Policy"
        ]
        
        for header in required_headers:
            if header in headers:
                print_success(f"{header}: {headers[header]}")
            else:
                print_failure(f"{header} is missing")
        
        # Check HSTS in production
        if "Strict-Transport-Security" in headers:
            print_success(f"HSTS: {headers['Strict-Transport-Security']}")
        else:
            print_info("HSTS not present (might be development mode)")
        
    except Exception as e:
        print_failure(f"Failed to check security headers: {e}")


def test_audit_logging():
    """Test 2: Audit Logging"""
    print_header("TEST 2: AUDIT LOGGING")
    
    print_test("Audit Logger Functionality")
    try:
        from services.audit_logger import audit_logger, AuditEventType
        
        # Test login logging
        audit_logger.log_login(
            user_id=999,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            user_agent="TestScript/1.0",
            status="success"
        )
        print_success("Login event logged successfully")
        
        # Test failed login logging
        audit_logger.log_login(
            user_id=None,
            user_email="attacker@example.com",
            ip_address="192.168.1.100",
            user_agent="AttackBot/1.0",
            status="failure",
            reason="Invalid credentials"
        )
        print_success("Failed login event logged successfully")
        
        # Test unauthorized access logging
        audit_logger.log_unauthorized_access(
            user_id=999,
            user_email="test@example.com",
            resource="/admin/users",
            ip_address="127.0.0.1",
            reason="Insufficient permissions"
        )
        print_success("Unauthorized access event logged successfully")
        
        # Test generic event logging
        audit_logger.log_event(
            event_type="data_access",
            action="viewed_sensitive_data",
            resource="user_profile",
            user_id=999,
            ip_address="127.0.0.1",
            status="success"
        )
        print_success("Generic event logged successfully")
        
        print_info("Check logs/audit.log for detailed audit trail")
        
    except Exception as e:
        print_failure(f"Audit logging failed: {e}")


def test_password_validation():
    """Test 3: Password Strength Validation"""
    print_header("TEST 3: PASSWORD STRENGTH VALIDATION")
    
    print_test("Password Validator")
    try:
        from utils.password_validator import PasswordValidator, PasswordStrength
        
        # Test weak passwords
        weak_passwords = [
            ("short", "Too short"),
            ("password", "No uppercase, numbers, or special chars"),
            ("Password", "No numbers or special chars"),
            ("Password123", "No special chars"),
            ("password123!", "No uppercase"),
            ("PASSWORD123!", "No lowercase"),
        ]
        
        print_info("Testing weak passwords (should be rejected):")
        for pwd, reason in weak_passwords:
            is_valid, error_msg, strength = PasswordValidator.validate(pwd)
            if not is_valid:
                print_success(f"'{pwd}' rejected: {error_msg}")
            else:
                print_failure(f"'{pwd}' was accepted but should be rejected ({reason})")
        
        # Test strong passwords
        strong_passwords = [
            "MyStr0ng!P@ssw0rd",
            "C0mpl3x#Passw0rd!",
            "S3cur3$P@ssW0rd#2024",
            "V3ry!Str0ng#P@ssw0rd"
        ]
        
        print_info("\nTesting strong passwords (should be accepted):")
        for pwd in strong_passwords:
            is_valid, error_msg, strength = PasswordValidator.validate(pwd)
            if is_valid:
                print_success(f"'{pwd}' accepted with strength: {strength.value}")
            else:
                print_failure(f"'{pwd}' rejected: {error_msg}")
        
        # Test password requirements
        requirements = PasswordValidator.get_requirements()
        print_info("\nPassword Requirements:")
        for key, value in requirements.items():
            print_info(f"  {key}: {value}")
        
    except Exception as e:
        print_failure(f"Password validation failed: {e}")


def test_password_validation_in_registration():
    """Test 3b: Password Validation in Registration Endpoint"""
    print_header("TEST 3B: PASSWORD VALIDATION IN REGISTRATION")
    
    print_test("Register with weak password (should fail)")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": f"weak_{int(time.time())}@example.com",
                "password": "weak",
                "name": "Weak Password User"
            }
        )
        
        if response.status_code == 400:
            print_success(f"Weak password rejected: {response.json().get('detail')}")
        else:
            print_failure(f"Weak password was accepted (status: {response.status_code})")
    
    except Exception as e:
        print_failure(f"Registration test failed: {e}")
    
    print_test("Register with strong password (should succeed)")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": "Strong Password User"
            }
        )
        
        if response.status_code in [200, 201]:
            print_success(f"Strong password accepted (status: {response.status_code})")
            return response.json()
        else:
            print_failure(f"Strong password rejected: {response.json().get('detail')}")
            return None
    
    except Exception as e:
        print_failure(f"Registration test failed: {e}")
        return None


def test_api_key_management(auth_token=None):
    """Test 4: API Key Rotation"""
    print_header("TEST 4: API KEY MANAGEMENT")
    
    print_test("API Key Manager")
    try:
        from config.database import SyncSessionLocal
        from models.api_key import APIKeyManager
        from models.user import User
        
        db = SyncSessionLocal()
        
        # Create test user
        test_user = User(
            email=f"apikey_{int(time.time())}@example.com",
            name="API Key Test User",
            hashed_password="dummy_hash"
        )
        db.add(test_user)
        db.commit()
        
        # Test 1: Generate API key
        print_test("Generate API Key")
        api_key = APIKeyManager.generate_api_key(
            db=db,
            user_id=test_user.id,
            name="Test API Key"
        )
        print_success(f"API key generated: {api_key[:20]}...")
        
        # Test 2: Validate API key
        print_test("Validate API Key")
        key_obj = APIKeyManager.validate_api_key(db, api_key)
        if key_obj:
            print_success(f"API key validated successfully (User ID: {key_obj.user_id})")
        else:
            print_failure("API key validation failed")
        
        # Test 3: Rotate API key
        print_test("Rotate API Key")
        new_key = APIKeyManager.rotate_api_key(db, api_key)
        if new_key:
            print_success(f"API key rotated: {new_key[:20]}...")
            
            # Verify old key is revoked
            old_key_obj = APIKeyManager.validate_api_key(db, api_key)
            if old_key_obj is None:
                print_success("Old API key successfully revoked")
            else:
                print_failure("Old API key still valid after rotation")
            
            # Verify new key is valid
            new_key_obj = APIKeyManager.validate_api_key(db, new_key)
            if new_key_obj:
                print_success("New API key is valid")
            else:
                print_failure("New API key is invalid")
        else:
            print_failure("API key rotation failed")
        
        # Test 4: Revoke API key
        print_test("Revoke API Key")
        success = APIKeyManager.revoke_api_key(db, new_key)
        if success:
            print_success("API key revoked successfully")
            
            # Verify key is invalid
            key_obj = APIKeyManager.validate_api_key(db, new_key)
            if key_obj is None:
                print_success("Revoked key is now invalid")
            else:
                print_failure("Revoked key is still valid")
        else:
            print_failure("API key revocation failed")
        
        # Test 5: List user API keys
        print_test("List User API Keys")
        keys = APIKeyManager.list_user_keys(db, test_user.id)
        print_success(f"Found {len(keys)} API keys for user")
        for key in keys:
            status = "Revoked" if key.is_revoked else "Active"
            print_info(f"  - {key.name}: {status} (Created: {key.created_at})")
        
        db.close()
        
    except Exception as e:
        print_failure(f"API key management test failed: {e}")
        import traceback
        traceback.print_exc()


def test_rbac():
    """Test 5: Role-Based Access Control"""
    print_header("TEST 5: ROLE-BASED ACCESS CONTROL (RBAC)")
    
    print_test("RBAC Models")
    try:
        from config.database import SyncSessionLocal
        from models.rbac import Role, Permission, UserRole
        from models.user import User
        
        db = SyncSessionLocal()
        
        # Test 1: Create roles
        print_test("Create Roles")
        roles = [
            Role(name="admin", description="Administrator with full access"),
            Role(name="manager", description="Manager with limited admin access"),
            Role(name="user", description="Regular user"),
        ]
        
        for role in roles:
            # Check if role already exists
            existing = db.query(Role).filter(Role.name == role.name).first()
            if not existing:
                db.add(role)
        db.commit()
        print_success("Roles created successfully")
        
        # Test 2: Create permissions
        print_test("Create Permissions")
        permissions = [
            Permission(name="read_users", resource="users", action="read"),
            Permission(name="write_users", resource="users", action="write"),
            Permission(name="delete_users", resource="users", action="delete"),
            Permission(name="read_settings", resource="settings", action="read"),
            Permission(name="write_settings", resource="settings", action="write"),
        ]
        
        for perm in permissions:
            # Check if permission already exists
            existing = db.query(Permission).filter(
                Permission.name == perm.name
            ).first()
            if not existing:
                db.add(perm)
        db.commit()
        print_success("Permissions created successfully")
        
        # Test 3: Assign role to user
        print_test("Assign Role to User")
        test_user = User(
            email=f"rbac_{int(time.time())}@example.com",
            name="RBAC Test User",
            hashed_password="dummy_hash"
        )
        db.add(test_user)
        db.commit()
        
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if admin_role:
            user_role = UserRole(user_id=test_user.id, role_id=admin_role.id)
            db.add(user_role)
            db.commit()
            print_success(f"Assigned 'admin' role to user {test_user.email}")
        else:
            print_failure("Admin role not found")
        
        # Test 4: Check user roles
        print_test("Check User Roles")
        user_roles = db.query(UserRole).filter(UserRole.user_id == test_user.id).all()
        print_success(f"User has {len(user_roles)} role(s)")
        for ur in user_roles:
            role = db.query(Role).filter(Role.id == ur.role_id).first()
            print_info(f"  - {role.name}: {role.description}")
        
        db.close()
        
    except Exception as e:
        print_failure(f"RBAC test failed: {e}")
        import traceback
        traceback.print_exc()


def test_rate_limiting():
    """Test 6: Rate Limiting"""
    print_header("TEST 6: RATE LIMITING")
    
    print_test("Rate Limit Enforcement")
    try:
        print_info("Making 250 requests to test rate limiting...")
        
        rate_limited = False
        success_count = 0
        rate_limit_count = 0
        
        for i in range(250):
            response = requests.get(f"{BASE_URL}/health")
            
            if response.status_code == 200:
                success_count += 1
            elif response.status_code == 429:
                rate_limited = True
                rate_limit_count += 1
            
            # Don't spam too fast
            if i % 50 == 0:
                print_info(f"  Progress: {i}/250 requests")
                time.sleep(0.1)
        
        print_info(f"Results: {success_count} successful, {rate_limit_count} rate limited")
        
        if rate_limited:
            print_success(f"Rate limiting is working (got {rate_limit_count} 429 responses)")
        else:
            print_info("No rate limiting detected (might be disabled or limit not reached)")
        
    except Exception as e:
        print_failure(f"Rate limiting test failed: {e}")


def test_request_size_limit():
    """Test 7: Request Size Limit"""
    print_header("TEST 7: REQUEST SIZE LIMIT")
    
    print_test("Large Request Rejection")
    try:
        # Create a large payload (11MB)
        large_data = "x" * (11 * 1024 * 1024)
        
        print_info("Sending 11MB request (should be rejected)...")
        response = requests.post(
            f"{BASE_URL}/api/test",
            json={"data": large_data},
            timeout=5
        )
        
        if response.status_code == 413:
            print_success(f"Large request rejected with 413: {response.json().get('detail')}")
        elif response.status_code in [400, 422]:
            print_success(f"Large request rejected with {response.status_code}")
        else:
            print_failure(f"Large request was accepted (status: {response.status_code})")
    
    except requests.exceptions.Timeout:
        print_info("Request timed out (might be processing large payload)")
    except Exception as e:
        print_failure(f"Request size limit test failed: {e}")


def test_monitoring():
    """Test 8: Security Monitoring"""
    print_header("TEST 8: SECURITY MONITORING")
    
    print_test("Failed Login Tracking")
    try:
        print_info("Attempting 6 failed logins...")
        
        for i in range(6):
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json={
                    "email": "attacker@example.com",
                    "password": "wrong_password"
                }
            )
            
            print_info(f"  Attempt {i+1}: Status {response.status_code}")
            time.sleep(0.5)
        
        print_success("Failed login attempts completed")
        print_info("Check audit logs for failed login tracking")
        
    except Exception as e:
        print_failure(f"Monitoring test failed: {e}")


def print_summary():
    """Print test summary"""
    print_header("TEST SUMMARY")
    
    passed = sum(1 for result, _ in test_results if result == "PASS")
    failed = sum(1 for result, _ in test_results if result == "FAIL")
    total = len(test_results)
    
    print(f"\n{Fore.CYAN}Total Tests: {total}")
    print(f"{Fore.GREEN}Passed: {passed}")
    print(f"{Fore.RED}Failed: {failed}")
    
    if failed > 0:
        print(f"\n{Fore.RED}Failed Tests:")
        for result, message in test_results:
            if result == "FAIL":
                print(f"  ✗ {message}")
    
    print("\n" + "=" * 60)
    
    if failed == 0:
        print(f"{Fore.GREEN}{Style.BRIGHT}✓ ALL TESTS PASSED!")
    else:
        print(f"{Fore.YELLOW}{Style.BRIGHT}⚠ SOME TESTS FAILED")
    
    print("=" * 60)


def main():
    """Run all manual tests"""
    print(f"{Fore.CYAN}{Style.BRIGHT}")
    print("=" * 60)
    print("PHASE 2 SECURITY MANUAL TESTING SUITE")
    print("=" * 60)
    print(f"{Style.RESET_ALL}")
    
    print_info(f"Testing against: {BASE_URL}")
    print_info(f"Test email: {TEST_EMAIL}")
    print_info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run all tests
    test_https_enforcement()
    test_audit_logging()
    test_password_validation()
    user_data = test_password_validation_in_registration()
    test_api_key_management()
    test_rbac()
    test_rate_limiting()
    test_request_size_limit()
    test_monitoring()
    
    # Print summary
    print_summary()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Tests interrupted by user")
    except Exception as e:
        print(f"\n{Fore.RED}Fatal error: {e}")
        import traceback
        traceback.print_exc()
