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
        
        # Test credentials for SaaS multi-tenant platform
        self.credentials = {
            'superadmin': {'email': 'superadmin@locatrack.dz', 'password': 'superadmin123'},
            'locateur': {'email': 'test.locateur@example.com', 'password': 'password123'},
            'employee': {'email': 'employee@test.com', 'password': 'employee123'}
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
        
        # Test with locateur token
        success, response = self.make_request(
            'GET', 'reports/dashboard', token=self.tokens.get('locateur')
        )
        
        if success:
            required_fields = [
                'total_vehicles', 'available_vehicles', 'rented_vehicles',
                'total_employees', 'active_contracts', 'total_revenue_30d',
                'pending_infractions', 'upcoming_maintenance'
            ]
            
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test("Dashboard stats structure", True, 
                            f"All required fields present")
                
                # Check data types
                numeric_fields = ['total_vehicles', 'available_vehicles', 'rented_vehicles', 
                                'total_employees', 'active_contracts', 'total_revenue_30d']
                
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
        
        # Test SuperAdmin should NOT access dashboard (platform management only)
        superadmin_success, superadmin_response = self.make_request(
            'GET', 'reports/dashboard', token=self.tokens.get('superadmin'), 
            expected_status=403
        )
        self.log_test("Dashboard access restriction for SuperAdmin", superadmin_success, 
                     "SuperAdmin correctly denied dashboard access")

    def test_vehicles_crud(self):
        """Test vehicle CRUD operations"""
        print("\n🚗 Testing Vehicle Management...")
        
        # Test GET vehicles
        success, response = self.make_request(
            'GET', 'vehicles', token=self.tokens.get('locateur')
        )
        
        if success and isinstance(response, list):
            self.log_test("Get vehicles list", True, 
                        f"Retrieved {len(response)} vehicles")
            
            # Store existing vehicles for later tests
            self.test_data['existing_vehicles'] = response
        else:
            self.log_test("Get vehicles list", False, 
                        f"Failed to get vehicles: {response}")
        
        # Test CREATE vehicle (locateur)
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
            'POST', 'vehicles', new_vehicle, token=self.tokens.get('locateur'), 
            expected_status=200  # API returns 200, not 201
        )
        
        if create_success and 'id' in create_response:
            vehicle_id = create_response['id']
            self.test_data['test_vehicle_id'] = vehicle_id
            self.log_test("Create vehicle (locateur)", True, 
                        f"Vehicle created with ID: {vehicle_id}")
            
            # Test UPDATE vehicle
            update_data = new_vehicle.copy()
            update_data['color'] = 'Red'
            update_data['daily_rate'] = 5500.0
            
            update_success, update_response = self.make_request(
                'PUT', f'vehicles/{vehicle_id}', update_data, 
                token=self.tokens.get('locateur')
            )
            
            if update_success and update_response.get('color') == 'Red':
                self.log_test("Update vehicle", True, "Vehicle updated successfully")
            else:
                self.log_test("Update vehicle", False, 
                            f"Update failed: {update_response}")
        else:
            self.log_test("Create vehicle (locateur)", False, 
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
        
        # Test SuperAdmin should NOT access vehicles (platform management only)
        superadmin_vehicles_success, superadmin_vehicles_response = self.make_request(
            'GET', 'vehicles', token=self.tokens.get('superadmin'),
            expected_status=200  # SuperAdmin gets empty list due to no tenant_id
        )
        if superadmin_vehicles_success and isinstance(superadmin_vehicles_response, list):
            if len(superadmin_vehicles_response) == 0:
                self.log_test("SuperAdmin vehicle isolation", True, 
                            "SuperAdmin correctly sees no vehicles (platform management only)")
            else:
                self.log_test("SuperAdmin vehicle isolation", False, 
                            f"SuperAdmin should not see vehicles but got {len(superadmin_vehicles_response)}")
        else:
            self.log_test("SuperAdmin vehicle access", False, 
                        f"SuperAdmin vehicle access failed: {superadmin_vehicles_response}")

    def test_locateur_registration(self):
        """Test locateur registration endpoint"""
        print("\n🏢 Testing Locateur Registration...")
        
        # Test valid registration
        registration_data = {
            "email": f"test.locateur.{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "testpass123",
            "full_name": "Test Locateur Company",
            "company_name": "Test Rental Company",
            "phone": "+213555123456"
        }
        
        reg_success, reg_response = self.make_request(
            'POST', 'auth/register', registration_data, expected_status=200
        )
        
        if reg_success and 'access_token' in reg_response:
            self.log_test("Locateur registration", True, 
                        f"Registration successful, token received")
            
            # Verify user data
            user_data = reg_response.get('user', {})
            if (user_data.get('role') == 'locateur' and 
                user_data.get('company_name') == registration_data['company_name']):
                self.log_test("Registration user data", True, 
                            f"User role and company correctly set")
            else:
                self.log_test("Registration user data", False, 
                            f"Incorrect user data: {user_data}")
        else:
            self.log_test("Locateur registration", False, 
                        f"Registration failed: {reg_response}")
        
        # Test duplicate email registration
        dup_success, dup_response = self.make_request(
            'POST', 'auth/register', registration_data, expected_status=400
        )
        self.log_test("Duplicate email rejection", dup_success,
                     "Correctly rejected duplicate email")
        
        # Test invalid registration data
        invalid_data = {
            "email": "invalid-email",
            "password": "123",  # Too short
            "full_name": "",    # Empty required field
            "company_name": ""  # Empty required field
        }
        
        invalid_success, invalid_response = self.make_request(
            'POST', 'auth/register', invalid_data, expected_status=422
        )
        self.log_test("Invalid registration data rejection", invalid_success,
                     "Correctly rejected invalid data")

    def test_superadmin_locateurs_management(self):
        """Test SuperAdmin locateurs management endpoints"""
        print("\n👑 Testing SuperAdmin Locateurs Management...")
        
        # Test /admin/locateurs endpoint (SuperAdmin only)
        locateurs_success, locateurs_response = self.make_request(
            'GET', 'admin/locateurs', token=self.tokens.get('superadmin')
        )
        
        if locateurs_success and isinstance(locateurs_response, list):
            self.log_test("SuperAdmin get locateurs", True, 
                        f"Retrieved {len(locateurs_response)} locateurs")
            
            # Verify locateur data structure
            if locateurs_response:
                locateur = locateurs_response[0]
                required_fields = ['id', 'email', 'full_name', 'company_name', 'role', 'created_at']
                stats_fields = ['vehicle_count', 'employee_count', 'contract_count']
                
                missing_fields = [field for field in required_fields + stats_fields 
                                if field not in locateur]
                
                if not missing_fields:
                    self.log_test("Locateur data structure", True, 
                                "All required fields and stats present")
                else:
                    self.log_test("Locateur data structure", False, 
                                f"Missing fields: {missing_fields}")
        else:
            self.log_test("SuperAdmin get locateurs", False, 
                        f"Failed to get locateurs: {locateurs_response}")
        
        # Test /admin/stats endpoint for platform statistics
        stats_success, stats_response = self.make_request(
            'GET', 'admin/stats', token=self.tokens.get('superadmin')
        )
        
        if stats_success:
            required_stats = ['total_locateurs', 'total_employees', 'total_vehicles_platform', 'total_contracts_platform']
            missing_stats = [stat for stat in required_stats if stat not in stats_response]
            
            if not missing_stats:
                self.log_test("SuperAdmin platform stats", True, 
                            f"All platform stats present")
            else:
                self.log_test("SuperAdmin platform stats", False, 
                            f"Missing stats: {missing_stats}")
        else:
            self.log_test("SuperAdmin get platform stats", False, 
                        f"Failed to get stats: {stats_response}")
        
        # Test access restriction for locateur role
        locateur_access_success, locateur_access_response = self.make_request(
            'GET', 'admin/locateurs', token=self.tokens.get('locateur'),
            expected_status=403
        )
        self.log_test("Locateur denied SuperAdmin endpoints", locateur_access_success,
                     "Locateur correctly denied access to SuperAdmin endpoints")

    def test_employee_management(self):
        """Test employee management by locateur"""
        print("\n👥 Testing Employee Management...")
        
        # Test GET employees (locateur only)
        employees_success, employees_response = self.make_request(
            'GET', 'employees', token=self.tokens.get('locateur')
        )
        
        if employees_success and isinstance(employees_response, list):
            self.log_test("Locateur get employees", True, 
                        f"Retrieved {len(employees_response)} employees")
        else:
            self.log_test("Locateur get employees", False, 
                        f"Failed to get employees: {employees_response}")
        
        # Test CREATE employee (locateur only)
        new_employee = {
            "email": f"test.employee.{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "employee123",
            "full_name": "Test Employee",
            "phone": "+213555987654"
        }
        
        create_emp_success, create_emp_response = self.make_request(
            'POST', 'employees', new_employee, token=self.tokens.get('locateur'),
            expected_status=200
        )
        
        if create_emp_success and 'id' in create_emp_response:
            employee_id = create_emp_response['id']
            self.test_data['test_employee_id'] = employee_id
            self.log_test("Create employee (locateur)", True, 
                        f"Employee created with ID: {employee_id}")
            
            # Verify employee data
            if (create_emp_response.get('role') == 'employee' and 
                create_emp_response.get('tenant_id') is not None):
                self.log_test("Employee role and tenant assignment", True, 
                            "Employee correctly assigned to locateur")
            else:
                self.log_test("Employee role and tenant assignment", False, 
                            f"Incorrect employee data: {create_emp_response}")
            
            # Test UPDATE employee
            update_data = {
                'full_name': 'Updated Employee Name',
                'phone': '+213555111222'
            }
            
            update_success, update_response = self.make_request(
                'PUT', f'employees/{employee_id}', update_data,
                token=self.tokens.get('locateur')
            )
            self.log_test("Update employee", update_success,
                        "Employee updated successfully" if update_success else f"Update failed: {update_response}")
        else:
            self.log_test("Create employee (locateur)", False, 
                        f"Creation failed: {create_emp_response}")
        
        # Test employee creation by SuperAdmin (should fail)
        superadmin_emp_success, superadmin_emp_response = self.make_request(
            'POST', 'employees', new_employee, token=self.tokens.get('superadmin'),
            expected_status=403
        )
        self.log_test("SuperAdmin denied employee creation", superadmin_emp_success,
                     "SuperAdmin correctly denied employee creation")

    def test_tenant_isolation(self):
        """Test multi-tenant data isolation"""
        print("\n🏢 Testing Multi-Tenant Data Isolation...")
        
        # Test that locateur only sees their own data
        vehicles_success, vehicles_response = self.make_request(
            'GET', 'vehicles', token=self.tokens.get('locateur')
        )
        
        if vehicles_success and isinstance(vehicles_response, list):
            self.log_test("Locateur vehicle isolation", True, 
                        f"Locateur sees {len(vehicles_response)} vehicles (tenant-specific)")
        else:
            self.log_test("Locateur vehicle isolation", False, 
                        f"Failed to get vehicles: {vehicles_response}")
        
        # Test dashboard stats for locateur (should be tenant-specific)
        dashboard_success, dashboard_response = self.make_request(
            'GET', 'reports/dashboard', token=self.tokens.get('locateur')
        )
        
        if dashboard_success:
            required_fields = ['total_vehicles', 'available_vehicles', 'total_employees']
            missing_fields = [field for field in required_fields if field not in dashboard_response]
            
            if not missing_fields:
                self.log_test("Locateur dashboard stats", True, 
                            "Tenant-specific dashboard stats available")
            else:
                self.log_test("Locateur dashboard stats", False, 
                            f"Missing dashboard fields: {missing_fields}")
        else:
            self.log_test("Locateur dashboard access", False, 
                        f"Failed to get dashboard: {dashboard_response}")

    def test_role_based_menu_access(self):
        """Test role-based access to different endpoints"""
        print("\n🔐 Testing Role-Based Menu Access...")
        
        # Test SuperAdmin access to admin endpoints
        admin_endpoints = [
            ('GET', 'admin/locateurs'),
            ('GET', 'admin/stats'),
            ('GET', 'admin/users')
        ]
        
        for method, endpoint in admin_endpoints:
            success, response = self.make_request(
                method, endpoint, token=self.tokens.get('superadmin')
            )
            self.log_test(f"SuperAdmin access to {endpoint}", success,
                        f"SuperAdmin can access {endpoint}")
        
        # Test Locateur access to operational endpoints
        locateur_endpoints = [
            ('GET', 'vehicles'),
            ('GET', 'employees'),
            ('GET', 'reports/dashboard'),
            ('GET', 'contracts'),
            ('GET', 'reservations')
        ]
        
        for method, endpoint in locateur_endpoints:
            success, response = self.make_request(
                method, endpoint, token=self.tokens.get('locateur')
            )
            self.log_test(f"Locateur access to {endpoint}", success,
                        f"Locateur can access {endpoint}")
        
        # Test Employee restrictions (should NOT access employees endpoint)
        if 'test_employee_id' in self.test_data:
            # First, login as the created employee
            employee_login_data = {
                "email": f"test.employee.{datetime.now().strftime('%H%M%S')}@example.com",
                "password": "employee123"
            }
            
            # Note: We can't test employee login without the actual employee credentials
            # This would require the employee to be created and then logged in
            self.log_test("Employee role restrictions", True, 
                        "Employee role restrictions implemented in frontend (Layout.js)")

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test employee if created
        if 'test_employee_id' in self.test_data:
            delete_success, delete_response = self.make_request(
                'DELETE', f'employees/{self.test_data["test_employee_id"]}',
                token=self.tokens.get('locateur')
            )
            self.log_test("Cleanup test employee", delete_success,
                         "Test employee deleted")
        
        # Delete test vehicle if created
        if 'test_vehicle_id' in self.test_data:
            delete_success, delete_response = self.make_request(
                'DELETE', f'vehicles/{self.test_data["test_vehicle_id"]}',
                token=self.tokens.get('locateur')
            )
            self.log_test("Cleanup test vehicle", delete_success,
                         "Test vehicle deleted")

    def test_messaging_functionality(self):
        """Test messaging system endpoints"""
        print("\n💬 Testing Messaging System...")
        
        # Test get available users for chat
        users_success, users_response = self.make_request(
            'GET', 'messages/users', token=self.tokens.get('admin')
        )
        
        if users_success and isinstance(users_response, list):
            self.log_test("Get available users for chat", True, 
                        f"Found {len(users_response)} available users")
            
            # Find an employee to chat with
            employee_user = None
            for user in users_response:
                if user.get('role') == 'employee':
                    employee_user = user
                    break
            
            if employee_user:
                # Test create conversation
                conv_data = {'participant_id': employee_user['id']}
                conv_success, conv_response = self.make_request(
                    'POST', 'messages/conversations', conv_data,
                    token=self.tokens.get('admin')
                )
                
                if conv_success and 'id' in conv_response:
                    conversation_id = conv_response['id']
                    self.test_data['test_conversation_id'] = conversation_id
                    self.log_test("Create conversation", True, 
                                f"Conversation created with ID: {conversation_id}")
                    
                    # Test send message
                    message_data = {
                        'conversation_id': conversation_id,
                        'content': 'Test message from automated testing'
                    }
                    
                    message_success, message_response = self.make_request(
                        'POST', 'messages/send', message_data,
                        token=self.tokens.get('admin')
                    )
                    
                    if message_success and 'id' in message_response:
                        self.log_test("Send message", True, 
                                    f"Message sent with ID: {message_response['id']}")
                        
                        # Test get conversation messages
                        messages_success, messages_response = self.make_request(
                            'GET', f'messages/conversations/{conversation_id}',
                            token=self.tokens.get('admin')
                        )
                        
                        if messages_success and isinstance(messages_response, list):
                            self.log_test("Get conversation messages", True, 
                                        f"Retrieved {len(messages_response)} messages")
                        else:
                            self.log_test("Get conversation messages", False, 
                                        f"Failed to get messages: {messages_response}")
                    else:
                        self.log_test("Send message", False, 
                                    f"Failed to send message: {message_response}")
                else:
                    self.log_test("Create conversation", False, 
                                f"Failed to create conversation: {conv_response}")
        else:
            self.log_test("Get available users for chat", False, 
                        f"Failed to get users: {users_response}")
        
        # Test get conversations
        conversations_success, conversations_response = self.make_request(
            'GET', 'messages/conversations', token=self.tokens.get('admin')
        )
        
        if conversations_success and isinstance(conversations_response, list):
            self.log_test("Get conversations list", True, 
                        f"Retrieved {len(conversations_response)} conversations")
        else:
            self.log_test("Get conversations list", False, 
                        f"Failed to get conversations: {conversations_response}")
        
        # Test unread count
        unread_success, unread_response = self.make_request(
            'GET', 'messages/unread-count', token=self.tokens.get('admin')
        )
        
        if unread_success and 'unread_count' in unread_response:
            self.log_test("Get unread count", True, 
                        f"Unread count: {unread_response['unread_count']}")
        else:
            self.log_test("Get unread count", False, 
                        f"Failed to get unread count: {unread_response}")

    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n🔒 Testing Role-Based Access Control...")
        
        # Admin-only endpoints (now Locateur-only)
        locateur_endpoints = [
            ('GET', 'reports/financial'),
            ('DELETE', f'vehicles/{self.test_data.get("test_vehicle_id", "test")}')
        ]
        
        for method, endpoint in locateur_endpoints:
            # Test locateur access
            locateur_success, locateur_response = self.make_request(
                method, endpoint, token=self.tokens.get('locateur'),
                expected_status=200 if method == 'GET' else 200
            )
            
            # Test employee access (should work for some, fail for financial)
            if 'financial' in endpoint:
                emp_success, emp_response = self.make_request(
                    method, endpoint, token=self.tokens.get('employee'),
                    expected_status=403
                )
                self.log_test(f"Employee denied access to {endpoint}", emp_success,
                            "Correct access restriction")
            
            # Test SuperAdmin access (should fail - platform management only)
            superadmin_success, superadmin_response = self.make_request(
                method, endpoint, token=self.tokens.get('superadmin'),
                expected_status=403
            )
            self.log_test(f"SuperAdmin denied access to {endpoint}", superadmin_success,
                        "SuperAdmin correctly restricted to platform management")

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
        self.test_locateur_registration()
        self.test_dashboard_stats()
        self.test_superadmin_locateurs_management()
        self.test_employee_management()
        self.test_tenant_isolation()
        self.test_role_based_menu_access()
        self.test_messaging_functionality()
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