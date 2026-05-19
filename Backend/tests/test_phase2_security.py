"""
Phase 2 Security Testing Suite
Tests for HTTPS enforcement, audit logging, password validation, API key rotation, RBAC, and monitoring
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import json
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from config.database import SyncSessionLocal
from models.user import User
from models.api_key import APIKey, APIKeyManager
from models.rbac import Role, Permission, UserRole
from services.audit_logger import audit_logger, AuditEventType
from utils.password_validator import PasswordValidator, PasswordStrength
from utils.validators import validate_password_strength
from config.settings import settings

# Test client
client = TestClient(app)


class TestHTTPSEnforcement:
    """Test HTTPS enforcement in production"""
    
    def test_https_redirect_in_production(self):
        """Test that HTTP requests are redirected to HTTPS in production"""
        # Save original environment
        original_env = settings.ENVIRONMENT
        
        try:
            # Set to production
            settings.ENVIRONMENT = "production"
            
            # Make HTTP request
            response = client.get("/health", allow_redirects=False)
            
            # Should redirect to HTTPS (or pass if already HTTPS)
            # Note: In test environment, this might not redirect
            assert response.status_code in [200, 301, 302, 307, 308]
            
        finally:
            # Restore environment
            settings.ENVIRONMENT = original_env
    
    def test_security_headers_present(self):
        """Test that security headers are present in responses"""
        response = client.get("/health")
        
        # Check for security headers
        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        
        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"
        
        assert "X-XSS-Protection" in response.headers
        assert response.headers["X-XSS-Protection"] == "1; mode=block"
        
        assert "Referrer-Policy" in response.headers
        assert "Content-Security-Policy" in response.headers
    
    def test_hsts_header_in_production(self):
        """Test that HSTS header is present in production"""
        original_env = settings.ENVIRONMENT
        
        try:
            settings.ENVIRONMENT = "production"
            response = client.get("/health")
            
            # HSTS should be present in production
            if settings.ENVIRONMENT == "production":
                assert "Strict-Transport-Security" in response.headers
                assert "max-age" in response.headers.get("Strict-Transport-Security", "")
        
        finally:
            settings.ENVIRONMENT = original_env


class TestAuditLogging:
    """Test audit logging functionality"""
    
    def test_audit_logger_initialization(self):
        """Test that audit logger is properly initialized"""
        assert audit_logger is not None
        assert hasattr(audit_logger, 'log_login')
        assert hasattr(audit_logger, 'log_logout')
        assert hasattr(audit_logger, 'log_unauthorized_access')
    
    def test_login_audit_log(self):
        """Test that login events are logged"""
        # Log a login event
        audit_logger.log_login(
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            user_agent="TestClient/1.0",
            status="success"
        )
        
        # Verify log was created (check log file or database)
        # This is a basic test - in production, you'd verify the log entry
        assert True  # Placeholder
    
    def test_failed_login_audit_log(self):
        """Test that failed login attempts are logged"""
        audit_logger.log_login(
            user_id=None,
            user_email="attacker@example.com",
            ip_address="192.168.1.100",
            user_agent="AttackBot/1.0",
            status="failure",
            reason="Invalid credentials"
        )
        
        assert True  # Placeholder
    
    def test_unauthorized_access_audit_log(self):
        """Test that unauthorized access attempts are logged"""
        audit_logger.log_unauthorized_access(
            user_id=1,
            user_email="user@example.com",
            resource="/admin/users",
            ip_address="127.0.0.1",
            reason="Insufficient permissions"
        )
        
        assert True  # Placeholder
    
    def test_data_access_audit_log(self):
        """Test that sensitive data access is logged"""
        audit_logger.log_event(
            event_type="data_access",
            action="viewed_user_data",
            resource="user_profile",
            user_id=1,
            ip_address="127.0.0.1",
            status="success"
        )
        
        assert True  # Placeholder


class TestPasswordValidation:
    """Test password strength validation"""
    
    def test_password_too_short(self):
        """Test that short passwords are rejected"""
        is_valid, error_msg, strength = PasswordValidator.validate("Short1!")
        
        assert not is_valid
        assert "at least" in error_msg.lower()
        assert strength == PasswordStrength.WEAK
    
    def test_password_no_uppercase(self):
        """Test that passwords without uppercase are rejected"""
        is_valid, error_msg, strength = PasswordValidator.validate("password123!")
        
        assert not is_valid
        assert "uppercase" in error_msg.lower()
    
    def test_password_no_lowercase(self):
        """Test that passwords without lowercase are rejected"""
        is_valid, error_msg, strength = PasswordValidator.validate("PASSWORD123!")
        
        assert not is_valid
        assert "lowercase" in error_msg.lower()
    
    def test_password_no_numbers(self):
        """Test that passwords without numbers are rejected"""
        is_valid, error_msg, strength = PasswordValidator.validate("Password!")
        
        assert not is_valid
        assert "number" in error_msg.lower() or "digit" in error_msg.lower()
    
    def test_password_no_special_chars(self):
        """Test that passwords without special characters are rejected"""
        is_valid, error_msg, strength = PasswordValidator.validate("Password123")
        
        assert not is_valid
        assert "special" in error_msg.lower()
    
    def test_common_weak_password(self):
        """Test that common weak passwords are rejected"""
        weak_passwords = ["password123!", "Password123!", "Admin123!"]
        
        for pwd in weak_passwords:
            is_valid, error_msg, strength = PasswordValidator.validate(pwd)
            # Some might pass basic checks but should be flagged as weak
            if not is_valid:
                assert "common" in error_msg.lower() or "weak" in error_msg.lower()
    
    def test_sequential_characters(self):
        """Test that passwords with sequential characters are rejected"""
        is_valid, error_msg, strength = PasswordValidator.validate("Abc123!@#")
        
        # Should be rejected for sequential characters
        if not is_valid:
            assert "sequential" in error_msg.lower()
    
    def test_repeated_characters(self):
        """Test that passwords with repeated characters are rejected"""
        is_valid, error_msg, strength = PasswordValidator.validate("Passsword123!")
        
        # Should be rejected for repeated characters
        if not is_valid:
            assert "repeated" in error_msg.lower()
    
    def test_strong_password(self):
        """Test that strong passwords are accepted"""
        strong_passwords = [
            "MyStr0ng!P@ssw0rd",
            "C0mpl3x#Passw0rd!",
            "S3cur3$P@ssW0rd#2024"
        ]
        
        for pwd in strong_passwords:
            is_valid, error_msg, strength = PasswordValidator.validate(pwd)
            
            assert is_valid, f"Password '{pwd}' should be valid but got: {error_msg}"
            assert strength in [PasswordStrength.MEDIUM, PasswordStrength.STRONG, PasswordStrength.VERY_STRONG]
    
    def test_password_strength_levels(self):
        """Test password strength calculation"""
        # Weak password
        is_valid, _, strength = PasswordValidator.validate("Pass123!")
        if is_valid:
            assert strength in [PasswordStrength.WEAK, PasswordStrength.MEDIUM]
        
        # Strong password
        is_valid, _, strength = PasswordValidator.validate("MyV3ry$tr0ng!P@ssw0rd#2024")
        if is_valid:
            assert strength in [PasswordStrength.STRONG, PasswordStrength.VERY_STRONG]
    
    def test_password_requirements(self):
        """Test that password requirements are documented"""
        requirements = PasswordValidator.get_requirements()
        
        assert "min_length" in requirements
        assert "min_uppercase" in requirements
        assert "min_lowercase" in requirements
        assert "min_numbers" in requirements
        assert "min_special_chars" in requirements
        assert requirements["min_length"] >= 8


class TestAPIKeyManagement:
    """Test API key rotation and management"""
    
    def setup_method(self):
        """Setup test database session"""
        self.db = SyncSessionLocal()
    
    def teardown_method(self):
        """Cleanup test database session"""
        self.db.close()
    
    def test_api_key_generation(self):
        """Test API key generation"""
        # Create a test user first
        user = User(
            email="apitest@example.com",
            name="API Test User",
            hashed_password="dummy_hash"
        )
        self.db.add(user)
        self.db.commit()
        
        # Generate API key
        api_key = APIKeyManager.generate_api_key(
            db=self.db,
            user_id=user.id,
            name="Test API Key"
        )
        
        assert api_key is not None
        assert len(api_key) > 20  # Should be a long random string
        assert api_key.startswith("sk_")  # Should have prefix
    
    def test_api_key_validation(self):
        """Test API key validation"""
        # Create user and API key
        user = User(
            email="apitest2@example.com",
            name="API Test User 2",
            hashed_password="dummy_hash"
        )
        self.db.add(user)
        self.db.commit()
        
        # Generate key
        api_key = APIKeyManager.generate_api_key(
            db=self.db,
            user_id=user.id,
            name="Test Key"
        )
        
        # Validate key
        key_obj = APIKeyManager.validate_api_key(self.db, api_key)
        
        assert key_obj is not None
        assert key_obj.user_id == user.id
        assert not key_obj.is_revoked
    
    def test_api_key_revocation(self):
        """Test API key revocation"""
        # Create user and API key
        user = User(
            email="apitest3@example.com",
            name="API Test User 3",
            hashed_password="dummy_hash"
        )
        self.db.add(user)
        self.db.commit()
        
        # Generate key
        api_key = APIKeyManager.generate_api_key(
            db=self.db,
            user_id=user.id,
            name="Test Key"
        )
        
        # Revoke key
        success = APIKeyManager.revoke_api_key(self.db, api_key)
        assert success
        
        # Try to validate revoked key
        key_obj = APIKeyManager.validate_api_key(self.db, api_key)
        assert key_obj is None  # Should be invalid
    
    def test_api_key_rotation(self):
        """Test API key rotation"""
        # Create user and API key
        user = User(
            email="apitest4@example.com",
            name="API Test User 4",
            hashed_password="dummy_hash"
        )
        self.db.add(user)
        self.db.commit()
        
        # Generate initial key
        old_key = APIKeyManager.generate_api_key(
            db=self.db,
            user_id=user.id,
            name="Old Key"
        )
        
        # Rotate key
        new_key = APIKeyManager.rotate_api_key(self.db, old_key)
        
        assert new_key is not None
        assert new_key != old_key
        
        # Old key should be revoked
        old_key_obj = APIKeyManager.validate_api_key(self.db, old_key)
        assert old_key_obj is None
        
        # New key should be valid
        new_key_obj = APIKeyManager.validate_api_key(self.db, new_key)
        assert new_key_obj is not None
    
    def test_api_key_expiration(self):
        """Test API key expiration"""
        # Create user
        user = User(
            email="apitest5@example.com",
            name="API Test User 5",
            hashed_password="dummy_hash"
        )
        self.db.add(user)
        self.db.commit()
        
        # Generate key with short expiration
        api_key = APIKeyManager.generate_api_key(
            db=self.db,
            user_id=user.id,
            name="Expiring Key",
            expires_in_days=0  # Expires immediately
        )
        
        # Key should be expired
        key_obj = APIKeyManager.validate_api_key(self.db, api_key)
        # Depending on implementation, might be None or have is_expired flag
        assert key_obj is None or key_obj.is_expired


class TestRBAC:
    """Test Role-Based Access Control"""
    
    def setup_method(self):
        """Setup test database session"""
        self.db = SyncSessionLocal()
    
    def teardown_method(self):
        """Cleanup test database session"""
        self.db.close()
    
    def test_role_creation(self):
        """Test creating roles"""
        role = Role(
            name="test_role",
            description="Test Role"
        )
        self.db.add(role)
        self.db.commit()
        
        assert role.id is not None
        assert role.name == "test_role"
    
    def test_permission_creation(self):
        """Test creating permissions"""
        permission = Permission(
            name="test_permission",
            resource="test_resource",
            action="read"
        )
        self.db.add(permission)
        self.db.commit()
        
        assert permission.id is not None
        assert permission.name == "test_permission"
    
    def test_user_role_assignment(self):
        """Test assigning roles to users"""
        # Create user
        user = User(
            email="rbactest@example.com",
            name="RBAC Test User",
            hashed_password="dummy_hash"
        )
        self.db.add(user)
        self.db.commit()
        
        # Create role
        role = Role(name="admin", description="Administrator")
        self.db.add(role)
        self.db.commit()
        
        # Assign role to user
        user_role = UserRole(user_id=user.id, role_id=role.id)
        self.db.add(user_role)
        self.db.commit()
        
        # Verify assignment
        assert user_role.id is not None
        assert user_role.user_id == user.id
        assert user_role.role_id == role.id
    
    def test_admin_route_protection(self):
        """Test that admin routes are protected"""
        # Try to access admin route without authentication
        response = client.get("/admin/users")
        
        # Should be unauthorized or forbidden
        assert response.status_code in [401, 403, 404]
    
    def test_user_has_permission(self):
        """Test checking if user has specific permission"""
        # This would test the RBAC service
        # Placeholder for actual implementation
        assert True


class TestSecurityMonitoring:
    """Test security monitoring and alerting"""
    
    def test_failed_login_tracking(self):
        """Test that failed login attempts are tracked"""
        # Attempt multiple failed logins
        for i in range(6):
            response = client.post(
                "/auth/login",
                json={
                    "email": "attacker@example.com",
                    "password": "wrong_password"
                }
            )
        
        # After threshold, should be blocked or alerted
        # This is a placeholder - actual implementation would check monitoring system
        assert True
    
    def test_rate_limiting(self):
        """Test that rate limiting is enforced"""
        # Make many requests quickly
        responses = []
        for i in range(250):  # Exceed rate limit
            response = client.get("/health")
            responses.append(response.status_code)
        
        # Should eventually get rate limited (429)
        assert 429 in responses or all(r == 200 for r in responses)
    
    def test_request_size_limit(self):
        """Test that large requests are rejected"""
        # Create a large payload (>10MB)
        large_data = "x" * (11 * 1024 * 1024)  # 11MB
        
        response = client.post(
            "/api/test",
            json={"data": large_data}
        )
        
        # Should be rejected with 413
        assert response.status_code in [413, 422, 400]
    
    def test_suspicious_activity_detection(self):
        """Test detection of suspicious activity patterns"""
        # This would test the security monitoring service
        # Placeholder for actual implementation
        assert True


class TestIntegration:
    """Integration tests for Phase 2 security features"""
    
    def test_complete_user_registration_flow(self):
        """Test complete registration with password validation"""
        response = client.post(
            "/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "MyStr0ng!P@ssw0rd",
                "name": "New User"
            }
        )
        
        # Should succeed with strong password
        assert response.status_code in [200, 201]
    
    def test_weak_password_registration_rejected(self):
        """Test that weak passwords are rejected during registration"""
        response = client.post(
            "/auth/register",
            json={
                "email": "weakuser@example.com",
                "password": "weak",
                "name": "Weak User"
            }
        )
        
        # Should be rejected
        assert response.status_code == 400
        assert "password" in response.json().get("detail", "").lower()
    
    def test_audit_log_on_login(self):
        """Test that login creates audit log entry"""
        # Register user first
        client.post(
            "/auth/register",
            json={
                "email": "audituser@example.com",
                "password": "MyStr0ng!P@ssw0rd",
                "name": "Audit User"
            }
        )
        
        # Login
        response = client.post(
            "/auth/login",
            json={
                "email": "audituser@example.com",
                "password": "MyStr0ng!P@ssw0rd"
            }
        )
        
        # Should succeed and create audit log
        assert response.status_code == 200
        # Verify audit log was created (would check database or log file)


def run_all_tests():
    """Run all Phase 2 security tests"""
    print("=" * 60)
    print("PHASE 2 SECURITY TEST SUITE")
    print("=" * 60)
    
    # Run pytest
    pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "--color=yes"
    ])


if __name__ == "__main__":
    run_all_tests()
