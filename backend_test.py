#!/usr/bin/env python3
"""
VehicleTrack Pro Backend API Testing Suite
Tests all API endpoints with different user roles and scenarios
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class VehicleTrackAPITester:
    def __init__(self, base_url="https://algiers-rentals.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tokens = {}
        self.test_data = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test credentials
        self.credentials = {
            'superadmin': {'email': 'superadmin@locatrack.dz', 'password': 'superadmin123'},
            'admin': {'email': 'admin@vehicletrack.dz', 'password': 'admin123'},
            'employee': {'email': 'employee@vehicletrack.dz', 'password': 'employee123'},
            'client': {'email': 'client@vehicletrack.dz', 'password': 'client123'}
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
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test login for all roles
        for role, creds in self.credentials.items():
            success, response = self.make_request(
                'POST', 'auth/login', creds, expected_status=200
            )
            
            if success and 'access_token' in response:
                self.tokens[role] = response['access_token']
                self.log_test(f"Login as {role}", True, f"Token received")
                
                # Test /auth/me endpoint
                me_success, me_response = self.make_request(
                    'GET', 'auth/me', token=self.tokens[role]
                )
                
                if me_success and 'email' in me_response:
                    self.log_test(f"Get user info for {role}", True, 
                                f"User: {me_response.get('full_name', 'N/A')}")
                else:
                    self.log_test(f"Get user info for {role}", False, 
                                f"Failed to get user info: {me_response}")
            else:
                self.log_test(f"Login as {role}", False, 
                            f"Login failed: {response}")
                return False
        
        # Test invalid login
        invalid_success, invalid_response = self.make_request(
            'POST', 'auth/login', 
            {'email': 'invalid@test.com', 'password': 'wrong'}, 
            expected_status=401
        )
        self.log_test("Invalid login rejection", invalid_success, 
                     "Correctly rejected invalid credentials")
        
        return len(self.tokens) == 4

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        print("\n📊 Testing Dashboard Stats...")
        
        # Test with admin token
        success, response = self.make_request(
            'GET', 'reports/dashboard', token=self.tokens.get('admin')
        )
        
        if success:
            required_fields = [
                'total_vehicles', 'available_vehicles', 'rented_vehicles',
                'total_clients', 'active_contracts', 'total_revenue_30d',
                'pending_infractions', 'upcoming_maintenance'
            ]
            
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test("Dashboard stats structure", True, 
                            f"All required fields present")
                
                # Check data types
                numeric_fields = ['total_vehicles', 'available_vehicles', 'rented_vehicles', 
                                'total_clients', 'active_contracts', 'total_revenue_30d']
                
                type_errors = []
                for field in numeric_fields:
                    if not isinstance(response.get(field), (int, float)):
                        type_errors.append(field)
                
                if not type_errors:
                    self.log_test("Dashboard stats data types", True, 
                                "All numeric fields have correct types")
                else:
                    self.log_test("Dashboard stats data types", False, 
                                f"Invalid types for: {type_errors}")
            else:
                self.log_test("Dashboard stats structure", False, 
                            f"Missing fields: {missing_fields}")
        else:
            self.log_test("Dashboard stats endpoint", False, 
                        f"Request failed: {response}")
        
        # Test with employee token
        emp_success, emp_response = self.make_request(
            'GET', 'reports/dashboard', token=self.tokens.get('employee')
        )
        self.log_test("Dashboard access for employee", emp_success, 
                     "Employee can access dashboard")
        
        # Test with client token (should fail)
        client_success, client_response = self.make_request(
            'GET', 'reports/dashboard', token=self.tokens.get('client'), 
            expected_status=403
        )
        self.log_test("Dashboard access restriction for client", client_success, 
                     "Client correctly denied access")

    def test_vehicles_crud(self):
        """Test vehicle CRUD operations"""
        print("\n🚗 Testing Vehicle Management...")
        
        # Test GET vehicles
        success, response = self.make_request(
            'GET', 'vehicles', token=self.tokens.get('admin')
        )
        
        if success and isinstance(response, list):
            self.log_test("Get vehicles list", True, 
                        f"Retrieved {len(response)} vehicles")
            
            # Store existing vehicles for later tests
            self.test_data['existing_vehicles'] = response
        else:
            self.log_test("Get vehicles list", False, 
                        f"Failed to get vehicles: {response}")
        
        # Test CREATE vehicle (admin)
        new_vehicle = {
            "registration_number": f"TEST-{datetime.now().strftime('%H%M%S')}",
            "type": "sedan",
            "make": "Test Make",
            "model": "Test Model",
            "year": 2024,
            "chassis_number": f"CHASSIS{datetime.now().strftime('%H%M%S')}",
            "color": "Blue",
            "daily_rate": 5000.0,
            "gps_device_id": "GPS_TEST_001"
        }
        
        create_success, create_response = self.make_request(
            'POST', 'vehicles', new_vehicle, token=self.tokens.get('admin'), 
            expected_status=200  # API returns 200, not 201
        )
        
        if create_success and 'id' in create_response:
            vehicle_id = create_response['id']
            self.test_data['test_vehicle_id'] = vehicle_id
            self.log_test("Create vehicle (admin)", True, 
                        f"Vehicle created with ID: {vehicle_id}")
            
            # Test UPDATE vehicle
            update_data = new_vehicle.copy()
            update_data['color'] = 'Red'
            update_data['daily_rate'] = 5500.0
            
            update_success, update_response = self.make_request(
                'PUT', f'vehicles/{vehicle_id}', update_data, 
                token=self.tokens.get('admin')
            )
            
            if update_success and update_response.get('color') == 'Red':
                self.log_test("Update vehicle", True, "Vehicle updated successfully")
            else:
                self.log_test("Update vehicle", False, 
                            f"Update failed: {update_response}")
        else:
            self.log_test("Create vehicle (admin)", False, 
                        f"Creation failed: {create_response}")
        
        # Test CREATE vehicle (employee) - should work
        employee_vehicle = {
            "registration_number": f"EMP-{datetime.now().strftime('%H%M%S')}",
            "type": "suv",
            "make": "Employee Make",
            "model": "Employee Model", 
            "year": 2023,
            "chassis_number": f"EMP_CHASSIS{datetime.now().strftime('%H%M%S')}",
            "color": "White",
            "daily_rate": 4500.0
        }
        
        emp_create_success, emp_create_response = self.make_request(
            'POST', 'vehicles', employee_vehicle, token=self.tokens.get('employee'),
            expected_status=200  # API returns 200, not 201
        )
        self.log_test("Create vehicle (employee)", emp_create_success, 
                     "Employee can create vehicles")
        
        # Test CREATE vehicle (client) - should fail
        client_create_success, client_create_response = self.make_request(
            'POST', 'vehicles', employee_vehicle, token=self.tokens.get('client'),
            expected_status=403
        )
        self.log_test("Create vehicle (client) - access denied", client_create_success, 
                     "Client correctly denied vehicle creation")

    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n🔒 Testing Role-Based Access Control...")
        
        # Admin-only endpoints
        admin_endpoints = [
            ('GET', 'reports/financial'),
            ('DELETE', f'vehicles/{self.test_data.get("test_vehicle_id", "test")}')
        ]
        
        for method, endpoint in admin_endpoints:
            # Test admin access
            admin_success, admin_response = self.make_request(
                method, endpoint, token=self.tokens.get('admin'),
                expected_status=200 if method == 'GET' else 200
            )
            
            # Test employee access (should fail for some)
            if 'financial' in endpoint:
                emp_success, emp_response = self.make_request(
                    method, endpoint, token=self.tokens.get('employee'),
                    expected_status=403
                )
                self.log_test(f"Employee denied access to {endpoint}", emp_success,
                            "Correct access restriction")
            
            # Test client access (should fail)
            client_success, client_response = self.make_request(
                method, endpoint, token=self.tokens.get('client'),
                expected_status=403
            )
            self.log_test(f"Client denied access to {endpoint}", client_success,
                        "Correct access restriction")

    def test_data_validation(self):
        """Test API data validation"""
        print("\n✅ Testing Data Validation...")
        
        # Test invalid vehicle data
        invalid_vehicle = {
            "registration_number": "",  # Empty required field
            "type": "invalid_type",     # Invalid enum value
            "year": "not_a_number",     # Invalid type
            "daily_rate": -100          # Negative rate
        }
        
        validation_success, validation_response = self.make_request(
            'POST', 'vehicles', invalid_vehicle, token=self.tokens.get('admin'),
            expected_status=422
        )
        self.log_test("Data validation for invalid vehicle", validation_success,
                     "API correctly rejects invalid data")
        
        # Test missing required fields
        incomplete_vehicle = {
            "registration_number": "TEST-INCOMPLETE"
            # Missing required fields
        }
        
        incomplete_success, incomplete_response = self.make_request(
            'POST', 'vehicles', incomplete_vehicle, token=self.tokens.get('admin'),
            expected_status=422
        )
        self.log_test("Validation for incomplete data", incomplete_success,
                     "API correctly rejects incomplete data")

    def test_error_handling(self):
        """Test API error handling"""
        print("\n🚨 Testing Error Handling...")
        
        # Test non-existent resource (GET method)
        not_found_success, not_found_response = self.make_request(
            'GET', 'vehicles/non-existent-id', token=self.tokens.get('admin'),
            expected_status=404
        )
        self.log_test("404 for non-existent resource", not_found_success,
                     "Correct 404 response")
        
        # Test unauthorized access (no token)
        unauth_success, unauth_response = self.make_request(
            'GET', 'vehicles', expected_status=403  # API returns 403 for missing auth
        )
        self.log_test("403 for unauthorized access", unauth_success,
                     "Correct 403 response")
        
        # Test invalid token
        invalid_token_success, invalid_token_response = self.make_request(
            'GET', 'vehicles', token='invalid_token', expected_status=401
        )
        self.log_test("401 for invalid token", invalid_token_success,
                     "Correct token validation")

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test vehicle if created
        if 'test_vehicle_id' in self.test_data:
            delete_success, delete_response = self.make_request(
                'DELETE', f'vehicles/{self.test_data["test_vehicle_id"]}',
                token=self.tokens.get('admin')
            )
            self.log_test("Cleanup test vehicle", delete_success,
                         "Test vehicle deleted")

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting VehicleTrack Pro Backend API Tests")
        print(f"🎯 Target URL: {self.base_url}")
        print("=" * 60)
        
        # Authentication is required for all other tests
        if not self.test_authentication():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Run all test suites
        self.test_dashboard_stats()
        self.test_vehicles_crud()
        self.test_role_based_access()
        self.test_data_validation()
        self.test_error_handling()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = VehicleTrackAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())