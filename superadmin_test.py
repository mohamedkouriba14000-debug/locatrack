#!/usr/bin/env python3
"""
SuperAdmin Platform Management Testing Suite for LocaTrack SaaS
Tests SuperAdmin user management, subscription management, and suspension features
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class SuperAdminTester:
    def __init__(self, base_url="https://carsaas-2.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tokens = {}
        self.test_data = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test credentials
        self.credentials = {
            'superadmin': {'email': 'superadmin@locatrack.dz', 'password': 'superadmin123'},
            'locateur': {'email': 'test.locateur@example.com', 'password': 'password123'}
        }

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append(f"{name}: {details}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    token: str = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status_code": response.status_code}
            
            return success, response_data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_authentication(self):
        """Test authentication for SuperAdmin and Locateur"""
        print("\n🔐 Testing Authentication...")
        
        # Test SuperAdmin login
        success, response = self.make_request(
            'POST', 'auth/login', self.credentials['superadmin'], expected_status=200
        )
        
        if success and 'access_token' in response:
            self.tokens['superadmin'] = response['access_token']
            self.log_test("SuperAdmin login", True, f"Token received")
        else:
            self.log_test("SuperAdmin login", False, f"Login failed: {response}")
            return False
        
        # Test Locateur login
        success, response = self.make_request(
            'POST', 'auth/login', self.credentials['locateur'], expected_status=200
        )
        
        if success and 'access_token' in response:
            self.tokens['locateur'] = response['access_token']
            self.test_data['locateur_user'] = response['user']
            self.log_test("Locateur login", True, f"Token received")
        else:
            self.log_test("Locateur login", False, f"Login failed: {response}")
            return False
        
        return True

    def test_get_all_users_endpoint(self):
        """Test GET /api/admin/all-users endpoint (P0)"""
        print("\n👥 Testing GET /api/admin/all-users (P0)...")
        
        success, response = self.make_request(
            'GET', 'admin/all-users', token=self.tokens.get('superadmin')
        )
        
        if success and isinstance(response, list):
            self.log_test("GET all users endpoint", True, 
                        f"Retrieved {len(response)} users")
            
            # Check if users have subscription fields
            if response:
                user = response[0]
                required_fields = ['subscription_type', 'subscription_start', 'subscription_end', 'is_suspended']
                missing_fields = [field for field in required_fields if field not in user]
                
                if not missing_fields:
                    self.log_test("Users have subscription fields", True, 
                                "All required subscription fields present")
                    
                    # Check if days_remaining is calculated
                    if 'days_remaining' in user:
                        self.log_test("Days remaining calculation", True, 
                                    f"Days remaining field present")
                    else:
                        self.log_test("Days remaining calculation", False, 
                                    "Days remaining field missing")
                else:
                    self.log_test("Users have subscription fields", False, 
                                f"Missing fields: {missing_fields}")
            else:
                self.log_test("Users data structure", False, "No users returned")
        else:
            self.log_test("GET all users endpoint", False, 
                        f"Request failed: {response}")

    def test_subscription_management(self):
        """Test POST /api/admin/users/{user_id}/subscription (P0)"""
        print("\n💳 Testing Subscription Management (P0)...")
        
        # First get the locateur user ID
        locateur_user = self.test_data.get('locateur_user')
        if not locateur_user:
            self.log_test("Subscription management setup", False, "No locateur user data")
            return
        
        user_id = locateur_user['id']
        
        # Test updating subscription to annual
        success, response = self.make_request(
            'POST', f'admin/users/{user_id}/subscription?subscription_type=annual',
            token=self.tokens.get('superadmin')
        )
        
        if success:
            self.log_test("Update subscription to annual", True, 
                        f"Subscription updated: {response.get('message', 'Success')}")
            
            # Verify subscription was updated by getting user info again
            verify_success, verify_response = self.make_request(
                'GET', 'admin/all-users', token=self.tokens.get('superadmin')
            )
            
            if verify_success:
                # Find the updated user
                updated_user = None
                for user in verify_response:
                    if user.get('id') == user_id:
                        updated_user = user
                        break
                
                if updated_user:
                    if updated_user.get('subscription_type') == 'annual':
                        self.log_test("Subscription verification", True, 
                                    "Subscription type updated to annual")
                        
                        # Check if subscription_end is set to 1 year from now
                        if updated_user.get('subscription_end'):
                            # Parse the date and check if it's approximately 1 year from now
                            try:
                                end_date = datetime.fromisoformat(updated_user['subscription_end'].replace('Z', '+00:00'))
                                now = datetime.now(end_date.tzinfo)
                                days_diff = (end_date - now).days
                                
                                if 360 <= days_diff <= 370:  # Allow some tolerance
                                    self.log_test("Subscription end date", True, 
                                                f"End date set correctly (~{days_diff} days from now)")
                                else:
                                    self.log_test("Subscription end date", False, 
                                                f"End date incorrect ({days_diff} days from now)")
                            except Exception as e:
                                self.log_test("Subscription end date parsing", False, 
                                            f"Date parsing error: {e}")
                        else:
                            self.log_test("Subscription end date", False, 
                                        "No subscription end date set")
                    else:
                        self.log_test("Subscription verification", False, 
                                    f"Subscription type not updated: {updated_user.get('subscription_type')}")
                else:
                    self.log_test("Subscription verification", False, 
                                "Updated user not found")
            else:
                self.log_test("Subscription verification", False, 
                            "Failed to verify subscription update")
        else:
            self.log_test("Update subscription to annual", False, 
                        f"Request failed: {response}")

    def test_suspend_activate_user(self):
        """Test POST /api/admin/users/{user_id}/suspend and activate (P0)"""
        print("\n🚫 Testing User Suspension/Activation (P0)...")
        
        locateur_user = self.test_data.get('locateur_user')
        if not locateur_user:
            self.log_test("Suspension test setup", False, "No locateur user data")
            return
        
        user_id = locateur_user['id']
        
        # Test suspend user
        suspend_success, suspend_response = self.make_request(
            'POST', f'admin/users/{user_id}/suspend',
            token=self.tokens.get('superadmin')
        )
        
        if suspend_success:
            self.log_test("Suspend user", True, 
                        f"User suspended: {suspend_response.get('message', 'Success')}")
            
            # Test that suspended user cannot login
            login_success, login_response = self.make_request(
                'POST', 'auth/login', self.credentials['locateur'], 
                expected_status=403
            )
            
            if login_success:
                self.log_test("Suspended user login blocked", True, 
                            "Suspended user correctly denied login")
            else:
                # Check if it's the right error message
                if login_response.get('status_code') == 403:
                    self.log_test("Suspended user login blocked", True, 
                                "Suspended user correctly denied login (403)")
                else:
                    self.log_test("Suspended user login blocked", False, 
                                f"Unexpected response: {login_response}")
        else:
            self.log_test("Suspend user", False, 
                        f"Suspension failed: {suspend_response}")
            return
        
        # Test activate user
        activate_success, activate_response = self.make_request(
            'POST', f'admin/users/{user_id}/activate',
            token=self.tokens.get('superadmin')
        )
        
        if activate_success:
            self.log_test("Activate user", True, 
                        f"User activated: {activate_response.get('message', 'Success')}")
            
            # Test that activated user can login again
            login_success, login_response = self.make_request(
                'POST', 'auth/login', self.credentials['locateur'], 
                expected_status=200
            )
            
            if login_success and 'access_token' in login_response:
                self.log_test("Activated user can login", True, 
                            "User can login after activation")
                # Update token for further tests
                self.tokens['locateur'] = login_response['access_token']
            else:
                self.log_test("Activated user can login", False, 
                            f"Login failed after activation: {login_response}")
        else:
            self.log_test("Activate user", False, 
                        f"Activation failed: {activate_response}")

    def test_login_blocking_scenarios(self):
        """Test login blocking for suspended and expired users (P0)"""
        print("\n🔒 Testing Login Blocking Scenarios (P0)...")
        
        # We already tested suspended user login blocking in the previous test
        # Here we can test expired subscription scenario if we can create a test user
        
        # Test with invalid credentials (should get 401)
        invalid_success, invalid_response = self.make_request(
            'POST', 'auth/login', 
            {'email': 'nonexistent@test.com', 'password': 'wrong'}, 
            expected_status=401
        )
        
        if invalid_success:
            self.log_test("Invalid credentials blocked", True, 
                        "Invalid credentials correctly rejected with 401")
        else:
            self.log_test("Invalid credentials blocked", False, 
                        f"Unexpected response: {invalid_response}")

    def test_superadmin_page_access(self):
        """Test SuperAdmin page functionality"""
        print("\n👑 Testing SuperAdmin Page Access...")
        
        # Test access to admin endpoints that would be used by the frontend
        admin_endpoints = [
            ('GET', 'admin/all-users'),
            ('GET', 'admin/stats'),
            ('GET', 'admin/locateurs')
        ]
        
        for method, endpoint in admin_endpoints:
            success, response = self.make_request(
                method, endpoint, token=self.tokens.get('superadmin')
            )
            
            if success:
                self.log_test(f"SuperAdmin access to {endpoint}", True, 
                            f"Successfully accessed {endpoint}")
            else:
                self.log_test(f"SuperAdmin access to {endpoint}", False, 
                            f"Failed to access {endpoint}: {response}")
        
        # Test that locateur cannot access admin endpoints
        restricted_success, restricted_response = self.make_request(
            'GET', 'admin/all-users', token=self.tokens.get('locateur'),
            expected_status=403
        )
        
        if restricted_success:
            self.log_test("Locateur denied admin access", True, 
                        "Locateur correctly denied access to admin endpoints")
        else:
            self.log_test("Locateur denied admin access", False, 
                        f"Locateur should be denied access: {restricted_response}")

    def run_superadmin_tests(self):
        """Run all SuperAdmin platform management tests"""
        print("🚀 Starting SuperAdmin Platform Management Tests")
        print(f"🎯 Target URL: {self.base_url}")
        print("🔥 Focus: SuperAdmin User Management & Subscription Features")
        print("=" * 70)
        
        # Authentication is required for all tests
        if not self.test_authentication():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Run P0 Priority Tests
        print("\n🔥 PRIORITY TESTS (P0)")
        self.test_get_all_users_endpoint()
        self.test_subscription_management()
        self.test_suspend_activate_user()
        self.test_login_blocking_scenarios()
        self.test_superadmin_page_access()
        
        # Print summary
        print("\n" + "=" * 70)
        print("📊 SUPERADMIN TESTS SUMMARY")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        else:
            print("\n✅ ALL TESTS PASSED!")
        
        return self.tests_passed == self.tests_run

def main():
    """Main function to run SuperAdmin tests"""
    tester = SuperAdminTester()
    success = tester.run_superadmin_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())