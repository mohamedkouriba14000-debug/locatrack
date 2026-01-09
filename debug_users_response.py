#!/usr/bin/env python3
"""
Debug script to check the actual response from /api/admin/all-users
"""

import requests
import json

# Login as superadmin
login_response = requests.post(
    "https://rentsaas.preview.emergentagent.com/api/auth/login",
    json={'email': 'superadmin@locatrack.dz', 'password': 'superadmin123'}
)

if login_response.status_code == 200:
    token = login_response.json()['access_token']
    
    # Get all users
    users_response = requests.get(
        "https://rentsaas.preview.emergentagent.com/api/admin/all-users",
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if users_response.status_code == 200:
        users = users_response.json()
        print(f"Found {len(users)} users")
        
        if users:
            print("\nFirst user structure:")
            print(json.dumps(users[0], indent=2, default=str))
            
            print("\nAll user fields:")
            all_fields = set()
            for user in users:
                all_fields.update(user.keys())
            print(sorted(all_fields))
        else:
            print("No users found")
    else:
        print(f"Failed to get users: {users_response.status_code} - {users_response.text}")
else:
    print(f"Login failed: {login_response.status_code} - {login_response.text}")