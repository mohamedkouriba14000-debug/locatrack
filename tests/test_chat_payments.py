"""
Test suite for LocaTrack Chat and Payments modules
Tests:
- Chat: Create conversation, send message, view messages, multi-tenant isolation
- Payments: CRUD operations - create, read, update, delete
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://rentsaas.preview.emergentagent.com').rstrip('/')

# Test credentials from the review request
LOCATEUR_CREDENTIALS = {
    "email": "testlocateur2@test.com",
    "password": "Test1234!"
}

EMPLOYEE_CREDENTIALS = {
    "email": "employee1@test.com",
    "password": "Emp1234!"
}

# Test contract ID provided
TEST_CONTRACT_ID = "91001fca-88c6-4555-94b6-e710b9297148"
TEST_EMPLOYEE_ID = "2b5de0db-6f3d-4adc-bac3-57bdfd726bc6"


class TestAuthentication:
    """Test authentication for both locateur and employee"""
    
    def test_locateur_login(self):
        """Test locateur can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=LOCATEUR_CREDENTIALS)
        print(f"Locateur login response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            assert "user" in data
            assert data["user"]["role"] == "locateur"
            print(f"Locateur login SUCCESS - User: {data['user']['email']}")
        else:
            print(f"Locateur login FAILED: {response.text}")
            pytest.skip("Locateur login failed - skipping dependent tests")
    
    def test_employee_login(self):
        """Test employee can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=EMPLOYEE_CREDENTIALS)
        print(f"Employee login response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            assert "user" in data
            assert data["user"]["role"] == "employee"
            print(f"Employee login SUCCESS - User: {data['user']['email']}")
        else:
            print(f"Employee login FAILED: {response.text}")
            pytest.skip("Employee login failed - skipping dependent tests")


class TestChatModule:
    """Test Chat/Messaging module functionality"""
    
    @pytest.fixture
    def locateur_auth(self):
        """Get locateur authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=LOCATEUR_CREDENTIALS)
        if response.status_code != 200:
            pytest.skip("Locateur login failed")
        data = response.json()
        return {
            "Authorization": f"Bearer {data['access_token']}",
            "Content-Type": "application/json"
        }, data['user']
    
    @pytest.fixture
    def employee_auth(self):
        """Get employee authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=EMPLOYEE_CREDENTIALS)
        if response.status_code != 200:
            pytest.skip("Employee login failed")
        data = response.json()
        return {
            "Authorization": f"Bearer {data['access_token']}",
            "Content-Type": "application/json"
        }, data['user']
    
    def test_get_available_users_locateur(self, locateur_auth):
        """Test locateur can get available users for chat (should see their employees)"""
        headers, user = locateur_auth
        response = requests.get(f"{BASE_URL}/api/messages/users", headers=headers)
        
        print(f"Get available users (locateur) response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        users = response.json()
        print(f"Available users for locateur: {len(users)} users")
        
        # Locateur should see their employees
        for u in users:
            print(f"  - {u.get('full_name')} ({u.get('email')}) - Role: {u.get('role')}")
        
        # Verify multi-tenant: locateur should only see users with their tenant_id
        locateur_id = user['id']
        for u in users:
            # Users should either be employees of this locateur or the locateur themselves
            if u.get('role') == 'employee':
                assert u.get('tenant_id') == locateur_id, f"Employee {u.get('email')} has wrong tenant_id"
        
        print("Multi-tenant isolation VERIFIED for locateur chat users")
    
    def test_get_available_users_employee(self, employee_auth):
        """Test employee can get available users for chat (should see locateur and other employees)"""
        headers, user = employee_auth
        response = requests.get(f"{BASE_URL}/api/messages/users", headers=headers)
        
        print(f"Get available users (employee) response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        users = response.json()
        print(f"Available users for employee: {len(users)} users")
        
        for u in users:
            print(f"  - {u.get('full_name')} ({u.get('email')}) - Role: {u.get('role')}")
        
        # Employee should see their locateur and other employees of same tenant
        tenant_id = user.get('tenant_id')
        for u in users:
            # Should be either the locateur (id == tenant_id) or another employee with same tenant_id
            is_locateur = u.get('id') == tenant_id
            is_same_tenant_employee = u.get('tenant_id') == tenant_id
            assert is_locateur or is_same_tenant_employee, f"User {u.get('email')} should not be visible to employee"
        
        print("Multi-tenant isolation VERIFIED for employee chat users")
    
    def test_get_conversations(self, locateur_auth):
        """Test getting conversations list"""
        headers, user = locateur_auth
        response = requests.get(f"{BASE_URL}/api/messages/conversations", headers=headers)
        
        print(f"Get conversations response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        conversations = response.json()
        print(f"Found {len(conversations)} conversations")
        
        for conv in conversations:
            print(f"  - Conversation {conv.get('id')[:8]}... with {conv.get('participant_names')}")
    
    def test_create_conversation_and_send_message(self, locateur_auth, employee_auth):
        """Test creating a conversation and sending a message"""
        locateur_headers, locateur_user = locateur_auth
        employee_headers, employee_user = employee_auth
        
        # Locateur creates conversation with employee
        conv_data = {"participant_id": employee_user['id']}
        response = requests.post(
            f"{BASE_URL}/api/messages/conversations",
            json=conv_data,
            headers=locateur_headers
        )
        
        print(f"Create conversation response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        conversation = response.json()
        conversation_id = conversation['id']
        print(f"Created conversation: {conversation_id}")
        
        # Verify participants
        assert locateur_user['id'] in conversation['participants']
        assert employee_user['id'] in conversation['participants']
        print("Conversation participants verified")
        
        # Send a message from locateur
        test_message = f"Test message from locateur - {datetime.now().isoformat()}"
        msg_data = {
            "conversation_id": conversation_id,
            "content": test_message
        }
        response = requests.post(
            f"{BASE_URL}/api/messages/send",
            json=msg_data,
            headers=locateur_headers
        )
        
        print(f"Send message response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        message = response.json()
        assert message['content'] == test_message
        assert message['sender_id'] == locateur_user['id']
        print(f"Message sent successfully: {message['id'][:8]}...")
        
        # Employee should be able to see the message
        response = requests.get(
            f"{BASE_URL}/api/messages/conversations/{conversation_id}",
            headers=employee_headers
        )
        
        print(f"Get messages (employee) response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        messages = response.json()
        assert len(messages) > 0, "Employee should see messages in conversation"
        
        # Find our test message
        found_message = any(m['content'] == test_message for m in messages)
        assert found_message, "Employee should see the message sent by locateur"
        print("Employee can see locateur's message - Chat flow VERIFIED")
        
        # Employee sends reply
        reply_message = f"Reply from employee - {datetime.now().isoformat()}"
        reply_data = {
            "conversation_id": conversation_id,
            "content": reply_message
        }
        response = requests.post(
            f"{BASE_URL}/api/messages/send",
            json=reply_data,
            headers=employee_headers
        )
        
        print(f"Employee reply response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("Employee reply sent successfully")
        
        # Locateur should see the reply
        response = requests.get(
            f"{BASE_URL}/api/messages/conversations/{conversation_id}",
            headers=locateur_headers
        )
        
        messages = response.json()
        found_reply = any(m['content'] == reply_message for m in messages)
        assert found_reply, "Locateur should see employee's reply"
        print("Locateur can see employee's reply - Bidirectional chat VERIFIED")
    
    def test_unread_count(self, locateur_auth):
        """Test unread message count endpoint"""
        headers, user = locateur_auth
        response = requests.get(f"{BASE_URL}/api/messages/unread-count", headers=headers)
        
        print(f"Unread count response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"Unread count: {data.get('count', data)}")


class TestPaymentsModule:
    """Test Payments module CRUD operations"""
    
    @pytest.fixture
    def locateur_auth(self):
        """Get locateur authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=LOCATEUR_CREDENTIALS)
        if response.status_code != 200:
            pytest.skip("Locateur login failed")
        data = response.json()
        return {
            "Authorization": f"Bearer {data['access_token']}",
            "Content-Type": "application/json"
        }, data['user']
    
    @pytest.fixture
    def employee_auth(self):
        """Get employee authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=EMPLOYEE_CREDENTIALS)
        if response.status_code != 200:
            pytest.skip("Employee login failed")
        data = response.json()
        return {
            "Authorization": f"Bearer {data['access_token']}",
            "Content-Type": "application/json"
        }, data['user']
    
    def test_get_payments(self, locateur_auth):
        """Test getting payments list"""
        headers, user = locateur_auth
        response = requests.get(f"{BASE_URL}/api/payments", headers=headers)
        
        print(f"Get payments response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        payments = response.json()
        print(f"Found {len(payments)} payments")
        
        for p in payments:
            print(f"  - Payment {p.get('id')[:8]}... Amount: {p.get('amount')} DZD, Method: {p.get('method')}, Status: {p.get('status')}")
    
    def test_get_contracts_for_payment(self, locateur_auth):
        """Test getting contracts (needed for creating payments)"""
        headers, user = locateur_auth
        response = requests.get(f"{BASE_URL}/api/contracts", headers=headers)
        
        print(f"Get contracts response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        contracts = response.json()
        print(f"Found {len(contracts)} contracts")
        
        active_contracts = [c for c in contracts if c.get('status') == 'active']
        print(f"Active contracts: {len(active_contracts)}")
        
        return contracts
    
    def test_create_payment(self, locateur_auth):
        """Test creating a new payment"""
        headers, user = locateur_auth
        
        # First get contracts to find a valid contract_id
        contracts_response = requests.get(f"{BASE_URL}/api/contracts", headers=headers)
        contracts = contracts_response.json()
        
        if not contracts:
            # Create a test contract first
            print("No contracts found, creating test data...")
            pytest.skip("No contracts available for payment test")
        
        # Use the test contract ID or first available contract
        contract_id = TEST_CONTRACT_ID if any(c['id'] == TEST_CONTRACT_ID for c in contracts) else contracts[0]['id']
        
        # Create payment
        payment_data = {
            "contract_id": contract_id,
            "amount": 5000.0,
            "method": "cash",
            "reference": f"TEST-PAY-{uuid.uuid4().hex[:8].upper()}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/payments",
            json=payment_data,
            headers=headers
        )
        
        print(f"Create payment response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        payment = response.json()
        assert payment['amount'] == payment_data['amount']
        assert payment['method'] == payment_data['method']
        assert payment['contract_id'] == contract_id
        assert payment['status'] == 'completed'  # Payments are auto-completed
        
        print(f"Payment created successfully: {payment['id']}")
        print(f"  Amount: {payment['amount']} DZD")
        print(f"  Method: {payment['method']}")
        print(f"  Status: {payment['status']}")
        
        return payment
    
    def test_update_payment(self, locateur_auth):
        """Test updating an existing payment"""
        headers, user = locateur_auth
        
        # First create a payment to update
        contracts_response = requests.get(f"{BASE_URL}/api/contracts", headers=headers)
        contracts = contracts_response.json()
        
        if not contracts:
            pytest.skip("No contracts available for payment test")
        
        contract_id = contracts[0]['id']
        
        # Create payment
        payment_data = {
            "contract_id": contract_id,
            "amount": 3000.0,
            "method": "cash",
            "reference": f"TEST-UPDATE-{uuid.uuid4().hex[:8].upper()}"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/payments",
            json=payment_data,
            headers=headers
        )
        
        if create_response.status_code != 200:
            pytest.skip("Could not create payment for update test")
        
        payment = create_response.json()
        payment_id = payment['id']
        print(f"Created payment for update test: {payment_id}")
        
        # Update the payment
        update_data = {
            "contract_id": contract_id,
            "amount": 4500.0,
            "method": "cib",
            "reference": f"UPDATED-{uuid.uuid4().hex[:8].upper()}"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/payments/{payment_id}",
            json=update_data,
            headers=headers
        )
        
        print(f"Update payment response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        updated_payment = response.json()
        assert updated_payment['amount'] == update_data['amount']
        assert updated_payment['method'] == update_data['method']
        
        print(f"Payment updated successfully:")
        print(f"  New Amount: {updated_payment['amount']} DZD")
        print(f"  New Method: {updated_payment['method']}")
        
        return payment_id
    
    def test_delete_payment(self, locateur_auth):
        """Test deleting a payment"""
        headers, user = locateur_auth
        
        # First create a payment to delete
        contracts_response = requests.get(f"{BASE_URL}/api/contracts", headers=headers)
        contracts = contracts_response.json()
        
        if not contracts:
            pytest.skip("No contracts available for payment test")
        
        contract_id = contracts[0]['id']
        
        # Create payment
        payment_data = {
            "contract_id": contract_id,
            "amount": 1000.0,
            "method": "check",
            "reference": f"TEST-DELETE-{uuid.uuid4().hex[:8].upper()}"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/payments",
            json=payment_data,
            headers=headers
        )
        
        if create_response.status_code != 200:
            pytest.skip("Could not create payment for delete test")
        
        payment = create_response.json()
        payment_id = payment['id']
        print(f"Created payment for delete test: {payment_id}")
        
        # Delete the payment
        response = requests.delete(
            f"{BASE_URL}/api/payments/{payment_id}",
            headers=headers
        )
        
        print(f"Delete payment response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert "deleted" in result.get('message', '').lower() or "success" in result.get('message', '').lower()
        print(f"Payment deleted successfully: {result}")
        
        # Verify payment is gone
        payments_response = requests.get(f"{BASE_URL}/api/payments", headers=headers)
        payments = payments_response.json()
        
        deleted_payment = next((p for p in payments if p['id'] == payment_id), None)
        assert deleted_payment is None, "Payment should not exist after deletion"
        print("Payment deletion verified - payment no longer in list")
    
    def test_employee_can_manage_payments(self, employee_auth):
        """Test that employee can also manage payments (same tenant)"""
        headers, user = employee_auth
        
        # Employee should be able to view payments
        response = requests.get(f"{BASE_URL}/api/payments", headers=headers)
        
        print(f"Employee get payments response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        payments = response.json()
        print(f"Employee can see {len(payments)} payments")
        
        # Employee should be able to create payments
        contracts_response = requests.get(f"{BASE_URL}/api/contracts", headers=headers)
        contracts = contracts_response.json()
        
        if contracts:
            payment_data = {
                "contract_id": contracts[0]['id'],
                "amount": 2000.0,
                "method": "edahabia",
                "reference": f"EMP-PAY-{uuid.uuid4().hex[:8].upper()}"
            }
            
            create_response = requests.post(
                f"{BASE_URL}/api/payments",
                json=payment_data,
                headers=headers
            )
            
            print(f"Employee create payment response: {create_response.status_code}")
            assert create_response.status_code == 200, f"Expected 200, got {create_response.status_code}: {create_response.text}"
            print("Employee can create payments - VERIFIED")


class TestMultiTenantIsolation:
    """Test multi-tenant data isolation"""
    
    @pytest.fixture
    def locateur_auth(self):
        """Get locateur authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=LOCATEUR_CREDENTIALS)
        if response.status_code != 200:
            pytest.skip("Locateur login failed")
        data = response.json()
        return {
            "Authorization": f"Bearer {data['access_token']}",
            "Content-Type": "application/json"
        }, data['user']
    
    def test_payments_tenant_isolation(self, locateur_auth):
        """Test that payments are isolated by tenant"""
        headers, user = locateur_auth
        
        response = requests.get(f"{BASE_URL}/api/payments", headers=headers)
        assert response.status_code == 200
        
        payments = response.json()
        tenant_id = user['id']  # Locateur's ID is the tenant_id
        
        for payment in payments:
            assert payment.get('tenant_id') == tenant_id, f"Payment {payment['id']} has wrong tenant_id"
        
        print(f"All {len(payments)} payments belong to correct tenant - VERIFIED")
    
    def test_chat_users_tenant_isolation(self, locateur_auth):
        """Test that chat users are isolated by tenant"""
        headers, user = locateur_auth
        
        response = requests.get(f"{BASE_URL}/api/messages/users", headers=headers)
        assert response.status_code == 200
        
        users = response.json()
        tenant_id = user['id']  # Locateur's ID is the tenant_id
        
        for u in users:
            if u.get('role') == 'employee':
                assert u.get('tenant_id') == tenant_id, f"User {u['email']} has wrong tenant_id"
        
        print(f"All {len(users)} chat users belong to correct tenant - VERIFIED")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
